from django.urls import path
from .views import IncidenciaCrearView, IncidenciaListaView

urlpatterns = [
    path("crear/",IncidenciaCrearView.as_view(),name="incidencia-crear"
    ),

    path("listar/",IncidenciaListaView.as_view(),name="incidencias-listar")
    
]