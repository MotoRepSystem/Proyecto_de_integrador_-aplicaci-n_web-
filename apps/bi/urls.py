
from django.urls import path
from . import views

app_name = 'bi'

urlpatterns = [
    path(
        'ventas-por-periodo/',
        views.ventas_por_periodo,
        name='ventas_por_periodo',
    ),
    path(
        'ventas-por-satisfaccion/',
        views.ventas_por_satisfaccion,
        name='ventas_por_satisfaccion',
    ),
    path(
        'satisfaccion-con-incidencia/',
        views.satisfaccion_con_incidencia,
        name='satisfaccion_con_incidencia',
    ),
    path(
        'satisfaccion-sin-incidencia/',
        views.satisfaccion_sin_incidencia,
        name='satisfaccion_sin_incidencia',
    ),
    path(
        'incidencias-por-cliente/',
        views.incidencias_por_cliente,
        name='incidencias_por_cliente',
    ),
]
