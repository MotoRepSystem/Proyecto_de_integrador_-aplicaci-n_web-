const urlAPI = "https://motorepweb-api-h3ahb3c6hgfebpa6.centralus-01.azurewebsites.net/";

//const urlAPI = "https://qv0zgr4k-8000.use2.devtunnels.ms/"
//const urlAPI = "http://127.0.0.1:8000/";
const formLogin = document.getElementById("formulario");

if (formLogin) {
  formLogin.addEventListener("submit", login);
}

// === VARIABLES PARA EL CONTROL DE INACTIVIDAD ===
let tiempoInactividad;
let intervaloRefresco = null;
const TIEMPO_LIMITE_INACTIVIDAD = 5 * 60 * 1000; // 5 minutos en milisegundos (Ajustable)

// ==================== AUTENTICACIÓN ====================

/**
 * Realiza el login del usuario y almacena los tokens JWT
 */
async function login(e) {
  e.preventDefault();
  const pantallaCarga = document.getElementById("pantalla-carga");

  if (pantallaCarga) {
    pantallaCarga.classList.add("activo");
  }

  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  try {
    const respuesta = await fetch(urlAPI + "api/token/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        username: username,
        password: password
      })
    });

    const datos = await respuesta.json();

    if (respuesta.ok) {
      localStorage.setItem("access", datos.access);
      localStorage.setItem("refresh", datos.refresh);
      
      // NOTA: El refresco automático y el detector de actividad 
      // se iniciarán automáticamente al cargar index1.html
      window.location.href = "../layout/index1.html";

      document.getElementById("username").value = "";
      document.getElementById("password").value = "";
    } else {
      if (pantallaCarga) {
        pantallaCarga.classList.remove("activo");
      }
      document.getElementById("errorMensaje").textContent = "Usuario o contraseña incorrectos";
    }
    
  } catch (error) {
    if (pantallaCarga) {
      pantallaCarga.classList.remove("activo");
    }
    console.error("Error en login:", error);
    document.getElementById("errorMensaje").textContent = "Error de conexión con el servidor";
  }
}

/**
 * Obtiene el token de acceso actual
 */
export function obtenerAccessToken() {
  return localStorage.getItem("access");
}

/**
 * Obtiene el token de refresco actual
 */
function obtenerRefreshToken() {
  return localStorage.getItem("refresh");
}

/**
 * Refresca el token de acceso usando el refresh token
 */
export async function refrescarToken() {
  const refreshToken = obtenerRefreshToken();
  
  if (!refreshToken) {
    console.warn("No hay refresh token disponible");
    return false;
  }

  try {
    const respuesta = await fetch(urlAPI + "api/token/refresh/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        refresh: refreshToken
      })
    });

    const datos = await respuesta.json();

    if (respuesta.ok) {
      localStorage.setItem("access", datos.access);
      
      if (datos.refresh) {
        localStorage.setItem("refresh", datos.refresh);
      }
      
      console.log("Token refrescado exitosamente");
      return true;
    } else {
      console.warn("No se pudo refrescar el token");
      ejecutarCierreSesionInactividad();
      return false;
    }
  } catch (error) {
    console.error("Error al refrescar token:", error);
    ejecutarCierreSesionInactividad();
    return false;
  }
}

// ==================== LÓGICA DE INACTIVIDAD Y REFRESCO ====================

/**
 * Enciende el bucle de refresco (reutilizable)
 */
function iniciarRefrescoAutomatico() {
  if (intervaloRefresco === null) {
    console.log("Bucle de refresco automático activado.");
    intervaloRefresco = setInterval(async () => {
      const token = obtenerAccessToken();
      if (token) {
        await refrescarToken();
      }
    }, 50 * 1000); // 50 segundos
  }
}

/**
 * Apaga por completo el bucle de refresco para no consumir recursos de Django
 */
function detenerRefrescoAutomatico() {
  if (intervaloRefresco !== null) {
    clearInterval(intervaloRefresco);
    intervaloRefresco = null;
    console.log("Bucle de refresco automático desactivado por inactividad.");
  }
}

/**
 * Resetea el tiempo de espera cada vez que el usuario interactúa
 */
function reiniciarTemporizadorInactividad() {
  // 1. Limpiar el temporizador previo
  clearTimeout(tiempoInactividad);
  
  // 2. Asegurarse de que el refresco automático esté encendido mientras trabaje
  iniciarRefrescoAutomatico();

  // 3. Configurar la cuenta regresiva para desconectar
  tiempoInactividad = setTimeout(() => {
    ejecutarCierreSesionInactividad();
  }, TIEMPO_LIMITE_INACTIVIDAD);
}

/**
 * Desactiva todo, muestra la alerta solicitada y redirige al Login
 */
function ejecutarCierreSesionInactividad() {
  detenerRefrescoAutomatico();
  clearTimeout(tiempoInactividad);
  
  // Limpiar credenciales
  localStorage.removeItem("access");
  localStorage.removeItem("refresh");

  // Alerta que obliga al usuario a interactuar antes de ser redirigido
  alert("Se ha cerrado la sesión por inactividad. Por favor, inicie sesión nuevamente.");
  
  // Redirección
  window.location.href = "../login/login.html"; // Asegúrate de que esta ruta apunte bien a tu login
 // window.location.href = "https://qv0zgr4k-5501.use2.devtunnels.ms/frontend/login/login.html";
}

export function registrarControlInactividad() {
  const eventos = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];// se agrega los eventos
  
  // Cada interacción reiniciará los 5 minutos de gracia
  eventos.forEach(evento => {
    document.addEventListener(evento, reiniciarTemporizadorInactividad, true);
  });

  
}// Iniciar por primera vez el flujo
  reiniciarTemporizadorInactividad();

/**
 * Realiza logout manual (botón cerrar sesión convencional)
 */
export function logout() {
  detenerRefrescoAutomatico();
  clearTimeout(tiempoInactividad);
  localStorage.removeItem("access");
  localStorage.removeItem("refresh");
  window.location.href = "../login/login.html";
}

// ==================== PETICIONES AUTENTICADAS ====================

export async function fetchConAutenticacion(url, opciones = {}) {
  const token = obtenerAccessToken();
  
  const headers = {
    "Content-Type": "application/json",
    ...opciones.headers
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  let respuesta = await fetch(urlAPI + url, {
    ...opciones,
    headers: headers
  });

  if (respuesta.status === 401) {
    const refrescado = await refrescarToken();
    
    if (refrescado) {
      const nuevoToken = obtenerAccessToken();
      headers["Authorization"] = `Bearer ${nuevoToken}`;
      
      respuesta = await fetch(urlAPI + url, {
        ...opciones,
        headers: headers
      });
    } else {
      ejecutarCierreSesionInactividad();
    }
  }

  return respuesta;
}