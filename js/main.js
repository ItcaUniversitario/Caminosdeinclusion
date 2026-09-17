// 1. IMPORTA LA BASE DE DATOS Y LAS FUNCIONES DE FIRESTORE
import { db, precargarCartas } from './firebase-config.js'; 
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// IMPORTANTE: Importación de submódulos
import './registrojugadores.js';
import './seleccioncaminos.js';      
import './renderizarpersonajes.js';  
import './quiz.js';
import './tablero.js';

// Importamos la data de los caminos
import * as camino1 from './data/datacamino1.js';
import * as camino2 from './data/datacamino2.js';

// =========================================================
// VARIABLES GLOBALES DE ESTADO
// =========================================================
window.jugadores = [];
window.indiceTurnoActual = 0; 
window.personajesBloqueados = []; 
window.tableroCompletado = false; // 🚩 NUEVO: Controla si estamos en Pre-Quiz (false) o Post-Quiz (true)

// =========================================================
// UTILIDADES GLOBALES
// =========================================================
window.normalizarId = function(texto) {
    if (!texto) return "";
    return texto
        .toLowerCase()
        .normalize("NFD") // Separa las letras de sus tildes
        .replace(/[\u0300-\u036f]/g, "") // Borra las tildes
        .trim(); // Quita espacios al inicio y al final
};

// =========================================================
// GUARDAR JUGADORES EN FIREBASE
// =========================================================
window.guardarDatosYContinuar = async function(event) {
    if (event) event.preventDefault();

    const fechaActual = new Date().toISOString();
    const totalRegistros = window.cantidadJugadores || 1; 

    try {
        for (let i = 1; i <= totalRegistros; i++) {
            const docInput = document.getElementById(`numero-doc-${i}`);
            const nombresInput = document.getElementById(`nombres-${i}`);
            const apellidosInput = document.getElementById(`apellidos-${i}`);
            const celularInput = document.getElementById(`celular-${i}`);

            if (!docInput || !nombresInput || !apellidosInput || !celularInput) continue;

            const numeroDoc = docInput.value.trim();
            const nombres = nombresInput.value.toUpperCase().trim();
            const apellidos = apellidosInput.value.toUpperCase().trim();
            const celular = celularInput.value.trim();
            const correo = document.getElementById(`correo-${i}`) ? document.getElementById(`correo-${i}`).value : "";
            const edad = document.getElementById(`edad-${i}`) ? document.getElementById(`edad-${i}`).value : "";
            const sexo = document.getElementById(`sexo-${i}`) ? document.getElementById(`sexo-${i}`).value : "";

            if (!numeroDoc || !nombres || !apellidos || !celular) {
                alert(`Faltan datos obligatorios para el jugador ${i}`);
                return;
            }

            const jugadorData = {
                apellidos: apellidos,
                cedula: numeroDoc,
                celular: celular,
                correo: correo,
                edad: edad,
                fechaRegistro: fechaActual,
                lastLogin: fechaActual,
                nombres: nombres,
                sexo: sexo,
                terms: true
            };

            const docRef = doc(db, "usuarios", numeroDoc);
            await setDoc(docRef, jugadorData, { merge: true });
            console.log(`✅ Jugador guardado con ID ${numeroDoc}`);
        }

        // Pasamos al Paso 3 (Selección de Personajes/Caminos)
        window.cambiarPaso(3);

    } catch (error) {
        console.error("❌ Error al guardar en Firebase: ", error);
        alert("Hubo un problema guardando los datos. Por favor revisa tu conexión.");
    }
};

