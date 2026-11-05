from rest_framework import serializers
from .models import Facturas, DetalleFactura, FacturasCredito
from apps.movimiento.caja.models import MovimientoCaja
from apps.movimiento.movimientoPago.models import MovimientoPago

# --- SERIALIZERS PARA DETALLES ---

class DetalleFacturaSerializer(serializers.ModelSerializer):
    producto_nombre = serializers.CharField(
        source='loteId.DetalleCompraId.DetalleProductoId.producto.Nombre', 
        read_only=True
    )

    class Meta:
        model = DetalleFactura
        fields = ['id', 'Cantidad', 'PrecioUnitario', 'Subtotal', 'loteId', 'producto_nombre']
        read_only_fields = ['id', 'PrecioUnitario', 'Subtotal']


# --- SERIALIZERS COMPLEMENTARIOS PARA LA RESPUESTA ---

class FacturaCreditoSerializer(serializers.ModelSerializer):
    estado_cuenta_nombre = serializers.CharField(source='estadoCuentaId.descripcion', read_only=True)

    class Meta:
        model = FacturasCredito
        fields = [
            'id', 'FechaInicioCredito', 'montoTotalCredito', 
            'saldoPendiente', 'FechaLimiteCredito', 
            'estadoCuentaId', 'estado_cuenta_nombre'
        ]
        read_only_fields = ['id', 'FechaInicioCredito', 'montoTotalCredito', 'saldoPendiente']


class MovimientoPagoResponseSerializer(serializers.ModelSerializer):
    metodo_pago_nombre = serializers.CharField(source='metodoPagoId.descripcion', read_only=True)

    class Meta:
        model = MovimientoPago
        fields = ['id', 'monto', 'metodoPagoId', 'metodo_pago_nombre']


class MovimientoCajaResponseSerializer(serializers.ModelSerializer):
    pagos = MovimientoPagoResponseSerializer(source='movimientopago_set', many=True, read_only=True)
    tipo_movimiento_nombre = serializers.CharField(source='tipoMovimientoCajaId.descripcion', read_only=True)

    class Meta:
        model = MovimientoCaja
        fields = ['id', 'fecha', 'descripcion', 'monto', 'tipoMovimientoCajaId', 'tipo_movimiento_nombre', 'turnoCajaId', 'pagos']


# --- SERIALIZER PRINCIPAL DE FACTURA ---

class FacturaSerializer(serializers.ModelSerializer):

    cliente_nombre = serializers.CharField(
        source='ClienteId.Nombres',
        read_only=True
    )

    cliente_cedula = serializers.CharField(
        source='ClienteId.NumCedula',
        read_only=True
    )

    condicion_nombre = serializers.CharField(
        source='condicionId.descripcion',
        read_only=True
    )

    fecha_formateada = serializers.DateTimeField(
        source='Fecha',
        format='%d/%m/%Y %I:%M:%S %p',
        read_only=True
    )

    detalles = DetalleFacturaSerializer(many=True, read_only=True)
    credito = serializers.SerializerMethodField()
    movimiento_caja = serializers.SerializerMethodField()

    class Meta:
        model = Facturas
        fields = [
            'id', 'NumFactura', 'fecha_formateada', 'Total',
            'ClienteId', 'cliente_nombre', 'cliente_cedula',
            'condicionId', 'condicion_nombre',
            'detalles', 'credito', 'movimiento_caja'
        ]

        read_only_fields = [
            'id', 'Total', 'fecha_formateada'
        ]

    # NUEVO MÉTODO
    def get_credito(self, obj):

        creditos = getattr(obj, 'creditos_prefetch', None)

        if creditos is None:
            credito_obj = FacturasCredito.objects.filter(
                FacturaId=obj
            ).first()
        else:
            credito_obj = creditos[0] if creditos else None

        if credito_obj:
            return FacturaCreditoSerializer(credito_obj).data

        return None

    # NUEVO MÉTODO
    def get_movimiento_caja(self, obj):

        movimientos = getattr(
            obj,
            'movimientos_caja_prefetch',
            None
        )

        if movimientos is None:
            movimiento_obj = MovimientoCaja.objects.filter(
                facturaid=obj
            ).first()
        else:
            movimiento_obj = movimientos[0] if movimientos else None

        if movimiento_obj:
            return MovimientoCajaResponseSerializer(
                movimiento_obj
            ).data

        return None