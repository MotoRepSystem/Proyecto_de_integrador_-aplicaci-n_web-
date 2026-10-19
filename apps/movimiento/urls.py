from django.urls import path, include


urlpatterns = [

 path("caja/", include(('apps.movimiento.caja.urls', 'caja'), namespace='caja')),
 path ("compras/",include('apps.movimiento.compra.urls',namespace='compra')),
 path ("compras/", include('apps.movimiento.compra.urls',namespace='detalles')),
 path ("compras/", include('apps.movimiento.compra.urls',namespace='compra_credito')),
 path("factura/",include('apps.movimiento.factura.urls')),
 path("factura/",include('apps.movimiento.factura.urls', namespace='detalle/')),
 path("factura/",include('apps.movimiento.factura.urls', namespace='credito/')),
 path("marcas/", include('apps.movimiento.marca.urls')),
 path("moto/", include('apps.movimiento.moto.urls')),
 path("productos/",include('apps.movimiento.producto.urls')),
 path("productos/",include('apps.movimiento.producto.urls', namespace='detalle')),
 path("productos/",include('apps.movimiento.producto.urls', namespace='inventarioLote')),
 path("movimiento_pago/",include('apps.movimiento.movimientoPago.urls')),

]
