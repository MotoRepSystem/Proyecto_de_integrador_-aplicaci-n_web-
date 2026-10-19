from django.urls import path

from .views import EncuestaCrearView, EncuestaConexionView


urlpatterns = [
    path(
        "crear/",
        EncuestaCrearView.as_view(),
        name="encuesta-crear"
    ),
    path(
        "conexion/",
        EncuestaConexionView.as_view(),
        name="encuesta-conexion"
    ),
]
