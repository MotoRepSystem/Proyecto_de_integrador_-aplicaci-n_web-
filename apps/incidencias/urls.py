from django.urls import path, include


urlpatterns = [
    path('incidencia/', include('apps.incidencias.incidencia.urls')),
    
]