// =========================================================
// NAVEGACIÓN PRINCIPAL (FUNCIÓN ÚNICA Y CENTRAL)
// =========================================================
window.cambiarPaso = function(pasoDestino) {
    // 1. Ocultar todas las pantallas
    const pasos = document.querySelectorAll('.paso-pantalla');
    pasos.forEach(paso => {
        paso.classList.remove('activa');
        paso.style.display = 'none'; 
    });

    // 2. Mostrar la pantalla seleccionada
    const pasoMostrar = document.getElementById(`paso-${pasoDestino}`);
    if (pasoMostrar) {
        pasoMostrar.classList.add('activa');
        pasoMostrar.style.display = ''; 
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // 🎬 ACCIÓN AL ENTRAR AL PASO 2 (Registro de Jugadores + Video Intro)
    if (pasoDestino === 2) {
        if (typeof window.prepararRegistro === 'function') {
            window.prepararRegistro();
        }
        if (typeof window.mostrarVideoIntro === 'function') {
            window.mostrarVideoIntro();
        }
    }

    // ACCIÓN AL ENTRAR AL PASO 3 (Selección de personajes/turnos)
    if (pasoDestino === 3) {
        if (window.iniciarTurnos) window.iniciarTurnos(); 
    }

    // 📝/🎓 ACCIÓN AL ENTRAR AL PASO 4 (Pantalla del Quiz)
    if (pasoDestino === 4) {
        // 1. Renderizamos la lista de jugadores en el panel izquierdo
        if (typeof window.renderizarRosterQuiz === 'function') {
            window.renderizarRosterQuiz();
        }

        const caminoActual = window.caminoSeleccionado || 'Violencia de Género'; 

        // 2. 🛑 CONTROL DE EVALUACIÓN: ¿Pre-Quiz o Post-Quiz?
        if (!window.tableroCompletado) {
            console.log("📝 Cargando PRE-QUIZ...");
            if (window.cargarQuiz) window.cargarQuiz(caminoActual);
        } else {
            console.log("🎓 Cargando POST-QUIZ...");
            if (window.cargarPostQuiz) window.cargarPostQuiz();
        }
    }

    // 🎲 ACCIÓN AL ENTRAR AL PASO 5 (Tablero)
    if (pasoDestino === 5) {
        // 1. RESCATE DE MEMORIA: Recuperamos los jugadores si el arreglo global se vació
        if (!window.jugadores || window.jugadores.length === 0) {
            const memoria = sessionStorage.getItem("partidaActual");
            if (memoria) {
                const partida = JSON.parse(memoria);
                window.jugadores = partida.jugadores || [];
            }
        }

        // 2. PARCHE DE EMERGENCIA: Si no hay jugadores, creamos uno de prueba
        if (window.jugadores.length === 0) {
            console.warn("🚨 No hay jugadores en memoria. Creando jugador de prueba para evitar error fatal.");
            window.jugadores = [{
                cedula: "test-001",
                nombres: "Jugador de Prueba",
                avatarUrl: "assets/imagenes/personajes/avatar_default.png"
            }];
        }

        // 3. FORMATEADOR DE DATOS: Aseguramos que el tablero reciba id y nombre
        window.jugadores = window.jugadores.map((jug, index) => {
            return {
                ...jug,
                id: jug.cedula || `jugador-${index}`,
                nombre: jug.nombres || jug.nombreJugador || `Jugador ${index + 1}`,
                imagenPersonaje: jug.imagenPersonaje || jug.avatarUrl || 'assets/imagenes/personajes/avatar_default.png',
                puntos: jug.puntos || 0,
                posicion: 0
            };
        });

        // Turno inicial
        window.indiceTurnoActual = 0;

        const caminoActual = window.caminoSeleccionado || 'Violencia de Género'; 
        
        let fondoMapaUrl = '';
        let coordenadasMapa = []; 
        let numCamino = 1;

        if (caminoActual === 'Violencia de Género') {
            fondoMapaUrl = 'assets/imagenes/mapas/mapa_camino1.jpeg'; 
            coordenadasMapa = camino1.camino1 ? camino1.camino1.casillas : camino1.posicionesBase; 
            numCamino = 1;
        } else {
            fondoMapaUrl = 'assets/imagenes/mapas/mapa_camino2.jpeg';
            coordenadasMapa = camino2.camino2 ? camino2.camino2.casillas : camino2.posicionesBase; 
            numCamino = 2;
        }

        // Llenamos la mochila de cartas
        precargarCartas(window.jugadores, numCamino).then(() => {
            console.log("✅ Cartas precargadas correctamente para la partida.");
        });

        // Iniciamos el tablero
        if (window.iniciarTablero) window.iniciarTablero(fondoMapaUrl, coordenadasMapa);
    }
}

// =========================================================
// SISTEMA DE TURNOS (MULTIJUGADOR) - CENTRALIZADO
// =========================================================
window.iniciarTurnos = function() {
    console.log("🎮 Iniciando sistema global de turnos...");
    
    const memoria = sessionStorage.getItem("partidaActual");
    
    if (memoria) {
        const partida = JSON.parse(memoria);
        if (partida.jugadores && partida.jugadores.length > 0) {
            window.jugadores = partida.jugadores;
        }
    }

    window.indiceTurnoActual = 0; 
    window.personajesBloqueados = []; 
    window.tableroCompletado = false; // Reset de la bandera al iniciar nueva partida
    
    window.actualizarIndicadorTurno();
};

window.actualizarIndicadorTurno = function() {
    const spansNombre = document.querySelectorAll('.indicador-turno span, #nombre-jugador-actual');
    
    if (spansNombre.length > 0 && window.jugadores.length > 0) {
        const jugadorActual = window.jugadores[window.indiceTurnoActual];
        const nombreMostrar = jugadorActual.nombreJugador || jugadorActual.nombres || `Jugador ${window.indiceTurnoActual + 1}`;
        
        spansNombre.forEach(span => {
            span.textContent = nombreMostrar;
            span.style.color = "#ffc107";
        });
        
        console.log(`✅ Turno global actualizado: Le toca a ${nombreMostrar}`);
    }
};

// =========================================================
// SISTEMA GLOBAL DE NOTIFICACIONES FLOTANTES
// =========================================================
window.mostrarNotificacion = function(mensaje, tipo = 'info') {
    const existente = document.getElementById('toast-juego');
    if (existente) existente.remove();

    const toast = document.createElement('div');
    toast.id = 'toast-juego';
    toast.className = `toast-gamificado toast-${tipo}`;
    
    let icono = '💡';
    if (tipo === 'success') icono = '✅';
    if (tipo === 'error') icono = '❌';
    if (tipo === 'warning') icono = '⚠️';

    toast.innerHTML = `<span style="font-size: 1.4rem;">${icono}</span> <span>${mensaje}</span>`;
    document.body.appendChild(toast);

    setTimeout(() => toast.classList.add('mostrar'), 10);

    setTimeout(() => {
        toast.classList.remove('mostrar');
        setTimeout(() => toast.remove(), 500); 
    }, 3500);
};

// =========================================================
// CARGA INICIAL
// =========================================================
document.addEventListener('DOMContentLoaded', () => {
    window.cambiarPaso(1);
});

window.renderizarRosterQuiz = function() {
    const contenedorRoster = document.getElementById('roster-lista-jugadores');
    if (!contenedorRoster) return;

    if (!window.jugadores || window.jugadores.length === 0) {
        const memoria = sessionStorage.getItem("partidaActual");
        if (memoria) {
            const partida = JSON.parse(memoria);
            window.jugadores = partida.jugadores || [];
        }
    }

    contenedorRoster.innerHTML = '';

    if (window.jugadores.length === 0) {
        contenedorRoster.innerHTML = '<p style="font-size: 0.85rem; color: #666;">No hay jugadores registrados.</p>';
        return;
    }

    window.jugadores.forEach((jugador, index) => {
        const avatarUrl = jugador.imagenPersonaje || jugador.avatarUrl || 'assets/imagenes/personajes/avatar_default.png';
        const nombre = jugador.nombreJugador || jugador.nombres || `Jugador ${index + 1}`;
        
        const itemHTML = `
            <div class="chip-jugador" id="roster-item-${index}">
                <img src="${avatarUrl}" alt="${nombre}" style="width: 28px !important; height: 28px !important; object-fit: cover; object-position: center 5%;">
                <span>${nombre}</span>
            </div>
        `;
        contenedorRoster.insertAdjacentHTML('beforeend', itemHTML);
    });
};

window.actualizarTurnoRosterQuiz = function(nuevoIndice) {
    window.indiceTurnoActual = nuevoIndice;

    window.jugadores.forEach((_, index) => {
        const item = document.getElementById(`roster-item-${index}`);
        if (item) {
            const estadoSpan = item.querySelector('.roster-estado');
            if (index === nuevoIndice) {
                item.classList.add('activo');
                if (estadoSpan) estadoSpan.textContent = 'Turno actual';
            } else {
                item.classList.remove('activo');
                if (estadoSpan) estadoSpan.textContent = 'En espera';
            }
        }
    });
};

// =========================================================
// ⏳ LÓGICA DEL TEMPORIZADOR DE JUEGO (LÍMITE DE TIEMPO)
// =========================================================

// Variable global para detener el tiempo si llegan a la meta antes
window.intervaloTemporizador = null; 
window.iniciarTemporizadorSiExiste = async function(numeroCamino) {
    try {
        const { collection, query, where, getDocs } = await import("https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js");
        
        // 1. Buscamos el tiempo exacto para el camino actual
        // 🔥 Nota: Si tu panel de admin guarda el camino como TEXTO, cambia numeroCamino por String(numeroCamino)
        const q = query(collection(window.db || db, "configuracion_tiempos"), where("camino", "==", numeroCamino));
        const snapshot = await getDocs(q);
        
        let historial = [];
        snapshot.forEach((doc) => historial.push(doc.data()));

        // 2. SALVACAÍDAS: Si el admin no configuró el tiempo, usamos 15 minutos
        if (historial.length === 0) {
            console.warn(`⚠️ No hay tiempo guardado para el camino ${numeroCamino}. Iniciando con 15 min por defecto.`);
            arrancarReloj(15);
            return;
        }

        // 3. Obtenemos el tiempo configurado más reciente
        historial.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
        const minutosLimite = historial[0].minutos;

        // 4. Arrancamos el reloj oficial
        if (minutosLimite > 0) {
            arrancarReloj(minutosLimite);
        }
    } catch (error) {
        console.error("❌ Error al obtener la configuración de tiempo:", error);
    }
};
function arrancarReloj(minutos) {
    let tiempoRestante = minutos * 60; // Convertimos a segundos

    // 1. Buscamos el contenedor en el HTML
    const contenedorReloj = document.getElementById('contenedor-reloj-panel');
    
    if (!contenedorReloj) {
        console.error("No se encontró el contenedor del reloj en el HTML.");
        return;
    }

    // Lo hacemos visible
    contenedorReloj.style.display = 'block';

    // 2. Le damos un diseño elegante con un título descriptivo
    contenedorReloj.innerHTML = `
        <div style="text-align: center;">
            <span style="font-size: 0.85rem; font-weight: 800; color: #5e2a84; text-transform: uppercase; letter-spacing: 1px; opacity: 0.9;">
                ⏳ Tiempo límite de juego
            </span>
        </div>
        <div id="ui-reloj-interno" style="
            background: #f0eaf5; 
            color: #5e2a84; padding: 12px; border-radius: 12px;
            font-size: 1.6rem; font-weight: 900; 
            border: 2px solid #5e2a84;
            box-shadow: 0 4px 10px rgba(0,0,0,0.1);
            display: flex; justify-content: center; align-items: center; gap: 10px;
            transition: all 0.3s ease;">
            ⏱️ <span id="texto-reloj-numeros">00:00</span>
        </div>
    `;

    const textoNumeros = document.getElementById('texto-reloj-numeros');
    const uiInterno = document.getElementById('ui-reloj-interno');

    // 3. Empezar a contar hacia atrás
    window.intervaloTemporizador = setInterval(() => {
        tiempoRestante--;

        let m = Math.floor(tiempoRestante / 60);
        let s = tiempoRestante % 60;
        
        // Efecto visual: Si queda 1 minuto o menos, se vuelve rojo
        if (tiempoRestante <= 60) {
            uiInterno.style.background = "#ffebee"; // Fondo rojito claro
            uiInterno.style.color = "#d32f2f";      // Texto rojo oscuro
            uiInterno.style.borderColor = "#d32f2f";
            
            // Reusamos tu animación para que palpite
            uiInterno.style.animation = "palpitarCofre 1s infinite alternate"; 
        }

        // Formatear texto (ej: 09:05)
        textoNumeros.innerText = `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;

        // 4. ¡SE ACABÓ EL TIEMPO!
        if (tiempoRestante <= 0) {
            clearInterval(window.intervaloTemporizador);
            contenedorReloj.style.display = 'none'; // Ocultamos el reloj
            forzarFinDeJuego(); // Llamamos a la función que creamos antes
        }
    }, 1000);
}
function forzarFinDeJuego() {
    // 1. Cerrar cualquier modal que esté abierto
    const modal = document.getElementById('modal-contenido-casilla');
    if (modal) {
        modal.classList.add('hidden');
        modal.style.display = 'none';
    }
    
    // 2. Apagar videos que estén sonando
    const video = document.querySelector('video');
    if (video) { video.pause(); }

    // 3. Crear una alerta bonita de "Tiempo Agotado"
    const alertaFin = document.createElement('div');
    alertaFin.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
        background: rgba(0,0,0,0.85); display: flex; justify-content: center; align-items: center;
        z-index: 10005; flex-direction: column; text-align: center; color: white;
    `;
    alertaFin.innerHTML = `
        <div style="background: rgba(255,255,255,0.9); padding: 40px; border-radius: 20px; border: 4px solid #5e2a84;">
            <h1 style="color: #5e2a84; font-size: 3rem; margin-bottom: 10px;">¡Tiempo Agotado! ⏰</h1>
            <p style="color: #333; font-size: 1.2rem; font-weight: bold; margin-bottom: 20px;">El tiempo límite de esta sesión ha terminado.</p>
            <button id="btn-ir-quiz-timeout" style="background: linear-gradient(135deg, #9C27B0, #6A1B9A); color: white; padding: 15px 30px; border: none; border-radius: 10px; font-size: 1.2rem; font-weight: bold; cursor: pointer;">Ir a la Evaluación Final ➔</button>
        </div>
    `;
    document.body.appendChild(alertaFin);

    // 4. Al hacer clic, los mandamos al quiz (Paso 4)
    document.getElementById('btn-ir-quiz-timeout').addEventListener('click', () => {
        alertaFin.remove();
        
        window.tableroCompletado = true; 
        const tituloQuiz = document.querySelector('#paso-4 .quiz-titulos h2');
        const subTituloQuiz = document.querySelector('#paso-4 .quiz-titulos p');
        
        if (tituloQuiz) tituloQuiz.innerHTML = "Evaluación Final 🎓";
        if (subTituloQuiz) subTituloQuiz.textContent = "El tiempo terminó, ¡veamos cuánto aprendieron!";
        
        if (typeof window.cambiarPaso === 'function') {
            window.cambiarPaso(4); 
        }
    });
}


document.addEventListener("DOMContentLoaded", () => {
    const audioFondo = document.getElementById("audio-fondo");
    const btnSonido = document.getElementById("btn-sonido");
    const iconoSonido = btnSonido.querySelector("img");
    
    // 🔥 Define aquí las rutas exactas de tus dos iconos
    const iconActivo = "assets/imagenes/iconos/icono_sonido.png";
    const iconMute = "assets/imagenes/iconos/icono_sinsonido.png"; // Icono tachado o apagado
    
    // 1. Ajustar el volumen bien bajo (0.0 a 1.0)
    audioFondo.volume = 0.15; 
    
    let interaccionIniciada = false;

    // 2. Reproducir al primer clic en CUALQUIER parte del juego
    document.body.addEventListener("click", () => {
        if (!interaccionIniciada) {
            audioFondo.play().catch(error => console.log("Bloqueado por el navegador"));
            interaccionIniciada = true;
            // Asegurarnos de mostrar el icono activo cuando empieza la música
            iconoSonido.src = iconActivo;
        }
    }, { once: true });

    // 3. Funcionalidad de tu botón de sonido (Mutear / Desmutear y cambiar imagen)
    btnSonido.addEventListener("click", (e) => {
        e.stopPropagation(); 
        
        if (audioFondo.paused || audioFondo.muted) {
            // Encender audio
            audioFondo.muted = false;
            audioFondo.play();
            iconoSonido.src = iconActivo; // 🔥 Cambia a la imagen de sonido encendido
        } else {
            // Apagar audio
            audioFondo.muted = true;
            iconoSonido.src = iconMute; // 🔥 Cambia a la imagen de sonido apagado
        }
    });
});

document.addEventListener("DOMContentLoaded", () => {
    const btnInicio = document.getElementById("btn-inicio");
    const paso1 = document.getElementById("paso-1");

    if (btnInicio) {
        btnInicio.addEventListener("click", () => {
            // Verificamos si el paso 1 está oculto (es decir, el juego ya empezó)
            // Usamos getComputedStyle para saber si realmente tiene display: none
            const estaEnJuego = paso1 && window.getComputedStyle(paso1).display === "none";

            if (estaEnJuego) {
                // Si ya está jugando, mostramos la advertencia
                const confirmacion = confirm("⚠️ ¿Estás seguro de que quieres volver al inicio?\n\nSe perderán todos los datos, turnos y avances de esta partida si aún no has terminado.");
                
                if (confirmacion) {
                    // Si el usuario da clic en "Aceptar", recargamos la página limpiando todo
                    window.location.reload();
                }
                // Si da clic en "Cancelar", no pasa nada y sigue jugando
            } else {
                // Si ya está en la pantalla de inicio (paso-1), recargamos directamente sin preguntar
                // o puedes dejarlo vacío para que simplemente no haga nada.
                window.location.reload(); 
            }
        });
    }
});