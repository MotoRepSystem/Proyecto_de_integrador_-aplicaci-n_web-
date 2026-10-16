from decimal import Decimal
from django.db import transaction
from django.utils import timezone
from rest_framework.exceptions import ValidationError

from apps.movimiento.factura.models import Facturas, DetalleFactura, FacturasCredito
from apps.movimiento.caja.models import MovimientoCaja, TurnoCaja
from apps.movimiento.movimientoPago.models import MovimientoPago
from apps.catalogos.tipoMovimientoCaja.models import TipoMovimientoCaja
from apps.catalogos.metodoPago.models import MetodoPago
from apps.catalogos.estadoCuenta.models import EstadoCuenta
from apps.movimiento.producto.models import RegistroProducto

from .factura_service import Validar_datos, validar_existencia, descontar_stock


@transaction.atomic
def crear_factura_completa(datos_factura, detalles_data, pagos_data=None, datos_credito=None, turno_caja_id=None, tipo_movimiento_id=None):
    condicion_id = datos_factura['condicionId'].id if hasattr(datos_factura['condicionId'], 'id') else datos_factura['condicionId']

    # --------------------------------------------------------------------------
    # 0. VALIDACIÓN E INCREMENTO CON Bloqueo (select_for_update)
    # --------------------------------------------------------------------------
    turno = None
    if turno_caja_id:
        turno = TurnoCaja.objects.select_for_update().filter(
            id=turno_caja_id, 
            abierto=True, 
            estado=True,
            NumCajaid__abierta=True,
            NumCajaid__estado=True
        ).first()
        
        if not turno:
            raise ValidationError({
                "turno_caja": "El turno seleccionado no existe, está cerrado o la caja física está inactiva."
            })
    elif condicion_id == 1:
        raise ValidationError({"turno_caja": "Debe proporcionar un turno de caja activo para ventas al contado."})

    # --------------------------------------------------------------------------
    # 1. Crear Cabecera
    # --------------------------------------------------------------------------
    factura = Facturas.objects.create(
        NumFactura=datos_factura['NumFactura'],
        ClienteId=datos_factura['ClienteId'],
        condicionId=datos_factura['condicionId'],
        Total=Decimal('0.00')
    )

    total_acumulado = Decimal('0.00')

    # --------------------------------------------------------------------------
    # 2. Registrar Detalles y Inventario
    # --------------------------------------------------------------------------
    for item in detalles_data:
        Validar_datos(item)
        lote_id = item['loteId']
        cantidad = Decimal(str(item['Cantidad']))
        
        validar_existencia(lote_id, cantidad)
        lote = RegistroProducto.objects.get(id=lote_id)
        
        precio_unitario = lote.PrecioVenta or Decimal('0.00')
        subtotal = cantidad * precio_unitario
        total_acumulado += subtotal

        DetalleFactura.objects.create(
            FacturaId=factura,
            loteId=lote,
            Cantidad=cantidad,
            PrecioUnitario=precio_unitario,
            Subtotal=subtotal
        )

        descontar_stock(lote_id, cantidad)

    factura.Total = total_acumulado
    factura.save()

    # --------------------------------------------------------------------------
    # 3. Flujo Al Contado (ID 1)
    # --------------------------------------------------------------------------
    if condicion_id == 1:
        if not pagos_data or not tipo_movimiento_id:
            raise ValidationError({"error": "Las ventas al contado requieren tipo de movimiento y pagos."})

        total_pagos = sum(Decimal(str(pago['monto'])) for pago in pagos_data)
        if total_pagos != total_acumulado:
            raise ValidationError({
                "Pagos": f"El total pagado ({total_pagos}) no coincide con el total de la factura ({total_acumulado})."
            })

        tipo_mov = TipoMovimientoCaja.objects.get(id=tipo_movimiento_id)

        movimiento_caja = MovimientoCaja.objects.create(
            fecha=timezone.now(),
            descripcion=f"Venta Contado Factura #{factura.NumFactura}",
            monto=total_acumulado,
            tipoMovimientoCajaId=tipo_mov,
            facturaid=factura,
            turnoCajaId=turno
        )

        # Garantizamos que los totales no sean None antes de sumar
        if turno.Din_efectivo is None:
            turno.Din_efectivo = Decimal('0.00')
        if turno.Din_digital is None:
            turno.Din_digital = Decimal('0.00')
        if turno.Egresos is None:
            turno.Egresos = Decimal('0.00')
        if turno.SaldoInicial is None:
            turno.SaldoInicial = Decimal('0.00')

        # Registrar los desgloses de pago y actualizar el TurnoCaja activo
        for pago in pagos_data:
            metodo = MetodoPago.objects.get(id=pago['metodoPagoId'])
            monto_pago = Decimal(str(pago['monto']))
            
            MovimientoPago.objects.create(
                monto=monto_pago,
                metodoPagoId=metodo,
                MovimientoCajaId=movimiento_caja
            )

            if metodo.id == 1 or metodo.Tipo.strip().lower() == 'efectivo':
                turno.Din_efectivo += monto_pago
            else:
                turno.Din_digital += monto_pago

        # Recalcular saldo final del turno
        turno.SaldoFinal = turno.SaldoInicial + turno.Din_efectivo + turno.Din_digital - turno.Egresos
        turno.save()

    # --------------------------------------------------------------------------
    # 4. Flujo Al Crédito (ID 2)
    # --------------------------------------------------------------------------
    elif condicion_id == 2:
        if not datos_credito:
            raise ValidationError({"credito": "Faltan los datos necesarios para registrar el crédito."})

        estado_cuenta = EstadoCuenta.objects.get(id=datos_credito['estadoCuentaId'])

        credito = FacturasCredito.objects.create(
            FacturaId=factura,
            FechaInicioCredito=timezone.now(),
            montoTotalCredito=total_acumulado,
            saldoPendiente=total_acumulado,
            FechaLimiteCredito=datos_credito['FechaLimiteCredito'],
            estadoCuentaId=estado_cuenta
        )

        if turno and tipo_movimiento_id:
            tipo_mov = TipoMovimientoCaja.objects.get(id=tipo_movimiento_id)
            MovimientoCaja.objects.create(
                fecha=timezone.now(),
                descripcion=f"Venta Crédito Factura #{factura.NumFactura}",
                monto=Decimal('0.00'),
                tipoMovimientoCajaId=tipo_mov,
                facturaCreditoId=credito,
                turnoCajaId=turno
            )

    else:
        raise ValidationError({"condicionId": "Condición de pago no válida."})

    return factura