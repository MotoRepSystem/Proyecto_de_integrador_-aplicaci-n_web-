from django.db import models
from django.contrib.auth.models import AbstractUser
from apps.catalogos.empleados.models import Empleados

class User(AbstractUser):
    empleado = models.OneToOneField(
        Empleados,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='usuario',
        verbose_name='Empleado'
    )

    def __str__(self):
        return f"{self.username} - {self.empleado if self.empleado else 'Sin Empleado'}"