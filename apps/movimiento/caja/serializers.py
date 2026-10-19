from rest_framework.serializers import ModelSerializer, CharField, DateTimeField, ReadOnlyField, ValidationError,SerializerMethodField
from .models import TurnoCaja, MovimientoCaja, Caja
from rest_framework import serializers

class CajaSerializer(ModelSerializer):
    class Meta:
        model = Caja
        fields = ['id', 'NumCaja', 'abierta', 'estado']


class TurnoCajaSerializer(ModelSerializer):
    Empleado_nombre = CharField(source='EmpleadoId.Nombres', read_only=True)
    num_caja_numero = CharField(source='NumCajaid.NumCaja', read_only=True)
    fecha_incio_formateada = DateTimeField(source='FechaApertura', format='%d/%m/%Y %I:%M:%S %p', read_only=True)
    fecha_cierre_formateada = DateTimeField(source='FechaCierre', format='%d/%m/%Y %I:%M:%S %p', read_only=True)
    
    # Propiedades calculadas en tiempo real para auditar el turno
    efectivo_esperado = ReadOnlyField()
    digital_esperado = ReadOnlyField()

    class Meta:
        model = TurnoCaja
        fields = [
            'id', 'SaldoInicial', 'Egresos', 'SaldoFinal', 
            'FechaApertura', 'fecha_incio_formateada', 
            'FechaCierre', 'fecha_cierre_formateada', 
            'NumCajaid', 'num_caja_numero', 'EmpleadoId', 
            'Empleado_nombre', 'Din_efectivo', 'Din_digital', 'abierto',
            'efectivo_esperado', 'digital_esperado'
        ]
        # Campos que el cliente no debe modificar directamente en la creación/edición libre
        read_only_fields = ['FechaApertura', 'Egresos', 'fecha_incio_formateada', 'fecha_cierre_formateada']

    def validate(self, data):
        """
        Validación del arqueo al momento de ejecutar el cierre de caja.
        """
        # Si la petición intenta cambiar el estado de la caja a cerrado (abierto = False)
        if 'abierto' in data and not data['abierto']:
            din_efectivo = data.get('Din_efectivo', getattr(self.instance, 'Din_efectivo', None))
            din_digital = data.get('Din_digital', getattr(self.instance, 'Din_digital', None))

            if din_efectivo is None or din_digital is None:
                raise ValidationError(
                    {"error": "Para cerrar el turno debe declarar el dinero físico y digital contado en caja."}
                )
            
            # Asigna automáticamente el SaldoFinal como la suma del dinero reportado
            data['SaldoFinal'] = din_efectivo + din_digital
            
        return data






class MovimientoCajaSerialiezer(serializers.ModelSerializer):
    tipo_movimiento_nombre = serializers.CharField(
        source="tipoMovimientoCajaId.Tipo",
        read_only=True
    )

    nombreEmpleado = serializers.CharField(
        source="turnoCajaId.EmpleadoId.Nombres",
        read_only=True
    )

    fecha_incio_formateada = serializers.DateTimeField(
        source="fecha",
        format="%d/%m/%Y %I:%M %p",
        read_only=True
    )

    documento_relacionado = serializers.SerializerMethodField()

    class Meta:
        model = MovimientoCaja
        fields = [
            "id",
            "turnoCajaId",
            "nombreEmpleado",
            "fecha",
            "fecha_incio_formateada",
            "tipoMovimientoCajaId",
            "tipo_movimiento_nombre",
            "monto",
            "facturaid",
            "facturaCreditoId",
            "compraid",
            "compraCreditoId",
            "documento_relacionado",
            "descripcion",
            "estado",
        ]

    def get_documento_relacionado(self, obj):
        # Venta de contado
        if obj.facturaid_id:
            return f"Factura #{obj.facturaid.NumFactura} · Contado"

        # Venta al crédito
        if obj.facturaCreditoId_id:
            factura_credito = obj.facturaCreditoId
            factura = factura_credito.FacturaId
            return f"Factura #{factura.NumFactura} · Crédito"

        # Compra de contado
        if obj.compraid_id:
            return f"Compra #{obj.compraid.NumCompra} · Contado"

        # Compra al crédito
        if obj.compraCreditoId_id:
            compra_credito = obj.compraCreditoId
            compra = compra_credito.CompraId
            return f"Compra #{compra.NumCompra} · Crédito"

        # Movimiento sin factura ni compra
        return obj.descripcion or "Sin documento asociado"