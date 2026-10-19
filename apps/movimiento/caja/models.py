from django.db import models
from django.apps import apps
from django.db.models import Sum
from decimal import Decimal

from apps.catalogos.empleados.models import Empleados
from apps.catalogos.tipoMovimientoCaja.models import TipoMovimientoCaja
from apps.movimiento.factura.models import Facturas, FacturasCredito
from apps.movimiento.compra.models import Compras, ComprasCredito

class Caja (models.Model):
    NumCaja= models.IntegerField(verbose_name='Numero de caja')
    abierta = models.BooleanField(default=True)
    estado = models.BooleanField(default=True)
    
    class Meta:
        verbose_name_plural = "Cajas"

    def __str__ (self):
        return f"{self.NumCaja}"
    
class TurnoCaja (models.Model):
    SaldoInicial= models.DecimalField(verbose_name='Saldo inicial',  max_digits=10,decimal_places=2)
    Egresos = models.DecimalField(verbose_name='Egresos',  max_digits=10,decimal_places=2, null=True, blank=True)
    SaldoFinal = models.DecimalField (verbose_name='Saldo final',  max_digits=10,decimal_places=2, null=True, blank=True)
    FechaApertura = models.DateTimeField(verbose_name='Fecha de apertura de la caja')
    FechaCierre = models.DateTimeField(verbose_name='Fecha de cierre de la caja', null=True, blank=True)
    NumCajaid= models.ForeignKey(Caja, verbose_name='Numero de caja', on_delete=models.PROTECT)
    EmpleadoId = models.ForeignKey(Empleados,verbose_name='Empleados', on_delete=models.PROTECT)
    Din_efectivo = models.DecimalField (verbose_name='Dinero en efectivo',max_digits=10, decimal_places=2 , null=True, blank=True)
    Din_digital = models.DecimalField (verbose_name='Dinero en digital',max_digits=10, decimal_places=2, null=True, blank=True)
    abierto = models.BooleanField(default=True, verbose_name='¿Turno Abierto?')
    estado = models.BooleanField(default=True)
    
    class Meta:
        verbose_name_plural = "Cajas"

    def __str__ (self):
        return f"{self.EmpleadoId} - {self.FechaApertura} - {self.FechaCierre}"
        
    @property
    def efectivo_esperado(self):
        """Saldo inicial + pagos en efectivo (MetodoPago ID 1) - Egresos"""
        

        MovimientoPago = apps.get_model('movimientoPago', 'MovimientoPago')

        # Sumar desgloses de pago que sean en efectivo (ID 1)
        ingresos_efectivo = MovimientoPago.objects.filter(
            MovimientoCajaId__turnoCajaId=self,
            MovimientoCajaId__estado=True,
            metodoPagoId__id=1
        ).aggregate(total=Sum('monto'))['total'] or Decimal('0.00')

        # Sumar egresos directos de la caja
        egresos = self.movimientocaja_set.filter(
            estado=True,
            tipoMovimientoCajaId__Tipo='Egreso'
        ).aggregate(total=Sum('monto'))['total'] or Decimal('0.00')

        saldo_inicial = self.SaldoInicial or Decimal('0.00')
        return saldo_inicial + ingresos_efectivo - egresos

    @property
    def digital_esperado(self):
        """Sumar desgloses de pago que NO sean efectivo (Excluye MetodoPago ID 1)"""
        from django.apps import apps
        from django.db.models import Sum
        from decimal import Decimal

        MovimientoPago = apps.get_model('movimientoPago', 'MovimientoPago')

        total_digital = MovimientoPago.objects.filter(
            MovimientoCajaId__turnoCajaId=self,
            MovimientoCajaId__estado=True
        ).exclude(
            metodoPagoId__id=1
        ).aggregate(total=Sum('monto'))['total'] or Decimal('0.00')

        return total_digital

class MovimientoCaja (models.Model):
    
    fecha = models.DateTimeField(verbose_name='Fecha')
    descripcion = models.CharField (verbose_name='Descripcion', null=True, blank=True,  max_length=300)
    monto = models.DecimalField (verbose_name='Monto',max_digits=10, decimal_places=2)
    tipoMovimientoCajaId = models.ForeignKey(TipoMovimientoCaja, verbose_name='Tipo de movimiento', on_delete=models.PROTECT)
    facturaid= models.ForeignKey(Facturas,verbose_name='Factura', null=True, blank=True, on_delete=models.PROTECT)
    compraid= models.ForeignKey(Compras,verbose_name='Compra', null=True, blank=True, on_delete=models.PROTECT)
    compraCreditoId= models.ForeignKey(ComprasCredito, verbose_name='Compra al credito', null=True, blank=True, on_delete=models.PROTECT)
    facturaCreditoId = models.ForeignKey(FacturasCredito, verbose_name='Factura al credito', null=True, blank=True, on_delete=models.PROTECT)
    turnoCajaId = models.ForeignKey(TurnoCaja, verbose_name='Turno de caja', on_delete=models.PROTECT)
    estado= models.BooleanField(default=True)
    
    class Meta:
        verbose_name_plural = "Movimientos"

    def __str__ (self):
        return f"{self.turnoCajaId} - {self.tipoMovimientoCajaId} - {self.monto}"
