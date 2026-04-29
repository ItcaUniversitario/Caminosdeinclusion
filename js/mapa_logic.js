// js/mapa_logic.js
import { camino1 } from './data/datacamino1.js';
import { obtenerCartaAleatoria, precargarCartas} from './firebase.js';
import { prepararCuestionario, iniciarQuizUI } from './quiz_logic.js';
import { cambiarPantalla } from './main.js'; // Para hacer el cambio de vista

// 🚀 VARIABLES GLOBALES DE ESTADO
let personajesElegidos = [];
let jugadorActualIndex = 0; // Para saber de quién es el turno
let posicionesFichas = [];  // Guardará en qué casilla está cada jugador
let fichaEnMovimiento = false;
export function inicializarMapa() {
    console.log(`🗺️ Cargando Mapa: ${camino1.nombre}...`);
 
    // ✅ CAMBIO AQUÍ: Usamos 'personajesSeleccionados' que es el nombre que pusimos en el sessionStorage
    const datosGuardados = sessionStorage.getItem('personajesSeleccionados');

    personajesElegidos = JSON.parse(datosGuardados) || [];

    if (personajesElegidos.length === 0) {
        console.error("❌ Error: No se encontraron personajes seleccionados.");
        alert("¡Ups! Parece que no has seleccionado a tus personajes. Por favor, regresa al inicio.");
        return;
    }

    // 🚀 NUEVO: Iniciamos la descarga masiva y silenciosa de las cartas
    const numeroCamino = sessionStorage.getItem('caminoSeleccionadoNum') || 1;
    precargarCartas(personajesElegidos, numeroCamino);

    if (posicionesFichas.length === 0) {
        posicionesFichas = personajesElegidos.map(() => 0);
    }

    // 🚨 AQUÍ AGREGAMOS LA NUEVA FUNCIÓN: Primero creamos las tarjetas
    inicializarHUDMultijugador();

    // Y luego las encendemos y actualizamos los puntos
    actualizarHUD();

    dibujarCasillas();

    const btnRuleta = document.getElementById('ruleta-interactiva');
    if (btnRuleta) {
        btnRuleta.onclick = () => girarRuleta();
    }
}
// js/mapa_logic.js

function actualizarHUD() {
    // Recorremos a todos los jugadores para actualizar sus puntos y estado
    personajesElegidos.forEach((personaje, index) => {
        const tarjeta = document.getElementById(`score-jugador-${index}`);
        const textoPuntos = document.getElementById(`puntos-texto-${index}`);

        if (tarjeta && textoPuntos) {
            // Actualizamos los puntos (por si ganó empatía)
            textoPuntos.textContent = personaje.puntosEmpatia || 0;

            // Prendemos la tarjeta si es su turno, o la apagamos si no lo es
            if (index === jugadorActualIndex) {
                tarjeta.classList.add('turno-activo');
            } else {
                tarjeta.classList.remove('turno-activo');
            }
        }
    });
}
// Asegúrate de que esta variable esté arriba del todo en tu archivo
let gradosActuales = 0;

