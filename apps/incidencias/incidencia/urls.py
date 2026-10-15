from django.urls import path
from .views import IncidenciaCrearView

urlpatterns = [
    path("crear/",IncidenciaCrearView.as_view(),name="incidencia-crear"
    ),
]