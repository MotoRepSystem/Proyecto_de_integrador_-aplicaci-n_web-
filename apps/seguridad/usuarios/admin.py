from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from apps.seguridad.usuarios.models import User

@admin.register(User)
class CustomUserAdmin(UserAdmin):
    # Campos que se mostrarán en la lista del admin
    list_display = ('username', 'email', 'first_name', 'last_name', 'empleado', 'is_staff', 'is_superuser')
    
    # Agregar 'empleado' a los formularios de creación y edición
    fieldsets = UserAdmin.fieldsets + (
        ('Información de Empleado', {'fields': ('empleado',)}),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('Información de Empleado', {'fields': ('empleado',)}),
    )