function girarRuleta() {
    // 🛑 BLOQUEO 1: Si hay movimiento, no hacer nada
    if (fichaEnMovimiento) {
        console.warn("⚠️ Espera a que la ficha termine de moverse.");
        return;
    }

    const btnRuleta = document.getElementById('ruleta-interactiva');
    const textoCentro = document.getElementById('texto-centro-ruleta');
    const ruedaGrafica = document.getElementById('rueda-grafica');

    // Bloqueo visual y de clics
    btnRuleta.style.pointerEvents = 'none';
    btnRuleta.style.opacity = '0.5'; 
    textoCentro.textContent = "...";

    // 1. Generar número aleatorio del 1 al 6
    const avance = Math.floor(Math.random() * 6) + 1;
    const gradosPorSeccion = 60;

    // 2. MAGIA DE ALEATORIEDAD VISUAL:
    // En lugar de caer siempre en el centro exacto (-30), elegimos un punto aleatorio 
    // dentro de la sección (entre 10 y 50 grados para no pisar la línea divisoria).
    const offsetAleatorio = Math.floor(Math.random() * 40) + 10; 
    const gradosParaLlegar = 360 - (avance * gradosPorSeccion - offsetAleatorio);

    // 3. Reducimos las vueltas extra de 5 a 2, para que en medio segundo no se vea como un borrón
    gradosActuales += (360 * 2) + gradosParaLlegar - (gradosActuales % 360);
    ruedaGrafica.style.setProperty('--giro', `${gradosActuales}deg`);

    // 4. Cambiamos el temporizador a 500 milisegundos (Medio segundo)
    setTimeout(() => {
        textoCentro.textContent = avance;
        moverFicha(avance); // Esta función activará el bloqueo de ficha
    }, 500);
}
// ==========================================================================
// 🚀 FUNCIÓN PRINCIPAL DE MOVIMIENTO (Paso a Paso animado)
// ==========================================================================
export async function moverFicha(casillasAvanzadas, evaluarEvento = true) {
    fichaEnMovimiento = true;

    let posicionActual = posicionesFichas[jugadorActualIndex];
    let nuevaPosicion = posicionActual;
    const totalCasillas = camino1.casillas.length - 1;

    let pasosSobrantes = 0; 

    // 1. CALCULAMOS EL DESTINO FINAL (y las paradas obligatorias)
    if (evaluarEvento && casillasAvanzadas > 0) {
        for (let i = 1; i <= casillasAvanzadas; i++) {
            let posicionEvaluada = posicionActual + i;

            if (posicionEvaluada >= totalCasillas) {
                nuevaPosicion = totalCasillas;
                break;
            }

            let casillaDestino = camino1.casillas[posicionEvaluada];

            // 🚨 DETECCIÓN DE PARADA OBLIGATORIA
            if (casillaDestino && (casillaDestino.tipo === 'info' || casillaDestino.tipo === 'video' || casillaDestino.tipo === 'parada')) {
                console.log(`🛑 Parada obligatoria. Faltan ${casillasAvanzadas - i} pasos por dar.`);
                nuevaPosicion = posicionEvaluada;
                pasosSobrantes = casillasAvanzadas - i; 
                break;
            }
            nuevaPosicion = posicionEvaluada;
        }
    } else {
        // Movimiento hacia atrás (ej. -2 casillas) o saltos sin evaluar
        nuevaPosicion = posicionActual + casillasAvanzadas;
        if (nuevaPosicion > totalCasillas) nuevaPosicion = totalCasillas;
        if (nuevaPosicion < 0) nuevaPosicion = 0;
    }

    // ====================================================================
    // 🌟 LA MAGIA DE LOS PASITOS (Animación casilla por casilla)
    // ====================================================================
    let direccion = nuevaPosicion > posicionActual ? 1 : -1; // 1 si avanza, -1 si retrocede
    let totalPasos = Math.abs(nuevaPosicion - posicionActual);
    let velocidadPaso = 300; // Milisegundos por casilla (300ms es rápido pero se alcanza a ver)

    // Damos los pasitos uno por uno
    for (let i = 0; i < totalPasos; i++) {
        posicionActual += direccion;
        
        // Actualizamos la posición real en la memoria
        posicionesFichas[jugadorActualIndex] = posicionActual;
        
        // Movemos el muñequito en la pantalla a esta casilla intermedia
        moverFichaFisicamente(jugadorActualIndex, posicionActual);

        // Hacemos una micropausa antes de dar el siguiente paso
        await new Promise(resolve => setTimeout(resolve, velocidadPaso));
    }
    // ====================================================================

    // Cuando termina de caminar, disparamos el evento o pasamos el turno
    setTimeout(() => {
        if (evaluarEvento) {
            evaluarAccionCasilla(nuevaPosicion, pasosSobrantes);
        } else {
            pasarAlSiguienteTurno();
        }
    }, 400); // 400ms de respiro al llegar a la casilla final antes de abrir el modal
}
function pasarAlSiguienteTurno() {
    jugadorActualIndex = (jugadorActualIndex + 1) % personajesElegidos.length;

    // 🚩 LIBERAMOS LA RULETA
    fichaEnMovimiento = false;

    // Restauramos el aspecto visual del botón
    const btnRuleta = document.getElementById('ruleta-interactiva');
    const textoCentro = document.getElementById('texto-centro-ruleta');
    if (btnRuleta) {
        btnRuleta.style.pointerEvents = 'auto';
        btnRuleta.style.opacity = '1';
        textoCentro.textContent = "GIRAR";
    }

    actualizarHUD();
    console.log(`🔄 Turno de: ${personajesElegidos[jugadorActualIndex].nombre}. Ruleta lista.`);
}
// js/mapa_logic.js
function dibujarCasillas() {
    console.log("📍 El mapa ya tiene las casillas en la imagen. Colocando jugadores...");
    colocarFichasEnInicio();
}
// Función para crear los avatares reales
function colocarFichasEnInicio() {
    const capaFichas = document.getElementById('capa-fichas');
    capaFichas.innerHTML = '';

    personajesElegidos.forEach((personaje, index) => {
        const fichaJugador = document.createElement('div');
        fichaJugador.className = 'ficha-jugador-mapa';
        fichaJugador.id = `ficha-jugador-${index}`;

        // 🚨 USAMOS imagenFull QUE ES LA QUE VIENE DE TU DATA REAL
        // Busca esta línea dentro de colocarFichasEnInicio y cámbiala:
        fichaJugador.innerHTML = `
            <div class="nombre-ficha-flotante">${personaje.nombre}</div>
            <img src="${personaje.imagenFull || personaje.imagen}" alt="${personaje.nombre}">
        `;
        capaFichas.appendChild(fichaJugador);
        moverFichaFisicamente(index, 0);
    });
}
// Dibuja las tarjetas de score con el nombre del JUGADOR
function inicializarHUDMultijugador() {
    const contenedorHUD = document.getElementById('contenedor-scores-global');
    contenedorHUD.innerHTML = '';

    personajesElegidos.forEach((personaje, index) => {
        const tarjeta = document.createElement('div');
        tarjeta.id = `score-jugador-${index}`;
        tarjeta.className = 'tarjeta-score-jugador';

        // 🚨 CAMBIO AQUÍ: Usamos el nombre del jugador real
        // Si no existe, ponemos "Jugador #" como respaldo
        const nombreAMostrar = personaje.nombreJugador || `Jugador ${index + 1}`;

        tarjeta.innerHTML = `
            <div class="avatar-score">
                <img src="${personaje.imagenFull || personaje.imagen}" alt="${personaje.nombre}">
            </div>
            <div class="datos-score">
                <span class="nombre-score">${nombreAMostrar}</span>
                <span class="puntos-score" id="puntos-texto-${index}">0</span>
            </div>
        `;

        contenedorHUD.appendChild(tarjeta);
    });
}
// Función que anima el movimiento físico de la ficha sobre tu imagen
function moverFichaFisicamente(indexJugador, indexCasillaDestino) {
    const ficha = document.getElementById(`ficha-jugador-${indexJugador}`);
    const dataCasilla = camino1.casillas[indexCasillaDestino];

    if (ficha && dataCasilla) {
        // Coordenada matemática exacta de la casilla
        ficha.style.left = `${dataCasilla.x}%`;
        ficha.style.top = `${dataCasilla.y}%`;
        const posicionesX = [0, 0, 0, 0, 0, 0, 0];

        const desfaseX = posicionesX[indexJugador] || 0;
        const desfaseY = 0; // 🚨 ¡CERO! Todos los pies pisan exactamente la misma coordenada Y.

        ficha.style.setProperty('--desfaseX', `${desfaseX}px`);
        ficha.style.setProperty('--desfaseY', `${desfaseY}px`);

        // Z-Index para que el que está en el centro resalte un poco más
        ficha.style.zIndex = 100 - indexJugador;
    }
}
// ==========================================================================
// 🧠 EL CEREBRO: LÓGICA DE EVENTOS POR CASILLA
// ==========================================================================
export function evaluarAccionCasilla(posicionFinal, pasosSobrantes = 0) {
    const jugadorActual = personajesElegidos[jugadorActualIndex];
    const casillaData = camino1.casillas[posicionFinal];

    if (!casillaData) {
        console.warn("⚠️ Casilla sin datos configurados.");
        pasarAlSiguienteTurno();
        return;
    }

    console.log(`📍 ${jugadorActual.nombre} cayó en: ${casillaData.tipo}. Pasos en reserva: ${pasosSobrantes}`);

    // Interceptor de ventaja
    if (casillaData.tieneVentaja) {
        mostrarVentaja(casillaData, jugadorActual, pasosSobrantes);
        return;
    }

    switch (casillaData.tipo) {
        // 🚨 CAMBIO: Unificamos a un solo tipo 'carta'
        case 'carta':
            mostrarCartaSituacion(casillaData, jugadorActual);
            break;

        case 'video':
        case 'parada':
            mostrarVideoEducativo(casillaData, jugadorActualIndex, pasosSobrantes);
            break;

        case 'info':
            mostrarDatoImportante(casillaData, jugadorActualIndex, pasosSobrantes);
            break;

        case 'meta':
            mostrarVideoReflexionFinal(casillaData, jugadorActual);
            break;

        default:
            pasarAlSiguienteTurno();
            break;
    }
}

