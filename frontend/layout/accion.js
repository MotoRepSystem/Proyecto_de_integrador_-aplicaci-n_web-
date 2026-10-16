const urlAPI = "https://motorepweb-api-h3ahb3c6hgfebpa6.centralus-01.azurewebsites.net/";

//const urlAPI = "http://127.0.0.1:8000/";

import {
  registrarControlInactividad,
  logout,
  fetchConAutenticacion,
} from "../login/auth.js";

//registrarControlInactividad();
document.addEventListener("DOMContentLoaded", () => {
  registrarControlInactividad();
});

//impot

const navLinks = document.querySelectorAll(".nav-link");
const secciones = document.querySelectorAll(".seccion");
const tituloTop = document.getElementById("topbarTitulo");
const btneditar = document.getElementById("btnEditar");

//material para agregar clientes
//const btnAgregarCliente = document.getElementById('btnGuardar');

navLinks.forEach(function (link) {
  link.addEventListener("click", function (e) {
    e.preventDefault();

    // Leer qué sección abrir
    const nombreSeccion = link.dataset.section;

    // Quitar clase activo de todos los links
    navLinks.forEach(function (l) {
      l.classList.remove("activo");
    });

    // Poner clase activo al link clickeado
    link.classList.add("activo");

    // Ocultar todas las secciones
    secciones.forEach(function (s) {
      s.classList.remove("activa");
    });

    // Mostrar la sección correspondiente
    document.getElementById(nombreSeccion).classList.add("activa");

    // Actualizar el título de la barra superior
    tituloTop.textContent = link.textContent;
  });
});

window.openPaymentDrawer = function () {
  let errorEl = document.getElementById("errorfactura");
  if (errorEl) errorEl.textContent = "";

  const numFactura = document.getElementById("facturaNumero").value.trim();
  const clienteId = document.getElementById("facturaCliente").value;
  const condicionId = document.getElementById("facturaCondicion").value; // 1: Contado, 2: Crédito

  if (!numFactura || !clienteId || !condicionId) {
    if (errorEl)
      errorEl.textContent = "⚠️ Por favor, llena todos los campos principales.";
    return;
  }

  if (ncFacturaProductosTemp.length === 0) {
    alert("⚠️ Agrega al menos un producto a la lista.");
    return;
  }
  // 1. Obtener el texto del elemento <td> (usando textContent)
  const valorTotal =
    document.getElementById("facTotal")?.textContent || "C$ 0.00";

  // 2. Corregir la sintaxis de getElementById (sin la 'I' al final)
  const textValor = document.getElementById("textTotalMovimentoPagoFactura");

  // 3. Asignar el texto en el panel lateral de pago
  if (textValor) {
    textValor.textContent = valorTotal;
  }

  // 4. Abrir el drawer lateral
  const drawer = document.getElementById("paymentDrawer");
  if (drawer) {
    drawer.classList.add("open");
  }
};
window.closePaymentDrawer = function () {
  document.getElementById("paymentDrawer").classList.remove("open");
};
window.FacturaCreditoField = function () {
  const condicion = document.getElementById("facturaCondicion").value;
  const fieldFecha = document.getElementById("facturaFechaLimite");

  console.log(typeof condicion);

  console.log(`valor ${condicion}`);
  if (condicion == 2) {
    fieldFecha.style.display = "flex";
  } else {
    fieldFecha.style.display = "none";
  }
};
// ==========================================
// LOGICA DE cerrar sesion
// ==========================================

const btnCerraSesion = document.getElementById("btnCerrarSesion");

if (btnCerraSesion) {
  btnCerraSesion.addEventListener("click", (e) => {
    e.preventDefault(); //evita cualquier comportamiento por default

    const confirmar = confirm(
      "¿Estás seguro de que deseas cerrar la sesión actual?",
    );

    if (confirmar) {
      logout(); //si el usuario acepta ejecutamos la funcion
    }
  });
}

// ===== BUSCADOR GLOBAL =====

