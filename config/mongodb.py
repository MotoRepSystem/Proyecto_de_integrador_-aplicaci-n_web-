
from pymongo import MongoClient
from decouple import config

# Configuración tomada del archivo .env
MONGO_URI = config("MONGO_URI")
MONGO_DB_NAME = config("MONGO_DB_NAME")

# Cliente reutilizable durante la ejecución de Django
cliente_mongo = MongoClient(
    MONGO_URI,
    serverSelectionTimeoutMS=5000
)

# Base de datos para las incidencias
db_mongo = cliente_mongo[MONGO_DB_NAME]


def comprobar_conexion():

    #Comprueba que el servidor MongoDB responda.
    return cliente_mongo.admin.command("ping")
