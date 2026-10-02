const urlAPI = "https://motorepweb-api-h3ahb3c6hgfebpa6.centralus-01.azurewebsites.net/";

//const urlAPI = "http://127.0.0.1:8000/";

import { registrarControlInactividad,logout, fetchConAutenticacion } from "../login/auth.js";

//registrarControlInactividad();
document.addEventListener("DOMContentLoaded",() => {registrarControlInactividad();});

//impot

const navLinks   = document.querySelectorAll('.nav-link');
const secciones  = document.querySelectorAll('.seccion');
const tituloTop  = document.getElementById('topbarTitulo');
const btneditar = document.getElementById('btnEditar');


//material para agregar clientes
//const btnAgregarCliente = document.getElementById('btnGuardar');

navLinks.forEach(function(link) {
  link.addEventListener('click', function(e) {
    e.preventDefault();

    // Leer qué sección abrir
    const nombreSeccion = link.dataset.section;

    // Quitar clase activo de todos los links
    navLinks.forEach(function(l) {
      l.classList.remove('activo');
    });

    // Poner clase activo al link clickeado
    link.classList.add('activo');

    // Ocultar todas las secciones
    secciones.forEach(function(s) {
      s.classList.remove('activa');
    });

    // Mostrar la sección correspondiente
    document.getElementById(nombreSeccion).classList.add('activa');

    // Actualizar el título de la barra superior
    tituloTop.textContent = link.textContent;
  });
});
// ==========================================
// LOGICA DE cerrar sesion
// ==========================================

const btnCerraSesion= document.getElementById("btnCerrarSesion")

if(btnCerraSesion){
  btnCerraSesion.addEventListener("click", (e)=>{
    e.preventDefault();//evita cualquier comportamiento por default

    const confirmar= confirm("¿Estás seguro de que deseas cerrar la sesión actual?")

    if(confirmar){
      logout(); //si el usuario acepta ejecutamos la funcion
    }

  })
}

// ===== BUSCADOR GLOBAL =====

function activarBuscadorGlobal(idInput, selectorFilas){
  const buscador = document.getElementById(idInput);

  if (!buscador) return;

  buscador.addEventListener('input', function(){
    const textoBusqueda = buscador.value.toLowerCase();
    const filas = document.querySelectorAll(selectorFilas);

    filas.forEach(function(fila){
      const textoDeFila = fila.textContent.toLowerCase();

      if (textoDeFila.includes(textoBusqueda)){
        fila.style.display= '';
      }else{
        fila.style.display= 'none';
      }
    });
  });
}

// ==========================================
// LOGICA DE CLIENTES
// ==========================================

let clienteID = null;

// Hacemos la función exportable por si otro módulo necesita refrescar la tabla
export async function cargarClientes() {
  const cargando = document.getElementById('cargandoCliente');
  const tabla = document.getElementById('tablaCliente');
  const tbody = document.getElementById('bodyCliente');

  //parametro para la funcion buscador global
  const buscadorCliente = document.getElementById('buscarCliente');

  cargando.style.display = 'block';
  tabla.classList.remove('visible');
  
  try {
    // REEMPLAZO 1: Usamos tu función con autenticación automática.
    // Ojo: fetchConAutenticacion ya concatena urlAPI internamente según el diseño previo.
    let respuesta = await fetchConAutenticacion('catalogos/clientes/');
    const dato = await respuesta.json();

    const cliente = Array.isArray(dato) ? dato : dato.results;
    let filas = "";

    for (let i = 0; i < cliente.length; i++) {
      let cli = cliente[i];
    
      filas += '<tr>';
      filas += '<td> '+(i+1) +' </td>';
      filas += '<td> '+ cli.Nombres +' </td>';
      filas += '<td> '+ cli.Apellidos +' </td>';
      filas += '<td> '+ cli.NumCedula +' </td>';
      filas += '<td> '+ cli.NumTeléfono +' </td>';

      // Botones editar y borrar
      filas += '<td class="td-acciones">';
      filas += '<button class="btn-accion btn-editar" '
              + `onclick="abrirModalCliente('editar', ${cli.id}, '${cli.Nombres}', '${cli.Apellidos}', '${cli.NumTeléfono}', '${cli.NumCedula}')">`
              + '✏ Editar'              
              + '</button>';
      filas += '<button class="btn-accion btn-eliminar" '
              + `onclick="eliminarCliente(${cli.id}, '${cli.Nombres}', '${cli.Apellidos}')">`
              + '🗑 Eliminar'              
              + '</button>';
      filas += ' </td>';
      filas += '</tr>';
    }

    tbody.innerHTML = filas;
    cargando.style.display = 'none';
    tabla.classList.add('visible');

    //activar
    activarBuscadorGlobal('buscarCliente','#bodyCliente tr')
    
  } catch (error) {
    cargando.textContent = '⚠ Error al conectar con la API';
    console.error('Error en cargarClientes:', error); 
  }
}





// modal cliente
window.abrirModalCliente = function(modo, id, nombre, apellido, telefono, numCedula) {
  document.getElementById('modalTextCliente').textContent = modo === 'crear' ? 'Nuevo cliente' : 'Editar Cliente';

  document.getElementById('clienNombre').value = nombre || '';
  document.getElementById('clienApellidos').value = apellido || '';
  document.getElementById('clienTelefono').value = telefono || '';
  document.getElementById('clienCedula').value = numCedula || '';
  
  const errorEl = document.getElementById('error');
  if (errorEl) errorEl.textContent = '';

  clienteID = modo === 'editar' ? id : null;
  document.getElementById('modalCliente').classList.add('activo');
}

window.cerrarModalCliente = function(idModal) {
  document.getElementById('clienNombre').value = '';
  document.getElementById('clienApellidos').value = '';
  document.getElementById('clienTelefono').value = '';
  document.getElementById('clienCedula').value = '';
  
  const errorEl = document.getElementById('error');
  if (errorEl) errorEl.textContent = '';
  
  document.getElementById(idModal).classList.remove('activo');
}

// ── POST / PUT: Guardar cliente ─────────────────────────────────────
window.guardarCliente = async function guardarCliente() {
  let nombre = document.getElementById('clienNombre').value.trim();
  let apellidos = document.getElementById('clienApellidos').value.trim();
  let telefono = document.getElementById('clienTelefono').value.trim();
  let cedula = document.getElementById('clienCedula').value.trim();
  let errorEl = document.getElementById('error');

  if (!nombre || !apellidos || !telefono || !cedula) {
    errorEl.textContent = 'Todos los campos son obligatorios.';
    return;
  }

  let body = JSON.stringify({ Nombres: nombre, Apellidos: apellidos, NumCedula: cedula, NumTeléfono: telefono });

  let metodo = clienteID === null ? 'POST' : 'PATCH';
  // Pasamos solo la ruta relativa porque fetchConAutenticacion le pega la urlAPI
  let url = clienteID === null
    ? 'catalogos/clientes/'
    : 'catalogos/clientes/' + clienteID;

  try {
    // REEMPLAZO 2: Removimos la validación manual del token.
    // Tu función 'fetchConAutenticacion' inyectará el Header 'Authorization' automáticamente.
    let respuesta = await fetchConAutenticacion(url, {
      method: metodo,
      body: body
    });

    if (respuesta.ok) {
      cerrarModalCliente('modalCliente');
      cargarClientes(); 
    } else {
      let errores = await respuesta.json();
      errorEl.textContent = JSON.stringify(errores);
    }
  } catch (error) {
    errorEl.textContent = 'Error de conexión con la API.';
    console.error('Error en guardarCliente:', error);
  }
}