export async function mostrarCartaSituacion(casillaData, jugadorActual) {
    console.log(`🃏 Iniciando evento de carta para ${jugadorActual.nombreJugador} (${jugadorActual.nombre})`);

    const modal = document.getElementById('gameModal');
    if (!modal) return;

    const numeroCamino = sessionStorage.getItem('caminoSeleccionadoNum') || 1;

    // 🚨 BLINDAJE: Buscamos el ID, si no existe buscamos el nombre, y lo pasamos a minúsculas
    const idBruto = jugadorActual.id || jugadorActual.nombre || "paula";
    const idPersonaje = idBruto.toLowerCase();

    const personajeIdBusqueda = `${idPersonaje}_c${numeroCamino}`;

    // 🎨 1. DICCIONARIO DE COLORES 
    const paletaPersonajes = {
        'paula': { principal: '#D81B60' },
        'nina': { principal: '#B71C1C' },
        'josefa': { principal: '#E65100' },
        'martina': { principal: '#2E7D32' },
        'paty': { principal: '#455A64' },
        'yuleisy': { principal: '#1565C0' },
        'mia': { principal: '#00ACC1' }
    };

    const colores = paletaPersonajes[idPersonaje] || { principal: '#673AB7' };
    const colorCarta = colores.principal;

    // 🖼️ 2. CARGAMOS TUS FONDOS DINÁMICAMENTE
    const rutaFrente = `assets/imagenes/fondos_cartillas/${idPersonaje}_frente.jpg`;
    const rutaReverso = `assets/imagenes/fondos_cartillas/${idPersonaje}_reverso.jpg`;

    // 3. APLICAMOS LAS IMÁGENES AL CSS DEL MODAL
    const estiloFrente = `
    background: url('${rutaFrente}') center/cover no-repeat; 
    border-top: 8px solid ${colorCarta};
    display: flex; flex-direction: column; align-items: center; padding-top: 15px;`;

    const estiloReverso = `
    background: url('${rutaReverso}') center/cover no-repeat; 
    border-top: 8px solid ${colorCarta};`;

    // Pantalla de Carga
    modal.innerHTML = `
    <div class="modal-contenido" style="background: transparent; box-shadow: none; padding: 0;">
        <div id="modalDescription" style="width: 100%;">
            <div style="text-align:center; padding: 20px; background: white; border-radius: 20px;">
                <p>Mezclando el mazo de ${jugadorActual.nombre}...</p>
                <div class="spinner-carga">⏳</div>
            </div>
        </div>
    </div>
    `;
    modal.style.display = 'flex';

    // ======================================================
    // 🌟 NUEVA LÓGICA: EL MAZO DE CARTAS
    // ======================================================
    if (!jugadorActual.cartasJugadas) {
        jugadorActual.cartasJugadas = [];
    }

    try {
        const carta = await obtenerCartaAleatoria(personajeIdBusqueda, jugadorActual.cartasJugadas);

        if (carta) {
            const identificadorCarta = carta.id || carta.descripcion;
            jugadorActual.cartasJugadas.push(identificadorCarta);

            document.getElementById('modalDescription').innerHTML = `
                <div class="escena-carta">
                    <div id="tarjeta-animada" class="carta-3d">
                        
                        <div class="cara-carta cara-frente" id="cara-frontal" style="${estiloFrente}">
                          <h2 style="margin: 0; color: white; text-transform: uppercase; letter-spacing: 1px; z-index: 2; position: relative; text-shadow: 1px 1px 4px rgba(0,0,0,0.6);">
                            Situación
                        </h2>
                                    <img src="${jugadorActual.imagenFull || jugadorActual.imagen}" alt="${jugadorActual.nombre}" style="width: 140px; border-radius: 10px; margin-top: 15px; z-index: 1; position: relative;">
                            
                            <div style="position: absolute; bottom: 15px; left: 50%; transform: translateX(-50%); width: 90%; background: rgba(255,255,255,0.95); padding: 15px; border-radius: 15px; z-index: 20; box-shadow: 0 -5px 15px rgba(0,0,0,0.2); border: 2px solid ${colorCarta}; box-sizing: border-box;">
                             <p style="font-family: var(--font-body, 'Fredoka', sans-serif); font-size: 1.3rem; color: #333; font-weight: 500; line-height: 1.5; margin: 0 0 20px 0; text-align: justify; -webkit-font-smoothing: antialiased; transform: translateZ(0);">
                                ${carta.descripcion}
                            </p>
                        <button id="btn-dar-vuelta" class="btn-inclusion" style="font-family: var(--font-body, 'Fredoka', sans-serif); background: ${colorCarta}; color: white; width: 100%; border-radius: 10px; padding: 15px; font-weight: bold; cursor: pointer; border: none; font-size: 1.3rem;">
                            Tomar Decisión 🔄
                        </button>
                            </div>
                        </div>

              
                    <div class="cara-carta cara-reverso" id="cara-trasera" style="${estiloReverso}">
                        <h3 id="titulo-reverso" style="font-family: var(--font-body, 'Fredoka', sans-serif); color: #222; margin-top: 30px; margin-bottom: 12px; text-align: center; font-size: 1.5rem; -webkit-font-smoothing: antialiased;">
                            ¿Qué decides hacer?
                        </h3>
                        
                        <div id="contenedor-opciones-reverso" style="display: flex; flex-direction: column; justify-content: center; gap: 8px; width: 100%; padding: 0 15px 15px 15px; flex-grow: 1; position: relative; z-index: 30; box-sizing: border-box; overflow-y: auto;"></div>
                    </div>

                    </div>
                </div>
            `;

            document.getElementById('btn-dar-vuelta').onclick = () => {
                document.getElementById('tarjeta-animada').classList.add('volteada');
                document.getElementById('cara-frontal').style.pointerEvents = 'none';
            };

            const opciones = [
                { texto: carta.opcion_empatica, puntos: 3, mov: 3, retro: carta.retro_empatica },
                { texto: carta.opcion_poco_empatica, puntos: 2, mov: 1, retro: carta.retro_poco_empatica },
                { texto: carta.opcion_nada_empatica, puntos: 0, mov: -2, retro: carta.retro_nada_empatica }
            ];

            let opcionesValidas = opciones.filter(op => op.texto);

            // 🚨 ALGORITMO PROFESIONAL PARA MEZCLAR (Fisher-Yates)
            for (let i = opcionesValidas.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [opcionesValidas[i], opcionesValidas[j]] = [opcionesValidas[j], opcionesValidas[i]];
            }

            const contOpciones = document.getElementById('contenedor-opciones-reverso');
            const tituloReverso = document.getElementById('titulo-reverso');

            opcionesValidas.forEach(op => {
                const btn = document.createElement('button');
                btn.className = 'btn-opcion-carta';
              btn.style.cssText = `
                font-family: var(--font-body, 'Fredoka', sans-serif); 
                padding: 18px; 
                border-radius: 12px; 
                border: 2px solid #ddd; 
                background: rgba(255,255,255,0.98); 
                cursor: pointer; 
                text-align: justify; 
                font-size: 1.3rem; 
                font-weight: 600; 
                color: #333; 
                position: relative; 
                -webkit-font-smoothing: antialiased; 
                transform: translateZ(0);
                box-shadow: 0 4px 6px rgba(0,0,0,0.05);
            `;
                btn.innerText = op.texto;

                btn.onmouseover = () => btn.style.borderColor = colorCarta;
                btn.onmouseout = () => btn.style.borderColor = '#ddd';

              btn.onclick = () => {
                    // 🚨 MAGIA DE SONIDOS AQUÍ (Se mantiene igual)
                    if (op.puntos > 0) {
                        personajesElegidos[jugadorActualIndex].puntosEmpatia += op.puntos;
                        actualizarHUD();
                        
                        const sonidoCorrecto = document.getElementById('sonidoAcierto');
                        if (sonidoCorrecto) {
                            sonidoCorrecto.currentTime = 0; 
                            sonidoCorrecto.play().catch(e => console.warn("El navegador bloqueó el audio", e));
                        }
                    } else {
                        const sonidoIncorrecto = document.getElementById('sonidoError');
                        if (sonidoIncorrecto) {
                            sonidoIncorrecto.currentTime = 0;
                            sonidoIncorrecto.play().catch(e => console.warn("El navegador bloqueó el audio", e));
                        }
                    }

                    tituloReverso.style.display = 'none';

                    // ========================================================
                    // 🚨 NUEVA LÓGICA CON ICONOS LOCALES 🚨
                    // ========================================================
                    
                    // 1. Define aquí tus rutas locales (¡Cambia estas rutas por las tuyas!)
                    const rutaIconoCorrecto = 'assets/imagenes/iconos/icono_resp_empatica.png'; // Ej. Empática
                    const rutaIconoRegular = 'assets/imagenes/iconos/icono_resp_pocoempatica.png'; // Ej. Poco Empática
                    const rutaIconoError = 'assets/imagenes/iconos/icono_resp_nadaempatica.png';   // Ej. Nada Empática

                    let textoMovimiento = op.mov > 0 ? `¡Avanzas ${op.mov} casillas! 🚀` : `Retrocedes ${Math.abs(op.mov)} casillas. 🚶`;
                    
                    // Evaluamos los puntos para asignar color y LA RUTA DEL ICONO
                    let colorCaja, rutaIconoFinal;
                    
                    if (op.puntos >= 3) {
                        // Respuesta Muy Empática
                        colorCaja = '#4CAF50'; // Verde
                        rutaIconoFinal = rutaIconoCorrecto; // Asignamos la ruta local
                    } else if (op.puntos > 0) {
                        // Respuesta Poco Empática
                        colorCaja = '#FF9800'; // Naranja
                        rutaIconoFinal = rutaIconoRegular;
                    } else {
                        // Respuesta Nada Empática
                        colorCaja = '#F44336'; // Rojo
                        rutaIconoFinal = rutaIconoError;
                    }

                    // 🎨 RENDERIZAMOS EL RESULTADO (HTML actualizado)
                   // 🎨 RENDERIZAMOS EL RESULTADO (AJUSTADO PARA QUE NO SE CORTE NI SALGA SCROLL)
                    contOpciones.innerHTML = `
                        <h3 style="font-family: var(--font-body, 'Fredoka', sans-serif); color: #222; text-align: center; font-size: 2rem; margin: 15px 0 10px 0; padding-top: 5px; -webkit-font-smoothing: antialiased;">
                            Resultado
                        </h3>

                        <div class="retroalimentacion-box" style="font-family: var(--font-body, 'Fredoka', sans-serif); background: rgba(255,255,255,0.95); padding: 15px; border-radius: 15px; border: 2px solid ${colorCaja}; box-shadow: 0 8px 15px rgba(0,0,0,0.1); margin-bottom: 15px; -webkit-font-smoothing: antialiased; transform: translateZ(0); position: relative;">
                            
                            <img src="${rutaIconoFinal}" alt="Resultado" style="display: block; width: 60px; height: 60px; margin: 0 auto 10px auto; object-fit: contain; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.1));">
                            
                            <p style="font-size: 1.15rem; color: #333; margin-top:0; line-height: 1.3; text-align: justify;">${op.retro}</p>
                            
                            <div style="background: ${colorCaja}20; padding: 10px; border-radius: 10px; margin-top: 10px;">
                                <h4 style="margin: 0 0 5px 0; font-size: 1.3rem; color: ${colorCaja}; text-align: center;">${op.puntos > 0 ? `+${op.puntos} Puntos ✨` : '0 Puntos 😔'}</h4>
                                <h4 style="margin: 0; font-size: 1.1rem; color: #333; text-align: center;">${textoMovimiento}</h4>
                            </div>
                        </div>

                        <button id="btn-continuar-viaje" class="btn-inclusion" style="font-family: var(--font-body, 'Fredoka', sans-serif); background: ${colorCarta}; color: white; width: 100%; border-radius: 12px; padding: 15px; font-weight: bold; cursor: pointer; border: none; font-size: 1.3rem; position: relative; box-shadow: 0 4px 6px rgba(0,0,0,0.1); flex-shrink: 0;">
                            Continuar Viaje 
                        </button>
                    `;
                    
                    document.getElementById('btn-continuar-viaje').onclick = () => {
                        cerrarModalYContinuar(op.mov);
                    };
                };
                contOpciones.appendChild(btn);
            });

        } else {
            // ZONA SEGURA (Si el jugador ya vació todo su mazo y no quedan cartas nuevas)
            document.getElementById('modalDescription').innerHTML = `
                <div style="background: white; padding: 30px; border-radius: 20px; text-align: center; border-top: 5px solid ${colorCarta};">
                    <h3 style="color: ${colorCarta};">📍 Zona de Refugio</h3>
                    <p>¡Vaya! Ya has superado todas las situaciones de tu mazo actual. Tómate un respiro y sigue adelante.</p>
                    <button id="btn-zona-segura" class="btn-inclusion" style="margin-top:15px; background: ${colorCarta}; color: white; width: 100%; padding: 12px; border-radius: 10px; font-weight: bold; border: none; cursor: pointer;">
                        Continuar viaje
                    </button>
                </div>
            `;
            document.getElementById('btn-zona-segura').onclick = () => cerrarModalYContinuar();
        }
    } catch (error) {
        console.error("🔥 Error al cargar carta:", error);
        cerrarModalYContinuar(); 
    }
}
// ==========================================================================
// 🛠️ FUNCIONES DE APOYO PARA LA CARTA
// ==========================================================================

