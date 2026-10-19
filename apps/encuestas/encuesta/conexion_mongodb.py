from pymongo import MongoClient
from pymongo.errors import PyMongoError

# URI de conexión al servidor MongoDB local.
#MONGO_URI = "mongodb://localhost:27017/"

# URI de conexión al servidor MongoDB en Azure.
MONGO_URI="mongodb+srv://dbuser2emrrb:Xfcmr9268kv1@motorep-nosql-database.mongocluster.cosmos.azure.com/?tls=true&authMechanism=SCRAM-SHA-256&retrywrites=false&maxIdleTimeMS=120000"

# Base de datos destinada a las encuestas de satisfacción.
#MONGO_DB_NAME = "MotoRepDB"

# Base de datos destinada a las encuestas de satisfacción en Azure.
MONGO_DB_NAME = "MotoRep-NoSql-Database"

# Crear una conexión independiente para el módulo de encuestas.
cliente_encuestas = MongoClient(
   MONGO_URI,
    serverSelectionTimeoutMS=5000)

# Seleccionar la base de datos.
db_encuestas = cliente_encuestas[MONGO_DB_NAME]

# Seleccionar la colección donde se guardarán las encuestas.
coleccion_encuestas = db_encuestas["encuestas_satisfaccion"]


def comprobar_conexion():
    """Comprueba que el servidor MongoDB esté disponible."""
    return cliente_encuestas.admin.command("ping")