// BORRAR CLIENTE
window.eliminarCliente = async function(id, nombre, apellido) {
  let confirmar = window.confirm(`Seguro que quieres eliminar al cliente ${nombre} ${apellido}`);
  if (!confirmar) return;

  try {
    // REEMPLAZO 3: Petición DELETE limpia usando tu interceptor automático
    let url = 'catalogos/clientes/' + id;
    let respuesta = await fetchConAutenticacion(url, {
      method: 'DELETE'
    });

    if (respuesta.status === 204 || respuesta.ok) {
      cargarClientes();
    } else {
      alert('No se pudo eliminar. Código: ' + respuesta.status);
    }
  } catch (error) {
    alert('Error de conexión con la API.');
    console.error('Error en eliminarCliente:', error);
  }
}


// ==========================================
// 1. IMPORTACIONES AL INICIO DEL ARCHIVO
// ==========================================
// Importamos la función en el auth.js y la URL base
//import { fetchConAutenticacion, iniciarRefrescoAutomatico } from './auth.js'; 


// Reavivamos el temporizador automático en esta página
//iniciarRefrescoAutomatico();

// ==========================================
// LOGICA DE EMPLEADOS
// ==========================================

let empleadoID = null;

// Hacemos la función exportable por si otro módulo necesita refrescar la tabla
export async function cargarEmpleados() {
  const cargando = document.getElementById('cargandoEmpleado');
  const tabla = document.getElementById('tablaEmpleado');
  const tbody = document.getElementById('bodyEmpleado');

  cargando.style.display = 'block';
  tabla.classList.remove('visible');
  
  try {
    // Usamos tu función con autenticación automática.
    // fetchConAutenticacion ya concatena urlAPI internamente según el diseño previo.
    let respuesta = await fetchConAutenticacion('catalogos/empleados/');
    const dato = await respuesta.json();

    const empleado = Array.isArray(dato) ? dato : dato.results;
    let filas = "";

    for (let i = 0; i < empleado.length; i++) {
      let emp = empleado[i];
    
      filas += '<tr>';
      filas += '<td> '+(i+1) +' </td>';
      filas += '<td> '+ emp.Nombres +' </td>';
      filas += '<td> '+ emp.Apellidos +' </td>';
      filas += '<td> '+ emp.Telefono +' </td>';
      filas += '<td> '+ emp.NumCedula +' </td>';

      // Botones editar y borrar
      filas += '<td class="td-acciones">';
      filas += '<button class="btn-accion btn-editar" '
              + `onclick="abrirModalEmpleado('editar', ${emp.id}, '${emp.Nombres}', '${emp.Apellidos}', '${emp.Telefono}', '${emp.NumCedula}')">`
              + '✏ Editar'              
              + '</button>';
      filas += '<button class="btn-accion btn-eliminar" '
              + `onclick="eliminarEmpleado(${emp.id}, '${emp.Nombres}', '${emp.Apellidos}')">`
              + '🗑 Eliminar'              
              + '</button>';
      filas += ' </td>';
      filas += '</tr>';
    }

    tbody.innerHTML = filas;
    cargando.style.display = 'none';
    tabla.classList.add('visible');

    //activar
    activarBuscadorGlobal('buscarEmpleado','#bodyEmpleado tr')

  } catch (error) {
    cargando.textContent = '⚠ Error al conectar con la API local. ¿Está corriendo el servidor Django?';
    console.error('Error en cargarEmpleado:', error); 
  }
}

// modal empleado
window.abrirModalEmpleado = function(modo, id, nombre, apellido, telefono, numCedula) {
  document.getElementById('modalTextEmpleado').textContent = modo === 'crear' ? 'Nuevo empleado' : 'Editar Empleado';

  document.getElementById('empNombre').value = nombre || '';
  document.getElementById('empApellidos').value = apellido || '';
  document.getElementById('empTelefono').value = telefono || '';
  document.getElementById('empCedula').value = numCedula || '';
  
  const errorEl = document.getElementById('error');
  if (errorEl) errorEl.textContent = '';

  empleadoID = modo === 'editar' ? id : null;
  document.getElementById('modalEmpleado').classList.add('activo');
}

window.cerrarModal = function(idModal) {
  document.getElementById('empNombre').value = '';
  document.getElementById('empApellidos').value = '';
  document.getElementById('empTelefono').value = '';
  document.getElementById('empCedula').value = '';
  
  const errorEl = document.getElementById('error');
  if (errorEl) errorEl.textContent = '';
  
  document.getElementById(idModal).classList.remove('activo');
}

// ── POST / PUT: Guardar empleado ─────────────────────────────────────
window.guardarEmpleado = async function guardarEmpleado() {
  let nombre = document.getElementById('empNombre').value.trim();
  let apellidos = document.getElementById('empApellidos').value.trim();
  let telefono = document.getElementById('empTelefono').value.trim();
  let cedula = document.getElementById('empCedula').value.trim();
  let errorEl = document.getElementById('error');

  if (!nombre || !apellidos || !telefono || !cedula) {
    errorEl.textContent = 'Todos los campos son obligatorios.';
    return;
  }

  let body = JSON.stringify({ Nombres: nombre, Apellidos: apellidos, Telefono: telefono, NumCedula: cedula });

  let metodo = empleadoID === null ? 'POST' : 'PATCH';
  // Pasamos solo la ruta relativa porque fetchConAutenticacion le pega la urlAPI
  let url = empleadoID === null
    ? 'catalogos/empleados/'
    : 'catalogos/empleados/' + empleadoID;

  try {
    //la función 'fetchConAutenticacion' inyectará el Header 'Authorization' automáticamente.
    let respuesta = await fetchConAutenticacion(url, {
      method: metodo,
      body: body
    });

    if (respuesta.ok) {
      cerrarModal('modalEmpleado');
      cargarEmpleados(); 
    } else {
      let errores = await respuesta.json();
      errorEl.textContent = JSON.stringify(errores);
    }
  } catch (error) {
    errorEl.textContent = 'Error de conexión con la API.';
    console.error('Error en guardarEmpleado:', error);
  }
}

