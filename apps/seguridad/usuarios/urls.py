from django.urls import path
from .views import UserCreateView,UsuarioAutenticadoView

urlpatterns= [
    path("api/v1/registrar/",UserCreateView.as_view(),name='register-name'),
    path(
        "perfil/",
        UsuarioAutenticadoView.as_view(),
        name="usuario_autenticado"
    ),

]