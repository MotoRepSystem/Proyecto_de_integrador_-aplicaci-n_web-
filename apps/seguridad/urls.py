# Importar las funciones necesarias para definir e incluir rutas
from django.urls import path, include

# Definir las rutas principales del módulo de seguridad
urlpatterns = [
    # Incluir las rutas definidas en el módulo de usuarios
    path('usuarios/', include('apps.seguridad.usuarios.urls')),
]