// BORRAR EMPLEADO
window.eliminarEmpleado = async function(id, nombre, apellido) {
  let confirmar = window.confirm(`Seguro que quieres eliminar al empleado ${nombre} ${apellido}`);
  if (!confirmar) return;

  try {
    let url = 'catalogos/empleados/' + id;
    let respuesta = await fetchConAutenticacion(url, {
      method: 'DELETE'
    });

    if (respuesta.status === 204 || respuesta.ok) {
      cargarEmpleados();
    } else {
      alert('No se pudo eliminar. Código: ' + respuesta.status);
    }
  } catch (error) {
    alert('Error de conexión con la API.');
    console.error('Error en eliminarEmpleado:', error);
  }
}


let FacturaID=null;

async function cargarFactura() {
  const cargando = document.getElementById('cargandoFactura');
  const tabla = document.getElementById('tablaFactura');
  const tbody = document.getElementById('bodyFactura');

  cargando.style.display = 'block';
  tabla.classList.remove('visible');
  
  try {
    // Usamos tu función con autenticación automática.
    //fetchConAutenticacion ya concatena urlAPI internamente según el diseño previo.
    let respuesta = await fetchConAutenticacion('movimiento/factura/');
    const dato = await respuesta.json();

    const facturas = Array.isArray(dato) ? dato : dato.results;
    let filas = "";

    for (let i = 0; i < facturas.length; i++) {
      let factura = facturas[i];

      filas += '<tr>';
      filas += '<td>'+ (i+1)+'</td>';
      filas += '<td class="td-nombreEmp">'+factura.NumFactura+'</td>';
      filas += '<td>'+factura.cliente_nombre+' '+ factura.cliente_cedula +'</td>';
      filas += '<td>'+factura.fecha_formateada +'</td>';
      filas += `<td>C$ ${factura.Total.toLocaleString('es-NI')}</td>`;
      filas += '<td>'+factura.condicion_nombre+'</td>'
      filas += '<td>'+factura.estadoCuenta_nommbre+'</td>'
      filas += '<td class="td-acciones">';

      filas += `<button class="btn-accion" style="background:rgba(6,182,212,0.15);color:#0e7490;border:1px solid rgba(6,182,212,0.4);"
                  onclick="verDetalleFactura(${factura.id}, ${factura.NumFactura})">
                  🔍 Detalles
                </button>`;
      filas += '</td>';
      

      // aciones
      filas += '<td class="td-acciones">';
      filas += '<button class="btn-accion btn-editar" '
              + `onclick="abrirModalfactura('editar', ${factura.id}, '${factura.NumFactura}','${factura.ClienteId}', '${factura.Fecha}','${factura.Total}', '${factura.condicionId}', '${factura.estadoCuentaId}')">`
              + '✏ Editar'              
              + '</button>';
      filas += '<button class="btn-accion btn-eliminar" '
              + `onclick="eliminarFactura(${factura.id}, '${factura.NumFactura}', '${factura.cliente_nombre}')">`
              + '🗑 Eliminar'              
              + '</button>';
      filas += ' </td>';
      filas += '</tr>';
    }

    tbody.innerHTML = filas;
    cargando.style.display = 'none';
    tabla.classList.add('visible');

    activarBuscadorGlobal('buscarFactura','#bodyFactura tr')

  } catch (error) {
    cargando.textContent = '⚠ Error al conectar con la API';
    console.error('Error en cargarFactura:', error); 
  }
}

async function cargarOpcionesClientes () {
  var select = document.getElementById('facturaCliente');

  // Limpiar las opciones anteriores
  select.innerHTML = '<option value="">-- Seleccione un cliente --</option>';

  try {
    var respuesta    = await fetchConAutenticacion('catalogos/clientes/');
    var datos        = await respuesta.json();
    var cliente = Array.isArray(datos) ? datos : datos.results;

    // Crear un <option> por cada departamento.
    // value = id (lo que se envía al API como FK)
    // textContent = nombre (lo que ve el usuario)

    //console.log('datos recibidos de la api: ', cliente); //visualizar cuales son los datos enviados
    
    
    for (var i = 0; i < cliente.length; i++) {
      var c     = cliente[i];
      var option = document.createElement('option');
      option.value       = c.id;     // ← esto es lo que se envía como "departamento" en el body
      option.textContent =`${c.Nombres} cédula: ${c.NumCedula}`; // ← esto es lo que ve el usuario
      select.appendChild(option);
    }

  } catch (error) {
    console.error('No se pudieron cargar los departamentos para el select:', error);
  }
}

async function cargarOpcionesCondicion () {
  var select = document.getElementById('facturaCondicion');

  // Limpiar las opciones anteriores
  select.innerHTML = '<option value="">-- Seleccione una condicion --</option>';

  try {
    var respuesta    = await fetchConAutenticacion('catalogos/condicionpago/');
    var datos        = await respuesta.json();
    var condicion = Array.isArray(datos) ? datos : datos.results;

    // Crear un <option> por cada departamento.
    // value = id (lo que se envía al API como FK)
    // textContent = nombre (lo que ve el usuario)

    //console.log('datos recibidos de la api: ', condicion);
    
    
    for (var i = 0; i < condicion.length; i++) {
      var c     = condicion[i];
      var option = document.createElement('option');
      option.value       = c.id;     // ← esto es lo que se envía como  en el body
      option.textContent =`${c.descripcion}`; // ← esto es lo que ve el usuario
      select.appendChild(option);
    }

  } catch (error) {
    console.error('No se pudieron cargar los departamentos para el select:', error);
  }
}

async function cargarOpcionesEstados () {
  var select = document.getElementById('facturaEstado');

  // Limpiar las opciones anteriores
  select.innerHTML = '<option value="">-- Seleccione un estado --</option>';

  try {
    var respuesta    = await fetchConAutenticacion('catalogos/estadocuenta/');
    var datos        = await respuesta.json();
    var estado = Array.isArray(datos) ? datos : datos.results;

    // Crear un <option> por cada departamento.
    // value = id (lo que se envía al API como FK)
    // textContent = nombre (lo que ve el usuario)

    //console.log('datos recibidos de la api: ', estado);
    
    
    for (var i = 0; i < estado.length; i++) {
      var c     = estado[i];
      var option = document.createElement('option');
      option.value       = c.id;     // ← esto es lo que se envía en el body
      option.textContent =`${c.descripcion}`; // ← esto es lo que ve el usuario
      select.appendChild(option);
    }

  } catch (error) {
    console.error('No se pudieron cargar los departamentos para el select:', error);
  }
}
 
async function cargarOpcionesDetalles () {
  var select = document.getElementById('facturaProducto');

  // Limpiar las opciones anteriores
  select.innerHTML = '<option value="">-- Seleccione un producto --</option>';

  try {
    var respuesta    = await fetchConAutenticacion('movimiento/productos/destalle/');
    var datos        = await respuesta.json();
    var detallesP = Array.isArray(datos) ? datos : datos.results;

    // Crear un <option> por cada departamento.
    // value = id (lo que se envía al API como FK)
    // textContent = nombre (lo que ve el usuario)

    //console.log('datos recibidos de la api: ', detallesP);
    
    
    for (var i = 0; i < detallesP.length; i++) {
      var f      = detallesP[i];
      var option = document.createElement('option');
      option.value       = f.id;     // ← esto es lo que se envía  en el body
      option.textContent =`${f.producto_nombre}-marca: ${f.marca_nombre}-Moto: ${f.moto_modelo}`; // ← esto es lo que ve el usuario
      select.appendChild(option);
    }

  } catch (error) {
    console.error('No se pudieron cargar los departamentos para el select:', error);
  }
}



