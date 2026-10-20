
from django.urls import path

from .views import (
    ClienteApiview,
    ClienteIDAPIView,
    ClienteEliminarFisicoAPIView,
    ClienteEncuestaAPIView,
)

app_name = "Clientes"

urlpatterns = [
    path("", ClienteApiview.as_view(), name="Clientes"),
    path('<int:pk>',ClienteIDAPIView.as_view()),
    path('eliminar-fisico/<int:pk>', ClienteEliminarFisicoAPIView.as_view(), name='eliminar_fisico'),
    # Ruta para buscar clientes y facturas disponibles para la encuesta
    path(
        "encuesta/buscar",
        ClienteEncuestaAPIView.as_view(),
        name="buscar_cliente-encuesta",
    ),
]
