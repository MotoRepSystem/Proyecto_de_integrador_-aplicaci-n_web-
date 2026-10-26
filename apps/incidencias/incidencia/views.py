
from decimal import Decimal, InvalidOperation
from datetime import datetime
import math

from bson.decimal128 import Decimal128
from django.utils import timezone
from django.utils.dateparse import parse_datetime

from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from pymongo.errors import PyMongoError

from config.mongodb import db_mongo


class IncidenciaCrearView(APIView):
    permission_classes = [IsAuthenticated]

    TIPOS_PERMITIDOS = {
        "Producto",
        "Venta",
        "Caja",
        "Compra",
        "Inventario",
        "Otro",
    }

    ORIGENES_PERMITIDOS = {
        "cliente": "cliente_id",
        "empleado": "empleado_id",
        "proveedor": "proveedor_id",
    }

    CATEGORIAS_PERMITIDAS = {
        "Producto defectuoso",
        "Producto incorrecto",
        "Error de facturación",
        "Diferencia de caja",
        "Faltante de inventario",
        "Otro",
    }

    CATEGORIAS_MONTO_OBLIGATORIO = {
        "Error de facturación",
        "Diferencia de caja",
    }

    def post(self, request):
        datos = request.data

        # 1. Verificar que se recibió un objeto JSON.
        if not isinstance(datos, dict):
            return Response(
                {"error": "El formato de los datos no es válido."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        tipo = datos.get("tipo_incidencia")
        origen = datos.get("origen")
        detalle = datos.get("detalle_incidencia")
        gestion = datos.get("gestion")
        fecha_texto = datos.get("fecha_registro")

        # 2. Comprobar los campos principales.
        if not all([
            tipo,
            origen,
            detalle,
            gestion,
            fecha_texto,
        ]):
            return Response(
                {"error": "Faltan datos obligatorios de la incidencia."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not all(
            isinstance(valor, dict)
            for valor in [origen, detalle, gestion]
        ):
            return Response(
                {
                    "error": (
                        "El origen, el detalle y la gestión "
                        "deben ser objetos."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # 3. Obtener al empleado desde el usuario autenticado.
        # No confiamos en un empleado_id enviado por el navegador.
        empleado = getattr(request.user, "empleado", None)

        if empleado is None:
            return Response(
                {
                    "error": (
                        "El usuario autenticado no tiene "
                        "un empleado asociado."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # 4. Validar el tipo de incidencia.
        if (
            not isinstance(tipo, str)
            or tipo not in self.TIPOS_PERMITIDOS
        ):
            return Response(
                {"error": "El tipo de incidencia no es válido."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # 5. Validar el origen de la incidencia.
        tipo_origen = origen.get("tipo")

        if (
            not isinstance(tipo_origen, str)
            or tipo_origen not in {
                "cliente",
                "empleado",
                "proveedor",
                "interno",
            }
        ):
            return Response(
                {"error": "El tipo de origen no es válido."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        origen_documento = {"tipo": tipo_origen}

        if tipo_origen == "interno":
            referencia = origen.get("referencia")

            if (
                not isinstance(referencia, str)
                or not referencia.strip()
            ):
                return Response(
                    {
                        "error": (
                            "La referencia interna es obligatoria."
                        )
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if len(referencia.strip()) > 150:
                return Response(
                    {
                        "error": (
                            "La referencia no puede superar "
                            "los 150 caracteres."
                        )
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            origen_documento["referencia"] = referencia.strip()

        else:
            campo_id = self.ORIGENES_PERMITIDOS[tipo_origen]
            identificador = origen.get(campo_id)

            if (
                isinstance(identificador, bool)
                or not isinstance(identificador, int)
                or identificador <= 0
            ):
                return Response(
                    {
                        "error": (
                            f"Debes seleccionar un "
                            f"{tipo_origen} válido."
                        )
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            origen_documento[campo_id] = identificador

        # 6. Validar la categoría del problema.
        categoria = detalle.get("categoria_problema")

        if (
            not isinstance(categoria, str)
            or categoria not in self.CATEGORIAS_PERMITIDAS
        ):
            return Response(
                {"error": "La categoría del problema no es válida."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # 7. Validar la descripción.
        descripcion = detalle.get("descripcion")

        if not isinstance(descripcion, str):
            return Response(
                {"error": "La descripción es obligatoria."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        descripcion = descripcion.strip()

        if not 5 <= len(descripcion) <= 2000:
            return Response(
                {
                    "error": (
                        "La descripción debe tener entre "
                        "5 y 2000 caracteres."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # 8. Validar el monto según la categoría.
        monto_recibido = detalle.get("monto_involucrado")

        requiere_monto = (
            categoria in self.CATEGORIAS_MONTO_OBLIGATORIO
        )

        if monto_recibido is None or monto_recibido == "":
            if requiere_monto:
                return Response(
                    {
                        "error": (
                            "Esta categoría requiere un "
                            "monto involucrado."
                        )
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            monto_documento = None

        else:
            if isinstance(monto_recibido, bool):
                return Response(
                    {"error": "El monto debe ser un número válido."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            try:
                monto = Decimal(str(monto_recibido))
            except (InvalidOperation, ValueError, TypeError):
                return Response(
                    {"error": "El monto debe ser un número válido."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if not monto.is_finite() or monto < 0:
                return Response(
                    {
                        "error": (
                            "El monto debe ser finito "
                            "y no puede ser negativo."
                        )
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Guardar los valores monetarios como Decimal128 en MongoDB.
            monto_documento = Decimal128(monto)

        # 9. Validar la prioridad.
        prioridad = gestion.get("prioridad")

        if (
            isinstance(prioridad, bool)
            or not isinstance(prioridad, int)
            or not 1 <= prioridad <= 5
        ):
            return Response(
                {
                    "error": (
                        "La prioridad debe ser un entero "
                        "entre 1 y 5."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # 10. Validar la fecha de registro.
        if not isinstance(fecha_texto, str):
            return Response(
                {"error": "La fecha de registro no es válida."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        fecha = parse_datetime(fecha_texto)

        if fecha is None:
            return Response(
                {
                    "error": (
                        "La fecha debe tener un formato "
                        "de fecha y hora válido."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if timezone.is_naive(fecha):
            fecha = timezone.make_aware(
                fecha,
                timezone.get_current_timezone(),
            )

        # 11. Construir el documento para MongoDB.
        documento = {
            "fecha_registro": fecha,
            "tipo_incidencia": tipo,
            "origen": origen_documento,
            "detalle_incidencia": {
                "categoria_problema": categoria,
                "descripcion": descripcion,
                "monto_involucrado": monto_documento,
            },
            "gestion": {
                "empleado_id": empleado.pk,
                "prioridad": prioridad,
            },
            # La carga real del archivo se implementará después.
            "evidencia": None,
        }

        # 12. Insertar un documento nuevo.
        # No se actualizan ni eliminan los registros anteriores.
        try:
            resultado = db_mongo["Incidencia"].insert_one(documento)

            return Response(
                {
                    "mensaje": "Incidencia registrada correctamente.",
                    "incidencia_id": str(resultado.inserted_id),
                },
                status=status.HTTP_201_CREATED,
            )

        except PyMongoError:
            return Response(
                {
                    "error": (
                        "No fue posible guardar la incidencia "
                        "en MongoDB."
                    )
                },
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )





#GET de incidencias para mostrarlas en app movil y web

import logging
from datetime import datetime, timezone as dt_timezone

from bson import ObjectId
from bson.decimal128 import Decimal128
from bson.errors import InvalidId

from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status

from pymongo.errors import PyMongoError

from config.mongodb import db_mongo

logger = logging.getLogger(__name__)


def serializar(valor):
    """Convierte tipos de BSON a tipos que JSON entiende."""
    if isinstance(valor, ObjectId):
        return str(valor)
    if isinstance(valor, datetime):
        if valor.tzinfo is None:
            valor = valor.replace(tzinfo=dt_timezone.utc)
        return (
            valor.astimezone(dt_timezone.utc)
            .isoformat()
            .replace("+00:00", "Z")
        )
    if isinstance(valor, Decimal128):
        return str(valor.to_decimal())  # string: no pierde precisión
    if isinstance(valor, dict):
        return {k: serializar(v) for k, v in valor.items()}
    if isinstance(valor, list):
        return [serializar(v) for v in valor]
    return valor


class IncidenciaListaView(APIView):
    permission_classes = [IsAuthenticated]  
    LIMITE_MAXIMO = 100

    def get(self, request):
        params = request.query_params

        try:
            page = int(params.get("page", 1))
            limit = int(params.get("limit", 20))
        except ValueError:
            return Response(
                {"error": "page y limit deben ser enteros."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if page < 1 or not 1 <= limit <= self.LIMITE_MAXIMO:
            return Response(
                {
                    "error": (
                        f"page debe ser >= 1 y limit entre "
                        f"1 y {self.LIMITE_MAXIMO}."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        filtro = {}

        tipo = params.get("tipo_incidencia")
        if tipo:
            if tipo not in IncidenciaCrearView.TIPOS_PERMITIDOS:
                return Response(
                    {"error": "El tipo de incidencia no es válido."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            filtro["tipo_incidencia"] = tipo

        prioridad = params.get("prioridad")
        if prioridad:
            try:
                prioridad = int(prioridad)
            except ValueError:
                prioridad = 0
            if not 1 <= prioridad <= 5:
                return Response(
                    {"error": "La prioridad debe ser entre 1 y 5."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            filtro["gestion.prioridad"] = prioridad

        coleccion = db_mongo["Incidencia"]

        try:
            total = coleccion.count_documents(filtro)
            cursor = (
                coleccion.find(filtro)
                .sort([("fecha_registro", -1), ("_id", -1)])
                .skip((page - 1) * limit)
                .limit(limit)
            )
            resultados = [serializar(doc) for doc in cursor]
        except PyMongoError:
            logger.exception("Error al listar incidencias")
            return Response(
                {"error": "No fue posible consultar las incidencias."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        return Response(
            {
                "total": total,
                "page": page,
                "limit": limit,
                "total_paginas": -(-total // limit),
                "resultados": resultados,
            }
        )


class IncidenciaDetalleView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request, incidencia_id):
        try:
            oid = ObjectId(incidencia_id)
        except (InvalidId, TypeError):
            return Response(
                {"error": "El identificador no es válido."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            doc = db_mongo["Incidencia"].find_one({"_id": oid})
        except PyMongoError:
            logger.exception("Error al consultar incidencia %s", incidencia_id)
            return Response(
                {"error": "No fue posible consultar la incidencia."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        if doc is None:
            return Response(
                {"error": "Incidencia no encontrada."},
                status=status.HTTP_404_NOT_FOUND,
            )

        return Response(serializar(doc))


