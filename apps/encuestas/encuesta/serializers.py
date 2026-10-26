from rest_framework import serializers

class SatisfaccionServicioSerializer(serializers.Serializer):
    satisfaccion_general = serializers.IntegerField(min_value=1, max_value=5)
    atencion_personal = serializers.IntegerField(min_value=1, max_value=5)
    experiencia_compra = serializers.IntegerField(min_value=1, max_value=5)


class PreferenciasUsoSerializer(serializers.Serializer):
    facilidad_encontrar_producto = serializers.IntegerField(min_value=1, max_value=5)
    variedad_productos = serializers.IntegerField(min_value=1, max_value=5)
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
