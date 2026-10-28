from django.shortcuts import render
from rest_framework.decorators import api_view
from rest_framework.response import Response

from .services import obtener_ventas_por_mes, obtener_inventario_por_categoria, obtener_ventas_por_metodo_pago, obtener_productos_mayor_rotacion,obtener_ventas_por_nivel_satisfaccion


@api_view(["GET"])
def ventas_por_mes(request):

    resultado = obtener_ventas_por_mes()

    return Response(resultado)

@api_view(["GET"])
def inventario_por_categoria(request):

    resultado = obtener_inventario_por_categoria()

    return Response(resultado)


@api_view(["GET"])
def ventas_por_metodo_pago(request):

    resultado = obtener_ventas_por_metodo_pago()

    return Response(resultado)

@api_view(["GET"])
def productos_mayor_rotacion(request):

    resultado = obtener_productos_mayor_rotacion()

    return Response(resultado)

@api_view(["GET"])
def ventas_por_nivel_satisfaccion(request):

    resultado = obtener_ventas_por_nivel_satisfaccion()

    return Response(resultado)