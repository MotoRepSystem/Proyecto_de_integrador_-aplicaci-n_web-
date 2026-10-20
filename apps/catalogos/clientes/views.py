# Importar las clases necesarias de Django REST Framework
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

# Importar la conexión con la colección de encuestas en MongoDB.

from config.mongodb import (
    comprobar_conexion,
    db_mongo,
)

coleccion_encuestas = db_mongo["encuestas_satisfaccion"]
# Importar el error de conexión de MongoDB.
from pymongo.errors import PyMongoError

# Importar el modelo de clientes y su serializador
from .models import Clientes
from .serializers import ClienteSerializer

# Importar herramientas para documentar los endpoints en Swagger
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi

# Importar funciones para concatenar nombres y apellidos
from django.db.models import Value, CharField
from django.db.models.functions import Concat

# Importar el modelo de facturas de SQL Server
from apps.movimiento.factura.models import Facturas

# VISTA PARA LISTAR Y REGISTRAR CLIENTES
class ClienteApiview (APIView):
     
    @swagger_auto_schema(responses={200: ClienteSerializer(many=True)})
    def get(self,request):
        serializer=ClienteSerializer(Clientes.objects.filter(estado=True).order_by('-id'), many=True)
        return Response(serializer.data)
    
    @swagger_auto_schema(request_body=ClienteSerializer, responses={201: ClienteSerializer})
    def post(self,request):
       serializer=ClienteSerializer(data=request.data)
       serializer.is_valid(raise_exception=True)
       serializer.save()
       return Response(status=status.HTTP_201_CREATED,data=serializer.data)


# VISTA PARA ACTUALIZAR Y ELIMINAR CLIENTES
class ClienteIDAPIView(APIView):   
    @swagger_auto_schema(request_body=ClienteSerializer, responses={200: ClienteSerializer})
    def patch(self, request, pk):
        
        try:
            cliente = Clientes.objects.filter(estado=True).get(pk=pk)
        except Clientes.DoesNotExist:
            return Response({'error': 'Cliente no encontrado'}, status=status.HTTP_404_NOT_FOUND)

        serializer = ClienteSerializer(cliente, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @swagger_auto_schema(responses={204: 'No Content'})
    def delete(self, request, pk):
      
        try:
            clientes = Clientes.objects.filter(estado=True).get(pk=pk)
        except Clientes.DoesNotExist:
            return Response({'error': 'Cliente no encontrado'}, status=status.HTTP_404_NOT_FOUND)

        clientes.estado=False # Eliminado logico
        clientes.save()
        return Response(status=status.HTTP_204_NO_CONTENT) 
    
class ClienteEliminarFisicoAPIView(APIView):

    @swagger_auto_schema(
        responses={
            204: 'Cliente eliminado físicamente',
            404: 'Cliente no encontrado'
        }
    )
    def delete(self, request, pk):

        try:
            cliente = Clientes.objects.get(pk=pk)

        except Clientes.DoesNotExist:
            return Response(
                {'error': 'Cliente no encontrado'},
                status=status.HTTP_404_NOT_FOUND
            )

        cliente.delete()

        return Response(status=status.HTTP_204_NO_CONTENT)
        

# VISTA PARA BUSCAR CLIENTES Y SUS FACTURAS PARA LA ENCUESTA
class ClienteEncuestaAPIView(APIView):

    @swagger_auto_schema(
        operation_description=(
            "Buscar un cliente por nombre completo "
            "y consultar sus facturas registradas."
        ),
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            required=["nombre_completo"],
            properties={
                "nombre_completo": openapi.Schema(
                    type=openapi.TYPE_STRING,
                    description="Nombre y apellidos completos del cliente"
                ),
            },
        ),
        responses={
            200: "Cliente encontrado con sus facturas.",
            400: "Nombre completo obligatorio o inválido.",
            404: "Cliente no encontrado o sin facturas.",
            409: "Existen varios clientes con el mismo nombre completo.",
        },
    )
    def post(self, request):

        # Obtener el nombre completo enviado desde Android
        nombre_completo = request.data.get(
            "nombre_completo", ""
        )

        # Verificar que el dato recibido sea texto
        if not isinstance(nombre_completo, str):
            return Response(
                {
                    "mensaje": "El nombre completo debe ser texto."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # Eliminar espacios al inicio y al final y convertir varios espacios consecutivos en uno
        nombre_completo = " ".join(
            nombre_completo.split()
        )

        # Validar que el campo no esté vacío
        if not nombre_completo:
            return Response(
                {
                    "mensaje": "Debe ingresar su nombre y apellidos."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # Verificar que se haya ingresado al menos
        # un nombre y un apellido
        if len(nombre_completo.split()) < 2:
            return Response(
                {
                    "mensaje": "Ingrese su nombre y apellidos completos."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # Concatenar los campos Nombres y Apellidos de SQL Server para compararlos con el texto recibido
        clientes_encontrados = Clientes.objects.filter(
            estado=True
        ).annotate(
            nombre_completo_db=Concat(
                "Nombres",
                Value(" "),
                "Apellidos",
                output_field=CharField()
            )
        ).filter(
            nombre_completo_db__iexact=nombre_completo
        )

        # Verificar si no existe ningún cliente coincidente
        if not clientes_encontrados.exists():
            return Response(
                {
                    "mensaje": "Cliente no encontrado."
                },
                status=status.HTTP_404_NOT_FOUND
            )

        # Verificar si hay varios clientes con el mismo nombre
        if clientes_encontrados.count() > 1:
            return Response(
                {
                    "mensaje": (
                        "Hay varios clientes con ese nombre completo. "
                        "Se necesita otro dato para identificarlos."
                    )
                },
                status=status.HTTP_409_CONFLICT
            )

        # Obtener el único cliente encontrado
        cliente = clientes_encontrados.first()

        # Consultar las facturas relacionadas con el cliente
        facturas = Facturas.objects.filter(
            ClienteId_id=cliente.id
        )

        try:
            # Buscar las encuestas que ya fueron registradas
            # para este cliente en MongoDB
            encuestas_registradas = coleccion_encuestas.find(
                {
                    "cliente_id": cliente.id
                },
                {
                    "factura_id": 1,
                    "_id": 0
                }
            )

            # Obtener los identificadores de las facturas
            # que ya tienen una encuesta registrada
            facturas_encuestadas = [
                encuesta["factura_id"]
                for encuesta in encuestas_registradas
            ]

        except PyMongoError:
            # Informar si no se puede consultar MongoDB
            return Response(
                {
                    "mensaje": (
                        "No fue posible consultar las encuestas "
                        "registradas en MongoDB."
                    )
                },
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )

        
        # Excluir las facturas que ya tienen encuesta
        facturas = facturas.exclude(
            id__in=facturas_encuestadas
        ).order_by("-id")

        # Verificar que existan facturas pendientes de encuesta
        if not facturas.exists():
            return Response(
                {
                    "mensaje": (
                        "El cliente no tiene facturas disponibles "
                        "para realizar una nueva encuesta."
                    )
                },
                status=status.HTTP_404_NOT_FOUND
            )

        # Preparar las facturas para enviarlas a Android
        lista_facturas = [
            {
                "factura_id": factura.id,
                "numero_factura": factura.NumFactura,
                "fecha": factura.Fecha,
                "total": factura.Total
            }
            for factura in facturas
        ]

        # Devolver el cliente y sus facturas
        return Response(
            {
                "cliente_id": cliente.id,
                "nombres": cliente.Nombres,
                "apellidos": cliente.Apellidos,
                "facturas": lista_facturas
            },
            status=status.HTTP_200_OK
        )