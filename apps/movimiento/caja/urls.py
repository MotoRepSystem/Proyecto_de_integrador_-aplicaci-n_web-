from django.urls import path
from .views import (
    CajaApiView, 
    CajaIDAPIView, 
    TurnoCajaApiView, 
    TurnoCajaIDAPIView, 
    TurnoCajaActivoView,
    MovimientoCajaApiView, 
    MovimientoCajaIDAPIView,
    MovimientoCajaIDAPiGETView
)

urlpatterns = [
    # Cajas
    path('', CajaApiView.as_view(), name='caja-list-create'),
    path('<int:pk>/', CajaIDAPIView.as_view(), name='caja-detail'),

    # Turnos
    path('turno/', TurnoCajaApiView.as_view(), name='turno-caja-list-create'),
    path('turno/activo/', TurnoCajaActivoView.as_view(), name='turno-caja-activo'),
    path('turno/<int:pk>/', TurnoCajaIDAPIView.as_view(), name='turno-caja-detail'),

    # Movimientos
    path('movimiento/', MovimientoCajaApiView.as_view(), name='movimiento-caja-list-create'),
    path('movimiento/<int:pk>/', MovimientoCajaIDAPIView.as_view(), name='movimiento-caja-detail'),
    path('movimientocaja/turno/<int:pk>/', MovimientoCajaIDAPiGETView.as_view(), name='movimiento-caja-turno'),
]   