// Abrir modal compra (crear / editar)
window.abrirModalfactura = async function(modo, id, numFactura, clienteId, Fecha, total, condicionId, estadoId) {

    const tablaDetalleCompra = document.getElementById('tablaDetalleFactura');
    if (tablaDetalleCompra) tablaDetalleCompra.classList.add('visible');

    document.getElementById('modalTextCompra').textContent =
        modo === 'crear' ? 'Nueva Factura' : 'Editar Factura';

    // 1. Primero cargamos los catálogos desde la API de forma asíncrona
    await cargarOpcionesClientes();
    await cargarOpcionesCondicion();
    await cargarOpcionesEstados();
    await cargarOpcionesDetalles();

    // 2. Ahora que las opciones ya existen en el HTML, asignamos los valores de forma segura
    document.getElementById('facturaNumero').value    = numFactura  || '';
    document.getElementById('facturaCliente').value   = clienteId   || '';
    document.getElementById('facturaFecha').value     = Fecha       || '';
   // document.getElementById('facturaTotal').value     = total       || '';
    
    // Si es modo 'crear' y tus selects tienen opciones por defecto, se quedan en blanco para que el usuario elija
    document.getElementById('facturaCondicion').value = condicionId || '';
    document.getElementById('facturaEstado').value    = estadoId    || '';
    
    FacturaID = modo === 'editar' ? id : null;

    document.getElementById('modalfactura').classList.add('activo');
};


window.cerrarModalFactura = function(modalfactura) {


  let confirmar = window.confirm(`Seguro que quieres salirte`);
  if (!confirmar) return;

  document.getElementById('facturaNumero').value = '';
  document.getElementById('facturaCliente').value = '';
  document.getElementById('facturaFecha').value = '';
  //document.getElementById('facturaTotal').value = '';
  document.getElementById('facturaCondicion').value    = '';
  document.getElementById('facturaEstado').value    =  '';
  
  const errorEl = document.getElementById('error');
  if (errorEl) errorEl.textContent = '';

  const errorProducto= document.getElementById('errorMensajeFacturaProducto');
  if (errorProducto) errorProducto.textContent='';
  
  document.getElementById(modalfactura).classList.remove('activo');
}


let ncFacturaProductosTemp = [];   // [ { prodId, nombre, cantidad, precio, subtotal } ]
let ncFacturaContadorFila = 0;

function ActualizarTotalFac() {
    const total = ncFacturaProductosTemp.reduce((acc, p) => acc + p.subtotal, 0);
    document.getElementById('facTotal').textContent = ncMoneda(total);
}

/** Redibuja todas las filas de la tabla temporal */
function ncRedibujarTablaDetalleFac() {
    const tbody = document.getElementById('bodyDetalleCompra');
    const tablaWrap = document.getElementById('TablaDetalleFac');
    //const sinProd = document.getElementById('nc_sin_productos');

    if (ncFacturaProductosTemp.length === 0) {
        tbody.innerHTML = '';
        tablaWrap.style.display = 'none';
        //sinProd.style.display = 'block';
        ActualizarTotalFac();
        return;
    }

    tablaWrap.style.display = 'block';
    //sinProd.style.display = 'none';

    let filas = '';
    ncFacturaProductosTemp.forEach((p, idx) => {
        filas += `<tr id="nc_fila_${p._key}">
            <td>${idx + 1}</td>
            <td>${p.nombreProducto}</td>
            <td>${p.cantidad}</td>
            <td>${ncMoneda(p.precio)}</td>
            <td>${ncMoneda(p.subtotal)}</td>
            <td>
                <button class="btn-accion btn-eliminar"
                        onclick="ncQuitarProductoFactura(${p._key})"
                        title="Quitar producto">
                    🗑
                </button>
            </td>
        </tr>`;
    });

    tbody.innerHTML = filas;
    ActualizarTotalFac();
}

window.ncAgregarFacturaProducto = function() {
    const errorEl = document.getElementById('errorMensajeFacturaProducto');
    errorEl.textContent = '';

    // 1. Obtener los elementos y sus valores correctamente
    const selectProducto = document.getElementById('facturaProducto');
    const prodId = selectProducto.value; // El ID seleccionado (value del option)
    const nombreProducto = selectProducto.options[selectProducto.selectedIndex]?.text || ''; // El texto visible
    
    const cantidad = parseFloat(document.getElementById('facturaCantidad').value.trim());
    const precio = parseFloat(document.getElementById('facturaPrecio').value.trim());

    // Validaciones
    if (!prodId) {
        errorEl.textContent = 'Selecciona un producto.';
        return;
    }
    if (!cantidad || cantidad <= 0) {
        errorEl.textContent = 'Ingresa una cantidad válida.';
        return;
    }
    if (!precio || precio <= 0) {
        errorEl.textContent = 'Ingresa un precio válido.';
        return;
    }

    // Buscar en el array temporal usando el ID del producto (prodId)
    const yaExiste = ncFacturaProductosTemp.find(p => String(p.prodId) === String(prodId));
    if (yaExiste) {
        errorEl.textContent = `El producto "${nombreProducto}" ya está en la lista. Quítalo primero si quieres modificarlo.`;
        return;
    }

    const subtotal = cantidad * precio;
    ncFacturaContadorFila++;

    // Guardar las propiedades correctas en el objeto (incluyendo una clave única _key para poder borrarlo)
    ncFacturaProductosTemp.push({
        _key: ncFacturaContadorFila,
        prodId: prodId,
        nombreProducto: nombreProducto,
        cantidad: cantidad,
        precio: precio,
        subtotal: subtotal
    });

    // Limpiar campos usando los IDs reales de tu HTML
    document.getElementById('facturaProducto').value = '';
    document.getElementById('facturaCantidad').value = '';
    document.getElementById('facturaPrecio').value = '';

    // Foco de vuelta al select de productos
    document.getElementById('facturaProducto').focus();

    // Redibujar la tabla
    ncRedibujarTablaDetalleFac();
};

window.ncQuitarProductoFactura = function(key) {
    ncFacturaProductosTemp = ncFacturaProductosTemp.filter(p => p._key !== key);
    ncRedibujarTablaDetalleFac();
};

// ── Guardar: envía cabecera + detalles a la API ───────────────

