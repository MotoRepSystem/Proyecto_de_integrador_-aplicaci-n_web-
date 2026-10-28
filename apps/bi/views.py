
from django.db import connections
from django.http import JsonResponse
from django.views.decorators.http import require_GET


def consultar_kpi(sql, nombre_kpi):
    """Ejecuta una consulta de solo lectura en MotoRepCubo."""
    try:
        with connections['olap'].cursor() as cursor:
            cursor.execute(sql)
            columnas = [columna[0] for columna in cursor.description]
            datos = [
                dict(zip(columnas, fila))
                for fila in cursor.fetchall()
            ]

        return JsonResponse({
            'kpi': nombre_kpi,
            'total_registros': len(datos),
            'datos': datos,
        })

    except Exception:
        return JsonResponse(
            {
                'error': 'No fue posible consultar el KPI.',
                'kpi': nombre_kpi,
            },
            status=500,
        )


@require_GET
def ventas_por_periodo(request):
    sql = """
        SELECT Year, Trimestre, Mes, NombreMes, TotalVentas
        FROM dbo.vw_KPI_VentasPorPeriodo
        ORDER BY Year, Mes
    """
    return consultar_kpi(sql, 'ventas_por_periodo')


@require_GET
def ventas_por_satisfaccion(request):
    sql = """
        SELECT NivelSatisfaccion, TotalVentas
        FROM dbo.vw_KPI_VentasPorSatisfaccion
        ORDER BY NivelSatisfaccion
    """
    return consultar_kpi(sql, 'ventas_por_satisfaccion')


@require_GET
def satisfaccion_con_incidencia(request):
    sql = """
        SELECT SatisfaccionPromedio
        FROM dbo.vw_KPI_SatisfaccionConIncidencia
    """
    return consultar_kpi(sql, 'satisfaccion_con_incidencia')


@require_GET
def satisfaccion_sin_incidencia(request):
    sql = """
        SELECT SatisfaccionPromedio
        FROM dbo.vw_KPI_SatisfaccionSinIncidencia
    """
    return consultar_kpi(sql, 'satisfaccion_sin_incidencia')


@require_GET
def incidencias_por_cliente(request):
    sql = """
        SELECT
            idCliente,
            ClienteID,
            NombreCompleto,
            NumeroIncidencias
        FROM dbo.vw_KPI_IncidenciasPorCliente
        ORDER BY NumeroIncidencias DESC, NombreCompleto
    """
    return consultar_kpi(sql, 'incidencias_por_cliente')
