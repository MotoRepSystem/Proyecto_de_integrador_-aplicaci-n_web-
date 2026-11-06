from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import Facturas,DetalleFactura,FacturasCredito
from .serializers import FacturaSerializer,DetalleFacturaSerializer,FacturaCreditoSerializer
from drf_yasg.utils import swagger_auto_schema
#logica validacines
from rest_framework.exceptions import ValidationError
#from.services.factura_service import descontar_stock,validar_existencia,Validar_datos,suma_total,calcular_subtotal

from .services.crear_factura_completa import crear_factura_completa

from django.db import transaction

from django.shortcuts import get_object_or_404
#from .models import Clientes, CondicionPago,EstadoCuenta,RegistroProducto

from time import perf_counter        #perf_counter: mide tiempos de ejecución con precisión.
from django.db import connection     #connection.execute_wrapper: nos permite observar las consultas SQL que Django ejecuta durante la serialización.

from django.db.models import Prefetch


from apps.movimiento.caja.models import MovimientoCaja

from apps.movimiento.movimientoPago.models import MovimientoPago
#paginaciones 
from .pagination import FacturaCursorPagination
#------------------------------
# FACTURA
#------------------------------
class FacturaAPIView (APIView):
    
    @swagger_auto_schema(responses={200: FacturaSerializer(many=True)})
    def get(self, request):

        tiempo_inicio = perf_counter()

        estadisticas = {
            "consultas_sql": 0,
            "tiempo_sql_execute": 0.0
        }

        def medir_sql(execute, sql, params, many, context):

            inicio_sql = perf_counter()

            try:
                return execute(sql, params, many, context)

            finally:
                duracion = perf_counter() - inicio_sql

                estadisticas["consultas_sql"] += 1
                estadisticas["tiempo_sql_execute"] += duracion

        with connection.execute_wrapper(medir_sql):

            queryset = Facturas.objects.filter(
                estado=True
            ).select_related(
                'ClienteId',
                'condicionId'
            ).prefetch_related(

                Prefetch(
                    'detalles',
                    queryset=DetalleFactura.objects.select_related(
                        'loteId__DetalleCompraId__DetalleProductoId__producto'
                    )
                ),

                Prefetch(
                    'facturascredito_set',
                    queryset=FacturasCredito.objects.select_related(
                        'estadoCuentaId'
                    ).order_by('pk'),
                    to_attr='creditos_prefetch'
                ),

                Prefetch(
                    'movimientocaja_set',
                    queryset=MovimientoCaja.objects.select_related(
                        'tipoMovimientoCajaId',
                        'turnoCajaId'
                    ).prefetch_related(
                        Prefetch(
                            'movimientopago_set',
                            queryset=MovimientoPago.objects.select_related(
                                'metodoPagoId'
                            )
                        )
                    ).order_by('pk'),
                    to_attr='movimientos_caja_prefetch'
                )

            ).order_by('-id')

            # 1. Aplicar paginación
            paginador = FacturaCursorPagination()

            pagina = paginador.paginate_queryset(
                queryset,
                request,
                view=self
            )

            # 2. Serializar únicamente los registros de esta página
            serializer = FacturaSerializer(
                pagina,
                many=True
            )

            datos = serializer.data

            # 3. Construir respuesta paginada
            respuesta = paginador.get_paginated_response(datos)

        tiempo_total = perf_counter() - tiempo_inicio

        tiempo_sql = estadisticas["tiempo_sql_execute"]
        tiempo_fuera_execute = tiempo_total - tiempo_sql

        print("\n========== DIAGNOSTICO FACTURAS ==========")
        print(f"Consultas SQL: {estadisticas['consultas_sql']}")
        print(f"Tiempo acumulado execute SQL: {tiempo_sql:.4f} segundos")
        print(f"Tiempo fuera de execute SQL: {tiempo_fuera_execute:.4f} segundos")
        print(f"Tiempo total GET: {tiempo_total:.4f} segundos")
        print("==========================================\n")

        return respuesta
    
    @swagger_auto_schema(request_body=FacturaSerializer)
    def post(self, request):
        serializer = FacturaSerializer(data=request.data)
        if serializer.is_valid():
            try:
                datos_factura = serializer.validated_data
                detalles_data = request.data.get('detalles', [])
                pagos_data = request.data.get('pagos', [])
                datos_credito = request.data.get('datos_credito', None)
                turno_caja_id = request.data.get('turnoCajaId', None)
                tipo_movimiento_id = request.data.get('tipoMovimientoCajaId', None)

                # 1. El detalle de productos SIEMPRE es obligatorio
                if not detalles_data:
                    return Response(
                        {"error": "Se requiere al menos un detalle de producto."}, 
                        status=status.HTTP_400_BAD_REQUEST
                    )

                # Obtener la condición para saber si exige pagos o crédito
                condicion_obj = datos_factura.get('condicionId')
                condicion_id = condicion_obj.id if hasattr(condicion_obj, 'id') else condicion_obj

                # 2. Si es AL CONTADO (1), exigimos los pagos
                if condicion_id == 1 and not pagos_data:
                    return Response(
                        {"error": "Para ventas al contado se requiere registrar el pago."}, 
                        status=status.HTTP_400_BAD_REQUEST
                    )

                # 3. Si es AL CRÉDITO (2), exigimos los datos del crédito
                if condicion_id == 2 and not datos_credito:
                    return Response(
                        {"error": "Para ventas a crédito se requieren los datos_credito."}, 
                        status=status.HTTP_400_BAD_REQUEST
                    )

                # Ejecutamos el servicio
                factura = crear_factura_completa(
                    datos_factura=datos_factura,
                    detalles_data=detalles_data,
                    pagos_data=pagos_data,
                    datos_credito=datos_credito,
                    turno_caja_id=turno_caja_id,
                    tipo_movimiento_id=tipo_movimiento_id
                )

                response_serializer = FacturaSerializer(factura)
                return Response(response_serializer.data, status=status.HTTP_201_CREATED)

            except Exception as e:
                return Response({"Error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
                
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
class FacturaIDAPIView(APIView):
    
    @swagger_auto_schema(request_body=FacturaSerializer, responses={200: FacturaSerializer})
    def patch(self, request, pk):
        """
        Actualizar parcialmente un departamento por su ID.
        """
        try:
            factura = Facturas.objects.filter(estado=True).get(pk=pk)
        except Facturas.DoesNotExist:
            return Response({'error': 'Factura no encontrada'}, status=status.HTTP_404_NOT_FOUND)

        serializer = FacturaSerializer(factura, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @swagger_auto_schema(responses={204: 'No Content'})
    def delete(self, request, pk):
        """
        Eliminar un departamento por su ID.
        """
        try:
            factura = Facturas.objects.filter(estado=True).get(pk=pk)
        except Facturas.DoesNotExist:
            return Response({'error': 'Factura no encontrada'}, status=status.HTTP_404_NOT_FOUND)

        factura.delete()
        return Response(status=status.HTTP_204_NO_CONTENT) 



#------------------------------
# DETALLE FACTURA
#------------------------------


class DetalleFacturaAPIView (APIView):
    @swagger_auto_schema(responses={200: DetalleFacturaSerializer(many=True)})
    def get (self,request):
        serializer= DetalleFacturaSerializer(DetalleFactura.objects.filter(estado=True), many = True)
        return Response (data=serializer.data)
    
    @swagger_auto_schema(request_body=DetalleFacturaSerializer, responses={201: DetalleFacturaSerializer})
    @transaction.atomic
    def post(self,request):
       

       serializer=DetalleFacturaSerializer(data=request.data)

       if serializer.is_valid(raise_exception=True):
           try:
                datos = serializer.validated_data
                canti= datos['Cantidad']
                id_prod= datos["detalleProductoId"].id

                Validar_datos(datos)
                validar_existencia(id_prod,canti)

                detalle= serializer.save()

                detalle_producto_id = detalle.detalleProductoId.id
                cantidad= detalle.Cantidad
                factura_id= detalle.FacturaId.id
                
                
                suma_total(factura_id)
                descontar_stock(detalle_producto_id, cantidad)

                return Response(status=status.HTTP_201_CREATED,data=serializer.data)
           
           except ValidationError as e:
                return Response(e.detail,status=status.HTTP_400_BAD_REQUEST)
           except ValidationError as e:
                return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
               

class DetallaeFacturaIDAPIView(APIView):
    
    @swagger_auto_schema(request_body=DetalleFacturaSerializer, responses={200: DetalleFacturaSerializer})
    def patch(self, request, pk):
        """
        Actualizar parcialmente un departamento por su ID.
        """
        try:
            detalleFact = DetalleFactura.objects.filter(estado=True).get(pk=pk)
        except FacturasCredito.DoesNotExist:
            return Response({'error': 'Detalle factura no encontrado'}, status=status.HTTP_404_NOT_FOUND)

        serializer = DetalleFacturaSerializer(detalleFact, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @swagger_auto_schema(responses={204: 'No Content'})
    def delete(self, request, pk):
        """
        Eliminar un departamento por su ID.
        """
        try:
            detalleFact = DetalleFactura.objects.filter(estado=True).get(pk=pk)
        except DetalleFactura.DoesNotExist:
            return Response({'error': 'Detalle factura no encontrado'}, status=status.HTTP_404_NOT_FOUND)

        detalleFact.delete()
        return Response(status=status.HTTP_204_NO_CONTENT) 


#------------------------------
# FACTURA AL CREDITO
#------------------------------
class FacturaCreditoIDAPIView(APIView):
    
    @swagger_auto_schema(request_body=FacturaCreditoSerializer, responses={200: FacturaCreditoSerializer})
    def patch(self, request, pk):
        """
        Actualizar parcialmente un departamento por su ID.
        """
        try:
            facturaCred = FacturasCredito.objects.filter(estado=True).get(pk=pk)
        except FacturasCredito.DoesNotExist:
            return Response({'error': 'Factura al credito no encontrada'}, status=status.HTTP_404_NOT_FOUND)

        serializer = FacturaSerializer(facturaCred, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @swagger_auto_schema(responses={204: 'No Content'})
    def delete(self, request, pk):
        """
        Eliminar un departamento por su ID.
        """
        try:
            facturaCred = FacturasCredito.objects.filter(estado=True).get(pk=pk)
        except FacturasCredito.DoesNotExist:
            return Response({'error': 'Factura al credito no encontrada'}, status=status.HTTP_404_NOT_FOUND)

        facturaCred.delete()
        return Response(status=status.HTTP_204_NO_CONTENT) 



class FacturaCreditoAPIView (APIView):
    @swagger_auto_schema(responses={200: FacturaCreditoSerializer(many=True)})
    def get (self,request):
        serializer= FacturaCreditoSerializer(FacturasCredito.objects.filter(estado=True), many = True)
        return Response (data=serializer.data)
    
    @swagger_auto_schema(request_body=FacturaCreditoSerializer, responses={201: FacturaCreditoSerializer})
    def post(self,request):
       
       
       serializer=FacturaCreditoSerializer(data=request.data)
       serializer.is_valid(raise_exception=True)
       serializer.save()
       return Response(status=status.HTTP_201_CREATED,data=serializer.data)
    
class FacturaCreditoIDAPIView(APIView):
    
    @swagger_auto_schema(request_body=FacturaCreditoSerializer, responses={200: FacturaCreditoSerializer})
    def patch(self, request, pk):
        """
        Actualizar parcialmente un departamento por su ID.
        """
        try:
            facturaCred = FacturasCredito.objects.filter(estado=True).get(pk=pk)
        except FacturasCredito.DoesNotExist:
            return Response({'error': 'Factura al credito no encontrada'}, status=status.HTTP_404_NOT_FOUND)

        serializer = FacturaSerializer(facturaCred, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @swagger_auto_schema(responses={204: 'No Content'})
    def delete(self, request, pk):
        """
        Eliminar un departamento por su ID.
        """
        try:
            facturaCred = FacturasCredito.objects.filter(estado=True).get(pk=pk)
        except FacturasCredito.DoesNotExist:
            return Response({'error': 'Factura al credito no encontrada'}, status=status.HTTP_404_NOT_FOUND)

        facturaCred.delete()
        return Response(status=status.HTTP_204_NO_CONTENT) 
