from django.urls import path
from . import views

urlpatterns = [
    path("test/", views.test_kpi, name="test-kpi"),

    path("ventas-por-mes/",views.ventas_por_mes,name="ventas-por-mes"),

    path("inventario-por-categoria/",views.inventario_por_categoria,name="inventario-por-categoria"),

    path("ventas-por-metodo-pago/",views.ventas_por_metodo_pago,name="ventas-por-metodo-pago"),

    path(
    "productos-mayor-rotacion/",
    views.productos_mayor_rotacion,
    name="productos-mayor-rotacion"
),

path(
    "ventas-por-nivel-satisfaccion/",
    views.ventas_por_nivel_satisfaccion,
    name="ventas-por-nivel-satisfaccion"
),
]