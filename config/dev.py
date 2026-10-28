from .settings import *
from decouple import config

DEBUG = True

ALLOWED_HOSTS = ['127.0.0.1','localhost']


DATABASES = {
    'default': {
        'ENGINE': 'mssql',
        'NAME': config('DB_NAME'),
        'HOST': config('DB_HOST'),
        'OPTIONS': {
            'driver': 'ODBC Driver 17 for SQL Server',
            'trusted_connection': 'yes',
            'extra_params': 'TrustServerCertificate=yes;',
        },
    },

    'dashboard': {
        'ENGINE': 'mssql',
        'NAME': config('DB_NAME_DASHBOARD'),
        'HOST': config('DB_HOST'),
        'OPTIONS': {
            'driver': 'ODBC Driver 17 for SQL Server',
            'trusted_connection': 'yes',
            'extra_params': 'TrustServerCertificate=yes;',
        },
    },

    'olap': {
        'ENGINE': 'mssql',
        'NAME': config('OLAP_DB_NAME'),
        'USER': config('OLAP_DB_USER'),
        'PASSWORD': config('OLAP_DB_PASSWORD'),
        'HOST': config('OLAP_DB_HOST'),
        'PORT': config('OLAP_DB_PORT', default='1433'),
        'OPTIONS': {
            'driver': 'ODBC Driver 17 for SQL Server',
            'extra_params': 'Encrypt=yes;TrustServerCertificate=yes;',
        },
    },
}


# Configuración de MongoDB para desarrollo local
MONGO_URI = config('MONGO_URI')
MONGO_DB_NAME = config('MONGO_DB_NAME')