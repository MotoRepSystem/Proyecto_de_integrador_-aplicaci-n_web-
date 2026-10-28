VENTAS_POR_MES = {
    "kpi": "ventas_por_mes",
    "titulo": "Ventas por mes",
    "moneda": "NIO",
    "datos": [
        {"mes": "Enero", "total_ventas": 125000},
        {"mes": "Febrero", "total_ventas": 148000},
        {"mes": "Marzo", "total_ventas": 132000},
        {"mes": "Abril", "total_ventas": 175000},
        {"mes": "Mayo", "total_ventas": 163000},
        {"mes": "Junio", "total_ventas": 195000}
    ],
    "metadata": {
        "es_dato_de_ejemplo": True
    }
}


INVENTARIO_POR_CATEGORIA = {
    "kpi": "inventario_por_categoria",
    "titulo": "Inventario por categoría",
    "unidad": "unidades",
    "datos": [
        {"categoria": "Filtros", "cantidad": 145},
        {"categoria": "Lubricantes", "cantidad": 210},
        {"categoria": "Frenos", "cantidad": 87},
        {"categoria": "Bujías", "cantidad": 126},
        {"categoria": "Transmisión", "cantidad": 64},
        {"categoria": "Eléctricos", "cantidad": 98}
    ],
    "metadata": {
        "es_dato_de_ejemplo": True
    }
}

VENTAS_POR_METODO_PAGO = {
    "kpi": "ventas_por_metodo_pago",
    "titulo": "Ventas por método de pago",
    "moneda": "NIO",
    "datos": [
        {
            "metodo_pago": "Efectivo",
            "total_ventas": 185000
        },
        {
            "metodo_pago": "Tarjeta",
            "total_ventas": 125000
        },
        {
            "metodo_pago": "Transferencia",
            "total_ventas": 95000
        }
    ],
    "metadata": {
        "es_dato_de_ejemplo": True
    }
}

PRODUCTOS_MAYOR_ROTACION = {
    "kpi": "productos_mayor_rotacion",
    "titulo": "Productos con mayor rotación",
    "periodo": "Último mes",
    "unidad": "unidades vendidas",
    "datos": [
        {
            "producto": "Aceite 20W-50",
            "unidades_vendidas": 185
        },
        {
            "producto": "Filtro de aceite",
            "unidades_vendidas": 142
        },
        {
            "producto": "Bujía estándar",
            "unidades_vendidas": 118
        },
        {
            "producto": "Pastillas de freno",
            "unidades_vendidas": 96
        },
        {
            "producto": "Filtro de aire",
            "unidades_vendidas": 83
        }
    ],
    "metadata": {
        "es_dato_de_ejemplo": True
    }
}

VENTAS_POR_NIVEL_SATISFACCION = {
    "kpi": "ventas_por_nivel_satisfaccion",
    "titulo": "Ventas por nivel de satisfacción",
    "descripcion": (
        "Suma del total de ventas agrupada por nivel "
        "de satisfacción del cliente."
    ),
    "moneda": "NIO",
    "periodo": {
        "tipo": "todos",
        "desde": None,
        "hasta": None
    },
    "unidad": "córdobas",
    "datos": [
        {
            "nivel_satisfaccion": "Bajo",
            "total_ventas": 18500.0
        },
        {
            "nivel_satisfaccion": "Medio",
            "total_ventas": 42750.5
        },
        {
            "nivel_satisfaccion": "Alto",
            "total_ventas": 86300.0
        },
        {
            "nivel_satisfaccion": "Muy alto",
            "total_ventas": 112450.75
        }
    ],
    "metadata": {
        "es_dato_de_ejemplo": True,
        "nota": (
            "Valores ficticios para practicar la lectura "
            "JSON y la visualización con MPAndroidChart."
        )
    }
}