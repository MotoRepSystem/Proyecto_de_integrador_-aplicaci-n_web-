from django.contrib import admin
from apps.catalogos.empleados.models import Empleados

@admin.register(Empleados)
class EmpladoAdmin(admin.ModelAdmin):
    search_fields = ['id', 'NumCedula']
    list_display = ['Nombres', 'Apellidos','Telefono','NumCedula','estado','syncId']
# Register your models here.
