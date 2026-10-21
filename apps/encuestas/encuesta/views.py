# Importar las funciones para manejar fechas y horas.
from datetime import datetime, timezone
from zoneinfo import ZoneInfo
from rest_framework.permissions import AllowAny

# Importar los errores de MongoDB, incluidos los duplicados.
from pymongo.errors import PyMongoError, DuplicateKeyError

# Importar herramientas de Django REST Framework.
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

# Importar la conexión y la colección de encuestas.
from config.mongodb import (
    comprobar_conexion,
    db_mongo,
)

coleccion_encuestas = db_mongo["encuestas_satisfaccion"]

# Importar el serializer de encuestas.
from .serializers import EncuestaSerializer

# Importar la función para documentar la API en Swagger.
from drf_yasg.utils import swagger_auto_schema

# Importar los modelos de clientes y facturas de SQL Server.
from apps.catalogos.clientes.models import Clientes
from apps.movimiento.factura.models import Facturas


# Vista para registrar una encuesta de satisfacción.
class EncuestaCrearView(APIView):

    permission_classes = [AllowAny]

    # Documentar la petición en Swagger.
    @swagger_auto_schema(
        operation_description=(
            "Registrar una encuesta de satisfacción. "
            "Cada factura admite una sola encuesta."
        ),
        request_body=EncuestaSerializer,
        responses={
            201: "Encuesta registrada correctamente.",
            400: "Datos inválidos o encuesta duplicada.",
            404: "Cliente o factura no encontrados.",
            503: "No fue posible acceder a MongoDB.",
        },
    )

    # Procesar la petición POST.
    def post(self, request):

        # Validar la estructura y los campos recibidos.
        serializer = EncuestaSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(
                {
                    "mensaje": "Los datos de la encuesta no son válidos.",
                    "errores": serializer.errors,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Obtener los datos validados.
        datos_encuesta = serializer.validated_data.copy()

        # Obtener el identificador del cliente y de la factura.
        cliente_id = datos_encuesta["cliente_id"]
        factura_id = datos_encuesta["factura_id"]

        # Verificar que el cliente exista en SQL Server.
        cliente = Clientes.objects.filter(pk=cliente_id).first()

        if cliente is None:
            return Response(
                {"mensaje": "El cliente no está registrado."},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Verificar que la factura pertenezca al cliente.
        factura = Facturas.objects.filter(
            pk=factura_id,
            ClienteId_id=cliente_id,
        ).first()

        if factura is None:
            return Response(
                {
                    "mensaje": (
                        "La factura no existe o no pertenece "
                        "al cliente indicado."
                    )
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        try:
            # Impedir una segunda encuesta para la misma factura.
            encuesta_existente = coleccion_encuestas.find_one(
                {
                    "cliente_id": cliente_id,
                    "factura_id": factura_id,
                },
                {"_id": 1},
            )

            if encuesta_existente is not None:
                return Response(
                    {
                        "mensaje": (
                            "Esta factura ya tiene una encuesta registrada."
                        )
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Asignar la fecha actual si no se recibió una.
            fecha_encuesta = datos_encuesta.get("fecha_encuesta")

            if fecha_encuesta is None:
                fecha_encuesta = datetime.now(ZoneInfo("UTC"))

            # Guardar la fecha en el documento.
            datos_encuesta["fecha_encuesta"] = fecha_encuesta

            # Registrar la encuesta en MongoDB.
            resultado = coleccion_encuestas.insert_one(datos_encuesta)

            # Devolver una respuesta de éxito.
            return Response(
                {
                    "mensaje": "Encuesta registrada correctamente.",
                    "encuesta_id": str(resultado.inserted_id),
                },
                status=status.HTTP_201_CREATED,
            )

        # Gestionar el intento de registrar una encuesta duplicada.
        # Este error puede ocurrir si dos peticiones llegan simultáneamente.
        except DuplicateKeyError:
            return Response(
                {
                    "mensaje": (
                        "Esta factura ya tiene una encuesta registrada."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Gestionar otros errores de acceso a MongoDB.
        except PyMongoError:
            return Response(
                {
                    "mensaje": (
                        "No fue posible guardar la encuesta en MongoDB."
                    )
                },
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )


# Vista para comprobar la conexión con MongoDB.
class EncuestaConexionView(APIView):

    # Exigir un token JWT válido.
    permission_classes = [IsAuthenticated]

    # Comprobar la conexión mediante GET.
    def get(self, request):

        try:
            # Comprobar que MongoDB responda.
            comprobar_conexion()

            return Response(
                {"mensaje": "Conexión con MongoDB correcta."},
                status=status.HTTP_200_OK,
            )

        except PyMongoError:
            return Response(
                {"mensaje": "No se pudo conectar con MongoDB."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )