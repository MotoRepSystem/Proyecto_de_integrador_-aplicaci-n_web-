from django.shortcuts import render
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from drf_yasg.utils import swagger_auto_schema

from .models import TurnoCaja, MovimientoCaja, Caja
from .serializers import CajaSerializer, TurnoCajaSerializer, MovimientoCajaSerialiezer
from apps.catalogos.empleados.models import Empleados


class CajaApiView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        cajas = Caja.objects.filter(estado=True)
        serializer = CajaSerializer(cajas, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    @swagger_auto_schema(request_body=CajaSerializer, responses={201: CajaSerializer})
    def post(self, request):
        if not request.user.is_staff:
            return Response({'error': 'Solo administradores pueden crear cajas.'}, status=status.HTTP_403_FORBIDDEN)
        serializer = CajaSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(data=serializer.data, status=status.HTTP_201_CREATED)


class CajaIDAPIView(APIView):
    permission_classes = [IsAuthenticated]

    @swagger_auto_schema(request_body=CajaSerializer, responses={200: CajaSerializer})
    def patch(self, request, pk):
        if not request.user.is_staff:
            return Response({'error': 'Solo administradores pueden modificar cajas.'}, status=status.HTTP_403_FORBIDDEN)
        try:
            caja = Caja.objects.filter(estado=True).get(pk=pk)
        except Caja.DoesNotExist:
            return Response({'error': 'Caja no encontrada'}, status=status.HTTP_404_NOT_FOUND)

        serializer = CajaSerializer(caja, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @swagger_auto_schema(responses={204: 'No Content'})
    def delete(self, request, pk):
        if not request.user.is_staff:
            return Response({'error': 'Solo administradores pueden eliminar cajas.'}, status=status.HTTP_403_FORBIDDEN)
        try:
            caja = Caja.objects.filter(estado=True).get(pk=pk)
        except Caja.DoesNotExist:
            return Response({'error': 'Caja no encontrada'}, status=status.HTTP_404_NOT_FOUND)

        caja.estado = False
        caja.save()
        return Response(status=status.HTTP_204_NO_CONTENT)


class TurnoCajaApiView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Admins ven todo el historial, empleados ven sus asignaciones
        if request.user.is_staff:
            turnos = TurnoCaja.objects.filter(estado=True).order_by('-id')
        else:
            # CORRECCIÓN: Se usa EmpleadoId__usuario para navegar la relación inversa definida en User
            empleado = getattr(request.user, 'empleado', None) or getattr(request.user, 'usuario', None)
            if not empleado:
                return Response(
                    {'error': f'El usuario "{request.user.username}" no tiene un perfil de empleado asignado.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            turnos = TurnoCaja.objects.filter(estado=True, EmpleadoId=empleado).order_by('-id')
            
        serializer = TurnoCajaSerializer(turnos, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    @swagger_auto_schema(request_body=TurnoCajaSerializer, responses={201: TurnoCajaSerializer})
    def post(self, request):
        # Exclusivo de administradores
        if not request.user.is_staff:
            return Response({'error': 'Solo los administradores pueden abrir turnos.'}, status=status.HTTP_403_FORBIDDEN)

        serializer = TurnoCajaSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(FechaApertura=timezone.now(), abierto=True)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

class TurnoCajaIDAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            caja = TurnoCaja.objects.filter(estado=True).get(pk=pk)
        except TurnoCaja.DoesNotExist:
            return Response({'error': 'Turno de caja no encontrado'}, status=status.HTTP_404_NOT_FOUND)
            
        serializer = TurnoCajaSerializer(caja)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @swagger_auto_schema(request_body=TurnoCajaSerializer, responses={200: TurnoCajaSerializer})
    def patch(self, request, pk):
        try:
            turno = TurnoCaja.objects.filter(estado=True).get(pk=pk)
        except TurnoCaja.DoesNotExist:
            return Response({'error': 'Turno de caja no encontrado'}, status=status.HTTP_404_NOT_FOUND)

        # Lógica de cierre de caja
        es_cierre = request.data.get('abierto') is False or request.data.get('abierto') == 'false'
        
        serializer = TurnoCajaSerializer(turno, data=request.data, partial=True)
        if serializer.is_valid():
            if es_cierre:
                serializer.save(FechaCierre=timezone.now(), abierto=False)
            else:
                serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @swagger_auto_schema(responses={204: 'No Content'})
    def delete(self, request, pk):
        if not request.user.is_staff:
            return Response({'error': 'Solo administradores pueden eliminar turnos.'}, status=status.HTTP_403_FORBIDDEN)
        try:
            caja = TurnoCaja.objects.filter(estado=True).get(pk=pk)
        except TurnoCaja.DoesNotExist:
            return Response({'error': 'Turno de caja no encontrado'}, status=status.HTTP_404_NOT_FOUND)

        caja.estado = False
        caja.save()
        return Response(status=status.HTTP_204_NO_CONTENT)




class TurnoCajaActivoView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        usuario = request.user

        # Obtener el empleado de forma directa (request.user.empleado) o mediante la relación inversa si fuera el caso
        empleado = getattr(usuario, 'empleado', None) or getattr(usuario, 'usuario', None)

        if not empleado:
            return Response(
                {'error': f'El usuario "{usuario.username}" no tiene un perfil de empleado asignado.'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        # Buscar el turno activo asignado a ese empleado
        turno = TurnoCaja.objects.filter(
            EmpleadoId=empleado,
            abierto=True,
            estado=True
        ).last()

        if turno:
            serializer = TurnoCajaSerializer(turno)
            return Response(serializer.data, status=status.HTTP_200_OK)

        return Response(
            {'mensaje': 'El empleado no tiene un turno de caja activo actualmente.'}, 
            status=status.HTTP_404_NOT_FOUND
        )
    

class MovimientoCajaApiView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        movimientos = MovimientoCaja.objects.filter(estado=True)
        serializer = MovimientoCajaSerialiezer(movimientos, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    @swagger_auto_schema(request_body=MovimientoCajaSerialiezer, responses={201: MovimientoCajaSerialiezer})
    def post(self, request):
        usuario = request.user
        
        # CORRECCIÓN: Lectura segura del perfil del empleado
        empleado = getattr(usuario, 'empleado', None) or getattr(usuario, 'usuario', None)
        if not empleado:
            return Response({'error': 'Usuario no tiene perfil de empleado vinculado.'}, status=status.HTTP_400_BAD_REQUEST)

        # Buscar turno activo del cajero
        turno_activo = TurnoCaja.objects.filter(
            EmpleadoId=empleado,
            abierto=True,
            estado=True
        ).last()

        if not turno_activo:
            return Response(
                {'error': 'Transacción rechazada: No hay un turno de caja abierto para registrar el movimiento.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        data = request.data.copy()
        data['turnoCajaId'] = turno_activo.id

        serializer = MovimientoCajaSerialiezer(data=data)
        serializer.is_valid(raise_exception=True)
        serializer.save(fecha=timezone.now())
        return Response(data=serializer.data, status=status.HTTP_201_CREATED)

class MovimientoCajaIDAPIView(APIView):
    permission_classes = [IsAuthenticated]

    @swagger_auto_schema(request_body=MovimientoCajaSerialiezer, responses={200: MovimientoCajaSerialiezer})
    def patch(self, request, pk):
        try:
            movimientoCJ = MovimientoCaja.objects.filter(estado=True).get(pk=pk)
        except MovimientoCaja.DoesNotExist:
            return Response({'error': 'Movimiento de caja no encontrado'}, status=status.HTTP_404_NOT_FOUND)

        serializer = MovimientoCajaSerialiezer(movimientoCJ, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @swagger_auto_schema(responses={204: 'No Content'})
    def delete(self, request, pk):
        if not request.user.is_staff:
            return Response({'error': 'Solo administradores pueden anular movimientos.'}, status=status.HTTP_403_FORBIDDEN)
        try:
            movimientoCJ = MovimientoCaja.objects.filter(estado=True).get(pk=pk)
        except MovimientoCaja.DoesNotExist:
            return Response({'error': 'Movimiento de caja no encontrado'}, status=status.HTTP_404_NOT_FOUND)

        movimientoCJ.estado = False
        movimientoCJ.save()
        return Response(status=status.HTTP_204_NO_CONTENT)

class MovimientoCajaIDAPiGETView(APIView):

    @swagger_auto_schema(
        responses={200: MovimientoCajaSerialiezer(many=True)}
    )
    def get(self, request, pk):
        try:
            turno = TurnoCaja.objects.get(
                pk=pk,
                estado=True
            )
        except TurnoCaja.DoesNotExist:
            return Response(
                {"error": "Turno de caja no encontrado"},
                status=status.HTTP_404_NOT_FOUND
            )

        movimientos = MovimientoCaja.objects.filter(
            turnoCajaId=turno,
            estado=True
        ).order_by("-fecha", "-id")

        serializer = MovimientoCajaSerialiezer(
            movimientos,
            many=True
        )

        return Response(serializer.data, status=status.HTTP_200_OK)