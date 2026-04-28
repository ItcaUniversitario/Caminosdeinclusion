// js/quiz_logic.js

import { db } from './firebase.js';
import { collection, query, where, getDocs, doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { cambiarPantalla } from './main.js';

// Variables globales para este archivo
let preguntasSeleccionadas = [];
let indiceActual = 0;
let respuestasPartida = [];
let opcionElegidaTemporal = null;
let modoActual = "PRE"; // "PRE" o "POST"

// ==========================================
// 1. EL CEREBRO: TRAER Y MEZCLAR PREGUNTAS
// ==========================================
export async function prepararCuestionario(caminoId) {
    try {
        // 🚨 LA MAGIA: Si ya tenemos preguntas guardadas del PRE-QUIZ, las reciclamos
        if (preguntasSeleccionadas.length > 0) {
            console.log("✅ Reutilizando las exactamente las mismas preguntas del PRE-QUIZ.");
            return true; 
        }

        const rawCamino = caminoId || sessionStorage.getItem('caminoSeleccionadoNum') || 1;
        const caminoNum = parseInt(rawCamino);
        const caminoStr = String(rawCamino);
        
        console.log(`🔍 Descargando preguntas nuevas para el Camino: ${caminoNum}`);

        const q = query(
            collection(db, "preguntas_cuestionario"), 
            where("camino", "in", [caminoNum, caminoStr])
        );
        
        const querySnapshot = await getDocs(q);
        const todasLasPreguntas = [];

        querySnapshot.forEach((doc) => {
            todasLasPreguntas.push({ id: doc.id, ...doc.data() });
        });

        if (todasLasPreguntas.length === 0) {
            console.warn(`⚠️ ALERTA: No se encontraron preguntas para el camino en Firebase.`);
            return false; 
        }

        const cantidadASeleccionar = Math.min(5, todasLasPreguntas.length);
        preguntasSeleccionadas = todasLasPreguntas.sort(() => 0.5 - Math.random()).slice(0, cantidadASeleccionar);

        // Mezclar las opciones
        preguntasSeleccionadas = preguntasSeleccionadas.map(pregunta => {
            const respuestaCorrectaTexto = pregunta.opciones[0]; 
            const opcionesMezcladas = [...pregunta.opciones].sort(() => 0.5 - Math.random());
            return { ...pregunta, opciones: opcionesMezcladas, respuestaCorrecta: respuestaCorrectaTexto };
        });

        console.log("✅ Cuestionario listo en memoria con", preguntasSeleccionadas.length, "preguntas.");
        return true;
    } catch (error) {
        console.error("❌ Error al preparar cuestionario:", error);
        return false;
    }
}
// ==========================================
// 2. LA INTERFAZ: PINTAR TODO EN PANTALLA
// ==========================================
export function iniciarQuizUI(modo = "PRE") {
    indiceActual = 0;
    respuestasPartida = []; // Limpiamos las respuestas del jugador, pero NO las preguntas
    modoActual = modo;
    
    document.getElementById('etiqueta-fase-texto').textContent = modo === "PRE" ? "PRE-QUIZ" : "POST-QUIZ";
    
    // 🚨 RESETEAR EL BOTÓN: Como lo usamos en el PRE-QUIZ, se quedó diciendo "Guardando..."
    const btnSiguiente = document.getElementById('btn-siguiente-quiz');
    if (btnSiguiente) {
        btnSiguiente.textContent = "Siguiente Pregunta";
    }
    
    mostrarPregunta();
}
function mostrarPregunta() {
    opcionElegidaTemporal = null;
    const btnSiguiente = document.getElementById('btn-siguiente-quiz');
    btnSiguiente.classList.add('bloqueado'); 
    
    const preguntaActual = preguntasSeleccionadas[indiceActual];
    
    // Textos
    document.getElementById('texto-progreso-quiz').textContent = `Pregunta ${indiceActual + 1} de 5`;
    document.getElementById('barra-progreso-quiz').style.width = `${((indiceActual + 1) / 5) * 100}%`;
    
    // 🚨 CAMBIO 1: Agregamos el número a la pregunta
    document.getElementById('texto-pregunta-quiz').textContent = `${indiceActual + 1}. ${preguntaActual.pregunta}`;
    
    // Botones
    const contenedorOpciones = document.getElementById('contenedor-opciones-quiz');
    contenedorOpciones.innerHTML = ''; 
    
    // 🚨 CAMBIO 2: Agregamos 'index' al forEach para saber qué número de opción es
    preguntaActual.opciones.forEach((opcionTexto, index) => {
        const btn = document.createElement('button');
        btn.className = 'btn-opcion-quiz';
        
        // Transformamos el índice (0, 1, 2, 3) en letras (A, B, C, D) usando código ASCII
        const letra = String.fromCharCode(65 + index); 
        btn.textContent = `${letra}. ${opcionTexto}`; // Mostramos la letra + opción
        
        // 🚨 CAMBIO 3: Guardamos el texto "limpio" en la memoria del botón para no romper la validación
        btn.dataset.respuesta = opcionTexto;
        
       btn.addEventListener('click', () => {
            if (!btnSiguiente.classList.contains('bloqueado')) return;
            
            opcionElegidaTemporal = opcionTexto; // Guardamos la limpia en la BD
            
            // Traemos los elementos de audio
            const audioAcierto = document.getElementById('sonidoAcierto');
            const audioError = document.getElementById('sonidoError');

            // 1. Evaluamos si es correcta o incorrecta
            if (opcionTexto === preguntaActual.respuestaCorrecta) {
                btn.classList.add('correcta'); // Se pinta de Verde
                
                // 🔊 REPRODUCIR SONIDO DE ACIERTO
                if (audioAcierto) {
                    audioAcierto.currentTime = 0; // Reinicia el sonido por si se hace clic rápido
                    audioAcierto.play().catch(e => console.warn("Audio bloqueado:", e));
                }

            } else {
                btn.classList.add('incorrecta'); // Se pinta de Rojo
                
                // 🔊 REPRODUCIR SONIDO DE ERROR
                if (audioError) {
                    audioError.currentTime = 0;
                    audioError.play().catch(e => console.warn("Audio bloqueado:", e));
                }
                
                // ==========================================
                // REVELACIÓN (SOLO PARA POST-QUIZ)
                // ==========================================
                if (modoActual === "POST") {
                    document.querySelectorAll('.btn-opcion-quiz').forEach(b => {
                        // 🚨 CAMBIO 4: Ahora comparamos con 'dataset.respuesta'
                        if (b.dataset.respuesta === preguntaActual.respuestaCorrecta) {
                            b.classList.add('correcta'); // Verde para la que debió ser
                        }
                    });
                }
            }
            
            // 2. Bloqueamos visualmente todos los botones
            document.querySelectorAll('.btn-opcion-quiz').forEach(b => b.classList.add('bloqueada'));
            
            // 3. Encendemos el botón Siguiente
            btnSiguiente.classList.remove('bloqueado');
        });
        
        contenedorOpciones.appendChild(btn);
    });
}
// ==========================================
// 3. EVENTOS: BOTÓN SIGUIENTE Y FINALIZAR
// ==========================================
document.getElementById('btn-siguiente-quiz').addEventListener('click', async () => {
    const btnSiguiente = document.getElementById('btn-siguiente-quiz');
    if (btnSiguiente.classList.contains('bloqueado')) return;
    
    // 🚨 CANDADO ANTI-ERRORES: Si ya no hay preguntas, no hacer nada
    if (indiceActual >= preguntasSeleccionadas.length) return;

    // Bloqueamos el botón temporalmente para evitar dobles clics
    btnSiguiente.classList.add('bloqueado');
    btnSiguiente.textContent = "Procesando..."; 
    
    const preguntaActual = preguntasSeleccionadas[indiceActual];
    
    // Guardamos la respuesta
    respuestasPartida.push({
        numeroPregunta: indiceActual + 1,
        idPreguntaFirebase: preguntaActual.id,
        preguntaTexto: preguntaActual.pregunta,
        respuestaElegida: opcionElegidaTemporal,
        respuestaCorrecta: preguntaActual.respuestaCorrecta, 
        fueCorrecta: opcionElegidaTemporal === preguntaActual.respuestaCorrecta 
    });
    
    indiceActual++;
    
    if (indiceActual < preguntasSeleccionadas.length) {
        mostrarPregunta();
        btnSiguiente.textContent = "Siguiente Pregunta"; // Restauramos el texto
    } else {
        btnSiguiente.textContent = "Guardando Resultados...";
        await finalizarQuiz();
    }
});
// ==========================================
// 4. GUARDADO FINAL EN FIREBASE (EL EQUIVALENTE A TU EJEMPLO)
// ==========================================
async function finalizarQuiz() {
    const idPartida = sessionStorage.getItem('idPartidaActual');
    
    if (idPartida) {
        try {
            const partidaRef = doc(db, "partidas", idPartida);
            
            // Si es la fase de PRE-QUIZ
            if (modoActual === "PRE") {
                await updateDoc(partidaRef, { 
                    respuestasPreQuiz: respuestasPartida, // Pasamos el array completo
                    estado: "en_mapa" 
                });
                console.log("✅ Respuestas del Pre-Quiz guardadas en Firebase.");
                cambiarPantalla('pantalla-mapa'); // Cambiamos de UI
            } 
            // Si es la fase de POST-QUIZ
            // Si es la fase de POST-QUIZ
            else {
                await updateDoc(partidaRef, { 
                    respuestasPostQuiz: respuestasPartida, 
                    estado: "finalizado" 
                });
                console.log("✅ Respuestas del Post-Quiz guardadas en Firebase.");
                
                // 🚨 NUEVO: Construimos el podio antes de mostrar la pantalla
                construirResultadosFinales();
                cambiarPantalla('pantalla-resultados'); 
            }
        } catch (error) {
            console.error("❌ Error al guardar las respuestas del Quiz en Firebase:", error);
        }
    } else {
        console.warn("⚠️ No hay partida activa para guardar el quiz.");
    }
}











// ==========================================
// 🏆 CONSTRUIR RANKING FINAL Y NAVEGACIÓN INTERNA
// ==========================================
export function construirResultadosFinales() {
    const contenedorRanking = document.getElementById('contenedor-ranking-final');
    const pantallaResultados = document.getElementById('pantalla-resultados');
    
    // 🚨 Buscamos la pantalla de caminos por su clase
    const pantallaCaminos = document.querySelector('.pantalla-caminos');

    if (!contenedorRanking) return;
    
    contenedorRanking.innerHTML = ''; 

    // 1. Recuperamos los datos de la sesión para armar el podio
    const datosGuardados = sessionStorage.getItem('personajesSeleccionados');
    let jugadoresFinales = JSON.parse(datosGuardados) || [];

    // 2. Ordenamos por empatía (de mayor a menor)
    jugadoresFinales.sort((a, b) => (b.puntosEmpatia || 0) - (a.puntosEmpatia || 0));

    // 3. Generamos las tarjetas del ranking
    jugadoresFinales.forEach((jugador, index) => {
        const medalla = index === 0 ? '🥇' : (index === 1 ? '🥈' : (index === 2 ? '🥉' : `#${index + 1}`));
        const esGanador = index === 0 ? 'ganador' : '';
        
        const tarjeta = document.createElement('div');
        tarjeta.className = `tarjeta-ranking ${esGanador}`;
        
        tarjeta.innerHTML = `
            <div class="puesto-ranking">${medalla}</div>
            <img class="avatar-ranking" src="${jugador.imagenFull || jugador.imagen}" alt="${jugador.nombre}">
            <div class="info-ranking">
                <span class="nombre-ranking">${jugador.nombreJugador || 'Jugador'} (${jugador.nombre})</span>
                <span class="pts-ranking">${jugador.puntosEmpatia || 0} pts de empatía</span>
            </div>
        `;
        contenedorRanking.appendChild(tarjeta);
    });

    // ==========================================
    // ⚡ LÓGICA DE LOS BOTONES (Cambio de pantalla)
    // ==========================================
    
    // BOTÓN 1: JUGAR DE NUEVO (Mismo equipo, elegir otro camino)
    const btnReintentar = document.getElementById('btn-jugar-de-nuevo');
    if (btnReintentar) {
        btnReintentar.onclick = () => {
            console.log("🔄 Preparando el mismo equipo para un nuevo camino...");

            // Limpiamos los puntos y mazos para que la nueva partida esté fresca
            const jugadoresReset = jugadoresFinales.map(j => ({
                ...j,
                puntosEmpatia: 0,
                posicionTablero: 0,
                cartasJugadas: [] 
            }));
            sessionStorage.setItem('personajesSeleccionados', JSON.stringify(jugadoresReset));

            // OCULTAR RESULTADOS Y MOSTRAR CAMINOS
            if (pantallaResultados) pantallaResultados.style.display = 'none';
            if (pantallaCaminos) {
                pantallaCaminos.style.display = 'flex'; // Asegúrate que sea flex o block según tu CSS
                // Si tienes animaciones en tu CSS, podrías usar: pantallaCaminos.classList.add('fade-in');
            }
        };
    }

    // BOTÓN 2: VOLVER AL INICIO (Nueva partida completa)
    const btnInicio = document.getElementById('btn-volver-inicio');
    if (btnInicio) {
        btnInicio.onclick = () => {
            console.log("🏠 Reiniciando juego desde cero...");
            sessionStorage.removeItem('personajesSeleccionados');
            // Como todo está en el index, recargar es la forma más segura de limpiar TODO
            window.location.reload(); 
        };
    }
}