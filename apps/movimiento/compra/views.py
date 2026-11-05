from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from drf_yasg.utils import swagger_auto_schema
from .serializers import CompraSerializer
from .models import Compras, DetalleCompra
from apps.movimiento.compra.service.services import CompraService

from django.db.models import Prefetch


class CompraAPIView(APIView):

    @swagger_auto_schema(responses={200: CompraSerializer(many=True)})
    def get(self, request):

        compras = Compras.objects.filter(
            estado=True
        ).select_related(
            'ProveedorId',
            'CondicionPagoId'
        ).prefetch_related(
            Prefetch(
                'detallesCompra',
                queryset=DetalleCompra.objects.select_related(
                    'DetalleProductoId__producto',
                    'DetalleProductoId__MarcaId',
                    'DetalleProductoId__MotoId'
                ).filter(estado=True)
            )
        ).order_by('-id')

        serializer = CompraSerializer(compras, many=True)

        return Response(
            serializer.data,
            status=status.HTTP_200_OK
        )
    @swagger_auto_schema(request_body=CompraSerializer, responses={201: CompraSerializer()})
    def post(self, request):
        serializer = CompraSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        datos_validos = serializer.validated_data

        if 'FechaVencimiento' in serializer.initial_data:
            datos_validos['FechaVencimiento'] = serializer.initial_data['FechaVencimiento']

        compra_creada = CompraService.crear_Compra(datos_validos)

        response_serializer = CompraSerializer(compra_creada)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)

class CompraIDAPIView(APIView):

    @swagger_auto_schema(responses={200: CompraSerializer()})
    def get(self, request, pk):

        compra = get_object_or_404(
            Compras.objects.select_related(
                'ProveedorId',
                'CondicionPagoId'
            ).prefetch_related(
                Prefetch(
                    'detallesCompra',
                    queryset=DetalleCompra.objects.select_related(
                        'DetalleProductoId__producto',
                        'DetalleProductoId__MarcaId',
                        'DetalleProductoId__MotoId'
                    ).filter(estado=True)
                )
            ),
            pk=pk,
            estado=True
        )

        serializer = CompraSerializer(compra)

        return Response(
            serializer.data,
            status=status.HTTP_200_OK
        )
    @swagger_auto_schema(responses={204: 'compra eliminada correctamente'})
    def delete(self, request, pk):
        compra = get_object_or_404(Compras, pk=pk, estado=True)
        compra.estado = False
        compra.save()
        return Response(status=status.HTTP_204_NO_CONTENT)