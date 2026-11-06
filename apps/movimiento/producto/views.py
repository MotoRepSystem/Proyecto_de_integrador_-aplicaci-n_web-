from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import Productos, DetalleProductos,RegistroProducto
from .serialezers import ProductoSerializer,DetalleProductoSerializer,Registro_ProductoSerializer
from drf_yasg.utils import swagger_auto_schema

from django.db import connections
from time import perf_counter

class ProductoAPIView (APIView):
    def get (self,request):
        serializer= ProductoSerializer(Productos.objects.filter(estado=True), many=True)
        return Response(data= serializer.data)
    
    @swagger_auto_schema(request_body=ProductoSerializer, responses= {201: ProductoSerializer})
    def post (self,request):
        serializer= ProductoSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(data=serializer.data)

class ProductoIDAPIView(APIView):   
    @swagger_auto_schema(request_body=ProductoSerializer, responses={200: ProductoSerializer})
    def patch(self, request, pk):
        
        try:
            producto = Productos.objects.filter(estado=True).get(pk=pk)
        except Productos.DoesNotExist:
            return Response({'error': 'Producto no encontrado'}, status=status.HTTP_404_NOT_FOUND)

        serializer = ProductoSerializer(producto, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @swagger_auto_schema(responses={204: 'No Content'})
    def delete(self, request, pk):
      
        try:
            producto = Productos.objects.filter(estado=True).get(pk=pk)
        except Productos.DoesNotExist:
            return Response({'error': 'Producto no encontrado'}, status=status.HTTP_404_NOT_FOUND)

        producto.estado=False # Eliminado logico
        producto.save()
        return Response(status=status.HTTP_204_NO_CONTENT)     


class DetalleProductoAPIVew (APIView):
    def get (self,request):
        serializer= DetalleProductoSerializer(DetalleProductos.objects.filter(estado=True), many=True)
        return Response(data= serializer.data)
    
    @swagger_auto_schema(request_body=DetalleProductoSerializer, responses= {201: DetalleProductoSerializer})
    def post (self,request):
        serializer= DetalleProductoSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(data=serializer.data)

class DetalleProductosIDAPIView(APIView):   
    @swagger_auto_schema(request_body=DetalleProductoSerializer, responses={200: DetalleProductoSerializer})
    def patch(self, request, pk):
        
        try:
            detalle = DetalleProductos.objects.filter(estado=True).get(pk=pk)
        except DetalleProductos.DoesNotExist:
            return Response({'error': 'Detale producto no encontrado'}, status=status.HTTP_404_NOT_FOUND)

        serializer = DetalleProductoSerializer(detalle, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @swagger_auto_schema(responses={204: 'No Content'})
    def delete(self, request, pk):
      
        try:
            detalle = DetalleProductoSerializer.objects.filter(estado=True).get(pk=pk)
        except DetalleProductos.DoesNotExist:
            return Response({'error': 'Detalle producto no encontrado'}, status=status.HTTP_404_NOT_FOUND)

        detalle.estado=False # Eliminado logico
        detalle.save()
        return Response(status=status.HTTP_204_NO_CONTENT) 



class Registro_ProductoApiView(APIView):

    def get(self, request):

        conexion = connections['default']

        consultas_iniciales = len(conexion.queries)

        inicio_total = perf_counter()

        # 1. Construcción del queryset
        queryset = (
            RegistroProducto.objects
            .using('default')
            .filter(estado=True)
            .select_related(
                'DetalleCompraId',
                'DetalleCompraId__DetalleProductoId',
                'DetalleCompraId__DetalleProductoId__producto',
                'DetalleCompraId__DetalleProductoId__MarcaId',
                'DetalleCompraId__DetalleProductoId__MotoId',
            )
            .order_by('-id')
        )

        # 2. Recuperación de registros desde SQL Server
        inicio_consulta = perf_counter()

        registros = list(queryset)

        tiempo_consulta = perf_counter() - inicio_consulta

        # 3. Serialización de registros
        inicio_serializacion = perf_counter()

        serializer = Registro_ProductoSerializer(
            registros,
            many=True
        )

        datos = serializer.data

        tiempo_serializacion = perf_counter() - inicio_serializacion

        # 4. Diagnóstico general
        tiempo_total = perf_counter() - inicio_total

        consultas = conexion.queries[consultas_iniciales:]

        tiempo_sql = sum(
            float(consulta['time'])
            for consulta in consultas
        )

        tiempo_fuera_sql = tiempo_total - tiempo_sql

        print("\n========== DIAGNÓSTICO INVENTARIO ==========")
        print(f"Registros obtenidos: {len(datos)}")
        print(f"Consultas SQL: {len(consultas)}")
        print(f"Tiempo acumulado SQL: {tiempo_sql:.4f} segundos")
        print(f"Tiempo recuperación: {tiempo_consulta:.4f} segundos")
        print(f"Tiempo serialización: {tiempo_serializacion:.4f} segundos")
        print(f"Tiempo fuera de SQL: {tiempo_fuera_sql:.4f} segundos")
        print(f"Tiempo total GET: {tiempo_total:.4f} segundos")
        print("============================================\n")

        return Response(
            status=status.HTTP_200_OK,
            data=datos
        ) 
    @swagger_auto_schema(request_body=Registro_ProductoSerializer, responses={201: Registro_ProductoSerializer})
    def post(self,request):
        Serializer= Registro_ProductoSerializer(data=request.data)
        Serializer.is_valid(raise_exception=True)
        Serializer.save()
        return Response (status=status.HTTP_201_CREATED, data=Serializer.data)

class Registro_ProductoIDAPIView(APIView):   
    @swagger_auto_schema(request_body=Registro_ProductoSerializer, responses={200: Registro_ProductoSerializer})
    def patch(self, request, pk):
        
        try:
            inventarioLote = RegistroProducto.objects.filter(estado=True).get(pk=pk)
        except RegistroProducto.DoesNotExist:
            return Response({'error': 'Lote no encontrado'}, status=status.HTTP_404_NOT_FOUND)

        serializer = Registro_ProductoSerializer(inventarioLote, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @swagger_auto_schema(responses={204: 'No Content'})
    def delete(self, request, pk):
      
        try:
            inventarioLote = RegistroProducto.objects.filter(estado=True).get(pk=pk)
        except RegistroProducto.DoesNotExist:
            return Response({'error': 'Lote no encontrado'}, status=status.HTTP_404_NOT_FOUND)

        inventarioLote.estado=False # Eliminado logico
        inventarioLote.save()
        return Response(status=status.HTTP_204_NO_CONTENT) 
        