from django.urls import path
from .views import ClienteApiview,ClienteIDAPIView,ClienteEliminarFisicoAPIView

app_name= "Clientes"

urlpatterns= [
    path("",ClienteApiview.as_view(),name="Clientes"),
    path('<int:pk>',ClienteIDAPIView.as_view()),
    path('eliminar-fisico/<int:pk>', ClienteEliminarFisicoAPIView.as_view(), name='eliminar_fisico'),
]