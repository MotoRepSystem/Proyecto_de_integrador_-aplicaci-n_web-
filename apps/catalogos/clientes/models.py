from django.db import models

class Clientes(models.Model):
    syncId = models.UUIDField(unique=True, null=True, blank=True, editable=False)
    Nombres = models.CharField(verbose_name='Nombres', max_length=100)
    Apellidos = models.CharField(verbose_name="Apellidos", max_length=100)
    NumCedula = models.CharField(verbose_name='Número de cédula', max_length=16,null= True, blank=True, unique=True)
    NumTeléfono= models.CharField(verbose_name='Número de teléfono', max_length=8, null= True, blank=True)
    estado = models.BooleanField(default=True)

    class Meta:
        verbose_name_plural = 'Clientes'
        
    
    def __str__(self):
        return f"{self.Nombres} - {self.Apellidos} - {self.NumCedula}"
    