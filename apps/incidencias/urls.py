from django.urls import path, include

from apps.incidencias.incidencia.views import IncidenciaDetalleView, IncidenciaListaView


urlpatterns = [
    path('incidencia/', include('apps.incidencias.incidencia.urls')),
    path("incidencias/lista/", IncidenciaListaView.as_view())
]