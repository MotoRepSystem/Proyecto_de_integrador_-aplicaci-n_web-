from rest_framework.serializers import ModelSerializer, CharField, DateField
from rest_framework import serializers
from .models import Compras, DetalleCompra, ComprasCredito
from apps.movimiento.compra.service.validaciones import validar_compra
from apps.movimiento.movimientoPago.models import MetodoPago
from apps.movimiento.movimientoPago.models import MovimientoPago


class DetalleCompraSerializer(ModelSerializer):

    PrecioVenta = serializers.DecimalField(max_digits=7, decimal_places=2, write_only=True)
    Detalle_Producto = serializers.SerializerMethodField()

    class Meta:
        
        model = DetalleCompra
        fields = [  'id',
                    'Cantidad',
                    'PrecioUnitario',
                    'Subtotal',
                    'CompraId',
                    'DetalleProductoId',
                    'Detalle_Producto',
                    'PrecioVenta'
                   ]
        
        read_only_fields = [
                                'Subtotal',
                            ]

        extra_kwargs = {
                                'DetalleProductoId': {'write_only': True},
                                'CompraId': {'write_only': True, 'required': False}
        }
        
    def get_Detalle_Producto(self, obj):
        if obj.DetalleProductoId:
            detalle_producto = obj.DetalleProductoId
            producto = detalle_producto.producto.Nombre
            marca = detalle_producto.MarcaId.Nombre
            moto = detalle_producto.MotoId.Modelo

            return f"{producto} - {marca} - {moto}"
        
class PagoCompraSerializer(ModelSerializer):

    metodo_pago_nombre = CharField(source='metodoPagoId.Tipo', read_only=True)
    metodoPagoId = serializers.PrimaryKeyRelatedField (queryset=MetodoPago.objects.all(), write_only=True)

    class Meta:
        model = MovimientoPago
        fields = ['metodoPagoId', 'monto', 'metodo_pago_nombre']

class CompraSerializer(ModelSerializer):

    Proveedor_nombre = CharField(source='ProveedorId.Nombre', read_only=True)
    CondicionPago_nombre = CharField(source='CondicionPagoId.descripcion', read_only=True)
    Fecha = DateField(required=True, input_formats=['%Y-%m-%d'], format='%Y-%m-%d')
    detalles_Compra = DetalleCompraSerializer(many=True, source='detallesCompra', required=True)
    movimientos_pagos = PagoCompraSerializer(many=True, write_only=True, required=False)
    FechaVencimiento = DateField(required=False, write_only=True, input_formats=['%Y-%m-%d'], format='%Y-%m-%d', allow_null=True)

    class Meta:
        
        model = Compras
        fields = [
                    'id',
                    'Fecha',
                    'NumCompra',
                    'Total',
                    'ProveedorId',
                    'CondicionPagoId',
                    'Proveedor_nombre',
                    'CondicionPago_nombre',
                    'detalles_Compra',
                    'movimientos_pagos',
                    'FechaVencimiento'
                  ]
        
        read_only_fields = [
                                'Total',
                            ]

        extra_kwargs = {
                            'ProveedorId': {'write_only': True},
                            'CondicionPagoId': {'write_only': True}
                        }

    def validate(self, data):
        validar_compra(data)
        return data

class CompraCreditoSerializer(ModelSerializer):

    estado_cuenta_nombre = CharField(source='EstadoCuentaId.descripcion', read_only=True)
    Compra_nombre = serializers.SerializerMethodField()

    class Meta:
        
        model = ComprasCredito
        fields = [
                    'MontoTotal',
                    'SaldoPendiente',
                    'FechaInicio',
                    'FechaVencimiento',
                    'CompraId',
                    'Compra_nombre',
                    'EstadoCuentaId',
                    'estado_cuenta_nombre'
                ]
        
        read_only_fields = [
                                'FechaInicio',
                                'SaldoPendiente',
                                'MontoTotal'
                            ]

        extra_kwargs = {
                            'CompraId': {'write_only': True},
                            'EstadoCuentaId': {'write_only': True}
                        }

        
    
    def get_Compra_nombre(self, obj):
        if obj.CompraId:
            compra = obj.CompraId
            num_compra = compra.NumCompra
            proveedor_nombre = compra.ProveedorId.Nombre
            return f"Compra {num_compra} - {proveedor_nombre}"