function activarBuscadorGlobal(idInput, selectorFilas) {
  const buscador = document.getElementById(idInput);

  if (!buscador) return;

  buscador.addEventListener("input", function () {
    const textoBusqueda = buscador.value.toLowerCase();
    const filas = document.querySelectorAll(selectorFilas);

    filas.forEach(function (fila) {
      const textoDeFila = fila.textContent.toLowerCase();

      if (textoDeFila.includes(textoBusqueda)) {
        fila.style.display = "";
      } else {
        fila.style.display = "none";
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
  const cargando = document.getElementById("cargandoCliente");
  const tabla = document.getElementById("tablaCliente");
  const tbody = document.getElementById("bodyCliente");

  //parametro para la funcion buscador global
  const buscadorCliente = document.getElementById("buscarCliente");

  cargando.style.display = "block";
  tabla.classList.remove("visible");

  try {
    // REEMPLAZO 1: Usamos tu función con autenticación automática.
    // Ojo: fetchConAutenticacion ya concatena urlAPI internamente según el diseño previo.
    let respuesta = await fetchConAutenticacion("catalogos/clientes/");
    const dato = await respuesta.json();

    const cliente = Array.isArray(dato) ? dato : dato.results;
    let filas = "";

    for (let i = 0; i < cliente.length; i++) {
      let cli = cliente[i];

      filas += "<tr>";
      filas += "<td> " + (i + 1) + " </td>";
      filas += "<td> " + cli.Nombres + " </td>";
      filas += "<td> " + cli.Apellidos + " </td>";
      filas += "<td> " + cli.NumCedula + " </td>";
      filas += "<td> " + cli.NumTeléfono + " </td>";

      // Botones editar y borrar
      filas += '<td class="td-acciones">';
      filas +=
        '<button class="btn-accion btn-editar" ' +
        `onclick="abrirModalCliente('editar', ${cli.id}, '${cli.Nombres}', '${cli.Apellidos}', '${cli.NumTeléfono}', '${cli.NumCedula}')">` +
        "✏ Editar" +
        "</button>";
      filas +=
        '<button class="btn-accion btn-eliminar" ' +
        `onclick="eliminarCliente(${cli.id}, '${cli.Nombres}', '${cli.Apellidos}')">` +
        "🗑 Eliminar" +
        "</button>";
      filas += " </td>";
      filas += "</tr>";
    }

    tbody.innerHTML = filas;
    cargando.style.display = "none";
    tabla.classList.add("visible");

    //activar
    activarBuscadorGlobal("buscarCliente", "#bodyCliente tr");
  } catch (error) {
    cargando.textContent =
      "⚠ Error al conectar con la API local. ¿Está corriendo el servidor Django?";
    console.error("Error en cargarClientes:", error);
  }
}

// modal cliente
window.abrirModalCliente = function (
  modo,
  id,
  nombre,
  apellido,
  telefono,
  numCedula,
) {
  document.getElementById("modalTextCliente").textContent =
    modo === "crear" ? "Nuevo cliente" : "Editar Cliente";

  document.getElementById("clienNombre").value = nombre || "";
  document.getElementById("clienApellidos").value = apellido || "";
  document.getElementById("clienTelefono").value = telefono || "";
  document.getElementById("clienCedula").value = numCedula || "";

  const errorEl = document.getElementById("error");
  if (errorEl) errorEl.textContent = "";

  clienteID = modo === "editar" ? id : null;
  document.getElementById("modalCliente").classList.add("activo");
};

window.cerrarModalCliente = function (idModal) {
  document.getElementById("clienNombre").value = "";
  document.getElementById("clienApellidos").value = "";
  document.getElementById("clienTelefono").value = "";
  document.getElementById("clienCedula").value = "";

  const errorEl = document.getElementById("error");
  if (errorEl) errorEl.textContent = "";

  document.getElementById(idModal).classList.remove("activo");
};

// ── POST / PUT: Guardar cliente ─────────────────────────────────────
window.guardarCliente = async function guardarCliente() {
  let nombre = document.getElementById("clienNombre").value.trim();
  let apellidos = document.getElementById("clienApellidos").value.trim();
  let telefono = document.getElementById("clienTelefono").value.trim();
  let cedula = document.getElementById("clienCedula").value.trim();
  let errorEl = document.getElementById("error");

  if (!nombre || !apellidos || !telefono || !cedula) {
    errorEl.textContent = "Todos los campos son obligatorios.";
    return;
  }

  let body = JSON.stringify({
    Nombres: nombre,
    Apellidos: apellidos,
    NumCedula: cedula,
    NumTeléfono: telefono,
  });

  let metodo = clienteID === null ? "POST" : "PATCH";
  // Pasamos solo la ruta relativa porque fetchConAutenticacion le pega la urlAPI
  let url =
    clienteID === null
      ? "catalogos/clientes/"
      : "catalogos/clientes/" + clienteID;

  try {
    // REEMPLAZO 2: Removimos la validación manual del token.
    // Tu función 'fetchConAutenticacion' inyectará el Header 'Authorization' automáticamente.
    let respuesta = await fetchConAutenticacion(url, {
      method: metodo,
      body: body,
    });

    if (respuesta.ok) {
      cerrarModalCliente("modalCliente");
      cargarClientes();
    } else {
      let errores = await respuesta.json();
      errorEl.textContent = JSON.stringify(errores);
    }
  } catch (error) {
    errorEl.textContent = "Error de conexión con la API.";
    console.error("Error en guardarCliente:", error);
  }
};

// BORRAR CLIENTE
window.eliminarCliente = async function (id, nombre, apellido) {
  let confirmar = window.confirm(
    `Seguro que quieres eliminar al cliente ${nombre} ${apellido}`,
  );
  if (!confirmar) return;

  try {
    // REEMPLAZO 3: Petición DELETE limpia usando tu interceptor automático
    let url = "catalogos/clientes/" + id;
    let respuesta = await fetchConAutenticacion(url, {
      method: "DELETE",
    });

    if (respuesta.status === 204 || respuesta.ok) {
      cargarClientes();
    } else {
      alert("No se pudo eliminar. Código: " + respuesta.status);
    }
  } catch (error) {
    alert("Error de conexión con la API.");
    console.error("Error en eliminarCliente:", error);
  }
};

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
  const cargando = document.getElementById("cargandoEmpleado");
  const tabla = document.getElementById("tablaEmpleado");
  const tbody = document.getElementById("bodyEmpleado");

  cargando.style.display = "block";
  tabla.classList.remove("visible");

  try {
    // Usamos tu función con autenticación automática.
    // fetchConAutenticacion ya concatena urlAPI internamente según el diseño previo.
    let respuesta = await fetchConAutenticacion("catalogos/empleados/");
    const dato = await respuesta.json();

    const empleado = Array.isArray(dato) ? dato : dato.results;
    let filas = "";

    for (let i = 0; i < empleado.length; i++) {
      let emp = empleado[i];

      filas += "<tr>";
      filas += "<td> " + (i + 1) + " </td>";
      filas += "<td> " + emp.Nombres + " </td>";
      filas += "<td> " + emp.Apellidos + " </td>";
      filas += "<td> " + emp.Telefono + " </td>";
      filas += "<td> " + emp.NumCedula + " </td>";

      // Botones editar y borrar
      filas += '<td class="td-acciones">';
      filas +=
        '<button class="btn-accion btn-editar" ' +
        `onclick="abrirModalEmpleado('editar', ${emp.id}, '${emp.Nombres}', '${emp.Apellidos}', '${emp.Telefono}', '${emp.NumCedula}')">` +
        "✏ Editar" +
        "</button>";
      filas +=
        '<button class="btn-accion btn-eliminar" ' +
        `onclick="eliminarEmpleado(${emp.id}, '${emp.Nombres}', '${emp.Apellidos}')">` +
        "🗑 Eliminar" +
        "</button>";
      filas += " </td>";
      filas += "</tr>";
    }

    tbody.innerHTML = filas;
    cargando.style.display = "none";
    tabla.classList.add("visible");

    //activar
    activarBuscadorGlobal("buscarEmpleado", "#bodyEmpleado tr");
  } catch (error) {
    cargando.textContent =
      "⚠ Error al conectar con la API local. ¿Está corriendo el servidor Django?";
    console.error("Error en cargarEmpleado:", error);
  }
}

// modal empleado
window.abrirModalEmpleado = function (
  modo,
  id,
  nombre,
  apellido,
  telefono,
  numCedula,
) {
  document.getElementById("modalTextEmpleado").textContent =
    modo === "crear" ? "Nuevo empleado" : "Editar Empleado";

  document.getElementById("empNombre").value = nombre || "";
  document.getElementById("empApellidos").value = apellido || "";
  document.getElementById("empTelefono").value = telefono || "";
  document.getElementById("empCedula").value = numCedula || "";

  const errorEl = document.getElementById("error");
  if (errorEl) errorEl.textContent = "";

  empleadoID = modo === "editar" ? id : null;
  document.getElementById("modalEmpleado").classList.add("activo");
};

window.cerrarModal = function (idModal) {
  document.getElementById("empNombre").value = "";
  document.getElementById("empApellidos").value = "";
  document.getElementById("empTelefono").value = "";
  document.getElementById("empCedula").value = "";

  const errorEl = document.getElementById("error");
  if (errorEl) errorEl.textContent = "";

  document.getElementById(idModal).classList.remove("activo");
};

// ── POST / PUT: Guardar empleado ─────────────────────────────────────
window.guardarEmpleado = async function guardarEmpleado() {
  let nombre = document.getElementById("empNombre").value.trim();
  let apellidos = document.getElementById("empApellidos").value.trim();
  let telefono = document.getElementById("empTelefono").value.trim();
  let cedula = document.getElementById("empCedula").value.trim();
  let errorEl = document.getElementById("error");

  if (!nombre || !apellidos || !telefono || !cedula) {
    errorEl.textContent = "Todos los campos son obligatorios.";
    return;
  }

  let body = JSON.stringify({
    Nombres: nombre,
    Apellidos: apellidos,
    Telefono: telefono,
    NumCedula: cedula,
  });

  let metodo = empleadoID === null ? "POST" : "PATCH";
  // Pasamos solo la ruta relativa porque fetchConAutenticacion le pega la urlAPI
  let url =
    empleadoID === null
      ? "catalogos/empleados/"
      : "catalogos/empleados/" + empleadoID;

  try {
    //la función 'fetchConAutenticacion' inyectará el Header 'Authorization' automáticamente.
    let respuesta = await fetchConAutenticacion(url, {
      method: metodo,
      body: body,
    });

    if (respuesta.ok) {
      cerrarModal("modalEmpleado");
      cargarEmpleados();
    } else {
      let errores = await respuesta.json();
      errorEl.textContent = JSON.stringify(errores);
    }
  } catch (error) {
    errorEl.textContent = "Error de conexión con la API.";
    console.error("Error en guardarEmpleado:", error);
  }
};

// BORRAR EMPLEADO
window.eliminarEmpleado = async function (id, nombre, apellido) {
  let confirmar = window.confirm(
    `Seguro que quieres eliminar al empleado ${nombre} ${apellido}`,
  );
  if (!confirmar) return;

  try {
    let url = "catalogos/empleados/" + id;
    let respuesta = await fetchConAutenticacion(url, {
      method: "DELETE",
    });

    if (respuesta.status === 204 || respuesta.ok) {
      cargarEmpleados();
    } else {
      alert("No se pudo eliminar. Código: " + respuesta.status);
    }
  } catch (error) {
    alert("Error de conexión con la API.");
    console.error("Error en eliminarEmpleado:", error);
  }
};

/* ==========================================
   FRONTEND DE INCIDENCIAS - MOTOREP
========================================== */


document.addEventListener("DOMContentLoaded", () => {
  const formulario = document.getElementById("formIncidencia");

  // Evitar errores si el script se carga en otras pantallas.
  if (!formulario) return;

  // ==========================================
  // 1. REFERENCIAS A LOS ELEMENTOS DEL HTML
  // ==========================================

  const origen = document.getElementById("incOrigen");
  const referencia = document.getElementById("incReferencia");
  const referenciaGrupo = document.getElementById("incReferenciaGrupo");
  const referenciaAyuda = document.getElementById("incReferenciaAyuda");
  const referenciaLabel = document.getElementById("incReferenciaLabel");
  const referenciaTexto = document.getElementById("incReferenciaTexto");

  const fecha = document.getElementById("incFecha");
  const archivo = document.getElementById("incEvidencia");
  const archivoSeleccionado = document.getElementById("incArchivoSeleccionado");

  const categoria = document.getElementById("incCategoria");
  const monto = document.getElementById("incMonto");
  const descripcion = document.getElementById("incDescripcion");
  const tipo = document.getElementById("incTipo");
  const prioridad = document.getElementById("incPrioridad");
  const campoEmpleado = document.getElementById("incEmpleado");

  const errorIncidencia = document.getElementById("incError");
  const mensajeIncidencia = document.getElementById("incMensaje");

  /* =========================================
   MODAL DE CONFIRMACIÓN Y RESULTADO
========================================= */

  const modalIncidencia = document.getElementById("incModal");
  const modalTitulo = document.getElementById("incModalTitulo");
  const modalTexto = document.getElementById("incModalTexto");
  const modalIcono = document.getElementById("incModalIcono");
  const modalAceptar = document.getElementById("incModalAceptar");
  const modalCancelar = document.getElementById("incModalCancelar");

    let resolverModalIncidencia = null;

    function mostrarModalIncidencia({
      titulo,
      mensaje,
      tipo = "confirmacion",
      textoAceptar = "Sí, registrar",
      textoCancelar = "Cancelar",
      mostrarCancelar = true,
    }) {
      // Si existe una promesa pendiente, no abrir otro modal.
      if (!modalIncidencia || resolverModalIncidencia) {
        return Promise.resolve(false);
      }

      modalTitulo.textContent = titulo;
      modalTexto.textContent = mensaje;

      modalAceptar.textContent = textoAceptar;
      modalCancelar.textContent = textoCancelar;

      modalCancelar.hidden = !mostrarCancelar;
      modalIcono.className = "inc-modal-icono";
      modalAceptar.classList.remove("exito");

      if (tipo === "exito") {
        modalIcono.classList.add("exito");
        modalIcono.innerHTML =
          '<ion-icon name="checkmark-circle-outline"></ion-icon>';

        modalAceptar.classList.add("exito");
      } else if (tipo === "error") {
        modalIcono.classList.add("error");
        modalIcono.innerHTML =
          '<ion-icon name="close-circle-outline"></ion-icon>';
      } else {
        modalIcono.innerHTML = '<ion-icon name="help-circle-outline"></ion-icon>';
      }

      modalIncidencia.hidden = false;
      modalIncidencia.setAttribute("aria-hidden", "false");
      modalAceptar.disabled = false;
      modalCancelar.disabled = false;

      modalAceptar.focus();

      return new Promise((resolver) => {
        resolverModalIncidencia = resolver;
      });
    }

    function cerrarModalIncidencia(resultado = false) {
      if (!modalIncidencia || !resolverModalIncidencia) {
        return;
      }

      const resolver = resolverModalIncidencia;
      resolverModalIncidencia = null;

      modalIncidencia.hidden = true;
      modalIncidencia.setAttribute("aria-hidden", "true");

      resolver(resultado);
    }

    // Registrar los eventos una sola vez.
    modalAceptar.addEventListener("click", () => {
      cerrarModalIncidencia(true);
    });

    modalCancelar.addEventListener("click", () => {
      cerrarModalIncidencia(false);
    });

    // Cerrar al pulsar fuera del cuadro solo si no se está enviando.
    // Estado para impedir solicitudes duplicadas.
  let enviandoIncidencia = false;

  // Registrar los eventos del modal únicamente si existe en el HTML.
  if (
    modalIncidencia &&
    modalTitulo &&
    modalTexto &&
    modalIcono &&
    modalAceptar &&
    modalCancelar
  ) {
    const fondoModal = modalIncidencia.querySelector("[data-cerrar-modal]");

    modalAceptar.addEventListener("click", () => {
      cerrarModalIncidencia(true);
    });

    modalCancelar.addEventListener("click", () => {
      if (!enviandoIncidencia) {
        cerrarModalIncidencia(false);
      }
    });

    if (fondoModal) {
      fondoModal.addEventListener("click", () => {
        if (!enviandoIncidencia) {
          cerrarModalIncidencia(false);
        }
      });
    }
  }

  // ==========================================
  // 2. ESTADO DEL FORMULARIO
  // ==========================================

  // Evita que una respuesta antigua sobrescriba
  // la selección de origen más reciente.
  let solicitudOrigenActual = 0;

  // Empleado asociado a la cuenta autenticada.
  let empleadoResponsableId = null;

  // ==========================================
  // 3. FECHA ACTUAL
  // ==========================================

  function establecerFechaActual() {
    const ahora = new Date();

    const zonaLocal = new Date(
      ahora.getTime() - ahora.getTimezoneOffset() * 60000,
    );

    fecha.value = zonaLocal.toISOString().slice(0, 16);
  }

  // ==========================================
  // 4. CARGAR USUARIO RESPONSABLE
  // ==========================================

  async function cargarUsuarioResponsable() {
    if (!campoEmpleado) return;

    empleadoResponsableId = null;
    campoEmpleado.value = "";
    campoEmpleado.placeholder = "Cargando usuario...";

    try {
      const respuesta = await fetchConAutenticacion(
        "seguridad/usuarios/perfil/",
      );

      if (!respuesta.ok) {
        throw new Error(
          `Error al consultar el perfil: HTTP ${respuesta.status}`,
        );
      }

      const usuario = await respuesta.json();

      // El usuario debe tener un empleado asociado.
      if (usuario.empleado_id == null) {
        campoEmpleado.placeholder = "Usuario sin empleado asociado";
        return;
      }

      const idEmpleado = Number(usuario.empleado_id);

      if (!Number.isInteger(idEmpleado) || idEmpleado <= 0) {
        throw new Error("El ID del empleado no es válido.");
      }

      empleadoResponsableId = idEmpleado;

      if (usuario.empleado_nombre) {
        campoEmpleado.value = `${usuario.empleado_nombre} (${usuario.username})`;
      } else {
        campoEmpleado.value = usuario.username || "";
      }
    } catch (error) {
      empleadoResponsableId = null;
      campoEmpleado.value = "";
      campoEmpleado.placeholder = "No se pudo cargar el usuario";

      console.error("Error al cargar el usuario:", error);
    }
  }

  // ==========================================
  // 5. CONFIGURACIÓN DE LOS ORÍGENES
  // ==========================================

  const configuracionOrigenIncidencia = {
    cliente: {
      url: "catalogos/clientes/",
      etiqueta: "Seleccionar cliente *",
      ayuda: "Selecciona el cliente relacionado.",
      texto: (cliente) => `${cliente.Nombres} - Cédula: ${cliente.NumCedula}`,
    },

    empleado: {
      url: "catalogos/empleados",
      etiqueta: "Seleccionar empleado *",
      ayuda: "Selecciona el empleado relacionado.",
      texto: (empleado) => `${empleado.Nombres} ${empleado.Apellidos}`,
    },

    proveedor: {
      url: "catalogos/proveedor/",
      etiqueta: "Seleccionar proveedor *",
      ayuda: "Selecciona al proveedor relacionado.",
      texto: (proveedor) => `${proveedor.Nombre}`,
    },
  };

  // ==========================================
  // 6. ACTUALIZAR CAMPOS SEGÚN EL ORIGEN
  // ==========================================

  function actualizarReferenciaInterna() {
    const esInterno = origen.value === "interno";

    referencia.hidden = esInterno;
    referenciaTexto.hidden = !esInterno;

    // La referencia de origen interno es texto libre.
    referenciaTexto.required = esInterno;
    referencia.required = false;

    if (esInterno) {
      referencia.disabled = true;
      referencia.removeAttribute("name");

      referenciaTexto.disabled = false;
      referenciaTexto.name = "incReferenciaTexto";
    } else {
      // Se habilitará cuando termine la carga del catálogo.
      referencia.disabled = true;
      referencia.name = "incReferencia";

      referenciaTexto.value = "";
      referenciaTexto.disabled = true;
      referenciaTexto.removeAttribute("name");
      referenciaTexto.setCustomValidity("");
    }
  }

  // ==========================================
  // 7. REGLA DEL MONTO SEGÚN LA CATEGORÍA
  // ==========================================

  function actualizarReglaMonto() {
    const opcion = categoria.selectedOptions[0];

    const requiereMonto = opcion?.dataset.requiereMonto === "true";

    monto.required = requiereMonto;

    if (!requiereMonto) {
      monto.setCustomValidity("");
    }
  }

  // ==========================================
  // 8. LLENAR EL SELECT DE REFERENCIAS
  // ==========================================

  function llenarSelectIncidencia(select, registros, obtenerTexto) {
    select.replaceChildren();

    const opcionInicial = document.createElement("option");
    opcionInicial.value = "";
    opcionInicial.textContent = "-- Seleccione --";

    select.appendChild(opcionInicial);

    registros.forEach((registro) => {
      const opcion = document.createElement("option");

      opcion.value = registro.id;
      opcion.textContent = obtenerTexto(registro);

      select.appendChild(opcion);
    });

    select.disabled = false;
  }

  // ==========================================
  // 9. CARGAR EL CATÁLOGO DEL ORIGEN
  // ==========================================

  async function actualizarOrigen() {
    const solicitudActual = ++solicitudOrigenActual;
    const origenSeleccionado = origen.value;

    const configuracion = configuracionOrigenIncidencia[origenSeleccionado];

    actualizarReferenciaInterna();

    referenciaGrupo.hidden = !origenSeleccionado;
    referencia.required = false;
    referencia.disabled = true;
    referencia.replaceChildren();

    errorIncidencia.textContent = "";
    mensajeIncidencia.textContent = "";

    referenciaLabel.textContent =
      configuracion?.etiqueta ||
      (origenSeleccionado === "interno"
        ? "Referencia interna *"
        : "Seleccionar referencia");

    referenciaAyuda.textContent =
      configuracion?.ayuda ||
      (origenSeleccionado === "interno"
        ? "Escribe una referencia que identifique la incidencia."
        : "Selecciona el origen de la incidencia.");

    // No se ha seleccionado ningún origen.
    if (!origenSeleccionado) {
      referencia.innerHTML =
        '<option value="">Seleccione primero el origen</option>';

      return;
    }

    // El origen interno no necesita consultar catálogos.
    if (origenSeleccionado === "interno") {
      referencia.innerHTML =
        '<option value="">-- Sin referencia externa --</option>';

      return;
    }

    // No intentar consultar una ruta inexistente.
    if (!configuracion) {
      referencia.innerHTML =
        '<option value="">Origen pendiente de configurar</option>';

      errorIncidencia.textContent =
        "Todavía no se ha configurado la carga de este origen.";

      return;
    }

    referencia.required = true;

    referencia.innerHTML = '<option value="">Cargando registros...</option>';

    try {
      const respuesta = await fetchConAutenticacion(configuracion.url);

      if (!respuesta.ok) {
        throw new Error(`Error HTTP ${respuesta.status}`);
      }

      const datos = await respuesta.json();

      // Admite respuestas en formato lista o paginadas.
      const registros = Array.isArray(datos) ? datos : datos.results;

      if (!Array.isArray(registros)) {
        throw new Error("La API no devolvió una lista válida.");
      }

      // Ignorar solicitudes que ya quedaron obsoletas.
      if (
        solicitudActual !== solicitudOrigenActual ||
        origen.value !== origenSeleccionado
      ) {
        return;
      }

      llenarSelectIncidencia(referencia, registros, configuracion.texto);

      if (registros.length === 0) {
        referencia.innerHTML =
          '<option value="">No hay registros disponibles</option>';

        referencia.disabled = true;
      }
    } catch (error) {
      if (solicitudActual !== solicitudOrigenActual) {
        return;
      }

      console.error("Error cargando origen de incidencia:", error);

      referencia.innerHTML =
        '<option value="">No se pudieron cargar los registros</option>';

      referencia.disabled = true;

      errorIncidencia.textContent =
        "No fue posible cargar los registros. " +
        "Comprueba la conexión e inténtalo nuevamente.";
    }
  }

  // ==========================================
  // 10. VALIDAR EL FORMULARIO
  // ==========================================

  function validarIncidencia() {
    errorIncidencia.textContent = "";
    mensajeIncidencia.textContent = "";

    // Limpiar errores anteriores antes de volver a validar.
    prioridad.setCustomValidity("");
    descripcion.setCustomValidity("");
    referenciaTexto.setCustomValidity("");
    monto.setCustomValidity("");

    actualizarReglaMonto();

    // Debe existir un empleado responsable.
    if (empleadoResponsableId == null) {
      errorIncidencia.textContent =
        "No se pudo identificar al empleado responsable. " +
        "Comprueba tu sesión e inténtalo nuevamente.";

      return false;
    }

    // Comprobar la prioridad: entero del 1 al 5.
    const valorPrioridad = prioridad.value.trim();
    const numeroPrioridad = Number(valorPrioridad);

    if (
      valorPrioridad === "" ||
      !Number.isInteger(numeroPrioridad) ||
      numeroPrioridad < 1 ||
      numeroPrioridad > 5
    ) {
      prioridad.setCustomValidity(
        "Selecciona una prioridad entera del 1 al 5.",
      );

      prioridad.reportValidity();
      prioridad.setCustomValidity("");

      return false;
    }

    // La descripción no puede estar vacía ni contener
    // únicamente espacios.
    if (!descripcion.value.trim()) {
      descripcion.setCustomValidity(
        "Escribe una descripción de la incidencia.",
      );

      descripcion.reportValidity();
      descripcion.setCustomValidity("");

      return false;
    }

    // Validar referencia interna o referencia de catálogo.
    if (origen.value === "interno") {
      if (!referenciaTexto.value.trim()) {
        referenciaTexto.setCustomValidity(
          "Escribe una referencia para la incidencia interna.",
        );

        referenciaTexto.reportValidity();
        referenciaTexto.setCustomValidity("");

        return false;
      }
    } else if (
      origen.value === "cliente" ||
      origen.value === "empleado" ||
      origen.value === "proveedor"
    ) {
      // Un select deshabilitado no bloquea por sí mismo
      // la validación nativa del formulario.
      if (referencia.disabled || !referencia.value) {
        errorIncidencia.textContent =
          "Selecciona una referencia válida para el origen elegido.";

        referenciaGrupo.hidden = false;

        if (!referencia.disabled) {
          referencia.reportValidity();
        }

        return false;
      }

      const idRelacionado = Number(referencia.value);

      if (!Number.isInteger(idRelacionado) || idRelacionado <= 0) {
        errorIncidencia.textContent =
          "El registro seleccionado no tiene un ID válido.";

        return false;
      }
    } else {
      errorIncidencia.textContent = "Selecciona un origen para la incidencia.";

      origen.reportValidity();

      return false;
    }

    // Comprobar que los campos obligatorios del HTML
    // también sean válidos.
    if (!formulario.checkValidity()) {
      formulario.reportValidity();
      return false;
    }

    // El monto es obligatorio solo para las categorías
    // configuradas con data-requiere-monto="true".
    const valorMonto = monto.value.trim();

    if (monto.required && valorMonto === "") {
      monto.setCustomValidity("El monto es obligatorio para esta categoría.");

      monto.reportValidity();
      monto.setCustomValidity("");

      return false;
    }

    // Si se introdujo un monto, debe ser finito y >= 0.
    if (valorMonto !== "") {
      const numeroMonto = Number(valorMonto);

      if (!Number.isFinite(numeroMonto) || numeroMonto < 0) {
        monto.setCustomValidity(
          "Introduce un monto numérico mayor o igual a cero.",
        );

        monto.reportValidity();
        monto.setCustomValidity("");

        return false;
      }
    }

    return true;
  }

  // ==========================================
  // 11. CONSTRUIR EL OBJETO DE LA INCIDENCIA
  // ==========================================

  function construirDatosIncidencia() {
    const origenSeleccionado = origen.value;

    const datosOrigen = {
      tipo: origenSeleccionado,
    };

    if (origenSeleccionado === "interno") {
      datosOrigen.referencia = referenciaTexto.value.trim();
    } else {
      const idRelacionado = Number(referencia.value);

      if (origenSeleccionado === "cliente") {
        datosOrigen.cliente_id = idRelacionado;
      } else if (origenSeleccionado === "empleado") {
        datosOrigen.empleado_id = idRelacionado;
      } else if (origenSeleccionado === "proveedor") {
        datosOrigen.proveedor_id = idRelacionado;
      }
    }

    const valorMonto = monto.value.trim();
    const archivoElegido = archivo.files[0];

    return {
      tipo_incidencia: tipo.value,
      fecha_registro: fecha.value,

      origen: datosOrigen,

      detalle_incidencia: {
        categoria_problema: categoria.value,
        descripcion: descripcion.value.trim(),
        monto_involucrado: valorMonto === "" ? null : Number(valorMonto),
      },

      gestion: {
        empleado_id: empleadoResponsableId,
        prioridad: Number(prioridad.value),
      },

      evidencia: archivoElegido
        ? {
            nombre: archivoElegido.name,
            tipo: archivoElegido.type,
            tamano_bytes: archivoElegido.size,
          }
        : null,
    };
  }

  // ==========================================
  // 12. EVENTOS DE LOS CAMPOS
  // ==========================================

  categoria.addEventListener("change", () => {
    actualizarReglaMonto();
    monto.setCustomValidity("");
  });

  monto.addEventListener("input", () => {
    monto.setCustomValidity("");
  });

  descripcion.addEventListener("input", () => {
    descripcion.setCustomValidity("");
  });

  prioridad.addEventListener("change", () => {
    prioridad.setCustomValidity("");
  });

  referenciaTexto.addEventListener("input", () => {
    referenciaTexto.setCustomValidity("");
  });

  origen.addEventListener("change", () => {
    actualizarOrigen();
  });

  // Mostrar el archivo seleccionado.
  // En esta etapa no se sube ni se guarda.
  archivo.addEventListener("change", () => {
    const seleccionado = archivo.files[0];

    archivoSeleccionado.hidden = !seleccionado;

    archivoSeleccionado.textContent = seleccionado
      ? `Archivo seleccionado: ${seleccionado.name}`
      : "";
  });

  // ==========================================
  // 13. RESTABLECER EL FORMULARIO
  // ==========================================

  formulario.addEventListener("reset", () => {
    // El reset nativo termina después del evento actual.
    setTimeout(() => {
      errorIncidencia.textContent = "";
      mensajeIncidencia.textContent = "";

      archivoSeleccionado.hidden = true;
      archivoSeleccionado.textContent = "";

      // Invalidar las solicitudes de origen anteriores.
      solicitudOrigenActual++;

      empleadoResponsableId = null;

      prioridad.setCustomValidity("");
      descripcion.setCustomValidity("");
      referenciaTexto.setCustomValidity("");
      monto.setCustomValidity("");

      establecerFechaActual();

      actualizarOrigen();
      cargarUsuarioResponsable();
    }, 0);
  });

  
  // ==========================================
  // 14. REGISTRAR INCIDENCIA
  // Confirmación + envío al API + resultado
  // ==========================================

  formulario.addEventListener("submit", async (evento) => {
    evento.preventDefault();

    if (enviandoIncidencia) {
      return;
    }

    errorIncidencia.textContent = "";
    mensajeIncidencia.textContent = "";

    // Primero se validan los datos del formulario.
    if (!validarIncidencia()) {
      return;
    }

    // Solicitar confirmación antes de enviar los datos.
    const confirmado = await mostrarModalIncidencia({
      titulo: "Confirmar registro",
      mensaje:
        "¿Deseas registrar esta incidencia? " +
        "Se enviarán los datos a MotoRep para guardarlos.",
      tipo: "confirmacion",
      textoAceptar: "Sí, registrar",
      textoCancelar: "Cancelar",
      mostrarCancelar: true,
    });

    // Si el usuario cancela, no se llama al API.
    if (!confirmado) {
      return;
    }

    enviandoIncidencia = true;

    const botonEnviar = formulario.querySelector(
      'button[type="submit"]'
    );

    if (botonEnviar) {
      botonEnviar.disabled = true;
    }

    mensajeIncidencia.textContent = "Registrando incidencia...";

    try {
      // Construir el objeto con los datos validados.
      const datosIncidencia = construirDatosIncidencia();

      // Enviar la incidencia al backend.
      const respuesta = await fetchConAutenticacion(
        "api/incidencia/crear/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(datosIncidencia),
        }
      );

      // Manejar respuestas que no contengan JSON válido.
      let resultado = {};

      try {
        resultado = await respuesta.json();
      } catch {
        resultado = {};
      }

      if (!respuesta.ok) {
        throw new Error(
          resultado.error ||
          resultado.detail ||
          `No fue posible registrar la incidencia (HTTP ${respuesta.status}).`
        );
      }

      // Informar que el backend confirmó el registro.
      mensajeIncidencia.textContent = "";

      // Reiniciar el formulario.
      // El evento reset existente actualiza la fecha,
      // el origen y el empleado responsable.
      formulario.reset();

      // Mostrar el modal de éxito.
      await mostrarModalIncidencia({
        titulo: "¡Incidencia registrada!",
        mensaje: resultado.incidencia_id
          ? `La incidencia se guardó correctamente.`
          : "La incidencia se guardó correctamente en MotoRep.",
        tipo: "exito",
        textoAceptar: "Entendido",
        mostrarCancelar: false,
      });

    } catch (error) {
      console.error(
        "Error al registrar la incidencia:",
        error
      );

      mensajeIncidencia.textContent = "";
      errorIncidencia.textContent =
        error.message ||
        "Ocurrió un error al registrar la incidencia.";

      // Mostrar el error en el modal.
      await mostrarModalIncidencia({
        titulo: "No se pudo registrar",
        mensaje:
          error.message ||
          "Ocurrió un error al guardar la incidencia. Verifica los datos e inténtalo nuevamente.",
        tipo: "error",
        textoAceptar: "Entendido",
        mostrarCancelar: false,
      });

    } finally {
      enviandoIncidencia = false;

      if (botonEnviar) {
        botonEnviar.disabled = false;
      }
    }
  });


  // ==========================================
  // 15. INICIALIZAR
  // ==========================================

  establecerFechaActual();
  actualizarReglaMonto();
  actualizarOrigen();
  cargarUsuarioResponsable();
});

let FacturaID = null;

async function cargarFactura() {
  const cargando = document.getElementById("cargandoFactura");
  const tabla = document.getElementById("tablaFactura");
  const tbody = document.getElementById("bodyFactura");

  cargando.style.display = "block";
  tabla.classList.remove("visible");

  try {
    // Usamos tu función con autenticación automática.
    //fetchConAutenticacion ya concatena urlAPI internamente según el diseño previo.
    let respuesta = await fetchConAutenticacion("movimiento/factura/");
    const dato = await respuesta.json();

    const facturas = Array.isArray(dato) ? dato : dato.results;
    let filas = "";

    for (let i = 0; i < facturas.length; i++) {
      let factura = facturas[i];

      filas += "<tr>";
      filas += "<td>" + (i + 1) + "</td>";
      filas += '<td class="td-nombreEmp">' + factura.NumFactura + "</td>";
      filas +=
        "<td>" +
        factura.cliente_nombre +
        " " +
        factura.cliente_cedula +
        "</td>";
      filas += "<td>" + factura.fecha_formateada + "</td>";
      filas += `<td>C$ ${factura.Total.toLocaleString("es-NI")}</td>`;
      filas += "<td>" + factura.condicion_nombre + "</td>";
      //filas += '<td>'+factura.estadoCuenta_nommbre+'</td>'
      filas += '<td class="td-acciones">';

      filas += `<button class="btn-accion" style="background:rgba(6,182,212,0.15);color:#0e7490;border:1px solid rgba(6,182,212,0.4);"
                  onclick="verDetalleFactura(${factura.id}, ${factura.NumFactura})">
                  🔍 Detalles
                </button>`;
      filas += "</td>";

      // aciones
      filas += '<td class="td-acciones">';
      filas +=
        '<button class="btn-accion btn-editar" ' +
        `onclick="abrirModalfactura('editar', ${factura.id}, '${factura.NumFactura}','${factura.ClienteId}', '${factura.Fecha}','${factura.Total}', '${factura.condicionId}', '${factura.estadoCuentaId}')">` +
        "✏ Editar" +
        "</button>";
      filas +=
        '<button class="btn-accion btn-eliminar" ' +
        `onclick="eliminarFactura(${factura.id}, '${factura.NumFactura}', '${factura.cliente_nombre}')">` +
        "🗑 Eliminar" +
        "</button>";
      filas += " </td>";
      filas += "</tr>";
    }

    tbody.innerHTML = filas;
    cargando.style.display = "none";
    tabla.classList.add("visible");

    activarBuscadorGlobal("buscarFactura", "#bodyFactura tr");
  } catch (error) {
    cargando.textContent =
      "⚠ Error al conectar con la API local. ¿Está corriendo el servidor Django?";
    console.error("Error en cargarFactura:", error);
  }
}

async function cargarOpcionesClientes() {
  var select = document.getElementById("facturaCliente");

  // Limpiar las opciones anteriores
  select.innerHTML = '<option value="">-- Seleccione un cliente --</option>';

  try {
    var respuesta = await fetchConAutenticacion("catalogos/clientes/");
    var datos = await respuesta.json();
    var cliente = Array.isArray(datos) ? datos : datos.results;

    // Crear un <option> por cada departamento.
    // value = id (lo que se envía al API como FK)
    // textContent = nombre (lo que ve el usuario)

    //console.log('datos recibidos de la api: ', cliente); //visualizar cuales son los datos enviados

    for (var i = 0; i < cliente.length; i++) {
      var c = cliente[i];
      var option = document.createElement("option");
      option.value = c.id; // ← esto es lo que se envía como "departamento" en el body
      option.textContent = `${c.Nombres} cédula: ${c.NumCedula}`; // ← esto es lo que ve el usuario
      select.appendChild(option);
    }
  } catch (error) {
    console.error(
      "No se pudieron cargar los departamentos para el select:",
      error,
    );
  }
}

async function cargarOpcionesCondicion() {
  var select = document.getElementById("facturaCondicion");

  // Limpiar las opciones anteriores
  select.innerHTML = '<option value="">-- Seleccione una condicion --</option>';

  try {
    var respuesta = await fetchConAutenticacion("catalogos/condicionpago/");
    var datos = await respuesta.json();
    var condicion = Array.isArray(datos) ? datos : datos.results;

    // Crear un <option> por cada departamento.
    // value = id (lo que se envía al API como FK)
    // textContent = nombre (lo que ve el usuario)

    //console.log('datos recibidos de la api: ', condicion);

    for (var i = 0; i < condicion.length; i++) {
      var c = condicion[i];
      var option = document.createElement("option");
      option.value = c.id; // ← esto es lo que se envía como  en el body
      option.textContent = `${c.descripcion}`; // ← esto es lo que ve el usuario
      select.appendChild(option);
    }
  } catch (error) {
    console.error(
      "No se pudieron cargar los departamentos para el select:",
      error,
    );
  }
}
/*
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
}*/

let inventarioLotesGlobal = [];

// 1. CARGAR PRODUCTOS ÚNICOS CON STOCK
async function cargarOpcionesDetalles() {
  const selectProd = document.getElementById("facturaProducto");
  const selectLote = document.getElementById("facturalote");

  if (!selectProd || !selectLote) return;

  selectProd.innerHTML =
    '<option value="">-- Seleccione un producto --</option>';
  selectLote.innerHTML =
    '<option value="">-- Primero elija un producto --</option>';
  selectLote.disabled = true;

  try {
    const respuesta = await fetchConAutenticacion(
      "movimiento/productos/inventarioLote/",
    );
    const datos = await respuesta.json();

    // Guardamos únicamente los lotes que tienen stock disponible (Cantidad > 0)
    const listaCompleta = Array.isArray(datos) ? datos : datos.results || [];
    inventarioLotesGlobal = listaCompleta.filter(
      (lote) => parseInt(lote.Cantidad) > 0,
    );

    console.log("Lotes con stock disponible:", inventarioLotesGlobal);

    const productosUnicos = new Map();

    inventarioLotesGlobal.forEach((lote) => {
      // Usamos el nombre del producto como identificador único para el primer select
      const nombreProducto = lote.detalle_producto;

      if (nombreProducto && !productosUnicos.has(nombreProducto)) {
        productosUnicos.set(nombreProducto, nombreProducto);
      }
    });

    // Cargar el primer select sin duplicados
    productosUnicos.forEach((nombre) => {
      const option = document.createElement("option");
      option.value = nombre; // El valor será el nombre exacto del producto
      option.textContent = nombre;
      selectProd.appendChild(option);
    });
  } catch (error) {
    console.error("Error al cargar inventario:", error);
  }
}

// 2. FILTRAR LOTES POR PRODUCTO SELECCIONADO
window.alCambiarProducto = function () {
  const nombreProductoSeleccionado =
    document.getElementById("facturaProducto").value;
  const selectLote = document.getElementById("facturalote");
  const inputPrecio = document.getElementById("facturaPrecio");
  const inputStockInfo = document.getElementById("stockinfo");

  selectLote.innerHTML = '<option value="">-- Seleccione un lote --</option>';
  inputPrecio.value = "";
  if (inputStockInfo) inputStockInfo.textContent = "";

  if (!nombreProductoSeleccionado) {
    selectLote.disabled = true;
    return;
  }

  // Filtrar únicamente los lotes con stock que coinciden con el producto seleccionado
  const lotesDelProducto = inventarioLotesGlobal.filter(
    (lote) =>
      lote.detalle_producto === nombreProductoSeleccionado &&
      parseInt(lote.Cantidad) > 0,
  );

  if (lotesDelProducto.length === 0) {
    selectLote.innerHTML =
      '<option value="">-- Sin stock disponible --</option>';
    selectLote.disabled = true;
    return;
  }

  // Poblar el segundo select con los lotes correspondientes
  lotesDelProducto.forEach((lote) => {
    const option = document.createElement("option");
    option.value = lote.id; // ID del lote (RegistroProducto) requerido por la API
    option.dataset.precio = lote.PrecioVenta;
    option.dataset.stock = lote.Cantidad;

    const fecha = lote.FechaRegistro
      ? new Date(lote.FechaRegistro).toLocaleDateString()
      : "";
    option.textContent = `Lote #${lote.id} - Reg: ${fecha} (Disponibles: ${lote.Cantidad} | C$ ${lote.PrecioVenta})`;
    selectLote.appendChild(option);
  });

  selectLote.disabled = false;
};

// 3. AUTOCOMPLETAR PRECIO Y MOSTRAR DISPONIBILIDAD DE LOTE
window.alCambiarLote = function () {
  const selectLote = document.getElementById("facturalote");
  const optionSelected = selectLote.selectedOptions[0];
  const inputPrecio = document.getElementById("facturaPrecio");
  const inputStockInfo = document.getElementById("stockinfo");

  if (optionSelected && optionSelected.dataset.precio) {
    inputPrecio.value = parseFloat(optionSelected.dataset.precio).toFixed(2);
    if (inputStockInfo) {
      inputStockInfo.textContent = `Disponible en este lote: ${optionSelected.dataset.stock} unidades`;
    }
  } else {
    inputPrecio.value = "";
    if (inputStockInfo) inputStockInfo.textContent = "";
  }
};

// ========================================== METODO DE PAGOS ==========================================
async function cargarOpcionesPago() {
  const select = document.getElementById("facturaMetodoPago");
  if (!select) return;

  select.innerHTML =
    '<option value="">-- Seleccione un método de pago --</option>';

  try {
    // Apuntar al catálogo correspondiente de métodos de pago
    const respuesta = await fetchConAutenticacion("catalogos/metodopago/");
    const datos = await respuesta.json();
    const metodos = Array.isArray(datos) ? datos : datos.results;

    metodos.forEach((m) => {
      const option = document.createElement("option");
      option.value = m.id;
      option.textContent = m.Tipo || m.nombre; // Lee 'Tipo' o 'nombre' según tu backend
      select.appendChild(option);
    });
  } catch (error) {
    console.error("Error al cargar métodos de pago:", error);
  }
}
//========================================= OBTENER TURNO DE CAJA ACTIVO =========================================
async function obtenerTurnoCajaActivo() {
  try {
    const resp = await fetchConAutenticacion("/movimiento/caja/turno/activo/");
    if (!resp.ok) return null;
    const data = await resp.json();
    return data.id; // Retorna el id del turno de caja
  } catch (e) {
    console.error("Error al obtener turno activo:", e);
    return null;
  }
}

// Retorna la fecha actual en formato YYYY-MM-DD para inputs de tipo date
function obtenerFechaActualFormateada() {
  const hoy = new Date();
  const year = hoy.getFullYear();
  const month = String(hoy.getMonth() + 1).padStart(2, "0");
  const day = String(hoy.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
// Abrir modal compra (crear / editar)
window.abrirModalfactura = async function (
  modo,
  id,
  numFactura,
  clienteId,
  Fecha,
  total,
  condicionId,
) {
  const tablaDetalleCompra = document.getElementById("tablaDetalleFactura");
  if (tablaDetalleCompra) tablaDetalleCompra.classList.add("visible");

  document.getElementById("modalTextCompra").textContent =
    modo === "crear" ? "Nueva Factura" : "Editar Factura";

  // 1. Cargar catálogos
  await cargarOpcionesClientes();
  await cargarOpcionesCondicion();
  await cargarOpcionesDetalles();
  await cargarOpcionesPago();

  pagosTemp = []; // Reinicia los pagos
  redibujarTablaPagos();

  // 2. Asignar Fecha y Número de Factura
  const inputFecha = document.getElementById("facturaFecha");
  //const inputNumero = document.getElementById('facturaNumero');

  if (modo === "crear") {
    // Asigna la fecha de hoy automáticamente
    inputFecha.value = obtenerFechaActualFormateada();

    // Obtiene el autoincrementable del servidor
    //  inputNumero.value = await obtenerSiguienteNumFactura();
  } else {
    // Si es edición, mantiene los valores recibidos
    // inputNumero.value = numFactura || '';
    inputFecha.value = Fecha || "";
  }

  // Bloquear campos para evitar manipulación accidental
  //inputNumero.readOnly = true;
  inputFecha.readOnly = true;

  // Asignar resto de campos
  document.getElementById("facturaCliente").value = clienteId || "";
  document.getElementById("facturaCondicion").value = condicionId || "";
  document.getElementById("facturaMetodoPago").value = "";
  FacturaID = modo === "editar" ? id : null;

  document.getElementById("modalfactura").classList.add("activo");
};

window.cerrarModalFactura = function (modalfactura) {
  let confirmar = window.confirm(
    "¿Seguro que quieres salirte? Se perderán los datos ingresados.",
  );
  if (!confirmar) return;

  // 1. LIMPIAR CAMPOS DEL ENCABEZADO
  document.getElementById("facturaNumero").value = "";
  document.getElementById("facturaCliente").value = "";
  document.getElementById("facturaFecha").value = "";
  document.getElementById("facturaCondicion").value = "";

  // 2. LIMPIAR CAMPOS DE DETALLE DE PRODUCTO
  const selectProd = document.getElementById("facturaProducto");
  const selectLote = document.getElementById("facturalote");
  const inputCantidad = document.getElementById("facturaCantidad");
  const inputPrecio = document.getElementById("facturaPrecio");
  const stockInfo = document.getElementById("stockinfo");

  if (selectProd) selectProd.selectedIndex = 0;
  if (selectLote) {
    selectLote.innerHTML =
      '<option value="">-- Primero elija un producto --</option>';
    selectLote.disabled = true;
  }
  if (inputCantidad) inputCantidad.value = "";
  if (inputPrecio) inputPrecio.value = "";
  if (stockInfo) stockInfo.textContent = "";

  // 3. VACIAR ARREGLOS Y RESETEAR CONTADORES DE TABLAS
  ncFacturaProductosTemp = [];
  pagosTemp = [];
  ncFacturaContadorFila = 0;
  contadorPagosFila = 0;

  // 4. REDIBUJAR TABLAS (Para vaciar visualmente las filas)
  if (typeof ncRedibujarTablaDetalleFac === "function") {
    ncRedibujarTablaDetalleFac();
  }
  if (typeof redibujarTablaPagos === "function") {
    redibujarTablaPagos();
  }

  // 5. LIMPIAR MENSAJES DE ERROR
  const errorEl = document.getElementById("error");
  if (errorEl) errorEl.textContent = "";

  const errorProducto = document.getElementById("errorMensajeFacturaProducto");
  if (errorProducto) errorProducto.textContent = "";

  // 6. CERRAR EL MODAL
  const elModal = document.getElementById(modalfactura);
  if (elModal) elModal.classList.remove("activo");
};

let ncFacturaProductosTemp = []; // [ { prodId, nombre, cantidad, precio, subtotal } ]
let ncFacturaContadorFila = 0;

function ActualizarTotalFac() {
  const total = ncFacturaProductosTemp.reduce((acc, p) => acc + p.subtotal, 0);
  document.getElementById("facTotal").textContent = ncMoneda(total);
}

/** Redibuja todas las filas de la tabla temporal */
function ncRedibujarTablaDetalleFac() {
  const tbody = document.getElementById("bodyDetalleCompra");
  const tablaWrap = document.getElementById("TablaDetalleFac");
  //const sinProd = document.getElementById('nc_sin_productos');

  if (ncFacturaProductosTemp.length === 0) {
    tbody.innerHTML = "";
    tablaWrap.style.display = "none";
    //sinProd.style.display = 'block';
    ActualizarTotalFac();
    return;
  }

  tablaWrap.style.display = "block";
  //sinProd.style.display = 'none';
  console.log()
  let filas = "";
  ncFacturaProductosTemp.forEach((p, idx) => {
    console.log(p)
    filas += `<tr id="nc_fila_${p._key}">
            <td>${idx + 1}</td>
            <td>${p.nombre}</td>
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

window.ncAgregarFacturaProducto = function () {
  const selectProducto = document.getElementById("facturaProducto");
  const selectLote = document.getElementById("facturalote");
  const inputCantidad = document.getElementById("facturaCantidad");
  const inputPrecio = document.getElementById("facturaPrecio");

  const productoNombre = selectProducto.value;
  const loteId = selectLote.value;
  const cantidad = parseInt(inputCantidad.value.trim()) || 0;
  const precio = parseFloat(inputPrecio.value) || 0;

  // 1. Validación de campos requeridos
  if (!productoNombre || !loteId) {
    alert("Por favor, seleccione un producto y un lote válido.");
    return;
  }

  if (cantidad <= 0) {
    alert("Por favor, ingrese una cantidad mayor a 0.");
    return;
  }

  // 2. ADVERTENCIA DE DUPLICADO: Verificar si el lote o el producto ya existe en la tabla
  const existeEnTabla = ncFacturaProductosTemp.some(
    (p) => p.loteId === loteId || p.nombre === productoNombre,
  );

  if (existeEnTabla) {
    alert(
      `¡El producto "${productoNombre}" ya se encuentra agregado en la tabla! Si desea modificar la cantidad, elimine la fila actual e ingréselo nuevamente.`,
    );
    return;
  }

  // 3. VALIDACIÓN DE STOCK MÁXIMO DISPONIBLE
  const optionLote = selectLote.selectedOptions[0];
  const stockDisponible = parseInt(optionLote.dataset.stock) || 0;

  if (cantidad > stockDisponible) {
    alert(
      `¡Stock insuficiente! El lote seleccionado solo cuenta con ${stockDisponible} unidades disponibles.`,
    );
    return;
  }

  // 4. Agregar al arreglo temporal de productos
  ncFacturaProductosTemp.push({
    _key: Date.now(), // Identificador único para el render de la fila
    loteId: loteId,
    nombre: productoNombre,
    cantidad: cantidad,
    precio: precio,
    subtotal: cantidad * precio,
  });

  // 5. Limpiar los campos del formulario de entrada
  inputCantidad.value = "0";
  selectLote.selectedIndex = 0;
  selectProducto.selectedIndex = 0;
  selectLote.disabled = true;
  inputPrecio.value = "";

  // 6. Redibujar la tabla de productos y actualizar totales de la factura
  ncRedibujarTablaDetalleFac();
};

window.ncQuitarProductoFactura = function (key) {
  ncFacturaProductosTemp = ncFacturaProductosTemp.filter((p) => p._key !== key);
  ncRedibujarTablaDetalleFac();
};
// llenar de forma temporal los pagos en la interfaz del modal derecho
// Arreglo temporal para los pagos acumulados
let pagosTemp = [];
let contadorPagosFila = 0;

/** Recalcula el total pagado y el cambio/vuelto */
function actualizarTotalesPago() {
  // 1. Obtener el total a cobrar de la factura (se calcula desde los productos cargados)
  const totalCobrar = ncFacturaProductosTemp.reduce(
    (acc, p) => acc + p.subtotal,
    0,
  );

  // 2. Sumar el total abonado en la tabla de pagos
  const totalPagado = pagosTemp.reduce((acc, p) => acc + p.monto, 0);

  // 3. Calcular el vuelto/cambio
  const cambio = totalPagado - totalCobrar;

  // Actualizar elementos en la interfaz
  const elTotalPagado = document.getElementById("facMetodoTotal");
  if (elTotalPagado) elTotalPagado.textContent = ncMoneda(totalPagado);

  const elCambio = document.getElementById("facturaCambio");
  if (elCambio) {
    // Muestra el cambio en verde si es mayor a 0, de lo contrario C$ 0.00
    //elCambio.textContent = ncMoneda(cambio > 0 ? cambio : 0);
    elCambio.value = ncMoneda(cambio > 0 ? cambio : 0);
  }
}

/** Redibuja la tabla temporal de pagos */
function redibujarTablaPagos() {
  const tbody = document.getElementById("bodyTablaFacturaPagos"); // id de tu <tbody> en el modal de cobro
  if (!tbody) return;

  if (pagosTemp.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="5" style="text-align:center;">No se han agregado pagos</td></tr>';
    actualizarTotalesPago();
    return;
  }

  let filas = "";
  const fechaHoy = obtenerFechaActualFormateada();

  pagosTemp.forEach((p, idx) => {
    filas += `<tr>
            <td>${idx + 1}</td>
            <td>${p.nombreMetodo}</td>
            <td>${ncMoneda(p.monto)}</td>
            <td>${fechaHoy}</td>
            <td>
                <button type="button" class="btn-accion btn-eliminar" onclick="quitarPagoTemporal(${p._key})" title="Quitar pago">
                    🗑
                </button>
            </td>
        </tr>`;
  });

  tbody.innerHTML = filas;
  actualizarTotalesPago();
}

/** Función llamada desde el HTML al dar clic en "+ Agregar monto" */
window.agregarPagoTemporal = function () {
  const selectMetodo = document.getElementById("facturaMetodoPago");
  const inputMonto = document.getElementById("facturaMontoPago");

  const metodoPagoId = selectMetodo.value;
  const nombreMetodo =
    selectMetodo.options[selectMetodo.selectedIndex]?.text || "";
  const monto = parseFloat(inputMonto.value.trim());

  // Validaciones
  if (!metodoPagoId) {
    alert("Por favor, selecciona un método de pago.");
    return;
  }
  if (isNaN(monto) || monto <= 0) {
    alert("Por favor, ingresa un monto válido mayor a 0.");
    return;
  }

  contadorPagosFila++;

  // Guardar en el arreglo temporal
  pagosTemp.push({
    _key: contadorPagosFila,
    metodoPagoId: metodoPagoId,
    nombreMetodo: nombreMetodo,
    monto: monto,
  });

  // Limpiar campo de monto y reenfocar
  inputMonto.value = "";
  selectMetodo.focus();

  // Redibujar la tabla
  redibujarTablaPagos();
};

/** Quitar un pago individual de la lista */
window.quitarPagoTemporal = function (key) {
  pagosTemp = pagosTemp.filter((p) => p._key !== key);
  redibujarTablaPagos();
};

// ── Guardar: envía cabecera + detalles a la API ───────────────
// Arreglo temporal local para acumular pagos en la interfaz del modal derecho

window.guardarNuevaFactura = async function () {
  let idtipomovimiento = 1; // 1: Venta, 2: Compra
  let errorEl = document.getElementById("errorfactura");
  if (errorEl) errorEl.textContent = "";

  const numFactura = document.getElementById("facturaNumero").value.trim();
  const clienteId = document.getElementById("facturaCliente").value;
  const condicionId = document.getElementById("facturaCondicion").value; // 1: Contado, 2: Crédito

  if (!numFactura || !clienteId || !condicionId) {
    if (errorEl)
      errorEl.textContent = "⚠️ Por favor, llena todos los campos principales.";
    return;
  }

  if (ncFacturaProductosTemp.length === 0) {
    alert("⚠️ Agrega al menos un producto a la lista.");
    return;
  }

  // Obtener turno de caja obligatorio para movimientos en efectivo/digital
  const turnoCajaId = await obtenerTurnoCajaActivo();

  // Mapeo del detalle con 'loteId'
  const detallesFormateados = ncFacturaProductosTemp.map((p) => ({
    loteId: parseInt(p.loteId, 10),
    Cantidad: parseInt(p.cantidad),
  }));

  // Construcción del Payload
  const payload = {
    NumFactura: parseInt(numFactura),
    ClienteId: parseInt(clienteId),
    condicionId: parseInt(condicionId),
    turnoCajaId: turnoCajaId,
    detalles: detallesFormateados,
    tipoMovimientoCajaId: idtipomovimiento,
  };

  // Si es Venta al Contado, agregamos el listado de pagos acumulados
  if (parseInt(condicionId) === 1) {
    if (pagosTemp.length === 0) {
      alert(
        "⚠️ Debe agregar al menos un pago para finalizar la venta al contado.",
      );
      return;
    }
    payload.pagos = pagosTemp.map((p) => ({
      metodoPagoId: parseInt(p.metodoPagoId),
      monto: parseFloat(p.monto),
    }));
  }
  // Si es Crédito, enviamos los datos correspondientes
  else if (parseInt(condicionId) === 2) {
    payload.datos_credito = {
      FechaLimiteCredito:
        document.getElementById("facturaFechaLimite")?.value || null,
      estadoCuentaId: 1, // Id por defecto (Pendiente/Activo)
    };
  }

  console.log(payload);

  try {
    const respFactura = await fetchConAutenticacion("movimiento/factura/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const respuestaJson = await respFactura.json();

    if (!respFactura.ok) {
      console.error("Error devuelto por Django:", respuestaJson);
      if (errorEl)
        errorEl.textContent = "Error: " + JSON.stringify(respuestaJson);
      return;
    }

    alert(`✅ Factura N° ${numFactura} procesada con éxito.`);

    // Reset y refresco
    ncFacturaProductosTemp = [];
    pagosTemp = [];
    document.getElementById("modalfactura").classList.remove("activo");
    await cargarFactura();
  } catch (e) {
    console.error(e);
    if (errorEl) errorEl.textContent = "Error de comunicación con el servidor.";

    console.error("Error devuelto por Django:", JSON.stringify(error, null, 2));
  }
};
//---------------------------------------------------------------------
// MODULO DE CAJA
//----------------------------------------------------------------------

let CajaID = null;

async function cargarCaja() {
  const cargando = document.getElementById("cargandoCaja");
  const tabla = document.getElementById("tablaCaja");
  const tbody = document.getElementById("bodyCaja");

  cargando.style.display = "block";
  tabla.classList.remove("visible");

  try {
    // Usamos tu función con autenticación automática.
    //fetchConAutenticacion ya concatena urlAPI internamente según el diseño previo.
    let respuesta = await fetchConAutenticacion("movimiento/caja/turno");
    const dato = await respuesta.json();

    const Caja = Array.isArray(dato) ? dato : dato.results;
    let filas = "";

    for (let i = 0; i < Caja.length; i++) {
      let caja = Caja[i];

      // esto es para que no muestre al usuario null si no hay fecha de cierre
      let fechaCierre = caja.fecha_cierre_formateada;

      if (fechaCierre === null) fechaCierre = "No hay fecha de cierre";
      else fechaCierre = caja.fecha_cierre_formateada;

      filas += "<tr>";
      filas += "<td>" + (i + 1) + "</td>";
      filas += '<td class="td-nombreEmp">' + caja.num_caja_numero + "</td>";
      filas += `<td> ${caja.Empleado_nombre}</td>`;
      filas += `<td>C$ ${caja.SaldoInicial}</td>`;
      filas += `<td>C$ ${caja.Egresos ?? "-"}</td>`;
      filas += `<td>C$ ${caja.Din_efectivo ?? "-"}</td>`;
      filas += `<td>C$ ${caja.Din_digital ?? "-"}</td>`;
      filas += `<td>C$ ${caja.SaldoFinal ?? "-"}</td>`;
      filas += "<td>" + caja.fecha_incio_formateada + "</td>";
      filas += "<td>" + fechaCierre + "</td>";
      filas += '<td class="td-acciones">';

      filas += `<button
                          type="button"
                          class="btn-accion"
                          style="
                              background: rgba(6,182,212,0.15);
                              color: #0e7490;
                              border: 1px solid rgba(6,182,212,0.4);
                          "
                          data-id="${escaparHTML(caja.id)}"
                          data-numero="${escaparHTML(caja.num_caja_numero)}"
                          data-empleado="${escaparHTML(caja.Empleado_nombre)}"
                          data-apertura="${escaparHTML(caja.fecha_incio_formateada)}"
                          data-abierto="${caja.abierto === true}"
                          onclick="detalleMovimientoCaja(this)">
                          🔍 Detalles
                  </button>`;
      filas += `</td>`;

      // aciones
      filas += '<td class="td-acciones">';
      filas +=
        '<button class="btn-accion btn-editar" ' +
        `onclick="abrirModalcaja('editar',${caja.id},'${caja.NumCajaid}','${caja.EmpleadoId}','${caja.SaldoInicial}','${caja.FechaApertura}')">` +
        "✏ Editar" +
        "</button>";
      filas +=
        '<button class="btn-accion btn-eliminar" ' +
        `onclick="eliminarCaja(${caja.id},'${caja.num_caja_numero}','${caja.Empleado_nombre}')">` +
        "🗑 Eliminar" +
        "</button>";
      filas += " </td>";
      filas += "</tr>";
    }

    tbody.innerHTML = filas;
    cargando.style.display = "none";
    tabla.classList.add("visible");

    activarBuscadorGlobal("buscarCaja", "#bodyCaja tr");
  } catch (error) {
    cargando.textContent =
      "⚠ Error al conectar con la API local. ¿Está corriendo el servidor Django?";
    console.error("Error en cargarFactura:", error);
  }
}
// =================Cargar numero de caja========================
async function cargarOpcionesNCcaja() {
  var select = document.getElementById("SelectNumCaja");

  // Limpiar las opciones anteriores
  select.innerHTML =
    '<option value="">-- Seleccione el número de caja --</option>';

  try {
    var respuesta = await fetchConAutenticacion("movimiento/caja/");
    var datos = await respuesta.json();
    var numcaja = Array.isArray(datos) ? datos : datos.results;

    // Crear un <option> por cada departamento.
    // value = id (lo que se envía al API como FK)
    // textContent = nombre (lo que ve el usuario)

    //console.log('datos recibidos de la api: ', condicion);

    for (var i = 0; i < numcaja.length; i++) {
      var cajaNum = numcaja[i];
      var option = document.createElement("option");
      option.value = cajaNum.id; // ← esto es lo que se envía como  en el body
      option.textContent = `${cajaNum.NumCaja}`; // ← esto es lo que ve el usuario
      select.appendChild(option);
    }
  } catch (error) {
    console.error(
      "No se pudieron cargar los departamentos para el select:",
      error,
    );
  }
}

// =================Cargar numero de caja========================
async function cargarOpcionesEmpleado() {
  var select = document.getElementById("SelectEmpleado");

  // Limpiar las opciones anteriores
  select.innerHTML = '<option value="">-- Seleccione --</option>';

  try {
    var respuesta = await fetchConAutenticacion("catalogos/empleados");
    var datos = await respuesta.json();
    var empleados = Array.isArray(datos) ? datos : datos.results;

    // Crear un <option> por cada departamento.
    // value = id (lo que se envía al API como FK)
    // textContent = nombre (lo que ve el usuario)

    //console.log('datos recibidos de la api: ', condicion);

    for (var i = 0; i < empleados.length; i++) {
      var Empleados = empleados[i];
      var option = document.createElement("option");
      option.value = Empleados.id; // ← esto es lo que se envía como  en el body
      option.textContent = `${`${Empleados.Nombres}` + `${Empleados.Apellidos}`}`; // ← esto es lo que ve el usuario
      select.appendChild(option);
    }
  } catch (error) {
    console.error(
      "No se pudieron cargar los departamentos para el select:",
      error,
    );
  }
}

// ------------------------------------------
// Abrir modal (crear o editar)
// ------------------------------------------
window.abrirModalcaja = async function (
  modo,
  id = null,
  NumCajaId = "",
  Empleado = "",
  SaldoInicial = "",
  fecha_incio_formateada = "",
) {
  document.getElementById("modalTextCaja").textContent =
    modo === "crear" ? "Asignar turno de caja" : "Editar turno de caja";

  CajaID = modo === "editar" ? id : null;

  document.getElementById("errorCaja").textContent = "";

  // Primero cargar las opciones
  await cargarOpcionesNCcaja();
  await cargarOpcionesEmpleado();

  // Después asignar los valores
  document.getElementById("SelectNumCaja").value = NumCajaId || "";
  document.getElementById("SelectEmpleado").value = Empleado || "";
  document.getElementById("CajaPrecioInicial").value = SaldoInicial || "";

  const fechaCajaInicio = document.getElementById("FechaInicioCaja");

  if (modo === "crear") {
    fechaCajaInicio.value = obtenerFechaActualFormateada();
  } else {
    fechaCajaInicio.value = convertirFechaParaInputDate(fecha_incio_formateada);
  }

  console.log("Número caja:", NumCajaId);
  console.log("Empleado:", Empleado);
  console.log("Saldo inicial:", SaldoInicial);
  console.log("Fecha inicio:", fechaCajaInicio.value);

  fechaCajaInicio.readOnly = true;

  document.getElementById("modalCaja").classList.add("activo");
};

function convertirFechaParaInputDate(fecha) {
  if (!fecha) return "";

  const fechaObj = new Date(fecha);

  if (isNaN(fechaObj.getTime())) {
    console.error("Fecha inválida:", fecha);
    return "";
  }

  const year = fechaObj.getFullYear();
  const month = String(fechaObj.getMonth() + 1).padStart(2, "0");
  const day = String(fechaObj.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}
//=========================CERRAR MODAL DE CAJA=====================================
window.cerrarModalCaja = function (idModal) {
  document.getElementById("SelectNumCaja").value = "";
  document.getElementById("SelectEmpleado").value = "";
  document.getElementById("CajaPrecioInicial").value = "";
  document.getElementById("FechaInicioCaja").value = "";

  const errorEl = document.getElementById("errorCaja");
  if (errorEl) errorEl.textContent = "";

  document.getElementById(idModal).classList.remove("activo");
};

// ------------------------------------------
// Guardar Caja(crear o editar)
// ------------------------------------------
window.guardarCaja = async function () {
  const errorCaja = document.getElementById("errorCaja");
  const NumCaja = document.getElementById("SelectNumCaja").value;
  const Empleado = document.getElementById("SelectEmpleado").value;
  const SaldoInicial = document
    .getElementById("CajaPrecioInicial")
    .value.trim();
  const FechaInicio = document.getElementById("FechaInicioCaja").value;

  // Validación básica
  if (!NumCaja || !Empleado || !SaldoInicial || !FechaInicio) {
    errorCaja.textContent = "Por favor, completa todos los campos.";
    return;
  }

  let body = JSON.stringify({
    NumCajaid: NumCaja,
    EmpleadoId: Empleado,
    SaldoInicial: SaldoInicial,
    FechaApertura: FechaInicio,
  });

  console.log(CajaID);
  try {
    let respuesta;

    if (CajaID) {
      // EDITAR — PATCH
      respuesta = await fetchConAutenticacion(
        `movimiento/caja/turno/${CajaID}/`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: body,
        },
      );
    } else {
      // CREAR — POST
      respuesta = await fetchConAutenticacion("movimiento/caja/turno/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: body,
      });
    }

    if (respuesta.ok) {
      cerrarModalCaja("modalCaja");
      cargarCaja();
    } else {
      const err = await respuesta.json();
      errorCaja.textContent = "Error: " + JSON.stringify(err);
    }
  } catch (error) {
    errorCaja.textContent = "Error de conexión con la API.";
    console.error("Error en caja:", error);
  }
};

// BORRAR Caja
window.eliminarCaja = async function (id, numCaja, empleado) {
  console.log(numCaja + empleado, id);
  let confirmar = window.confirm(
    `Seguro quieres eliminar el registro de la caja numero ${numCaja} del empleado ${empleado}`,
  );
  if (!confirmar) return;

  try {
    let url = `movimiento/caja/turno/${id}/`;
    let respuesta = await fetchConAutenticacion(url, {
      method: "DELETE",
    });

    if (respuesta.status === 204 || respuesta.ok) {
      cargarCaja();
    } else {
      alert("No se pudo eliminar. Código: " + respuesta.status);
    }
  } catch (error) {
    alert("Error de conexión con la API.");
    console.error("Error en eliminarEmpleado:", error);
  }
};

/* ==========================================
   UTILIDADES
========================================== */

function escaparHTML(valor) {
  return String(valor ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatearFecha(fecha) {
  if (!fecha) return "—";

  const fechaObj = new Date(fecha);

  if (Number.isNaN(fechaObj.getTime())) {
    return escaparHTML(fecha);
  }

  return fechaObj.toLocaleString("es-NI", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function formatearMonto(monto) {
  const numero = Number(monto);

  if (!Number.isFinite(numero)) return "C$ 0.00";

  return (
    "C$ " +
    numero.toLocaleString("es-NI", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
}

/* ==========================================
   ABRIR MODAL Y CONSULTAR MOVIMIENTOS
========================================== */

window.detalleMovimientoCaja = async function (boton) {
  const modal = document.getElementById("modalMomientoCaja");
  const tbody = document.getElementById("bodyMovimientoCaja");
  const cargando = document.getElementById("cargandoMovimientos");
  const contenedor = document.getElementById("contenedorTablaMovimientos");

  // El botón contiene los datos del turno seleccionado.
  const id = boton.dataset.id;
  const numeroCaja = boton.dataset.numero;
  const empleado = boton.dataset.empleado;
  const fechaApertura = boton.dataset.apertura;
  const abierto = boton.dataset.abierto === "true";

  if (!id) {
    console.error("No se recibió el ID del turno de caja.");
    return;
  }

  // Mostrar los datos generales.
  document.getElementById("detalleNumeroCaja").textContent = numeroCaja || "—";

  document.getElementById("detalleEmpleado").textContent = empleado || "—";

  document.getElementById("detalleFechaApertura").textContent =
    fechaApertura || "—";

  const estadoTurno = document.getElementById("detalleEstadoTurno");

  estadoTurno.textContent = abierto ? "Abierto" : "Cerrado";
  estadoTurno.className = abierto ? "estado-abierto" : "estado-cerrado";

  // Preparar el historial.
  tbody.innerHTML = "";
  contenedor.hidden = true;
  cargando.style.display = "block";
  cargando.textContent = "Cargando movimientos...";

  // Abrir el modal antes de realizar la consulta.
  modal.classList.add("activo");

  try {
    const respuesta = await fetchConAutenticacion(
      `movimiento/caja/movimientocaja/turno/${encodeURIComponent(id)}/`,
    );

    if (!respuesta.ok) {
      const detalleError = await respuesta.text();

      throw new Error(`Error HTTP ${respuesta.status}: ${detalleError}`);
    }

    const dato = await respuesta.json();

    const movimientos = Array.isArray(dato)
      ? dato
      : Array.isArray(dato.results)
        ? dato.results
        : [];

    if (movimientos.length === 0) {
      cargando.textContent =
        "Este turno todavía no tiene movimientos registrados.";
      return;
    }

    let filas = "";

    for (const movimiento of movimientos) {
      const tipo = movimiento.tipo_movimiento_nombre || "Sin tipo";

      // Determinar si el movimiento es ingreso o egreso.
      const tipoNormalizado = tipo.trim().toLowerCase();

      const esIngreso = tipoNormalizado === "ingreso";
      const esEgreso = tipoNormalizado === "egreso";

      let claseTipo = "";

      if (esIngreso) claseTipo = "tipo-ingreso";
      if (esEgreso) claseTipo = "tipo-egreso";

      // El serializador construye este texto en el servidor.
      const documento =
        movimiento.documento_relacionado ||
        movimiento.descripcion ||
        "Sin documento asociado";

      filas += `
                <tr>
                    <td>
                        ${escaparHTML(
                          movimiento.fecha_incio_formateada ||
                            movimiento.fecha ||
                            "—",
                        )}
                    </td>

                    <td>
                        <span class="${claseTipo}">
                            ${escaparHTML(tipo)}
                        </span>
                    </td>

                    <td>
                        ${escaparHTML(documento)}
                    </td>

                    <td class="monto-movimiento">
                        ${formatearMonto(movimiento.monto)}
                    </td>
                </tr>
            `;
    }

    tbody.innerHTML = filas;

    cargando.style.display = "none";
    contenedor.hidden = false;
  } catch (error) {
    console.error("Error al cargar los movimientos de caja:", error);

    cargando.style.display = "block";
    cargando.textContent =
      "No se pudieron cargar los movimientos. Intenta nuevamente.";
  }
};

/* ==========================================
   CERRAR MODAL
========================================== */

window.cerrarModalMovimientoCaja = function () {
  document.getElementById("modalMomientoCaja").classList.remove("activo");
};

// Cerrar al hacer clic fuera del contenido.
document
  .getElementById("modalMomientoCaja")
  .addEventListener("click", function (evento) {
    if (evento.target === this) {
      cerrarModalMovimientoCaja();
    }
  });

// Cerrar con Escape.
document.addEventListener("keydown", function (evento) {
  if (evento.key === "Escape") {
    cerrarModalMovimientoCaja();
  }
});
//------------------------------------------------
// MODULO DE COMPRA
//------------------------------------------------

let compraID = null;

export async function cargarCompras() {
  const cargando = document.getElementById("cargandoCompra");
  const tabla = document.getElementById("tablaCompra");
  const tbody = document.getElementById("bodyCompra");

  if (!cargando || !tabla || !tbody) return;

  cargando.style.display = "block";
  tabla.classList.remove("visible");

  try {
    let respuesta = await fetchConAutenticacion("movimiento/compras/");
    const dato = await respuesta.json();
    const compras = Array.isArray(dato) ? dato : dato.results;

    let filas = "";

    for (let i = 0; i < compras.length; i++) {
      let c = compras[i];

      const fecha = c.Fecha
        ? new Date(c.Fecha).toLocaleDateString("es-NI")
        : "-";

      filas += "<tr>";
      filas += `<td>${i + 1}</td>`;
      filas += `<td>${c.NumCompra}</td>`;
      filas += `<td>${c.Proveedor_nombre ?? "-"}</td>`;
      filas += `<td>${fecha}</td>`;
      filas += `<td>C$ ${Number(c.Total).toLocaleString("es-NI")}</td>`;
      filas += `<td>${c.CondicionPago_nombre ?? "-"}</td>`;
      // filas += `<td>${c.estado_cuenta_descripcion ?? '-'}</td>`;

      // Columna: Detalle de compra
      filas += '<td class="td-acciones">';
      filas += `<button class="btn-accion" style="background:rgba(6,182,212,0.15);color:#0e7490;border:1px solid rgba(6,182,212,0.4);"
                  onclick="verDetalleCompra(${c.id}, ${c.NumCompra})">
                  🔍 Detalles
                </button>`;
      filas += "</td>";

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
      filas += "</td>";

      filas += "</tr>";
    }

    tbody.innerHTML =
      filas ||
      '<tr><td colspan="9" style="text-align:center;padding:20px;">Sin registros</td></tr>';
    cargando.style.display = "none";
    tabla.classList.add("visible");

    activarBuscadorGlobal("buscarCompra", "#bodyCompra tr");
  } catch (error) {
    cargando.textContent =
      "⚠ Error al conectar con la API. ¿Está corriendo el servidor Django?";
    console.error("Error en cargarCompras:", error);
  }
}

async function cargarOpcionesProveedor() {
  var select = document.getElementById("facturaCliente");

  // Limpiar las opciones anteriores
  select.innerHTML = '<option value="">-- Seleccione un cliente --</option>';

  try {
    var respuesta = await fetchConAutenticacion("catalogos/clientes/");
    var datos = await respuesta.json();
    var cliente = Array.isArray(datos) ? datos : datos.results;

    // Crear un <option> por cada departamento.
    // value = id (lo que se envía al API como FK)
    // textContent = nombre (lo que ve el usuario)

    //console.log('datos recibidos de la api: ', cliente); //visualizar cuales son los datos enviados

    for (var i = 0; i < cliente.length; i++) {
      var c = cliente[i];
      var option = document.createElement("option");
      option.value = c.id; // ← esto es lo que se envía como "departamento" en el body
      option.textContent = `${c.Nombres} cédula: ${c.NumCedula}`; // ← esto es lo que ve el usuario
      select.appendChild(option);
    }
  } catch (error) {
    console.error(
      "No se pudieron cargar los departamentos para el select:",
      error,
    );
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
let ncProductosTemp = []; // [ { prodId, nombre, cantidad, precio, subtotal } ]
let ncContadorFila = 0; // Clave interna para poder quitar filas

// ── Helpers ──────────────────────────────────────────────────

/** Formatea un número como moneda nicaragüense */
function ncMoneda(n) {
  return (
    "C$ " +
    Number(n).toLocaleString("es-NI", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
}

/** Recalcula el total y actualiza la celda en pantalla */
function ncActualizarTotal() {
  const total = ncProductosTemp.reduce((acc, p) => acc + p.subtotal, 0);
  document.getElementById("nc_total_display").textContent = ncMoneda(total);
}

/** Redibuja todas las filas de la tabla temporal */
function ncRedibujarTabla() {
  const tbody = document.getElementById("nc_tbody_productos");
  const tablaWrap = document.getElementById("nc_tabla_wrap");
  const sinProd = document.getElementById("nc_sin_productos");

  if (ncProductosTemp.length === 0) {
    tbody.innerHTML = "";
    tablaWrap.style.display = "none";
    sinProd.style.display = "block";
    ncActualizarTotal();
    return;
  }

  tablaWrap.style.display = "block";
  sinProd.style.display = "none";

  let filas = "";
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
window.abrirModalNuevaCompra = function (
  modo,
  id,
  numCompra,
  provId,
  total,
  condId,
  estId,
) {
  //const tablaDetalleCompra = document.getElementById('tablaDetalleCompra')

  //tablaDetalleCompra.classList.add('visible');
  ncProductosTemp = [];
  ncContadorFila = 0;

  document.getElementById("modalTextCompra").textContent =
    modo === "crear" ? "Nueva Compra" : "Editar Compra";

  [
    "nc_numero",
    "nc_fecha",
    "nc_proveedor",
    "nc_condicion",
    "nc_estado",
  ].forEach((id) => {
    document.getElementById(id).value = "";
  });

  // Limpiar campos de producto
  [
    "nc_prod_id",
    "nc_prod_nombre",
    "nc_prod_cantidad",
    "nc_prod_precio",
  ].forEach((id) => {
    document.getElementById(id).value = "";
  });

  const errorEl = document.getElementById("errorCompra");
  if (errorEl) errorEl.textContent = "";

  compraID = modo === "editar" ? id : null;
  document.getElementById("modalNuevaCompra").classList.add("activo");
};

window.abrirModalNuevaCompra1 = function (modalNuevaCompra) {
  // Limpiar estado
  ProductosTemp = [];
  cContadorFila = 0;

  // Limpiar campos de cabecera
  [
    "nc_numero",
    "nc_fecha",
    "nc_proveedor",
    "nc_condicion",
    "nc_estado",
  ].forEach((id) => {
    document.getElementById(id).value = "";
  });

  // Limpiar campos de producto
  [
    "nc_prod_id",
    "nc_prod_nombre",
    "nc_prod_cantidad",
    "nc_prod_precio",
  ].forEach((id) => {
    document.getElementById(id).value = "";
  });

  // Limpiar errores
  document.getElementById("nc_error_prod").textContent = "";
  document.getElementById("nc_error_compra").textContent = "";

  // Poner fecha de hoy por defecto
  const hoy = new Date().toISOString().split("T")[0];
  document.getElementById("nc_fecha").value = hoy;

  // Redibujar tabla (vacía)
  ncRedibujarTabla();

  // Abrir modal
  document.getElementById("modalNuevaCompra").classList.add("activo");
};

window.cerrarModalNuevaCompra = function () {
  document.getElementById("modalNuevaCompra").classList.remove("activo");
};

// ── Agregar producto a la lista temporal ─────────────────────

window.ncAgregarProducto = function () {
  const errorEl = document.getElementById("nc_error_prod");
  errorEl.textContent = "";

  const prodId = document.getElementById("nc_prod_id").value.trim();
  const nombre = document.getElementById("nc_prod_nombre").value.trim();
  const cantidad = parseFloat(
    document.getElementById("nc_prod_cantidad").value,
  );
  const precio = parseFloat(document.getElementById("nc_prod_precio").value);

  // Validaciones
  if (!prodId) {
    errorEl.textContent = "Ingresa el ID del producto.";
    return;
  }
  if (!nombre) {
    errorEl.textContent = "Ingresa el nombre del producto.";
    return;
  }
  if (!cantidad || cantidad <= 0) {
    errorEl.textContent = "La cantidad debe ser mayor a 0.";
    return;
  }
  if (isNaN(precio) || precio < 0) {
    errorEl.textContent = "Ingresa un precio válido.";
    return;
  }

  // Verificar duplicado por ID de producto
  const yaExiste = ncProductosTemp.find(
    (p) => String(p.prodId) === String(prodId),
  );
  if (yaExiste) {
    errorEl.textContent = `El producto ID ${prodId} ya está en la lista. Quítalo primero si quieres modificarlo.`;
    return;
  }

  const subtotal = cantidad * precio;
  ncContadorFila++;

  ncProductosTemp.push({
    _key: ncContadorFila,
    prodId: parseInt(prodId),
    nombre: nombre,
    cantidad: cantidad,
    precio: precio,
    subtotal: subtotal,
  });

  // Limpiar campos del producto
  [
    "nc_prod_id",
    "nc_prod_nombre",
    "nc_prod_cantidad",
    "nc_prod_precio",
  ].forEach((id) => {
    document.getElementById(id).value = "";
  });

  // Foco de vuelta al primer campo de producto
  document.getElementById("nc_prod_id").focus();

  ncRedibujarTabla();
};

// ── Quitar un producto de la lista temporal ───────────────────

window.ncQuitarProducto = function (key) {
  ncProductosTemp = ncProductosTemp.filter((p) => p._key !== key);
  ncRedibujarTabla();
};

// ── Anular: limpia todo y cierra ─────────────────────────────

window.anularNuevaCompra = function () {
  const confirmar = window.confirm(
    "¿Seguro que deseas anular esta compra?\nSe perderán todos los datos ingresados.",
  );
  if (!confirmar) return;

  ncProductosTemp = [];
  ncContadorFila = 0;
  cerrarModalNuevaCompra();
};

// ── Guardar: envía cabecera + detalles a la API ───────────────

window.guardarNuevaCompra = async function () {
  const errorEl = document.getElementById("nc_error_compra");
  errorEl.textContent = "";

  // Leer campos de cabecera
  const numCompra = document.getElementById("nc_numero").value.trim();
  const fecha = document.getElementById("nc_fecha").value;
  const provId = document.getElementById("nc_proveedor").value.trim();
  const condId = document.getElementById("nc_condicion").value.trim();
  const estId = document.getElementById("nc_estado").value.trim();

  // Validaciones de cabecera
  if (!numCompra || !fecha || !provId || !condId || !estId) {
    errorEl.textContent =
      "Completa todos los datos de la compra antes de guardar.";
    return;
  }
  if (ncProductosTemp.length === 0) {
    errorEl.textContent = "Agrega al menos un producto antes de guardar.";
    return;
  }

  // Calcular total desde los productos temporales
  const total = ncProductosTemp.reduce((acc, p) => acc + p.subtotal, 0);

  // ── Paso 1: Crear la compra (cabecera) ──
  const bodyCompra = JSON.stringify({
    NumCompra: parseInt(numCompra),
    Fecha: fecha,
    ProveedoresId: parseInt(provId),
    Total: total,
    condicionId: parseInt(condId),
    estadoCuentaId: parseInt(estId),
  });

  let compraCreada;
  try {
    const respCompra = await fetchConAutenticacion("movimiento/compras/", {
      method: "POST",
      body: bodyCompra,
    });

    if (!respCompra.ok) {
      const err = await respCompra.json();
      errorEl.textContent =
        "Error al guardar la compra: " + JSON.stringify(err);
      return;
    }
    compraCreada = await respCompra.json();
  } catch (e) {
    errorEl.textContent = "Error de conexión al guardar la compra.";
    console.error(e);
    return;
  }

  // ── Paso 2: Crear cada detalle vinculado a la compra ──
  const erroresDetalle = [];

  for (const p of ncProductosTemp) {
    const bodyDetalle = JSON.stringify({
      CompraId: compraCreada.id,
      detallProductoId: p.prodId,
      Cantidad: p.cantidad,
      PrecioUnitario: p.precio,
      Subtotal: p.subtotal,
    });

    try {
      const respDet = await fetchConAutenticacion(
        "movimiento/compras/detalles/",
        {
          method: "POST",
          body: bodyDetalle,
        },
      );
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
        erroresDetalle.join("\n"),
    );
  } else {
    alert(
      `✅ Compra N° ${numCompra} guardada correctamente con ${ncProductosTemp.length} producto(s).`,
    );
  }

  cerrarModalNuevaCompra();
  cargarCompras(); // Refresca el historial de compras
};

(function inyectarEstilosNuevaCompra() {
  const style = document.createElement("style");
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
    const respuesta = await fetchConAutenticacion(
      "movimiento/productos/destalle/",
    );
    const datos = await respuesta.json();
    const lista = Array.isArray(datos) ? datos : datos.results;

    const select = document.getElementById("invDetalleProducto");
    // Limpiar opciones anteriores excepto el placeholder
    select.innerHTML = '<option value="">-- Seleccione un producto --</option>';

    lista.forEach((det) => {
      // El serializer devuelve los IDs de FK; mostramos la representación disponible
      // Si el backend expande el __str__ usa det.label o det.toString
      const textoOpcion = det.producto_nombre
        ? `${det.producto_nombre} | Marca: ${det.marca_nombre} | Moto: ${det.moto_modelo}`
        : `ID ${det.id} — Producto: ${det.producto} | Marca: ${det.MarcaId} | Moto: ${det.MotoId}`;
      // option.textContent =`${f.producto_nombre}-marca: ${f.marca_nombre}-modelo: ${f.moto_modelo}`;

      const option = document.createElement("option");
      option.value = det.id;
      option.textContent = textoOpcion;
      select.appendChild(option);
    });
  } catch (error) {
    console.error("Error al cargar detalles de producto:", error);
  }
}

// ------------------------------------------
// Cargar historial de inventario en la tabla
// ------------------------------------------
export async function cargarInventario() {
  const cargando = document.getElementById("cargandoInventario");
  const tabla = document.getElementById("tablaInventario");
  const tbody = document.getElementById("bodyInventario");

  cargando.style.display = "block";
  tabla.classList.remove("visible");

  try {
    const respuesta = await fetchConAutenticacion(
      "movimiento/productos/inventarioLote/",
    );
    const datos = await respuesta.json();
    const lista = Array.isArray(datos) ? datos : datos.results;

    let filas = "";

    for (let i = 0; i < lista.length; i++) {
      const reg = lista[i];

      // Formatear fecha legible
      const fecha = reg.FechaRegistro
        ? new Date(reg.FechaRegistro).toLocaleString("es-EC", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })
        : "—";

      filas += "<tr>";
      filas += `<td>${i + 1}</td>`;
      filas += `<td>${reg.detalle_producto ?? "—"}</td>`;
      filas += `<td>${reg.Cantidad}</td>`;
      filas += `<td>C$${parseFloat(reg.precioCosto).toFixed(2)}</td>`;
      filas += `<td>C$${parseFloat(reg.PrecioVenta).toFixed(2)}</td>`;
      filas += `<td>${fecha}</td>`;
      filas += '<td class="td-acciones">';
      filas += `<button class="btn-accion btn-editar" onclick="abrirModalInventario('editar', ${reg.id}, ${reg.detalleProductoId}, ${reg.Cantidad}, ${reg.precioCompra}, ${reg.PrecioVenta})">✏ Editar</button>`;
      filas += `<button class="btn-accion btn-eliminar" onclick="eliminarInventario(${reg.id})">🗑 Eliminar</button>`;
      filas += "</td>";
      filas += "</tr>";
    }

    tbody.innerHTML =
      filas ||
      '<tr><td colspan="7" style="text-align:center">Sin registros</td></tr>';
    cargando.style.display = "none";
    tabla.classList.add("visible");
    activarBuscadorGlobal("buscarInventario", "#bodyInventario tr");
  } catch (error) {
    cargando.textContent =
      "⚠ Error al conectar con la API. ¿Está corriendo el servidor Django?";
    console.error("Error en cargarInventario:", error);
  }
}

// ------------------------------------------
// Abrir modal (crear o editar)
// ------------------------------------------
window.abrirModalInventario = async function (
  modo,
  id = null,
  detalleId = "",
  cantidad = "",
  precioCompra = "",
  precioVenta = "",
) {
  inventarioID = id;

  document.getElementById("modalTextInventario").textContent =
    modo === "crear"
      ? "Nuevo Registro de Inventario"
      : "Editar Registro de Inventario";

  // Cargar el select de productos siempre al abrir
  await cargarDetallesParaSelect();

  // Pre-llenar si es edición
  document.getElementById("invDetalleProducto").value = detalleId;
  document.getElementById("invCantidad").value = cantidad;
  document.getElementById("invPrecioCompra").value = precioCompra;
  document.getElementById("invPrecioVenta").value = precioVenta;
  document.getElementById("errorInventario").textContent = "";

  document.getElementById("modalInventario").classList.add("activo");
};

// ------------------------------------------
// Cerrar modal
// ------------------------------------------
window.cerrarModalInventario = function (idModal) {
  document.getElementById("invDetalleProducto").value = "";
  document.getElementById("invCantidad").value = "";
  document.getElementById("invPrecioCompra").value = "";
  document.getElementById("invPrecioVenta").value = "";
  document.getElementById("errorInventario").textContent = "";
  inventarioID = null;
  document.getElementById(idModal).classList.remove("activo");
};

// ------------------------------------------
// Guardar (crear o editar)
// ------------------------------------------
window.guardarInventario = async function () {
  const errorEl = document.getElementById("errorInventario");
  const detalleId = document.getElementById("invDetalleProducto").value;
  const cantidad = document.getElementById("invCantidad").value.trim();
  const precioCompra = document.getElementById("invPrecioCompra").value.trim();
  const precioVenta = document.getElementById("invPrecioVenta").value.trim();

  // Validación básica
  if (!detalleId || !cantidad || !precioCompra || !precioVenta) {
    errorEl.textContent = "Por favor, completa todos los campos.";
    return;
  }

  const payload = {
    detalleProductoId: parseInt(detalleId),
    Cantidad: parseInt(cantidad),
    precioCosto: parseFloat(precioCompra),
    PrecioVenta: parseFloat(precioVenta),
  };

  try {
    let respuesta;

    if (inventarioID) {
      // EDITAR — PATCH
      respuesta = await fetchConAutenticacion(
        `movimiento/productos/inventarioLote/${inventarioID}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
    } else {
      // CREAR — POST
      respuesta = await fetchConAutenticacion(
        "movimiento/productos/inventarioLote/",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
    }

    if (respuesta.ok) {
      cerrarModalInventario("modalInventario");
      cargarInventario();
    } else {
      const err = await respuesta.json();
      errorEl.textContent = "Error: " + JSON.stringify(err);
    }
  } catch (error) {
    errorEl.textContent = "Error de conexión con la API.";
    console.error("Error en guardarInventario:", error);
  }
};

// ------------------------------------------
// Eliminar (lógico)
// ------------------------------------------
window.eliminarInventario = async function (id) {
  const confirmar = window.confirm(
    "¿Estás seguro de que deseas eliminar este registro de inventario?",
  );
  if (!confirmar) return;

  try {
    const respuesta = await fetchConAutenticacion(
      `movimiento/productos/inventarioLote/${id}`,
      {
        method: "DELETE",
      },
    );

    if (respuesta.status === 204 || respuesta.ok) {
      cargarInventario();
    } else {
      alert("No se pudo eliminar. Código: " + respuesta.status);
    }
  } catch (error) {
    alert("Error de conexión con la API.");
    console.error("Error en eliminarInventario:", error);
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
