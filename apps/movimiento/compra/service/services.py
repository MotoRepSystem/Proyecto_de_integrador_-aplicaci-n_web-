from django.db import transaction
from decimal import Decimal
from django.utils import timezone
from rest_framework.exceptions import ValidationError
from apps.catalogos.tipoMovimientoCaja.models import TipoMovimientoCaja
from apps.movimiento.compra.models import Compras, DetalleCompra, ComprasCredito
from apps.movimiento.producto.models import RegistroProducto
from apps.catalogos.estadoCuenta.models import EstadoCuenta
from apps.movimiento.caja.models import MovimientoCaja, TurnoCaja
from apps.movimiento.movimientoPago.models import MovimientoPago



class CompraService:

    @staticmethod
    def crear_Compra(data):

        fecha = data['Fecha']
        numero = data['NumCompra']
        proveedor = data['ProveedorId']
        condicion = data['CondicionPagoId']
        detalles = data['detallesCompra']
        fecha_vencimiento = data.get('FechaVencimiento')

        metodos_pago = data.get('movimientos_pagos', [])

        with transaction.atomic():

            #Buscar turno de caja activo
            turno_caja = (
            TurnoCaja.objects
            .filter(estado=True)
            .order_by('-FechaApertura')
            .first()  
            )  

            if not turno_caja:
                raise ValidationError("No hay un turno de caja activo. No se puede procesar la compra.")
            
            # CREAR LA COMPRA

            compra = Compras.objects.create(
                Fecha=fecha,
                NumCompra=numero,
                Total=Decimal('0.00'),
                ProveedorId=proveedor,
                CondicionPagoId=condicion
            )

            total = Decimal('0.00')
            detalles_crear = []

            # PREPARAR LOS DETALLES

            for detalle in detalles:

                cantidad = detalle["Cantidad"]
                precioUnitario = detalle["PrecioUnitario"]
                producto = detalle["DetalleProductoId"]

                subtotal = cantidad * precioUnitario

                detalle_obj = DetalleCompra(
                    Cantidad=cantidad,
                    PrecioUnitario=precioUnitario,
                    Subtotal=subtotal,
                    CompraId=compra,
                    DetalleProductoId=producto
                )

                detalles_crear.append(detalle_obj)

                total += subtotal

            # BULK CREATE DE DETALLE COMPRA

            DetalleCompra.objects.bulk_create(detalles_crear)

            # OBTENER LOS DETALLES YA GUARDADOS

            detalles_insertados = list(
                DetalleCompra.objects.filter(
                    CompraId=compra
                ).order_by('id')
            )

            # PREPARAR REGISTRO PRODUCTO

            lotes_crear = []

            for det, datos_detalle in zip(
                detalles_insertados,
                detalles
            ):

                lotes_crear.append(
                    RegistroProducto(
                        Cantidad=det.Cantidad,
                        precioCosto=det.PrecioUnitario,
                        PrecioVenta=datos_detalle['PrecioVenta'],
                        DetalleCompraId=det
                    )
                )

            # BULK CREATE DE REGISTRO PRODUCTO

            RegistroProducto.objects.bulk_create(lotes_crear)

            # ACTUALIZAR TOTAL DE LA COMPRA

            compra.Total = total
            compra.save(update_fields=['Total'])

            # SI ES CRÉDITO, CREAR CUENTA

            condicion_nombre = (condicion.descripcion.strip().lower())
            print(condicion_nombre)

            if condicion_nombre == 'al crédito':

                # No debería recibir pagos
                if metodos_pago:
                    raise ValidationError(
                        "Una compra a crédito no puede tener movimientos de pago."
                    )

                # Buscar estado Pendiente

                estado_pendiente = (
                    EstadoCuenta.objects
                    .get(
                        descripcion__iexact='Pendiente',
                        estado=True
                    )
                )

                # Crear ComprasCredito

                compra_credito = ComprasCredito.objects.create(
                    MontoTotal=total,
                    SaldoPendiente=total,
                    FechaInicio=fecha,
                    FechaVencimiento=fecha_vencimiento,
                    CompraId=compra,
                    EstadoCuentaId=estado_pendiente
                )

                # Buscar tipo FacturaCredito

                tipo_mov_credito = (
                    TipoMovimientoCaja.objects
                    .get(Tipo__iexact='Factura Credito')
                )

                # Crear movimiento de caja informativo

                MovimientoCaja.objects.create(
                    fecha=timezone.now(),
                    monto=Decimal('0.00'),
                    descripcion=(
                        f"Registro de Compra a Crédito N° {numero}"
                    ),
                    compraCreditoId=compra_credito,
                    tipoMovimientoCajaId=tipo_mov_credito,
                    turnoCajaId=turno_caja
                )

                # NO modificar TurnoCaja.Egresos

            # COMPRA AL CONTADO

            elif condicion_nombre == 'al contado' :

                # Debe existir al menos un pago

                if not metodos_pago:
                    raise ValidationError(
                        "Una compra al contado debe tener al menos un pago."
                    )

                # Calcular total de pagos

                total_pagos = Decimal('0.00')

                for pago in metodos_pago:

                    monto_pago = Decimal(
                        str(pago['monto'])
                    )

                    if monto_pago <= Decimal('0.00'):
                        raise ValidationError(
                            "El monto de un pago debe ser mayor que cero."
                        )

                    total_pagos += monto_pago

                # VALIDACIÓN FUNDAMENTAL

                if total_pagos != total:

                    raise ValidationError(
                        f"El total de los pagos ({total_pagos}) "
                        f"no coincide con el total de la compra ({total})."
                    )

                # Tipo Egreso

                tipo_mov_egreso = (
                    TipoMovimientoCaja.objects
                    .get(Tipo__iexact='Egreso')
                )

                # Crear movimiento de caja

                movimiento_caja = MovimientoCaja.objects.create(
                    fecha=timezone.now(),
                    monto=total_pagos,
                    descripcion=(
                        f"Pago de Compra Contado N° {numero}"
                    ),
                    compraid=compra,
                    tipoMovimientoCajaId=tipo_mov_egreso,
                    turnoCajaId=turno_caja
                )

                # 9. CREAR DESGLOSE DE PAGOS

                pagos_crear = []

                monto_egreso_caja = Decimal('0.00')

                for pago in metodos_pago:

                    monto_pago = Decimal(
                        str(pago['monto'])
                    )

                    metodo_pago = pago['metodoPagoId']

                    # Determinar si afecta caja

                    if metodo_pago.Tipo.strip().lower() == 'dinero exterior':
                        mov_caja = False
                    else:
                        mov_caja = True

                    # Crear MovimientoPago

                    pagos_crear.append(
                        MovimientoPago(
                            monto=monto_pago,
                            metodoPagoId=metodo_pago,
                            MovimientoCajaId=movimiento_caja,
                            MovCaja=mov_caja
                        )
                    )

                    # Solo sumar dinero que realmente salió de caja

                    if mov_caja:
                        monto_egreso_caja += monto_pago

                # 10. GUARDAR MOVIMIENTOS DE PAGO

                MovimientoPago.objects.bulk_create(
                    pagos_crear
                )

                # 11. ACTUALIZAR EGRESOS DEL TURNO

                if monto_egreso_caja > Decimal('0.00'):

                    turno_caja.Egresos = (
                        Decimal(str(turno_caja.Egresos or 0))
                        + monto_egreso_caja
                    )

                    turno_caja.save(
                        update_fields=['Egresos']
                    )

            else:

                raise ValidationError(
                    "La condición de pago debe ser Contado o Crédito."
                )

        return compra