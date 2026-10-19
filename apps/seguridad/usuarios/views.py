
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated

from .serialiezers import UserCreateSerializer
from drf_yasg.utils import swagger_auto_schema


class UserCreateView(APIView):
    @swagger_auto_schema(request_body=UserCreateSerializer)
    def post(self, request):
        serializer = UserCreateSerializer(data=request.data)

        if serializer.is_valid():
            serializer.save()
            return Response(
                {"message": "Usuario creado exitosamente"},
                status=status.HTTP_201_CREATED
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )


class UsuarioAutenticadoView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        usuario = request.user
        empleado = getattr(usuario, "empleado", None)

        empleado_nombre = None

        if empleado:
            empleado_nombre = (
                f"{empleado.Nombres} {empleado.Apellidos}"
            ).strip()

        return Response({
            "usuario_id": usuario.id,
            "username": usuario.username,
            "empleado_id": empleado.id if empleado else None,
            "empleado_nombre": empleado_nombre
        }, status=status.HTTP_200_OK)
