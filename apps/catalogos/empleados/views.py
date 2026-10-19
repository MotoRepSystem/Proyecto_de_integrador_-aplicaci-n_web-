from rest_framework.views import APIView
from rest_framework.views import Response
from rest_framework import status
from .models import Empleados
from .serializers import EmpleadoSerializer
from drf_yasg.utils import swagger_auto_schema

class EmpleadosAPIView (APIView):
    @swagger_auto_schema(responses={200: EmpleadoSerializer(many=True)})
    def get (self,request):
        serializer= EmpleadoSerializer(Empleados.objects.filter(estado=True).order_by('-id'), many= True)
        return Response (status=status.HTTP_200_OK, data=serializer.data)
    
    @swagger_auto_schema(request_body=EmpleadoSerializer, responses= {201: EmpleadoSerializer})
    def post (self,request):
        serializer= EmpleadoSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(data=serializer.data, status=status.HTTP_201_CREATED)
   
class EmpleadoIDAPIView(APIView):
    
    @swagger_auto_schema(request_body=EmpleadoSerializer, responses={200: EmpleadoSerializer})
    def patch(self, request, pk):
        try:
            empleado = Empleados.objects.filter(estado=True).get(pk=pk)
        except Empleados.DoesNotExist:
            return Response({'error': 'Empleado no encontrado'}, status=status.HTTP_404_NOT_FOUND)

        serializer = EmpleadoSerializer(empleado, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @swagger_auto_schema(responses={204: 'No Content'})
    def delete(self, request, pk):
        try:
            empleado = Empleados.objects.filter(estado=True).get(pk=pk)
        except Empleados.DoesNotExist:
            return Response({'error': 'Empleado no encontrado'}, status=status.HTTP_404_NOT_FOUND)

        empleado.estado=False # Eliminado logico
        empleado.save()
        return Response(status=status.HTTP_204_NO_CONTENT) 