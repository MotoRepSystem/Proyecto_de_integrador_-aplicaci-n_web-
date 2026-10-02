from .settings import *
from decouple import config
import os

DEBUG = False

ALLOWED_HOSTS = [
    config('ALLOWED_HOST'),
]

print(">>> DB_HOST DESDE DJANGO:", os.environ.get("DB_HOST"))
print(">>> DB_USER DESDE DJANGO:", os.environ.get("DB_USER"))

DATABASES = {
    'default': {
        'ENGINE': 'mssql',
        'NAME': config('DB_NAME'),
        'USER': config('DB_USER'),
        'PASSWORD': config('DB_PASSWORD'),
        'HOST': config('DB_HOST'),
        'PORT': config('DB_PORT', default='1433'),
        'OPTIONS': {
            'driver': 'ODBC Driver 18 for SQL Server',
            'extra_params': 'Encrypt=yes;TrustServerCertificate=no',
        },
    },

    'dashboard': {
        'ENGINE': 'mssql',
        'NAME': config('DB_NAME_DASHBOARD'),
        'USER': config('DB_USER'),
        'PASSWORD': config('DB_PASSWORD'),
        'HOST': config('DB_HOST'),
        'PORT': config('DB_PORT', default='1433'),
        'OPTIONS': {
            'driver': 'ODBC Driver 18 for SQL Server',
            'extra_params': 'Encrypt=yes;TrustServerCertificate=no',
        },
    },
}

CSRF_TRUSTED_ORIGINS = [
    f"https://{config('ALLOWED_HOST')}",
]