function resolverDilema(esEmpatica, puntos) {
    if (esEmpatica) {
        alert(`✨ ¡Excelente decisión! Has ganado ${puntos} puntos de empatía.`);
        // Sumamos puntos al personaje actual en el arreglo global
        personajesElegidos[jugadorActualIndex].puntosEmpatia += puntos;
        actualizarHUD(); // Actualiza los scores visuales
    } else {
        alert("A veces nuestras decisiones pueden afectar a otros. Reflexiona y sigue adelante.");
    }
    cerrarModalYContinuar();
}
// ==========================================================================
// 🛠️ FUNCIÓN PARA CERRAR CARTA Y MOVER (MODIFICADA PARA RETROCESOS)
// ==========================================================================
function cerrarModalYContinuar(movimientoExtra = 0) {
    const modal = document.getElementById('gameModal');
    if (modal) modal.style.display = 'none';

    if (movimientoExtra !== 0) {
        // 🚨 LA MAGIA: Si el movimiento es mayor a 0 (positivo), evalúa la nueva casilla.
        // Si es menor a 0 (negativo/retroceso), será 'false' y solo pasará el turno.
        const vaHaciaAdelante = movimientoExtra > 0;

        console.log(`🚀 Movimiento post-carta: ${movimientoExtra} casillas. ¿Evalúa nueva casilla?: ${vaHaciaAdelante}`);

        // Le pasamos esa variable a la función moverFicha
        moverFicha(movimientoExtra, vaHaciaAdelante);
    } else {
        // Si la carta dio 0 puntos de movimiento, pasamos turno directo
        pasarAlSiguienteTurno();
    }
}
// ==========================================================================
// 💡 MOSTRAR DATO IMPORTANTE (Casilla "i")
// ==========================================================================
export function mostrarDatoImportante(casillaData, jugadorId, pasosSobrantes = 0) {
    console.log("💡 Abriendo modal de Dato Importante (i)");

    if (window.playSound) window.playSound('success');

    const modal = document.getElementById('gameModal');
    if (!modal) return;

    // RECONSTRUIMOS EL MODAL (100% Justificado, SIN cortar palabras)
    modal.innerHTML = `
        <div class="modal-contenido" style="background: white; border-radius: 20px; padding: 30px; max-width: 650px; width: 90%; text-align: center; position: relative;">
            
            <div style="text-align: center; animation: fadeIn 0.5s ease;">
                <div style="font-size: 3.5rem; margin-bottom: -10px; animation: flotar 3s ease-in-out infinite;">
                    💡
                </div>
                <span style="background-color: #FF9800; color: white; padding: 4px 12px; border-radius: 20px; font-size: 0.85rem; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; box-shadow: 0 2px 5px rgba(255, 152, 0, 0.4);">
                    Conocimiento Adquirido
                </span>
                <h3 style="color: #4A148C; font-size: 1.6rem; margin: 15px 0 15px 0; font-weight: 800;">
                    ${casillaData.titulo || "Dato Importante"}
                </h3>
                
                <div style="background: linear-gradient(135deg, #FDFBFB 0%, #F3E5F5 100%); padding: 25px; border-radius: 12px; box-shadow: 0 8px 20px rgba(74, 20, 140, 0.08); border: 1px solid #E1BEE7; position: relative; margin-bottom: 25px;">
                    <span style="color: #444; 
                                 font-size: 1.15rem; 
                                 line-height: 1.6; 
                                 margin: 0; 
                                 position: relative; 
                                 z-index: 1; 
                                 font-weight: 500; 
                                 display: block; 
                                 text-align: justify; 
                                 text-justify: inter-word; 
                                 -webkit-hyphens: none;
                                 -ms-hyphens: none;
                                 hyphens: none; 
                                 word-break: keep-all;
                                 overflow-wrap: normal;">
                        ${casillaData.descripcion || "Recuerda siempre mantener el respeto y la empatía en tu camino."}
                    </span>
                </div>
            </div>
            
            <button id="btn-entendido-info" class="btn-imbabura primario" style="background: linear-gradient(to right, #9C27B0, #7B1FA2); color: white; border: none; box-shadow: 0 4px 10px rgba(156, 39, 176, 0.4); width: 100%; font-size: 1.2rem; padding: 14px; border-radius: 10px; cursor: pointer; position: relative; z-index: 10; font-weight: bold; text-transform: uppercase; transition: transform 0.2s ease;">
                ¡Entendido! ✨
            </button>
            
        </div>
        <style>
            @keyframes flotar { 0% { transform: translateY(0px); } 50% { transform: translateY(-8px); } 100% { transform: translateY(0px); } }
            @keyframes fadeIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        </style>
    `;

    modal.style.display = 'flex';

    setTimeout(() => {
        const btnEntendido = document.getElementById('btn-entendido-info');
        if (btnEntendido) {
            btnEntendido.onclick = () => {
                modal.style.display = 'none';

                if (pasosSobrantes > 0) {
                    moverFicha(pasosSobrantes, true);
                } else {
                    pasarAlSiguienteTurno();
                }
            };
        }
    }, 50);
}
// ==========================================================================
// 🎬 MOSTRAR VIDEO EDUCATIVO (Casilla "Parada")
// ==========================================================================
export function mostrarVideoEducativo(casillaData, jugadorId, pasosSobrantes = 0) {
    console.log("▶️ Abriendo reproductor de video");

    const modal = document.getElementById('gameModal');
    if (!modal) return;

    modal.innerHTML = `
        <div class="modal-contenido" style="background: white; border-radius: 20px; padding: 25px; max-width: 800px; width: 95%; text-align: center; position: relative;">
            <h2 style="color: #4A148C; margin-top: 0; font-size: 1.8rem;">🎬 ${casillaData.titulo || "Parada Educativa"}</h2>
            <p style="margin-bottom: 20px; font-weight: 500; color: #333; font-size: 1.1rem;">
                ${casillaData.descripcion || "Tómate un momento para ver este video antes de continuar."}
            </p>
            
            <div style="border-radius: 12px; overflow: hidden; box-shadow: 0 8px 25px rgba(0,0,0,0.4); margin-bottom: 20px; background: black; display: flex; justify-content: center; align-items: center;">
                
                <video id="modalVideo" width="100%" style="max-height: 60vh; width: auto; max-width: 100%; outline: none;" controls autoplay controlsList="nodownload">
                    <source src="${casillaData.rutaVideo || 'assets/videos/default.mp4'}" type="video/mp4">
                    Tu navegador no soporta videos.
                </video>

            </div>
            
            <button id="btnSaltarVideo" style="background: #E91E63; color: white; border: none; padding: 15px; width: 100%; border-radius: 12px; font-weight: 800; font-size: 1.2rem; cursor: pointer; position: relative; z-index: 10; box-shadow: 0 6px 12px rgba(233, 30, 99, 0.3); text-transform: uppercase; transition: transform 0.2s ease;">
                Continuar Viaje
            </button>
        </div>
    `;

    modal.style.display = 'flex';

    const modalVideo = document.getElementById('modalVideo');

    // 🚀 CAMBIO: Forzamos la reproducción por código justo al abrir el modal
    if (modalVideo) {
        // El timeout pequeño asegura que el navegador ya haya "pintado" el modal en pantalla
        setTimeout(() => {
            modalVideo.play().catch(error => {
                console.warn("⚠️ El navegador pausó el autoplay automático por políticas de sonido:", error);
            });
        }, 100);
    }

    const cerrarVideo = () => {
        if (modalVideo) modalVideo.pause();
        modal.style.display = 'none';

        // ======================================================
        // 🌟 LÓGICA: RECOMPENSA POR VER EL VIDEO
        // ======================================================
        const jugador = personajesElegidos[jugadorActualIndex];

        if (!jugador.videosVistos) {
            jugador.videosVistos = [];
        }

        if (!jugador.videosVistos.includes(casillaData.id)) {
            jugador.videosVistos.push(casillaData.id); 
            jugador.puntosEmpatia = (jugador.puntosEmpatia || 0) + 2; 

            actualizarHUD(); 
            if (window.playSound) window.playSound('success');

            alert(`✨ ¡Excelente, ${jugador.nombre}! Has ganado 2 puntos de empatía por informarte.`);
        }
        // ======================================================

        // 🚨 CONTINUAR EL VIAJE NORMALMENTE
        if (pasosSobrantes > 0) {
            console.log(`🚀 Continuando viaje... Faltan ${pasosSobrantes} pasos.`);
            moverFicha(pasosSobrantes, true);
        } else {
            pasarAlSiguienteTurno();
        }
    };

    if (modalVideo) {
        modalVideo.onended = cerrarVideo;
    }

    setTimeout(() => {
        const btnSaltar = document.getElementById('btnSaltarVideo');
        if (btnSaltar) {
            btnSaltar.onclick = cerrarVideo;
            
            btnSaltar.onmouseover = () => btnSaltar.style.transform = 'scale(1.02)';
            btnSaltar.onmouseout = () => btnSaltar.style.transform = 'scale(1)';
        }
    }, 50);
}
// ==========================================================================
// ⏩ MOSTRAR VENTAJA (IMPULSO EXTRA EN EL TABLERO)
// ==========================================================================
export function mostrarVentaja(casillaData, jugadorActual, pasosSobrantes = 0) {
    console.log("⏩ Abriendo modal de Ventaja");
    if (window.playSound) window.playSound('success');

    const modal = document.getElementById('gameModal');
    if (!modal) return;

    modal.innerHTML = `
        <div class="modal-contenido" style="background: white; border-radius: 20px; padding: 25px; max-width: 400px; width: 90%; text-align: center; position: relative;">
            <div style="font-size: 3.5rem; margin-bottom: -10px; animation: flotar 3s ease-in-out infinite;">
                ⏩
            </div>
            <span style="background-color: #4CAF50; color: white; padding: 4px 12px; border-radius: 20px; font-size: 0.8rem; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; box-shadow: 0 2px 5px rgba(76, 175, 80, 0.4);">
                ¡Atajo Encontrado!
            </span>
            <h3 style="color: #4A148C; font-size: 1.4rem; margin: 15px 0 10px 0; font-weight: 800;">
                ¡El viento está a tu favor!
            </h3>
            <p style="color: #444; font-size: 1.05rem; line-height: 1.6; margin-bottom: 20px; font-weight: 500;">
                Excelente, <strong>${jugadorActual.nombre}</strong>. El universo de Imbabura te sonríe hoy. Ganas un impulso y avanzas <strong>2 casillas</strong> adicionales.
            </p>
            <button id="btn-ventaja" class="btn-imbabura" style="background: #4CAF50; color: white; border: none; box-shadow: 0 4px 10px rgba(76, 175, 80, 0.4); width: 100%; font-size: 1.1rem; padding: 12px; border-radius: 10px; cursor: pointer; font-weight: bold;">
                ¡Genial, avanzar! 🚀
            </button>
        </div>
        <style>
            @keyframes flotar { 0% { transform: translateY(0px); } 50% { transform: translateY(-8px); } 100% { transform: translateY(0px); } }
        </style>
    `;

    modal.style.display = 'flex';

    setTimeout(() => {
        const btnVentaja = document.getElementById('btn-ventaja');
        if (btnVentaja) {
            btnVentaja.onclick = () => {
                modal.style.display = 'none';

                // Le damos 2 pasos de impulso + los pasos sobrantes (por si traía de antes)
                const totalAvanzar = 2 + pasosSobrantes;

                // Llamamos a moverFicha con 'true' para que evalúe a dónde llega después de este salto
                moverFicha(totalAvanzar, true);
            };
        }
    }, 50);
}
export function finalizarJuego(jugadorActual) {
    console.log("🏆 ¡Un jugador ha llegado a la meta!");

    // Detenemos la música normal y podemos poner una de victoria
    if (window.controlarMusica) window.controlarMusica(true);
    if (window.playSound) window.playSound('victory');

    const modalVictoria = document.getElementById('modal-victoria');
    const tituloVic = document.getElementById('vic-titulo');
    const msjVic = document.getElementById('vic-mensaje');

    tituloVic.innerText = "¡TENEMOS UN GANADOR!";
    msjVic.innerHTML = `¡Felicidades <strong>${jugadorActual.nombre}</strong>! Has completado el recorrido del Geoparque Imbabura.`;

    // Aquí podrías agregar lógica para actualizar el ranking en tu Firebase si lo deseas

    modalVictoria.style.display = 'flex';
}
// ==========================================================================
// 🏆 VIDEO DE REFLEXIÓN FINAL Y SALTO AL POST-QUIZ
// ==========================================================================
export function mostrarVideoReflexionFinal(casillaData, jugadorActual) {
    console.log("🏁 Meta alcanzada. Iniciando cierre pedagógico.");

    const modal = document.getElementById('gameModal');
    if (!modal) return;

   modal.innerHTML = `
        <div class="modal-contenido" style="background: white; border-radius: 25px; padding: 35px; max-width: 900px; width: 95%; text-align: center; border-top: 12px solid #FFD700; box-shadow: 0 25px 50px rgba(0,0,0,0.5);">
            <h2 style="color: #4A148C; margin-top: 0; font-size: 2.2rem;">✨ ¡Objetivo Cumplido!</h2>
            <p style="margin-bottom: 25px; font-weight: 600; color: #444; font-size: 1.2rem;">
                ${jugadorActual.nombre}, antes de ver los resultados finales, compartamos esta breve reflexión.
            </p>
            
            <div style="border-radius: 20px; overflow: hidden; box-shadow: 0 15px 30px rgba(0,0,0,0.4); background: black; margin-bottom: 25px;">
                <video id="videoReflexionFinal" width="100%" style="display: block; max-height: 60vh; object-fit: cover;" controls autoplay>
                    <source src="${casillaData.rutaVideo || 'assets/videos/reflexion_final.mp4'}" type="video/mp4">
                </video>
            </div>
            
            <button id="btnIrAlPostQuiz" style="background: #4CAF50; color: white; border: none; padding: 18px; width: 100%; border-radius: 15px; font-weight: bold; font-size: 1.4rem; cursor: pointer; transition: transform 0.2s, background 0.2s;">
                Ir al Post-Quiz 📝
            </button>
        </div>
    `;

    modal.style.display = 'flex';

    const videoFinal = document.getElementById('videoReflexionFinal');

    const finalizarYEntrarAlQuiz = async () => {
        console.log("🛑 Deteniendo video y cerrando modal...");
        if (videoFinal) videoFinal.pause();
        modal.style.display = 'none';

        // 🚨 PASO 1: GUARDAR EN FIREBASE
        const idPartida = sessionStorage.getItem('idPartidaActual');
        if (idPartida) {
            try {
                const { doc, updateDoc } = await import("https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js");
                const { db } = await import('./firebase.js');

                const partidaRef = doc(db, "partidas", idPartida);
                await updateDoc(partidaRef, {
                    jugadoresResultadosMapa: personajesElegidos,
                    fechaFinMapa: new Date().toISOString()
                });
                sessionStorage.setItem('personajesSeleccionados', JSON.stringify(personajesElegidos));
                console.log("✅ Puntuaciones sincronizadas con Firebase.");
            } catch (error) {
                console.warn("⚠️ No se pudo guardar en Firebase, pero continuamos el viaje...", error);
            }
        }

        // 🚨 PASO 2: PROCEDER AL POST-QUIZ
        console.log("📝 Preparando Post-Quiz...");
        try {
            const caminoActual = parseInt(sessionStorage.getItem('caminoSeleccionadoNum')) || 1;
            const listo = await prepararCuestionario(caminoActual);

            console.log("✅ ¿El cuestionario está listo?:", listo);

            if (listo) {
                console.log("🔄 Cambiando a la pantalla del Quiz...");

                if (typeof cambiarPantalla === 'function') {
                    cambiarPantalla('pantalla-quiz');
                } else {
                    console.warn("⚠️ Usando cambio de pantalla manual...");
                    document.querySelectorAll('.pantalla').forEach(p => p.classList.remove('activa'));
                    const pantallaDestino = document.getElementById('pantalla-quiz');
                    if (pantallaDestino) pantallaDestino.classList.add('activa');
                }

                iniciarQuizUI("POST");
            } else {
                console.error("❌ El cuestionario no se cargó correctamente.");
            }
        } catch (error) {
            console.error("🔥 Error crítico al intentar abrir el Post-Quiz:", error);
        }
    };

    // 🚨 ESTO ES LO QUE FALTABA: CONECTAR LOS EVENTOS 🚨

    // 1. Si el video termina de reproducirse solo, salta al quiz automáticamente
    if (videoFinal) {
        videoFinal.onended = finalizarYEntrarAlQuiz;
    }

    // 2. Si el jugador hace clic en el botón verde, salta al quiz
    setTimeout(() => {
        const btn = document.getElementById('btnIrAlPostQuiz');
        if (btn) btn.onclick = finalizarYEntrarAlQuiz;
    }, 50);
}