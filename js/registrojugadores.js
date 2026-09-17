import { db } from './firebase-config.js';
import { doc, getDoc, setDoc, collection, addDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

let cantidadJugadores = 1;
window.mostrarVideoIntro = function () {
    const modal = document.getElementById('modal-video-intro');
    const video = document.getElementById('video-intro-pantalla');

    if (modal && video) {
        modal.style.display = 'flex';
        video.currentTime = 0;

        // 🔊 Activamos el sonido explícitamente
        video.muted = false;

        // Intentamos reproducir con audio
        video.play().catch(err => {
            console.warn("El navegador bloqueó el audio automático:", err);
            // 🛡️ Plan de respaldo: Si el navegador bloquea el sonido,
            // lo reproduce en silencio para que el juego no se detenga.
            video.muted = true;
            video.play();
        });
    }
};

window.cerrarVideoIntro = function () {
    const modal = document.getElementById('modal-video-intro');
    const video = document.getElementById('video-intro-pantalla');

    if (modal && video) {
        video.pause(); // Detiene reproducción y audio
        modal.style.display = 'none';
    }
};


// 👥 SELECCIÓN DE CANTIDAD DE JUGADORES
window.seleccionarCantidadJugadores = function (cantidad, event) {
    cantidadJugadores = cantidad;

    const botones = document.querySelectorAll('.btn-jugador');
    botones.forEach(boton => boton.classList.remove('seleccionado'));
    if (event && event.currentTarget) {
        event.currentTarget.classList.add('seleccionado');
    }

    window.prepararRegistro();
};
// 📝 AUXILIAR: PLANTILLA DEL FORMULARIO DE UN JUGADOR
function obtenerHTMLJugador(i) {
    return `
    <div class="bloque-jugador" id="bloque-jugador-${i}">
        <div class="check-listo">✔️</div>

        <!-- 🎯 TÍTULO Y BÚSQUEDA CENTRADOS -->
        <div class="cabecera-bloque-jugador" style="display: flex; align-items: center; justify-content: center; gap: 20px; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 2px dashed rgba(94, 42, 132, 0.2); flex-wrap: wrap;">
            
            <div style="display: flex; align-items: center; gap: 8px;">
                <span style="font-size: 1.3rem;">👤</span>
                <h4 style="margin: 0; color: var(--color-purple-dark); font-size: 1.05rem; font-weight: 800; text-transform: uppercase; white-space: nowrap;">
                   ¡Bienvenido Jugador ${i}! 
                </h4>
            </div>

            <div class="input-busqueda-wrapper" style="margin-bottom: 0;">
                <select id="tipo-doc-${i}" class="input-form select-doc" onchange="validarBloque(${i})">
                    <option value="cedula">Cédula (EC)</option>
                    <option value="pasaporte">Pasaporte</option>
                    <option value="extranjero">Extranjero</option>
                </select>
                <input type="text" id="doc-${i}" class="input-form input-doc" placeholder="Nro. de documento" required oninput="alCambiarDocumento(${i})"> 
                <button type="button" class="btn-buscar-compacto" onclick="buscarUsuarioEnDB(${i})" title="Buscar mis datos">🔍</button>
            </div>

        </div>

        <!-- FORMULARIO 2 COLUMNAS -->
        <div class="form-grid">
            <div class="form-grupo">
                <input type="text" id="nombres-${i}" class="input-form" placeholder="Tu Nombre *" required oninput="validarBloque(${i})">
            </div>
            <div class="form-grupo">
                <input type="text" id="apellidos-${i}" class="input-form" placeholder="Tu Apellido *" required oninput="validarBloque(${i})">
            </div>
            <div class="form-grupo">
                <input type="tel" id="celular-${i}" class="input-form" placeholder="📱 Celular *" required oninput="validarBloque(${i})">
            </div>
            <div class="form-grupo">
                <input type="email" id="correo-${i}" class="input-form" placeholder="✉️ Correo (Opcional)">
            </div>
            <div class="form-grupo">
                <select id="sexo-${i}" class="input-form">
                    <option value="" disabled selected>Género (Opcional)</option>
                    <option value="Femenino">Femenino</option>
                    <option value="Masculino">Masculino</option>
                </select>
            </div>
            <div class="form-grupo">
                <input type="number" id="edad-${i}" class="input-form" placeholder="🎂 Edad (Opcional)">
            </div>

            <div class="form-grupo">
                <select id="institucion-${i}" class="input-form" required onchange="validarBloque(${i})">
                    <option value="" disabled selected>🏫 Institución por la que participas *</option>
                    <option value="ITCA">ITCA</option>
                    <option value="Fundación CACMU">Fundación CACMU</option>
                </select>
            </div>

            <div class="checkbox-grupo">
                <input type="checkbox" id="terminos-${i}" required onchange="validarBloque(${i})">
                <label for="terminos-${i}">
                    ¡Estoy listo! Autorizo el uso de mis datos personales y acepto los <a href="https://drive.google.com/file/d/1FOWdO75X8GoajU0BsB5IGJPoMfGL54j2/view?usp=drive_link" target="_blank" class="enlace-terminos" onclick="event.stopPropagation();">Términos, Condiciones y Reglas del Juego</a> *
                </label>
            </div>
        </div>
        
    </div>
    `;
}

// 📝 PREPARAR CAMPOS DE REGISTRO (CONSERVANDO DATOS EXISTENTES)
window.prepararRegistro = function () {
    const contenedor = document.getElementById('contenedor-formularios');
    const btnIzq = document.querySelector('.btn-flecha.izq');
    const btnDer = document.querySelector('.btn-flecha.der');

    if (!contenedor) return;

    // Contamos cuántos bloques de jugador existen actualmente en pantalla
    const bloquesExistentes = contenedor.querySelectorAll('.bloque-jugador');
    const cantidadActual = bloquesExistentes.length;

    // ➕ SI EL USUARIO AUMENTÓ LA CANTIDAD: Agregamos solo los nuevos
    if (cantidadJugadores > cantidadActual) {
        for (let i = cantidadActual + 1; i <= cantidadJugadores; i++) {
            // insertAdjacentHTML inserta el nuevo HTML sin borrar ni resetear lo que ya existía
            contenedor.insertAdjacentHTML('beforeend', obtenerHTMLJugador(i));
        }
    } 
    // ➖ SI EL USUARIO REDUJO LA CANTIDAD: Removemos solo los sobrantes desde el final
    else if (cantidadJugadores < cantidadActual) {
        for (let i = cantidadActual; i > cantidadJugadores; i--) {
            const bloqueAEliminar = document.getElementById(`bloque-jugador-${i}`);
            if (bloqueAEliminar) {
                bloqueAEliminar.remove();
            }
        }
    }

    // Recalcular la validación global de botones y estados
    window.verificarTodosListos();

    // Gestión limpia del evento de desplazamiento
    contenedor.removeEventListener('scroll', window.actualizarFlechas);

    if (btnIzq && btnDer) {
        if (cantidadJugadores > 1) {
            btnIzq.style.display = 'flex';
            btnDer.style.display = 'flex';
            contenedor.addEventListener('scroll', window.actualizarFlechas);
            setTimeout(window.actualizarFlechas, 100);
        } else {
            btnIzq.style.display = 'none';
            btnDer.style.display = 'none';
        }
    }
};
// 🎡 CARRUSEL Y FLECHAS
window.moverCarrusel = function (direccion) {
    const contenedor = document.getElementById('contenedor-formularios');
    if (!contenedor) return;

    const tarjeta = contenedor.querySelector('.bloque-jugador');
    if (!tarjeta) return;

    const distancia = tarjeta.offsetWidth + 30;
    contenedor.scrollBy({ left: direccion * distancia, behavior: 'smooth' });
};

window.actualizarFlechas = function () {
    const contenedor = document.getElementById('contenedor-formularios');
    const btnIzq = document.querySelector('.btn-flecha.izq');
    const btnDer = document.querySelector('.btn-flecha.der');

    if (!contenedor || !btnIzq || !btnDer || cantidadJugadores <= 1) return;

    if (contenedor.scrollLeft <= 5) {
        btnIzq.style.opacity = '0.3';
        btnIzq.style.cursor = 'not-allowed';
        btnIzq.disabled = true;
    } else {
        btnIzq.style.opacity = '1';
        btnIzq.style.cursor = 'pointer';
        btnIzq.disabled = false;
    }

    if (Math.ceil(contenedor.scrollLeft + contenedor.clientWidth) >= contenedor.scrollWidth - 5) {
        btnDer.style.opacity = '0.3';
        btnDer.style.cursor = 'not-allowed';
        btnDer.disabled = true;
    } else {
        btnDer.style.opacity = '1';
        btnDer.style.cursor = 'pointer';
        btnDer.disabled = false;
    }
};
// ✅ VALIDACIÓN DE CAMPOS INDIVIDUAL
window.validarBloque = function (i) {
    const bloque = document.getElementById(`bloque-jugador-${i}`);
    if (!bloque) return;

    const tipoDoc = document.getElementById(`tipo-doc-${i}`).value;
    const docInput = document.getElementById(`doc-${i}`).value.trim();
    const nombres = document.getElementById(`nombres-${i}`).value.trim();
    const apellidos = document.getElementById(`apellidos-${i}`).value.trim();
    const celular = document.getElementById(`celular-${i}`).value.trim();
    const institucion = document.getElementById(`institucion-${i}`).value;
    const terminos = document.getElementById(`terminos-${i}`).checked;

    let docValido = docInput !== "";
    if (tipoDoc === 'cedula' && docInput.length === 10) {
        docValido = validarCedulaEcuatoriana(docInput);
    } else if (tipoDoc === 'cedula' && docInput.length !== 10) {
        docValido = false;
    }

    if (docValido && nombres !== "" && apellidos !== "" && celular !== "" && institucion !== "" && terminos) {
        bloque.classList.add('completado');
    } else {
        bloque.classList.remove('completado');
    }

    // 🎯 LLAMAR A LA VERIFICACIÓN GLOBAL DESPUÉS DE CADA CAMBIO
    window.verificarTodosListos();
};

// 🎯 VERIFICAR SI TODOS ESTÁN LISTOS (Solo para animaciones, ya no oculta el botón)
window.verificarTodosListos = function () {
    let todosListos = true;

    for (let i = 1; i <= cantidadJugadores; i++) {
        const bloque = document.getElementById(`bloque-jugador-${i}`);
        // Si no existe el bloque o le falta la clase 'completado', no están listos
        if (!bloque || !bloque.classList.contains('completado')) {
            todosListos = false;
            break;
        }
    }

    const contenedorBoton = document.getElementById('contenedor-boton-iniciar');
    if (contenedorBoton) {
        // Mantenemos el botón SIEMPRE visible
        contenedorBoton.style.display = 'flex';

        if (todosListos) {
            contenedorBoton.classList.add('animar-aparicion');
        } else {
            contenedorBoton.classList.remove('animar-aparicion');
        }
    }
};
function validarCedulaEcuatoriana(cedula) {
    if (cedula.length !== 10) return false;
    const digitoRegion = Number(cedula.substring(0, 2));
    if (digitoRegion < 1 || digitoRegion > 24) return false;

    const ultimoDigito = Number(cedula.substring(9, 10));
    let sumaPar = 0;
    let sumaImpar = 0;

    for (let i = 0; i < 9; i++) {
        let digito = Number(cedula.substring(i, i + 1));
        if (i % 2 === 0) {
            digito = digito * 2;
            if (digito > 9) digito -= 9;
            sumaImpar += digito;
        } else {
            sumaPar += digito;
        }
    }

    const sumaTotal = sumaPar + sumaImpar;
    const decenaSuperior = Math.ceil(sumaTotal / 10) * 10;
    let digitoValidador = decenaSuperior - sumaTotal;
    if (digitoValidador === 10) digitoValidador = 0;

    return digitoValidador === ultimoDigito;
}

window.limpiarCamposJugador = function (index) {
    document.getElementById(`nombres-${index}`).value = "";
    document.getElementById(`apellidos-${index}`).value = "";
    document.getElementById(`celular-${index}`).value = "";
    document.getElementById(`correo-${index}`).value = "";
    document.getElementById(`sexo-${index}`).value = "";
    document.getElementById(`edad-${index}`).value = "";
    document.getElementById(`institucion-${index}`).value = "";
    document.getElementById(`terminos-${index}`).checked = false;
};

window.alCambiarDocumento = function (index) {
    const docInput = document.getElementById(`doc-${index}`).value.trim();
    if (docInput === "") {
        window.limpiarCamposJugador(index);
    }
    window.validarBloque(index);
};

// 🔍 BÚSQUEDA Y GUARDADO EN FIREBASE
window.buscarUsuarioEnDB = async function (index) {
    const tipoDoc = document.getElementById(`tipo-doc-${index}`).value;
    const docInput = document.getElementById(`doc-${index}`);
    const documentoId = docInput.value.trim();

    if (!documentoId) {
        window.mostrarNotificacion("Ingresa un número de documento para buscar.", "warning");
        window.limpiarCamposJugador(index);
        window.validarBloque(index);
        return;
    }

    if (tipoDoc === 'cedula' && !validarCedulaEcuatoriana(documentoId)) {
        window.mostrarNotificacion("Cédula inválida. Revisa el número.", "error");
        return;
    }

    window.limpiarCamposJugador(index);
    window.validarBloque(index);

    window.mostrarNotificacion("Buscando en la base de datos...", "info");

    try {
        const docRef = doc(db, "usuarios", documentoId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            document.getElementById(`nombres-${index}`).value = data.nombres || "";
            document.getElementById(`apellidos-${index}`).value = data.apellidos || "";
            document.getElementById(`celular-${index}`).value = data.celular || "";
            document.getElementById(`correo-${index}`).value = data.correo || "";
            document.getElementById(`sexo-${index}`).value = data.sexo || "";
            document.getElementById(`edad-${index}`).value = data.edad || "";
            document.getElementById(`institucion-${index}`).value = data.institucion || "";

            const primerNombre = (data.nombres || "Aventurero").split(" ")[0];
            window.mostrarNotificacion(`¡${primerNombre} encontrado!`, "success");

            window.validarBloque(index);
        } else {
            window.mostrarNotificacion("Jugador nuevo. Por favor, llena los datos.", "warning");
        }
    } catch (error) {
        console.error("Error al buscar usuario:", error);
        window.mostrarNotificacion("Error de conexión al buscar.", "error");
    }
};

// 🔥 ESCUDO ANTI DOBLE-CLIC: Variable global que actúa como cerrojo
window.guardandoPartidaEnProceso = false;

window.guardarRegistroDB = async function () {
    // 1. CERROJO INMEDIATO: Si ya está trabajando, ignoramos cualquier clic extra al instante
    if (window.guardandoPartidaEnProceso) {
        console.warn("Bloqueando intento de doble envío...");
        return;
    }
    
    // 2. Activamos el cerrojo para bloquear la puerta
    window.guardandoPartidaEnProceso = true;

    const btnJugar = document.querySelector('.btn-continuar-top');
    const textoOriginal = btnJugar ? btnJugar.innerHTML : "Jugar ➔";

    // Cambiamos el botón a modo carga inmediatamente
    if (btnJugar) {
        btnJugar.disabled = true;
        btnJugar.innerHTML = "⏳ Validando...";
        btnJugar.style.opacity = "0.7";
        btnJugar.style.cursor = "wait";
    }

    // 3. FUNCIÓN PARA ABRIR EL CERROJO SI ALGO FALLA (Para no repetir código)
    const cancelarYRestaurarBoton = () => {
        window.guardandoPartidaEnProceso = false;
        if (btnJugar) {
            btnJugar.disabled = false;
            btnJugar.innerHTML = textoOriginal;
            btnJugar.style.opacity = "1";
            btnJugar.style.cursor = "pointer";
        }
    };

    try {
        const fechaActual = new Date().toISOString();
        const jugadoresDeEstaPartida = [];

        for (let i = 1; i <= cantidadJugadores; i++) {
            const tipoDoc = document.getElementById(`tipo-doc-${i}`).value;
            const documentoId = document.getElementById(`doc-${i}`).value.trim();
            const nombres = document.getElementById(`nombres-${i}`).value.trim();
            const apellidos = document.getElementById(`apellidos-${i}`).value.trim();
            const celular = document.getElementById(`celular-${i}`).value.trim();
            const institucion = document.getElementById(`institucion-${i}`).value;
            const terminosAceptados = document.getElementById(`terminos-${i}`).checked;

            if (!documentoId || !nombres || !apellidos || !celular || !institucion) {
                let faltantes = [];
                if (!documentoId) faltantes.push("Documento");
                if (!nombres) faltantes.push("Nombre");
                if (!apellidos) faltantes.push("Apellido");
                if (!celular) faltantes.push("Celular");
                if (!institucion) faltantes.push("Institución");

                window.mostrarNotificacion(`Jugador ${i}: Faltan datos obligatorios (${faltantes.join(', ')})`, "warning");
                cancelarYRestaurarBoton(); // 🔥 Abrimos el cerrojo
                return;
            }

            if (tipoDoc === 'cedula' && !validarCedulaEcuatoriana(documentoId)) {
                window.mostrarNotificacion(`La cédula del Jugador ${i} no es válida.`, "error");
                cancelarYRestaurarBoton();
                return;
            }

            if (!terminosAceptados) {
                window.mostrarNotificacion(`El Jugador ${i} debe aceptar los Términos y Condiciones.`, "warning");
                cancelarYRestaurarBoton();
                return;
            }

            const usuarioData = {
                cedula: documentoId,
                nombres: nombres.toUpperCase(),
                apellidos: apellidos.toUpperCase(),
                celular: celular,
                correo: document.getElementById(`correo-${i}`).value.trim(),
                sexo: document.getElementById(`sexo-${i}`).value,
                edad: document.getElementById(`edad-${i}`).value,
                institucion: institucion,
                terms: terminosAceptados,
                lastLogin: fechaActual
            };

            const docRef = doc(db, "usuarios", documentoId);
            const docSnap = await getDoc(docRef);

            if (!docSnap.exists()) {
                usuarioData.fechaRegistro = fechaActual;
            }
            await setDoc(docRef, usuarioData, { merge: true });

            const jugadorParaPartida = {
                cedula: documentoId,
                nombreJugador: nombres.split(" ")[0] + " " + apellidos.split(" ")[0], 
                institucion: institucion,
                puntaje: 0,
                tiempo: 0,
                estado: "jugando"
            };

            jugadoresDeEstaPartida.push(jugadorParaPartida);
        }

        if (btnJugar) btnJugar.innerHTML = "⏳ Creando partida...";

        // ✅ FORMA CORRECTA: Leer directamente la variable del Paso 1
        const caminoSeleccionado = sessionStorage.getItem("caminoSeleccionado") || "Violencia de Género";
        const partidaPreviaStr = sessionStorage.getItem("partidaActual");
        const partidaPrevia = partidaPreviaStr ? JSON.parse(partidaPreviaStr) : {};
        const datosPartida = {
            cantidadJugadores: cantidadJugadores,
            jugadores: jugadoresDeEstaPartida, 
            fechaCreacion: fechaActual,
            estado: "activa",
            camino: caminoSeleccionado 
        };

        const partidasRef = collection(db, "partidas");
        const docPartida = await addDoc(partidasRef, datosPartida);

        const sesionActual = {
            ...partidaPrevia, 
            idPartida: docPartida.id, 
            ...datosPartida
        };

        sessionStorage.setItem("partidaActual", JSON.stringify(sesionActual));
        
        console.log("Partida creada con ID:", docPartida.id);
        window.mostrarNotificacion("¡Partida creada con éxito!", "success");

        setTimeout(() => {
            window.cambiarPaso(3);
            cancelarYRestaurarBoton(); // Abrimos el cerrojo por si el jugador retrocede usando las flechas del navegador
        }, 800);

    } catch (error) {
        console.error("Error al guardar usuarios y partida:", error);
        window.mostrarNotificacion("Error de conexión. Intenta de nuevo.", "error");
        cancelarYRestaurarBoton(); // 🔥 Si falla el internet, permitimos volver a intentar
    }
};
// 🚀 INICIALIZACIÓN AUTOMÁTICA AL CARGAR LA PÁGINA
document.addEventListener('DOMContentLoaded', () => {
    window.prepararRegistro(); // Renderiza automáticamente al Jugador 1
});