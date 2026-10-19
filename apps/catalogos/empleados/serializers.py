from rest_framework.serializers import ModelSerializer
from .models import Empleados

class EmpleadoSerializer (ModelSerializer):
    class Meta:
        model=Empleados
        fields= ['id','syncId', 'Nombres','Apellidos','Telefono','NumCedula']

