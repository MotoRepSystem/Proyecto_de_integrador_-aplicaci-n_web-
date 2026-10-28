from .repository import consultar_ventas_por_mes, consultar_inventario_por_categoria, consultar_ventas_por_metodo_pago, consultar_productos_mayor_rotacion, consultar_ventas_por_nivel_satisfaccion


def obtener_ventas_por_mes():
    datos = consultar_ventas_por_mes()

    return datos


def obtener_inventario_por_categoria():
    datos = consultar_inventario_por_categoria()

    return datos

def obtener_ventas_por_metodo_pago():
    datos = consultar_ventas_por_metodo_pago()

    return datos

def obtener_productos_mayor_rotacion():
    datos = consultar_productos_mayor_rotacion()

    return datos

def obtener_ventas_por_nivel_satisfaccion():
    datos = consultar_ventas_por_nivel_satisfaccion()

    return datos