window.guardarNuevaFactura = async function() {
    let errorEl = document.getElementById('errorfactura'); 
    let errorProducto= document.getElementById('errorMensajeFacturaProducto');
    if (!errorEl) {
        errorEl = { set textContent(val) { console.error("Error UI:", val); } };
    }
    errorEl.textContent = '';

    // Capturar elementos directamente
    const numFactura   = document.getElementById('facturaNumero').value.trim();
    const fecha        = document.getElementById('facturaFecha').value;
    const clienteId    = document.getElementById('facturaCliente').value;
    const condicionId  = document.getElementById('facturaCondicion').value;
    const estadoId     = document.getElementById('facturaEstado').value;

    // Validación estricta en Frontend antes de mandar el POST
    if (!numFactura || !fecha || !clienteId || !condicionId || !estadoId) {
        errorEl.textContent = '⚠️ Por favor, asegúrese llenar todos los campos';
        return;
    }

    if (ncFacturaProductosTemp.length === 0) {
        errorProducto.textContent = '⚠️ Agrega al menos un producto a la tabla antes de guardar.';
        return;
    }

    // Calcular total directamente desde la tabla temporal
    const totalCalculado = ncFacturaProductosTemp.reduce((acc, p) => acc + p.subtotal, 0);
    //const totalSu

    const detallesFormateados = ncFacturaProductosTemp.map(p => ({
        detalleProductoId: parseInt(p.prodId),
        Cantidad: parseFloat(p.cantidad),
        Subtotal: (p.subtotal),
    }));

    const payload = {
        NumFactura:     parseInt(numFactura),
        Fecha:          fecha, 
        ClienteId:      parseInt(clienteId),
        condicionId:    parseInt(condicionId),    
        estadoCuentaId: parseInt(estadoId),       
        Total:          totalCalculado.toFixed(2), 
        detalles:       detallesFormateados
    };

    try {
        const respFactura = await fetchConAutenticacion('movimiento/factura/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload),
        });

        const respuestaJson = await respFactura.json();

        if (!respFactura.ok) {
            console.error("Detalles del Error devuelto por Django:", respuestaJson);
            errorEl.textContent = 'Error desde el servidor: ' + JSON.stringify(respuestaJson);
            return;
        }

        alert(`✅ Factura N° ${numFactura} guardada con éxito por un total de C$ ${totalCalculado.toFixed(2)}`);
        
        // Limpieza completa
        ncFacturaProductosTemp = [];
        ncRedibujarTablaDetalleFac();
        document.getElementById('modalfactura').classList.remove('activo');
        await cargarFactura();

    } catch (e) {
        errorEl.textContent = 'Error crítico de comunicación con el servidor.';
        console.error(e);
    }
};

//---------------------------------------------------------------------
// MODULO DE CAJA
//----------------------------------------------------------------------

let CajaID=null;

async function cargarCaja() {
  const cargando = document.getElementById('cargandoCaja');
  const tabla = document.getElementById('tablaCaja');
  const tbody = document.getElementById('bodyCaja');

  cargando.style.display = 'block';
  tabla.classList.remove('visible');
  
  try {
    // Usamos tu función con autenticación automática.
    //fetchConAutenticacion ya concatena urlAPI internamente según el diseño previo.
    let respuesta = await fetchConAutenticacion('movimiento/caja/');
    const dato = await respuesta.json();

    const Caja = Array.isArray(dato) ? dato : dato.results;
    let filas = "";

    for (let i = 0; i < Caja.length; i++) {
      let caja = Caja[i];

      filas += '<tr>';
      filas += '<td>'+ (i+1)+'</td>';
      filas += '<td class="td-nombreEmp">'+caja.NumCaja+'</td>';
      filas += '<td>'+caja.Empleado_nombre+'</td>';
      filas += `<td>C$ ${caja.SaldoInicial}</td>`;
      filas += `<td>C$ ${caja.Egresos}</td>`;
      filas += `<td>C$ ${caja.Din_efectivo}</td>`;
      filas += `<td>C$ ${caja.Din_digital}</td>`;
      filas += `<td>C$ ${caja.SaldoFinal}</td>`;
      filas += '<td>'+caja.fecha_incio_formateada+'</td>'
      filas += '<td>'+caja.fecha_cierre_formateada+'</td>'
      filas += '<td class="td-acciones">';

      filas += `<button class="btn-accion" style="background:rgba(6,182,212,0.15);color:#0e7490;border:1px solid rgba(6,182,212,0.4);"
                  ">
                  🔍 Detalles
                </button>`;
      filas += '</td>';
      

      // aciones
      filas += '<td class="td-acciones">';
      filas += '<button class="btn-accion btn-editar" '
              + `onclick="abrirModalfactura('editar')">`
              + '✏ Editar'              
              + '</button>';
      filas += '<button class="btn-accion btn-eliminar" '
              + `onclick="eliminarFactura()">`
              + '🗑 Eliminar'              
              + '</button>';
      filas += ' </td>';
      filas += '</tr>';
    }

    tbody.innerHTML = filas;
    cargando.style.display = 'none';
    tabla.classList.add('visible');

    activarBuscadorGlobal('buscarCaja','#bodyCaja tr')

  } catch (error) {
    cargando.textContent = '⚠ Error al conectar con la API local. ¿Está corriendo el servidor Django?';
    console.error('Error en cargarFactura:', error); 
  }
}

//------------------------------------------------
// MODULO DE COMPRA
//------------------------------------------------

let compraID = null;

export async function cargarCompras() {
  const cargando = document.getElementById('cargandoCompra');
  const tabla    = document.getElementById('tablaCompra');
  const tbody    = document.getElementById('bodyCompra');

  if (!cargando || !tabla || !tbody) return;

  cargando.style.display = 'block';
  tabla.classList.remove('visible');

  try {
    let respuesta = await fetchConAutenticacion('movimiento/compras/');
    const dato = await respuesta.json();
    const compras = Array.isArray(dato) ? dato : dato.results;

    let filas = '';

    for (let i = 0; i < compras.length; i++) {
      let c = compras[i];

      const fecha = c.Fecha ? new Date(c.Fecha).toLocaleDateString('es-NI') : '-';

      filas += '<tr>';
      filas += `<td>${i + 1}</td>`;
      filas += `<td>${c.NumCompra}</td>`;
      filas += `<td>${c.proveedor_nombre ?? '-'}</td>`;
      filas += `<td>${fecha}</td>`;
      filas += `<td>C$ ${Number(c.Total).toLocaleString('es-NI')}</td>`;
      filas += `<td>${c.condicion_descripcion ?? '-'}</td>`;
      filas += `<td>${c.estado_cuenta_descripcion ?? '-'}</td>`;

      // Columna: Detalle de compra
      filas += '<td class="td-acciones">';
      filas += `<button class="btn-accion" style="background:rgba(6,182,212,0.15);color:#0e7490;border:1px solid rgba(6,182,212,0.4);"
                  onclick="verDetalleCompra(${c.id}, ${c.NumCompra})">
                  🔍 Detalles
                </button>`;
      filas += '</td>';

      // Columna: Acciones
      filas += '<td class="td-acciones">';
      filas += `<button class="btn-accion btn-editar"
                  onclick="abrirModalCompra('editar', ${c.id}, ${c.NumCompra}, ${c.ProveedoresId}, ${c.Total}, ${c.condicionId}, ${c.estadoCuentaId})">
                  ✏ Editar
                </button>`;
      filas += `<button class="btn-accion btn-eliminar"
                  onclick="eliminarCompra(${c.id}, ${c.NumCompra})">
                  🗑 Eliminar
                </button>`;
      filas += '</td>';

      filas += '</tr>';
    }

    tbody.innerHTML = filas || '<tr><td colspan="9" style="text-align:center;padding:20px;">Sin registros</td></tr>';
    cargando.style.display = 'none';
    tabla.classList.add('visible');

    activarBuscadorGlobal('buscarCompra','#bodyCompra tr')
    
  } catch (error) {
    cargando.textContent = '⚠ Error al conectar con la API. ¿Está corriendo el servidor Django?';
    console.error('Error en cargarCompras:', error);
  }
}


