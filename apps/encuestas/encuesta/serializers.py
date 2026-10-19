from rest_framework import serializers


class SatisfaccionServicioSerializer(serializers.Serializer):
    satisfaccion_general = serializers.CharField()
    atencion_personal = serializers.CharField()
    experiencia_compra = serializers.CharField()


class PreferenciasUsoSerializer(serializers.Serializer):
    facilidad_encontrar_producto = serializers.CharField()
    variedad_productos = serializers.CharField()
    marca_preferida = serializers.CharField()


class EncuestaSerializer(serializers.Serializer):
    cliente_id = serializers.IntegerField()
    factura_id = serializers.IntegerField(
        required=True,
        allow_null=False
    )

    satisfaccion_servicio = SatisfaccionServicioSerializer()
    preferencias_uso = PreferenciasUsoSerializer()

    productos_frecuentes = serializers.ListField(
        child=serializers.CharField()
    )

    comentario_servicio = serializers.CharField(
        required=False,
        allow_blank=True
    )

    sugerencia = serializers.CharField(
        required=False,
        allow_blank=True
    )

    fecha_encuesta = serializers.DateTimeField(required=False)
