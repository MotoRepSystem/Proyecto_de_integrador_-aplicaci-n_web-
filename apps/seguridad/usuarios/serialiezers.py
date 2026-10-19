from rest_framework import serializers
from django.contrib.auth.models import Group
from .models import User
from apps.catalogos.empleados.models import Empleados

class UserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True)
    password2 = serializers.CharField(write_only=True, required=True)
    empleado_id = serializers.PrimaryKeyRelatedField(
        queryset=Empleados.objects.all(),
        source='empleado',
        required=False,
        allow_null=True
    )
    grupo_id = serializers.IntegerField(write_only=True, required=False)

    class Meta:
        model = User
        fields = (
            'username', 'password', 'password2', 'email', 
            'first_name', 'last_name', 'empleado_id', 'grupo_id'
        )

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Las contraseñas no coinciden."})
        return attrs

    def create(self, validated_data):
        # 1. Extraemos los campos que requieren tratamiento especial
        validated_data.pop('password2', None)
        password = validated_data.pop('password')
        grupo_id = validated_data.pop('grupo_id', None)
        
        # 2. Creamos la instancia con los campos restantes (username, email, empleado, etc.)
        user = User(**validated_data)
        
        # 3. Encriptamos la contraseña
        user.set_password(password)
        user.save()

        # 4. Asignamos el grupo de permisos si viene en la petición
        if grupo_id:
            try:
                grupo = Group.objects.get(id=grupo_id)
                user.groups.add(grupo)
            except Group.DoesNotExist:
                pass

        return user