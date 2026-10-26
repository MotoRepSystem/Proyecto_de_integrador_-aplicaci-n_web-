from django.db import models

class Empleados (models.Model):
    syncId = models.UUIDField(unique=True, null=True, blank=True, editable=False)
    Nombres = models.CharField(verbose_name='Nombres', max_length=100)
    Apellidos = models.CharField(verbose_name='Apellidos', max_length=100)
    Telefono = models.CharField(verbose_name='Teléfono', max_length=8)
    NumCedula = models.CharField(verbose_name='Numero de cédula', max_length=16, unique=True)
    estado = models.BooleanField(default=True)

    class Meta:
       verbose_name_plural= 'Empleados'

    def __str__ (self):
      return f"{self.Nombres} - {self.Apellidos}"