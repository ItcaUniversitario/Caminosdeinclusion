// =========================================================
// LÓGICA DEL PRE-QUIZ Y POST-QUIZ CON SONIDOS Y LEYENDA
// =========================================================
import { db } from './firebase-config.js';
import { collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// 1. VARIABLES GLOBALES UNIFICADAS
window.respuestasJugador = {};
window.preguntasSeleccionadas = []; // Guarda las preguntas para el post-quiz
window.correctasPreQuiz = 0;
window.correctasPostQuiz = 0;
window.faseActualQuiz = 'pre'; // 'pre' o 'post'

// 🔊 Precargar los sonidos
const sonidoAcierto = new Audio('/assets/sonido/sonido_correcto.mp3');
const sonidoError = new Audio('/assets/sonido/sonido_incorrecto.mp3');

// =========================================================
// CARGA INICIAL DEL PRE-QUIZ (Antes del tablero)
// =========================================================
window.cargarQuiz = async function (nombreCamino) {
    const contenedor = document.getElementById('contenedor-quiz');
    const btnFinalizar = document.getElementById('btn-finalizar-quiz');

    if (!contenedor) return;

    window.respuestasJugador = {};
    window.correctasPreQuiz = 0;

    contenedor.innerHTML = '<div class="mensaje-carga">Buscando preguntas en la base de datos... ⏳</div>';
    if (btnFinalizar) {
        btnFinalizar.disabled = true;
        btnFinalizar.style.opacity = "0.5";
        btnFinalizar.style.display = "none"; // Ocultar hasta terminar
    }

    let caminoDB = 1;
    if (nombreCamino === 'Estereotipos') caminoDB = 2;

    try {
        const q = query(collection(db, "preguntas_cuestionario"), where("camino", "==", caminoDB));
        const querySnapshot = await getDocs(q);

        let todasLasPreguntas = [];
        querySnapshot.forEach((doc) => {
            todasLasPreguntas.push({ id: doc.id, ...doc.data() });
        });

        // Seleccionar 5 aleatorias
        const preguntasAleatorias = todasLasPreguntas
            .sort(() => 0.5 - Math.random())
            .slice(0, 5);

        // Guardamos las preguntas para usarlas idénticas en el Post-Quiz
        window.preguntasSeleccionadas = preguntasAleatorias;

        renderizarQuizSlider(preguntasAleatorias, 'contenedor-quiz', 'btn-finalizar-quiz', 'pre');

    } catch (error) {
        console.error("❌ Error cargando el Quiz: ", error);
        contenedor.innerHTML = '<div class="mensaje-carga" style="color: #ff6b6b;">Error al cargar las preguntas. Revisa tu conexión.</div>';
    }
};

// =========================================================
// CARGA DEL POST-QUIZ (Después del tablero)
// Llama a esta función para reutilizar la Pantalla 4
// =========================================================
window.cargarPostQuiz = function () {
    const btnFinalizar = document.getElementById('btn-finalizar-quiz');
    if (btnFinalizar) {
        btnFinalizar.disabled = true;
        btnFinalizar.style.opacity = "0.5";
        btnFinalizar.style.display = "none";
    }
    
    window.correctasPostQuiz = 0;
    
    // Mostramos el marcador global de nuevo si lo ocultaste en el pre-quiz
    const marcadorGlobal = document.getElementById('marcador-global');
    if (marcadorGlobal) marcadorGlobal.style.display = 'block';

    // Reutilizamos las preguntas guardadas
    renderizarQuizSlider(window.preguntasSeleccionadas, 'contenedor-quiz', 'btn-finalizar-quiz', 'post');
};
// =========================================================
// FUNCIÓN RENDERIZADORA PARA AMBAS FASES
// =========================================================
function renderizarQuizSlider(preguntas, contenedorId, btnFinalizarId, fase) {
    window.faseActualQuiz = fase;
    const contenedor = document.getElementById(contenedorId);

    // 1. Variables de Estado
    let correctasFase = 0;
    let incorrectasFase = 0;
    let slideActual = 0;
    const letras = ['A', 'B', 'C', 'D'];

    // 2. Actualizar marcador superior si existe
    const marcadorTotal = document.getElementById('marcador-total');
    if (marcadorTotal) marcadorTotal.textContent = preguntas.length;

    // 3. Estructura Base del Slider
    contenedor.innerHTML = `
        <div class="quiz-slider-wrapper" style="overflow: hidden; width: 100%; padding-bottom: 10px;">
            <div class="quiz-slider-track quiz-slide-animado" id="quiz-track-${fase}" style="display: flex;"></div>
        </div>
    `;

    const track = document.getElementById(`quiz-track-${fase}`);
    const marcadorNum = document.getElementById('marcador-num');
    if (marcadorNum) marcadorNum.textContent = 1;

    // 4. Renderizar Preguntas
    preguntas.forEach((preguntaData, index) => {
        let opcionesMezcladas = preguntaData.opciones.map((texto, i) => {
            return { texto: texto, esCorrecta: i === 0 };
        }).sort(() => 0.5 - Math.random());

        const slide = document.createElement('div');
        slide.classList.add('quiz-slide');
        slide.style.minWidth = '100%';
        slide.style.padding = '0 5px';

        // 🔥 NUEVO: Añadimos un div "feedback-..." debajo de las opciones para mostrar el mensaje
        slide.innerHTML = `
            <div class="quiz-pregunta-card">
                <p style="font-size: 1.15rem; color: #212121; line-height: 1.5; margin: 0;">
                    <strong style="color: #4a148c; font-size: 1.3rem;">${index + 1}.</strong> ${preguntaData.pregunta}
                </p>
                <div class="quiz-grid-opciones" id="opciones-${fase}-${preguntaData.id}"></div>
                
                <div id="feedback-${fase}-${preguntaData.id}" style="text-align: center; margin-top: 15px; font-size: 1.15rem; font-weight: 800; min-height: 30px; opacity: 0; transition: opacity 0.3s ease;">
                    <!-- Aquí aparecerá el texto Excelente o No te preocupes -->
                </div>
            </div>
        `;
        track.appendChild(slide);

        const contenedorOpciones = slide.querySelector(`#opciones-${fase}-${preguntaData.id}`);
        // Capturamos el div de feedback que acabamos de crear
        const feedbackDiv = slide.querySelector(`#feedback-${fase}-${preguntaData.id}`);

        opcionesMezcladas.forEach((opcion, i) => {
            const btn = document.createElement('button');
            btn.className = 'quiz-btn-premium';

            btn.innerHTML = `
                <span class="quiz-letra-circulo">${letras[i]}</span>
                <span style="flex: 1; word-break: break-word; font-size: 0.95rem; line-height: 1.4;">${opcion.texto}</span>
                <span class="icono-resultado" style="font-size: 1.3rem; font-weight: bold; width: 24px; text-align: right;"></span>
            `;

            btn.addEventListener('click', () => {
                const botones = contenedorOpciones.querySelectorAll('.quiz-btn-premium');
                botones.forEach(b => {
                    b.disabled = true;
                    b.style.opacity = "0.5";
                    b.style.transform = "scale(0.98)";
                });

                btn.style.opacity = "1";
                btn.style.transform = "scale(1)";
                const iconoSpan = btn.querySelector('.icono-resultado');

                // 🔥 NUEVO: Hacemos visible el div de feedback
                feedbackDiv.style.opacity = "1";

              if (opcion.esCorrecta) {
                    btn.style.borderColor = "#9c27b0"; 
                    btn.style.backgroundColor = "#f3e5f5";
                    btn.style.color = "#4a148c";
                    iconoSpan.textContent = "⭐"; 
                    iconoSpan.style.color = "#ff9800";

                    feedbackDiv.textContent = "¡Excelente! Respuesta correcta 🌟";
                    feedbackDiv.style.color = "#4a148c";
                    feedbackDiv.style.backgroundColor = "#f3e5f5";
                    feedbackDiv.style.border = "1px solid #9c27b0";
                    feedbackDiv.style.boxShadow = "0 4px 10px rgba(156, 39, 176, 0.2)";

                    correctasFase++;
                    
                    // 🔊 REPRODUCIR SONIDO DE ACIERTO
                    try {
                        bancoSonidos.acierto.currentTime = 0;
                        bancoSonidos.acierto.play();
                    } catch (e) { console.log("Audio bloqueado:", e); }

                } else {
                    btn.style.borderColor = "#e53935";
                    btn.style.backgroundColor = "#ffebee";
                    btn.style.color = "#b71c1c";
                    iconoSpan.textContent = "✖";
                    iconoSpan.style.color = "#e53935";

                    feedbackDiv.textContent = "No te preocupes, ¡aquí aprenderemos! 💪";
                    feedbackDiv.style.color = "#b71c1c";
                    feedbackDiv.style.backgroundColor = "#ffebee";
                    feedbackDiv.style.border = "1px solid #e53935";
                    feedbackDiv.style.boxShadow = "0 4px 10px rgba(229, 57, 53, 0.2)";

                    incorrectasFase++;
                    
                    // 🔊 REPRODUCIR SONIDO DE ERROR
                    try {
                        bancoSonidos.error.currentTime = 0;
                        bancoSonidos.error.play();
                    } catch (e) { console.log("Audio bloqueado:", e); }
                }

                if (fase === 'pre') window.correctasPreQuiz = correctasFase;
                if (fase === 'post') window.correctasPostQuiz = correctasFase;

                // 🔥 MODIFICADO: Aumenté el tiempo de 1200 a 1800 milisegundos para que 
                // tengan tiempo suficiente de leer el mensaje antes de que cambie la pregunta
                setTimeout(() => {
                    slideActual++;

                    if (slideActual < preguntas.length) {
                        track.style.transform = `translateX(-${slideActual * 100}%)`;
                        if (marcadorNum) marcadorNum.textContent = slideActual + 1;
                    } else {
                        // Fin del quiz (pre o post)
                        const marcadorGlobal = document.getElementById('marcador-global');
                        if (marcadorGlobal) marcadorGlobal.style.display = 'none';

                        let tituloMensaje = correctasFase === 5 ? "¡Puntuación Perfecta! " :
                                            correctasFase === 4 ? "¡Casi Perfecto! " :
                                            correctasFase === 3 ? "¡Buen Trabajo! " :
                                            correctasFase > 0 ? "¡Buen Esfuerzo! " : "¡Aprender es la meta!";
                                            
                        let textoMensaje = correctasFase === 5 ? "Dominan este tema a la perfección." :
                                           correctasFase === 4 ? "Tienen un excelente conocimiento." :
                                           correctasFase === 3 ? "Han demostrado una buena base." :
                                           correctasFase > 0 ? "Aún hay mucho por descubrir." : "Descubran todo paso a paso.";

                        contenedor.innerHTML = `
                            <div style="text-align: center; padding: 30px 10px; animation: fadeIn 0.8s ease;">
                                <h3 style="color: #4a148c; margin-bottom: 10px; font-size: 1.8rem;">${tituloMensaje}</h3>
                                <p style="color: #666; font-size: 1.1rem; margin-bottom: 25px;">${textoMensaje}</p>
                                
                                <div style="display: flex; justify-content: center; gap: 20px; flex-wrap: wrap;">
                                    <div style="background: #f1f8e9; padding: 15px 25px; border-radius: 12px; border: 2px solid #4caf50;">
                                        <span style="display: block; font-size: 2rem; margin-bottom: 5px;">✔️</span>
                                        <strong style="color: #2e7d32; font-size: 1.2rem;">${correctasFase} Correctas</strong>
                                    </div>
                                    <div style="background: #ffebee; padding: 15px 25px; border-radius: 12px; border: 2px solid #f44336;">
                                        <span style="display: block; font-size: 2rem; margin-bottom: 5px;">✖️</span>
                                        <strong style="color: #c62828; font-size: 1.2rem;">${incorrectasFase} Incorrectas</strong>
                                    </div>
                                </div>
                            </div>
                        `;

                        // 🚀 HABILITAMOS EL BOTÓN Y LE DAMOS SU FUNCIÓN SEGÚN LA FASE
                        const btnFinalizarViejo = document.getElementById(btnFinalizarId);
                        
                        if (btnFinalizarViejo) {
                            const btnFinalizar = btnFinalizarViejo.cloneNode(true);
                            btnFinalizarViejo.parentNode.replaceChild(btnFinalizar, btnFinalizarViejo);

                            btnFinalizar.disabled = false;
                            btnFinalizar.style.display = "inline-block";
                            btnFinalizar.style.opacity = "1";
                            btnFinalizar.style.transform = "scale(1.05)";
                            
                            btnFinalizar.textContent = fase === 'pre' ? "Ir al Tablero" : "Ver Resultados Finales";

                           btnFinalizar.addEventListener('click', () => {
                                // Apagar sonidos de golpe si cambian de pantalla
                                bancoSonidos.acierto.pause();
                                bancoSonidos.error.pause();

                                if (fase === 'pre') {
                                    window.cambiarPaso(5); 
                                } 
                                else if (fase === 'post') {
                                    if (typeof window.generarResultadosFinales === 'function') {
                                        window.generarResultadosFinales();
                                    }
                                    window.cambiarPaso(6); 
                                }
                            });
                        }
                    }
                }, 1800); // <-- Cambiado de 1200 a 1800 para dar tiempo a leer el feedback
            });
            contenedorOpciones.appendChild(btn);
        });
    });
}
window.renderizarQuizSlider = renderizarQuizSlider;
// =========================================================
// FUNCIÓN PARA GENERAR LOS RESULTADOS FINALES (PANTALLA 6)
// =========================================================
window.generarResultadosFinales = function() {
    const tarjetaGeneral = document.querySelector('#paso-6 .tarjeta-general');
    if (!tarjetaGeneral) return;

    // 1. Obtener el nombre del camino y asignar una imagen de portada
    let nombreCamino = window.caminoSeleccionado || 'Prevención de la Violencia de Género';
    
    // 🔥 IMPORTANTE: Cambia estas rutas por las imágenes reales de tus portadas
    let imagenPortada = nombreCamino.includes('Estereotipos') 
        ? 'assets/imagenes/generales/camino2puntajes.png' 
        : 'assets/imagenes/generales/camino1puntajes.png';

    // 2. Ordenar jugadores (del 1ero al último)
    const jugadoresOrdenados = window.jugadores ? [...window.jugadores].sort((a, b) => b.puntos - a.puntos) : [];

    // 3. Construir las tarjetas de los jugadores
    let htmlJugadores = '';
    jugadoresOrdenados.forEach((jugador, index) => {
        const avatar = jugador.imagenPersonaje || 'assets/imagenes/default.png';
        const nombre = jugador.nombre || 'Jugador';
        const personaje = window.normalizarId ? window.normalizarId(jugador.personaje || 'Personaje') : jugador.personaje;
        const puntos = jugador.puntos || 0;
        
        let clasePodio = "jugador-base"; 
        let medalla = "";

        if (index === 0) {
            clasePodio = "podio-oro";
            medalla = '<div class="medalla-lateral">🥇</div>';
        } else if (index === 1) {
            clasePodio = "podio-plata";
            medalla = '<div class="medalla-lateral">🥈</div>';
        } else if (index === 2) {
            clasePodio = "podio-bronce";
            medalla = '<div class="medalla-lateral">🥉</div>';
        } else {
            medalla = `<div class="medalla-lateral numero-posicion">${index + 1}º</div>`;
        }

        const delayAnimacion = index * 0.2; 

        htmlJugadores += `
            <div class="jugador-card-horizontal ${clasePodio}" style="animation-delay: ${delayAnimacion}s">
                ${medalla}
                <img src="${avatar}" alt="${nombre}" class="avatar-resultado-mini">
                <div class="info-jugador-victoria">
                    <h4 class="nombre-resultado">${nombre}</h4>
                    <div class="personaje-resultado">🎭 ${personaje}</div>
                </div>
                <div class="puntaje-resultado-box">⭐ ${puntos} pts</div>
            </div>
        `;
    });

    // 4. Inyectar el diseño de dos columnas en la pantalla 6
    tarjetaGeneral.innerHTML = `
        <div class="layout-victoria-columnas">
            <!-- Columna Izquierda: Portada del Camino -->
            <div class="columna-portada">
                <img src="${imagenPortada}" alt="Portada ${nombreCamino}" class="imagen-victoria">
            </div>
            
            <!-- Columna Derecha: Títulos y Ranking -->
            <div class="columna-ranking">
                <h2 class="titulo-trofeo">¡Misión Cumplida!</h2>
                <p class="subtitulo-resultados">Camino completado: <br><strong>${nombreCamino}</strong></p>
                
                <div class="lista-jugadores-final">
                    ${htmlJugadores}
                </div>

                <button class="btn-reiniciar" onclick="window.location.reload()">
                    🔄 Jugar de Nuevo
                </button>
            </div>
        </div>
    `;
};