// ============================================================
//  LÓGICA: NUEVA COMPRA CON DETALLE TEMPORAL
//  Pega este bloque al final de tu accion.js
//  (antes o después de la lógica existente de compras)
// ============================================================

// ── Estado temporal ──────────────────────────────────────────
// Aquí se almacenan los productos que el usuario agrega al modal
// ANTES de que la compra se guarde en la base de datos.
let ncProductosTemp = [];   // [ { prodId, nombre, cantidad, precio, subtotal } ]
let ncContadorFila = 0;     // Clave interna para poder quitar filas

// ── Helpers ──────────────────────────────────────────────────

/** Formatea un número como moneda nicaragüense */
function ncMoneda(n) {
    return 'C$ ' + Number(n).toLocaleString('es-NI', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** Recalcula el total y actualiza la celda en pantalla */
function ncActualizarTotal() {
    const total = ncProductosTemp.reduce((acc, p) => acc + p.subtotal, 0);
    document.getElementById('nc_total_display').textContent = ncMoneda(total);
}

/** Redibuja todas las filas de la tabla temporal */
function ncRedibujarTabla() {
    const tbody = document.getElementById('nc_tbody_productos');
    const tablaWrap = document.getElementById('nc_tabla_wrap');
    const sinProd = document.getElementById('nc_sin_productos');

    if (ncProductosTemp.length === 0) {
        tbody.innerHTML = '';
        tablaWrap.style.display = 'none';
        sinProd.style.display = 'block';
        ncActualizarTotal();
        return;
    }

    tablaWrap.style.display = 'block';
    sinProd.style.display = 'none';

    let filas = '';
    ncProductosTemp.forEach((p, idx) => {
        filas += `<tr id="nc_fila_${p._key}">
            <td>${idx + 1}</td>
            <td>${p.prodId}</td>
            <td>${p.nombre}</td>
            <td>${p.cantidad}</td>
            <td>${ncMoneda(p.precio)}</td>
            <td>${ncMoneda(p.subtotal)}</td>
            <td>
                <button class="btn-accion btn-eliminar"
                        onclick="ncQuitarProducto(${p._key})"
                        title="Quitar producto">
                    🗑
                </button>
            </td>
        </tr>`;
    });

    tbody.innerHTML = filas;
    ncActualizarTotal();
}

// ── Abrir / Cerrar modal ─────────────────────────────────────
// Abrir modal compra (crear / editar)
window.abrirModalNuevaCompra = function(modo, id, numCompra, provId, total, condId, estId) {

  //const tablaDetalleCompra = document.getElementById('tablaDetalleCompra')

  //tablaDetalleCompra.classList.add('visible');
  ncProductosTemp = [];
  ncContadorFila = 0;

  document.getElementById('modalTextCompra').textContent =
    modo === 'crear' ? 'Nueva Compra' : 'Editar Compra';

  ['nc_numero','nc_fecha','nc_proveedor','nc_condicion','nc_estado'].forEach(id => {
        document.getElementById(id).value = '';
    });

    // Limpiar campos de producto
    ['nc_prod_id','nc_prod_nombre','nc_prod_cantidad','nc_prod_precio'].forEach(id => {
        document.getElementById(id).value = '';
    });

  const errorEl = document.getElementById('errorCompra');
  if (errorEl) errorEl.textContent = '';

  compraID = modo === 'editar' ? id : null;
  document.getElementById('modalNuevaCompra').classList.add('activo');
};

window.abrirModalNuevaCompra1 = function(modalNuevaCompra) {
    // Limpiar estado
    ProductosTemp = [];
    cContadorFila = 0;

    // Limpiar campos de cabecera
    ['nc_numero','nc_fecha','nc_proveedor','nc_condicion','nc_estado'].forEach(id => {
        document.getElementById(id).value = '';
    });

    // Limpiar campos de producto
    ['nc_prod_id','nc_prod_nombre','nc_prod_cantidad','nc_prod_precio'].forEach(id => {
        document.getElementById(id).value = '';
    });

    // Limpiar errores
    document.getElementById('nc_error_prod').textContent = '';
    document.getElementById('nc_error_compra').textContent = '';

    // Poner fecha de hoy por defecto
    const hoy = new Date().toISOString().split('T')[0];
    document.getElementById('nc_fecha').value = hoy;

    // Redibujar tabla (vacía)
    ncRedibujarTabla();

    // Abrir modal
    document.getElementById('modalNuevaCompra').classList.add('activo');
};

window.cerrarModalNuevaCompra = function() {
    document.getElementById('modalNuevaCompra').classList.remove('activo');
};

// ── Agregar producto a la lista temporal ─────────────────────

window.ncAgregarProducto = function() {
    const errorEl = document.getElementById('nc_error_prod');
    errorEl.textContent = '';

    const prodId   = document.getElementById('nc_prod_id').value.trim();
    const nombre   = document.getElementById('nc_prod_nombre').value.trim();
    const cantidad = parseFloat(document.getElementById('nc_prod_cantidad').value);
    const precio   = parseFloat(document.getElementById('nc_prod_precio').value);

    // Validaciones
    if (!prodId) {
        errorEl.textContent = 'Ingresa el ID del producto.';
        return;
    }
    if (!nombre) {
        errorEl.textContent = 'Ingresa el nombre del producto.';
        return;
    }
    if (!cantidad || cantidad <= 0) {
        errorEl.textContent = 'La cantidad debe ser mayor a 0.';
        return;
    }
    if (isNaN(precio) || precio < 0) {
        errorEl.textContent = 'Ingresa un precio válido.';
        return;
    }

    // Verificar duplicado por ID de producto
    const yaExiste = ncProductosTemp.find(p => String(p.prodId) === String(prodId));
    if (yaExiste) {
        errorEl.textContent = `El producto ID ${prodId} ya está en la lista. Quítalo primero si quieres modificarlo.`;
        return;
    }

    const subtotal = cantidad * precio;
    ncContadorFila++;

    ncProductosTemp.push({
        _key:     ncContadorFila,
        prodId:   parseInt(prodId),
        nombre:   nombre,
        cantidad: cantidad,
        precio:   precio,
        subtotal: subtotal,
    });

    // Limpiar campos del producto
    ['nc_prod_id','nc_prod_nombre','nc_prod_cantidad','nc_prod_precio'].forEach(id => {
        document.getElementById(id).value = '';
    });

    // Foco de vuelta al primer campo de producto
    document.getElementById('nc_prod_id').focus();

    ncRedibujarTabla();
};

// ── Quitar un producto de la lista temporal ───────────────────

window.ncQuitarProducto = function(key) {
    ncProductosTemp = ncProductosTemp.filter(p => p._key !== key);
    ncRedibujarTabla();
};

// ── Anular: limpia todo y cierra ─────────────────────────────

window.anularNuevaCompra = function() {
    const confirmar = window.confirm('¿Seguro que deseas anular esta compra?\nSe perderán todos los datos ingresados.');
    if (!confirmar) return;

    ncProductosTemp = [];
    ncContadorFila = 0;
    cerrarModalNuevaCompra();
};

// ── Guardar: envía cabecera + detalles a la API ───────────────

window.guardarNuevaCompra = async function() {
    const errorEl = document.getElementById('nc_error_compra');
    errorEl.textContent = '';

    // Leer campos de cabecera
    const numCompra  = document.getElementById('nc_numero').value.trim();
    const fecha      = document.getElementById('nc_fecha').value;
    const provId     = document.getElementById('nc_proveedor').value.trim();
    const condId     = document.getElementById('nc_condicion').value.trim();
    const estId      = document.getElementById('nc_estado').value.trim();

    // Validaciones de cabecera
    if (!numCompra || !fecha || !provId || !condId || !estId) {
        errorEl.textContent = 'Completa todos los datos de la compra antes de guardar.';
        return;
    }
    if (ncProductosTemp.length === 0) {
        errorEl.textContent = 'Agrega al menos un producto antes de guardar.';
        return;
    }

    // Calcular total desde los productos temporales
    const total = ncProductosTemp.reduce((acc, p) => acc + p.subtotal, 0);

    // ── Paso 1: Crear la compra (cabecera) ──
    const bodyCompra = JSON.stringify({
        NumCompra:      parseInt(numCompra),
        Fecha:          fecha,
        ProveedoresId:  parseInt(provId),
        Total:          total,
        condicionId:    parseInt(condId),
        estadoCuentaId: parseInt(estId),
    });

    let compraCreada;
    try {
        const respCompra = await fetchConAutenticacion('movimiento/compras/', {
            method: 'POST',
            body:   bodyCompra,
        });

        if (!respCompra.ok) {
            const err = await respCompra.json();
            errorEl.textContent = 'Error al guardar la compra: ' + JSON.stringify(err);
            return;
        }
        compraCreada = await respCompra.json();
    } catch (e) {
        errorEl.textContent = 'Error de conexión al guardar la compra.';
        console.error(e);
        return;
    }

    // ── Paso 2: Crear cada detalle vinculado a la compra ──
    const erroresDetalle = [];

    for (const p of ncProductosTemp) {
        const bodyDetalle = JSON.stringify({
            CompraId:        compraCreada.id,
            detallProductoId: p.prodId,
            Cantidad:        p.cantidad,
            PrecioUnitario:  p.precio,
            Subtotal:        p.subtotal,
        });

        try {
            const respDet = await fetchConAutenticacion('movimiento/compras/detalles/', {
                method: 'POST',
                body:   bodyDetalle,
            });
            if (!respDet.ok) {
                const err = await respDet.json();
                erroresDetalle.push(`Producto ${p.prodId}: ${JSON.stringify(err)}`);
            }
        } catch (e) {
            erroresDetalle.push(`Producto ${p.prodId}: error de red.`);
            console.error(e);
        }
    }

    // ── Resultado ──
    if (erroresDetalle.length > 0) {
        // La cabecera se guardó pero algunos detalles fallaron
        alert(
            `⚠ La compra N° ${numCompra} se guardó, pero algunos productos tuvieron errores:\n` +
            erroresDetalle.join('\n')
        );
    } else {
        alert(`✅ Compra N° ${numCompra} guardada correctamente con ${ncProductosTemp.length} producto(s).`);
    }

    cerrarModalNuevaCompra();
    cargarCompras();   // Refresca el historial de compras
};


(function inyectarEstilosNuevaCompra() {
    const style = document.createElement('style');
    style.textContent = `
        /* Modal ancho para nueva compra */
        .modal-compra-grande {
            width: min(900px, 96vw);
            max-height: 92vh;
            display: flex;
            flex-direction: column;
        }
        .modal-body-compra {
            overflow-y: auto;
            flex: 1;
            padding: 16px 20px;
            display: flex;
            flex-direction: column;
            gap: 18px;
        }

        /* Fieldsets */
        .compra-fieldset {
            border: 1px solid rgba(99,102,241,0.2);
            border-radius: 10px;
            padding: 14px 16px 10px;
            background: rgba(30,32,60,0.35);
        }
        .compra-fieldset legend {
            font-size: 0.82rem;
            font-weight: 600;
            color: #a5b4fc;
            letter-spacing: 0.06em;
            text-transform: uppercase;
            padding: 0 6px;
        }

        /* Grid de campos */
        .compra-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
            gap: 14px 18px;
            margin-top: 10px;
        }
        .compra-grid-producto {
            align-items: end;
        }

        /* Botón + Agregar alineado al fondo */
        .btn-agregar-wrap {
            display: flex;
            align-items: flex-end;
            padding-bottom: 2px;
        }
        .btn-agregar-wrap .btn {
            white-space: nowrap;
            width: 100%;
        }

        /* Fila de total en tfoot */
        .nc-total-row {
            background: rgb(16, 104, 96);
            border-top: 2px solid rgba(15,118,110,0.4);
        }

        /* Botón peligro (anular) */
        .btn-peligro {
            background: rgba(220,38,38,0.15);
            color: #f87171;
            border: 1px solid rgba(220,38,38,0.35);
            padding: 8px 18px;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            transition: background 0.2s;
        }
        .btn-peligro:hover {
            background: rgba(220,38,38,0.3);
        }

        /* Activar label de fecha (siempre visible) */
        .lbl-activo span {
            transform: translateY(-120%) scale(0.82);
            color: blue;
        }
    `;
    document.head.appendChild(style);
})();

// ==========================================
// LÓGICA DE INVENTARIO (Registro_Producto)
// ==========================================


let inventarioID = null;

// ------------------------------------------
// Cargar DetalleProductos en el <select> del modal
// ------------------------------------------
async function cargarDetallesParaSelect() {
  try {
    const respuesta = await fetchConAutenticacion('movimiento/productos/destalle/');
    const datos = await respuesta.json();
    const lista = Array.isArray(datos) ? datos : datos.results;

    const select = document.getElementById('invDetalleProducto');
    // Limpiar opciones anteriores excepto el placeholder
    select.innerHTML = '<option value="">-- Seleccione un producto --</option>';

    lista.forEach(det => {
      // El serializer devuelve los IDs de FK; mostramos la representación disponible
      // Si el backend expande el __str__ usa det.label o det.toString
      const textoOpcion = det.producto_nombre
        ? `${det.producto_nombre} | Marca: ${det.marca_nombre} | Moto: ${det.moto_modelo}`
        : `ID ${det.id} — Producto: ${det.producto} | Marca: ${det.MarcaId} | Moto: ${det.MotoId}`;
       // option.textContent =`${f.producto_nombre}-marca: ${f.marca_nombre}-modelo: ${f.moto_modelo}`;

      const option = document.createElement('option');
      option.value = det.id;
      option.textContent = textoOpcion;
      select.appendChild(option);
    });
  } catch (error) {
    console.error('Error al cargar detalles de producto:', error);
  }
}


// ------------------------------------------
// Cargar historial de inventario en la tabla
// ------------------------------------------
export async function cargarInventario() {
  const cargando = document.getElementById('cargandoInventario');
  const tabla    = document.getElementById('tablaInventario');
  const tbody    = document.getElementById('bodyInventario');

  cargando.style.display = 'block';
  tabla.classList.remove('visible');

  try {
    const respuesta = await fetchConAutenticacion('movimiento/productos/inventarioLote/');
    const datos = await respuesta.json();
    const lista = Array.isArray(datos) ? datos : datos.results;

    let filas = '';

    for (let i = 0; i < lista.length; i++) {
      const reg = lista[i];

      // Formatear fecha legible
      const fecha = reg.FechaRegistro
        ? new Date(reg.FechaRegistro).toLocaleString('es-EC', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
          })
        : '—';

      filas += '<tr>';
      filas += `<td>${i + 1}</td>`;
      filas += `<td>${reg.nombreProducto ?? '—'}| marca: ${reg.nombreMarca }| moto: ${reg.nombreMoto}</td>`;
      filas += `<td>${reg.Cantidad}</td>`;
      filas += `<td>C$${parseFloat(reg.precioCompra).toFixed(2)}</td>`;
      filas += `<td>C$${parseFloat(reg.PrecioVenta).toFixed(2)}</td>`;
      filas += `<td>${fecha}</td>`;
      filas += '<td class="td-acciones">';
      filas += `<button class="btn-accion btn-editar" onclick="abrirModalInventario('editar', ${reg.id}, ${reg.detalleProductoId}, ${reg.Cantidad}, ${reg.precioCompra}, ${reg.PrecioVenta})">✏ Editar</button>`;
      filas += `<button class="btn-accion btn-eliminar" onclick="eliminarInventario(${reg.id})">🗑 Eliminar</button>`;
      filas += '</td>';
      filas += '</tr>';
    }

    tbody.innerHTML = filas || '<tr><td colspan="7" style="text-align:center">Sin registros</td></tr>';
    cargando.style.display = 'none';
    tabla.classList.add('visible');
    activarBuscadorGlobal('buscarInventario','#bodyInventario tr')

  } catch (error) {
    cargando.textContent = '⚠ Error al conectar con la API. ¿Está corriendo el servidor Django?';
    console.error('Error en cargarInventario:', error);
  }
}

// ------------------------------------------
// Abrir modal (crear o editar)
// ------------------------------------------
window.abrirModalInventario = async function(modo, id = null, detalleId = '', cantidad = '', precioCompra = '', precioVenta = '') {
  inventarioID = id;

  document.getElementById('modalTextInventario').textContent =
    modo === 'crear' ? 'Nuevo Registro de Inventario' : 'Editar Registro de Inventario';

  // Cargar el select de productos siempre al abrir
  await cargarDetallesParaSelect();

  // Pre-llenar si es edición
  document.getElementById('invDetalleProducto').value = detalleId;
  document.getElementById('invCantidad').value        = cantidad;
  document.getElementById('invPrecioCompra').value    = precioCompra;
  document.getElementById('invPrecioVenta').value     = precioVenta;
  document.getElementById('errorInventario').textContent = '';

  document.getElementById('modalInventario').classList.add('activo');
};

// ------------------------------------------
// Cerrar modal
// ------------------------------------------
window.cerrarModalInventario = function(idModal) {
  document.getElementById('invDetalleProducto').value = '';
  document.getElementById('invCantidad').value        = '';
  document.getElementById('invPrecioCompra').value    = '';
  document.getElementById('invPrecioVenta').value     = '';
  document.getElementById('errorInventario').textContent = '';
  inventarioID = null;
  document.getElementById(idModal).classList.remove('activo');
};

// ------------------------------------------
// Guardar (crear o editar)
// ------------------------------------------
window.guardarInventario = async function() {
  const errorEl      = document.getElementById('errorInventario');
  const detalleId    = document.getElementById('invDetalleProducto').value;
  const cantidad     = document.getElementById('invCantidad').value.trim();
  const precioCompra = document.getElementById('invPrecioCompra').value.trim();
  const precioVenta  = document.getElementById('invPrecioVenta').value.trim();

  // Validación básica
  if (!detalleId || !cantidad || !precioCompra || !precioVenta) {
    errorEl.textContent = 'Por favor, completa todos los campos.';
    return;
  }

  const payload = {
    detalleProductoId: parseInt(detalleId),
    Cantidad:          parseInt(cantidad),
    precioCompra:      parseFloat(precioCompra),
    PrecioVenta:       parseFloat(precioVenta),
  };

  try {
    let respuesta;

    if (inventarioID) {
      // EDITAR — PATCH
      respuesta = await fetchConAutenticacion(`movimiento/productos/inventarioLote/${inventarioID}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } else {
      // CREAR — POST
      respuesta = await fetchConAutenticacion('movimiento/productos/inventarioLote/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    }

    if (respuesta.ok) {
      cerrarModalInventario('modalInventario');
      cargarInventario();
    } else {
      const err = await respuesta.json();
      errorEl.textContent = 'Error: ' + JSON.stringify(err);
    }
  } catch (error) {
    errorEl.textContent = 'Error de conexión con la API.';
    console.error('Error en guardarInventario:', error);
  }
};

// ------------------------------------------
// Eliminar (lógico)
// ------------------------------------------
window.eliminarInventario = async function(id) {
  const confirmar = window.confirm('¿Estás seguro de que deseas eliminar este registro de inventario?');
  if (!confirmar) return;

  try {
    const respuesta = await fetchConAutenticacion(`movimiento/productos/inventarioLote/${id}`, {
      method: 'DELETE',
    });

    if (respuesta.status === 204 || respuesta.ok) {
      cargarInventario();
    } else {
      alert('No se pudo eliminar. Código: ' + respuesta.status);
    }
  } catch (error) {
    alert('Error de conexión con la API.');
    console.error('Error en eliminarInventario:', error);
  }
};

// Ejecutar al cargar la página
cargarInventario();
// Ejecutar
cargarClientes();
cargarEmpleados();
cargarFactura();
cargarCaja();
cargarCompras();


