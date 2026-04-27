// js/seleccionar_personaje.js

import { db } from './firebase.js';
import { doc, updateDoc, arrayUnion } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { datosDeTodosLosJugadores } from './registro_usuarios.js';
import { personajesData } from './data/datacamino1.js';
import { cambiarPantalla } from './main.js';
// Al inicio de seleccionar_personaje.js:
import { prepararCuestionario, iniciarQuizUI } from './quiz_logic.js';

let turnoActual = 0; // Índice del jugador que está eligiendo (0, 1, 2...)
let personajesSeleccionados = [];

export function configurarSeleccionPersonaje() {
    const fichas = document.querySelectorAll('.ficha-personaje');

    // ✅ CORRECCIÓN: El botón de confirmar mantiene este ID
    const btnSeleccionar = document.getElementById('btn-confirmar-personaje');
    // 👇 AÑADE ESTO PARA EL BOTÓN DE CERRAR 👇
    const btnCerrar = document.getElementById('btn-cerrar-modal-pj');
    if (btnCerrar) {
        btnCerrar.addEventListener('click', () => {
            const modal = document.getElementById('modal-pj-overlay');
            modal.classList.remove('activa');
        });
    }
    actualizarIndicadorTurno();

    fichas.forEach(ficha => {
        ficha.addEventListener('click', () => {
            const idPersonaje = ficha.getAttribute('data-personaje');
            abrirModal(idPersonaje);
        });
    });

    if (btnSeleccionar) {
        btnSeleccionar.addEventListener('click', async () => {
            const idPersonaje = btnSeleccionar.getAttribute('data-personaje-actual');
            await confirmarSeleccion(idPersonaje);
        });
    }
}

function abrirModal(id) {
    const data = personajesData[id];

    // ✅ CORRECCIÓN: Usamos los nuevos IDs del HTML (.modal-pj-)
    const modal = document.getElementById('modal-pj-overlay');

    if (!modal) {
        console.error("❌ No se encontró el modal en el HTML. Revisa los IDs.");
        return;
    }

    // Rellenamos el modal con los IDs actualizados
    document.getElementById('modal-pj-img').src = data.imagenFull;
    document.getElementById('modal-pj-nombre').textContent = data.nombre;
    document.getElementById('modal-pj-historia').textContent = data.historia;
    document.getElementById('btn-confirmar-personaje').setAttribute('data-personaje-actual', id);

    // ✅ CORRECCIÓN: Tu CSS usa la clase 'activa', no 'visible'
    modal.classList.add('activa');
}

function actualizarIndicadorTurno() {
    const indicador = document.getElementById('indicador-turno-texto');

    // Verificamos que el elemento exista y que haya jugadores registrados
    if (indicador && datosDeTodosLosJugadores && datosDeTodosLosJugadores[turnoActual]) {
        // Extraemos el nombre del jugador actual y lo inyectamos
        const nombreJugador = datosDeTodosLosJugadores[turnoActual].nombres;
        indicador.innerHTML = `Turno de: <strong>${nombreJugador}</strong>`;
    }
}
// Añade esto en js/seleccionar_personaje.js

// Añade esta función en tu js/seleccionar_personaje.js (si no la tienes aún)
export function iniciarPantallaSeleccion() {
    turnoActual = 0;
    personajesSeleccionados = [];
    actualizarIndicadorTurno(); // Pinta el nombre del Jugador 1
}

async function confirmarSeleccion(id) {
    if (!datosDeTodosLosJugadores[turnoActual]) {
        console.warn("⚠️ No hay datos del jugador para este turno.");
        return;
    }

    const jugador = datosDeTodosLosJugadores[turnoActual];
    const idPartida = sessionStorage.getItem('idPartidaActual');

    try {
        const partidaRef = doc(db, "partidas", idPartida);

        personajesSeleccionados.push({
            cedula: jugador.cedula,
            personaje: id
        });

        // ==========================================
        // 👇 NUEVO: BLOQUEO VISUAL DE LA FICHA ELEGIDA
        // ==========================================
        // Buscamos el botón exacto que acaban de elegir
        const botonElegido = document.querySelector(`.ficha-personaje[data-personaje="${id}"]`);

        if (botonElegido) {
            // 1. Le agregamos la clase que lo pone gris y desactiva el clic
            botonElegido.classList.add('ya-elegido');

            // 2. Creamos la banda que dice quién lo eligió
            const etiquetaDueno = document.createElement('div');
            etiquetaDueno.className = 'etiqueta-dueno';
            // Reemplaza la línea de etiquetaDueno.innerHTML por esta:
            etiquetaDueno.innerHTML = `<span class="texto-previo">ELEGIDO POR</span><span class="nombre-dueno">${jugador.nombres}</span>`;

            // 3. Se la inyectamos a la carta
            botonElegido.appendChild(etiquetaDueno);
        }
        // ==========================================

        if (turnoActual < datosDeTodosLosJugadores.length - 1) {
            // Siguiente jugador
            turnoActual++;
            actualizarIndicadorTurno();

            document.getElementById('modal-pj-overlay').classList.remove('activa');
            alert(`¡Excelente! Ahora es el turno de ${datosDeTodosLosJugadores[turnoActual].nombres}`);

        } else {
            // Ya eligieron todos
            console.log("Todos los personajes elegidos. Guardando selección final...");

            // =================================================================
            // 🚨 NUEVO: PREPARAMOS Y GUARDAMOS LOS DATOS EXACTOS PARA EL MAPA
            // =================================================================
            const datosParaElMapa = personajesSeleccionados.map((seleccion, index) => {
                const dataPj = personajesData[seleccion.personaje];
                
                // 🚨 MAGIA AQUÍ: Buscamos al jugador real usando el mismo orden (index)
                const jugadorReal = datosDeTodosLosJugadores[index]; 
                
                return {
                    id: seleccion.personaje,
                    nombre: dataPj.nombre, // El nombre del avatar (ej: Paula)
                    nombreJugador: jugadorReal.nombres, // 🚨 El nombre del jugador (ej: Domenica) para el Score!
                    imagenFull: dataPj.imagenFull,
                    puntosEmpatia: 0 
                };
            });
            
            // Guardamos en la "caja" exacta que el mapa está buscando
            sessionStorage.setItem('personajesSeleccionados', JSON.stringify(datosParaElMapa));
            // =================================================================
            // =================================================================

            await prepararCuestionario(1);
            iniciarQuizUI("PRE");
            
            await updateDoc(partidaRef, {
                seleccionFinalizada: true,
                mapeoPersonajes: personajesSeleccionados, // Esto va a Firebase (solo IDs)
                estado: "en_pre_quiz" 
            });

            document.getElementById('modal-pj-overlay').classList.remove('activa');
            cambiarPantalla('pantalla-quiz'); 
        }
    } catch (error) {
        console.error("Error al guardar personaje:", error);
    }
}