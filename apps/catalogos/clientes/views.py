from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import Clientes
from .serializers import ClienteSerializer
from drf_yasg.utils import swagger_auto_schema

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