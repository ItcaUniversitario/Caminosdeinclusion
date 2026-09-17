import { db, obtenerCartaAleatoria } from './firebase-config.js';
import { collection, query, where, limit, getDocs } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
// Si tu archivo de datos se llama 'datosCamino1.js' y está en la misma carpeta:
import { fondosCartillas, personajesData, camino1 } from './data/datacamino1.js';
window.camino1 = camino1;

let estadoJuego = {
    pasosPendientes: 0,
}

window.esMovimientoBono = false;
// Añade esto al principio de tu archivo temporalmente
window.animarSumaPuntos = function (jugadorId, puntos) {
    console.log(`Falta programar: Animación de +${puntos} puntos para el jugador ${jugadorId}`);
    // Aquí luego pondrás la lógica visual de sumar puntos
};
// 1. Pon esto en la línea 1 de tu archivo tablero.js
window.bancoSonidos = {
    turno: new Audio('assets/sonido/sonido_siguienteturno.mp3'),
    carta: new Audio('assets/sonido/sonido_girocarta.mp3'),
    acierto: new Audio('assets/sonido/sonido_correcto.mp3'),
    error: new Audio('assets/sonido/sonido_incorrecto.mp3')
};

// Ajustamos los volúmenes usando window.
window.bancoSonidos.turno.volume = 0.7;
window.bancoSonidos.carta.volume = 0.8;
window.bancoSonidos.acierto.volume = 0.8;
window.bancoSonidos.error.volume = 0.7;

// =========================================================
// 1. CREACIÓN Y GESTIÓN DINÁMICA DEL MODAL DESDE JS
// =========================================================
function obtenerOCrearModalJS() {
    let modal = document.getElementById('modal-contenido-casilla');

    if (!modal) {
        // Todo el diseño ahora lo controlan las clases del CSS
        const modalHtml = `
            <div id="modal-contenido-casilla" class="hidden">
                <div class="modal-educativo-contenido">
                    <h2 id="modal-educativo-titulo"></h2>
                    <div id="modal-educativo-cuerpo"></div>
                    <button id="btn-cerrar-educativo">Continuar</button>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        modal = document.getElementById('modal-contenido-casilla');
    }
    return modal;
}
window.moverCamara = function (coordenadaX, coordenadaY = null) {
    const tablero = document.getElementById('tableroMapa');
    if (!tablero) return;

    const contenedor = tablero.parentElement;
    
    // Verificamos si estamos en el camino horizontal
    const esCamino2 = tablero.classList.contains('tablero-horizontal');

    let opcionesScroll = { behavior: 'smooth' };

    if (esCamino2) {
        // ---> LÓGICA HORIZONTAL (CAMINO 2) <---
        // Calculamos los píxeles en el eje X (de izquierda a derecha)
        const posicionFichaPixelesX = (coordenadaX / 100) * tablero.clientWidth;
        
        // Desplazamos la cámara restando la mitad de la pantalla para que la ficha quede en el centro
        opcionesScroll.left = posicionFichaPixelesX - (contenedor.clientWidth / 2);
        
    } else {
        // ---> LÓGICA VERTICAL (CAMINO 1) <---
        // Calculamos los píxeles en el eje Y (de arriba abajo)
        if (coordenadaY !== null) {
            const posicionFichaPixelesY = (coordenadaY / 100) * tablero.clientHeight;
            opcionesScroll.top = posicionFichaPixelesY - (contenedor.clientHeight / 2);
        }
    }

    // Le decimos al contenedor que haga el scroll automático
    contenedor.scrollTo(opcionesScroll);
};

// =========================================================
// 2. LÓGICA DEL TABLERO Y ANUNCIO DE TURNO
// =========================================================
window.iniciarTablero = function (fondoMapa, posicionesBase) {
    const tituloCamino = document.getElementById('nombre-camino-ruleta');
    if (tituloCamino) {
        // Obtenemos el nombre del camino seleccionado
        let nombreCamino = window.caminoSeleccionado || 'Violencia de Género';

        // 🔥 NUEVO: Si detectamos que es el Camino 1, ponemos el nombre largo
        if (nombreCamino === 'Violencia de Género' || nombreCamino === 'Camino 1') {
            nombreCamino = 'Prevención de la Violencia de Género';
        }

        tituloCamino.textContent = nombreCamino;
    }

    if (!posicionesBase) {
        console.error("🚨 ERROR: No llegaron las coordenadas.");
        return;
    }

    // 🔥 SOLUCIÓN AL TURNO UNDEFINED: Forzamos el turno a 0 si no existe
    if (typeof window.indiceTurnoActual === 'undefined') {
        window.indiceTurnoActual = 0;
    }

    // 🔥 FILTRO: Asegurarnos de que el arreglo de jugadores no esté vacío
    if (!window.jugadores || window.jugadores.length === 0) {
        console.error("🚨 ERROR: La lista de window.jugadores está vacía.");
        return;
    }

    window.coordenadasActuales = posicionesBase;

    const contenedorJugadores = document.querySelector('.lista-jugadores');
    const tableroMapa = document.getElementById('tableroMapa');

    if (tableroMapa) {
        const caminoActual = window.caminoSeleccionado || 'Violencia de Género';
        const contenedorMapa = tableroMapa.parentElement;

       // Limpiamos cualquier estilo residual
        tableroMapa.style.cssText = '';
        contenedorMapa.style.cssText = '';

        if (fondoMapa) {
            tableroMapa.style.backgroundImage = `url('${fondoMapa}')`;
        }

        if (caminoActual === 'Estereotipos' || (fondoMapa && fondoMapa.includes('camino2'))) {
            // ---> CAMINO 2: HORIZONTAL <---
            contenedorMapa.className = "tablero-viewport contenedor-horizontal";
            tableroMapa.className = "tablero-horizontal";

            // 🔥 Forzar la cámara al inicio de la izquierda
            setTimeout(() => {
                contenedorMapa.scrollTo({ left: 0, behavior: 'instant' });
            }, 150);

        } else {
            // ---> CAMINO 1: MAPA VERTICAL <---
            contenedorMapa.className = "tablero-viewport contenedor-vertical";
            tableroMapa.className = "tablero-vertical";

            // Forzar la cámara al inicio del recorrido (abajo)
            setTimeout(() => {
                // Utilizamos scrollTo para forzar el movimiento inmediato hacia abajo
                contenedorMapa.scrollTo({
                    top: contenedorMapa.scrollHeight,
                    behavior: 'instant' /* instant asegura que aparezcas directo abajo sin marear al jugador */
                });
            }, 300); // Subimos a 300ms para darle tiempo al navegador de pintar el mapa gigante
        }
        // =======================================================
        // 🌟 LÓGICA DE LAS LLAVES VISUALES Y COFRES MÁGICOS
        // =======================================================

      // =======================================================
        // 🌟 LÓGICA DE LAS LLAVES VISUALES Y COFRES MÁGICOS
        // =======================================================
        const esCamino2Llaves = caminoActual === 'Estereotipos' || (fondoMapa && fondoMapa.includes('camino2'));

        if (esCamino2Llaves) {
            // APAGAMOS LAS LLAVES PARA EL CAMINO 2
            window.casillasConLlave = [];
            window.cofresDisponibles = [];
        } else {
            // LÓGICA NORMAL PARA EL CAMINO 1
            const cofresBase = (window.camino1 && window.camino1.cofresData) ? window.camino1.cofresData : (window.cofresDataGlobales || []);
            window.cofresDisponibles = [...cofresBase];

            window.casillasConLlave = [7, 15, 25, 35, 45];
            let intentos = 0;
            const maxCasilla = posicionesBase.length - 2;

            while (window.casillasConLlave.length < 5 && intentos < 1000) {
                let posibleId = Math.floor(Math.random() * maxCasilla) + 1;
                let estaMuyCerca = window.casillasConLlave.some(idGuardado => Math.abs(idGuardado - posibleId) < 5);

                if (!estaMuyCerca) {
                    window.casillasConLlave.push(posibleId);
                }
                intentos++;
            }

            if (window.casillasConLlave.length < 5) {
                window.casillasConLlave = [7, 15, 25, 35, 45];
            }
        }
        // 🔥 1. ANIMACIÓN CORREGIDA: Ahora flota desde el centro exacto (-50%, -50%)
        if (!document.getElementById('anim-llave')) {
            const style = document.createElement('style');

            style.id = 'anim-llave';
            style.innerHTML = `
                @keyframes flotarLlave { 
                    0% { transform: translate(-50%, -50%); filter: drop-shadow(0 4px 6px rgba(0,0,0,0.6)); } 
                    100% { transform: translate(-50%, calc(-50% - 15px)); filter: drop-shadow(0 10px 15px rgba(255, 215, 0, 0.9)); } 
                }
            `;
            document.head.appendChild(style);
        }

        tableroMapa.innerHTML = '';
        let htmlCasillas = '';

        posicionesBase.forEach((pos) => {
            let extraLlave = '';

            if (window.casillasConLlave.includes(pos.id)) {
                // 🔥 2. LLAVE GIGANTE Y CENTRADA
                extraLlave = `
                    <div id="llave-${pos.id}" style="
                        position: absolute; 
                        top: 50%; /* Centrado vertical */
                        left: 50%; /* Centrado horizontal */
                        transform: translate(-50%, -50%); 
                        font-size: 55px; /* 🔥 MUCHO MÁS GRANDE (Antes era 32px) */
                        z-index: 50; 
                        animation: flotarLlave 1s infinite alternate ease-in-out;
                        transition: all 0.4s ease;
                        pointer-events: none; /* Evita que bloquee clics accidentales */
                    ">🗝️</div>
                `;
            }

            htmlCasillas += `
                <div id="cas-${pos.id}" 
                     class="casilla casilla-${pos.tipo}" 
                     style="left: ${pos.x}%; top: ${pos.y}%;">
                     ${extraLlave}
                </div>
            `;
        });

        tableroMapa.insertAdjacentHTML('beforeend', htmlCasillas);
    }

    contenedorJugadores.innerHTML = '';

    window.jugadores.forEach((jugador, index) => {
        jugador.posicion = 0;
        jugador.puntos = jugador.puntos || 0;

        // 🔥 SOLUCIÓN AL 404: Cambiado de 'images' a 'imagenes'
        const imgAvatar = jugador.imagenPersonaje ? jugador.imagenPersonaje : 'assets/imagenes/default.png';

        const esTurnoActivo = index === window.indiceTurnoActual ? 'turno-activo' : '';

        const tarjetaHtml = `
            <div class="tarjeta-jugador ${esTurnoActivo}" id="tarjeta-jugador-${jugador.id}">
                <div class="avatar-miniatura">
                    <img src="${imgAvatar}" alt="${jugador.nombre}">
                </div>
                <div class="info-jugador">
                    <span class="nombre-jugador">👤 ${jugador.nombre}</span>
                    <span class="nombre-personaje" style="font-size: 0.85em; font-weight: bold; color: #6a1b9a;">
                        🎭 ${jugador.personaje || 'Personaje'}
                    </span>
                    <span class="puntos-jugador">⭐ ${jugador.puntos} pts</span>
                </div>
            </div>
        `;
        contenedorJugadores.insertAdjacentHTML('beforeend', tarjetaHtml);

        const casillaInicial = document.getElementById(`cas-0`);

        let startLeft = "36.00%";
        let startTop = "12.00%";

        if (casillaInicial) {
            startLeft = casillaInicial.style.left;
            startTop = casillaInicial.style.top;
        }

        const nombreAMostrar = jugador.personaje || jugador.nombre;

        // 🔥 NUEVO: Detectamos si es el Camino 1 para aplicarle una clase de tamaño reducido
        const rutaActual = window.caminoSeleccionado || 'Violencia de Género';
        const esCamino2 = rutaActual === 'Estereotipos' || (fondoMapa && fondoMapa.includes('camino2'));
        const claseTamano = esCamino2 ? '' : 'ficha-camino1';

        const fichaHtml = `
            <div class="ficha-jugador ${claseTamano}" id="ficha-${jugador.id}" style="left: ${startLeft}; top: ${startTop};">
                <span class="etiqueta-nombre">${nombreAMostrar}</span>
                
                <!-- Volvemos a la imagen transparente -->
                <img src="${imgAvatar}" alt="Ficha ${jugador.nombre}">
                
                <div class="base-3d"></div>
            </div>
        `;

        if (tableroMapa) {
            tableroMapa.insertAdjacentHTML('beforeend', fichaHtml);
        }
    });

    if (typeof actualizarIndicadorTablero === "function") {
        actualizarIndicadorTablero();
    }
    // 🔥 NUEVO: Configurar las llaves para el primer jugador 🔥
    if (typeof window.actualizarVisibilidadLlaves === 'function') {
        window.actualizarVisibilidadLlaves();
    }

    // =======================================================
    // ⏱️ INICIAR EL RELOJ PARA TODOS LOS CAMINOS
    // =======================================================
    let numeroCaminoParaReloj = 1; // Valor por defecto
    const nombreCaminoActual = window.caminoSeleccionado || 'Violencia de Género';

    // 1. Intentar extraer el número si la variable contiene "Camino 2", "Camino 3", etc.
    const matchNumero = nombreCaminoActual.match(/camino\s*(\d+)/i);
    
    if (matchNumero) {
        numeroCaminoParaReloj = parseInt(matchNumero[1]);
    } else {
        // 2. Si solo llega el nombre del tema, usamos un switch para asignarlo
        switch (nombreCaminoActual) {
            case 'Violencia de Género':
                numeroCaminoParaReloj = 1;
                break;
            case 'Estereotipos':
                numeroCaminoParaReloj = 2;
                break;
            // Agrega aquí los nombres de tus otros caminos cuando los tengas:
            // case 'Nombre Del Camino 3':
            //     numeroCaminoParaReloj = 3;
            //     break;
            // case 'Nombre Del Camino 4':
            //     numeroCaminoParaReloj = 4;
            //     break;
            default:
                numeroCaminoParaReloj = 1;
        }
    }

    // Llamamos a la función que revisa Firebase e inicia el reloj
    if (typeof window.iniciarTemporizadorSiExiste === "function") {
        window.iniciarTemporizadorSiExiste(numeroCaminoParaReloj);
    }
};

function mostrarAnuncioTurno(nombreJugador) {
    // 🔊 1. REPRODUCIR SONIDO DE NUEVO TURNO
    bancoSonidos.turno.currentTime = 0;
    bancoSonidos.turno.play().catch(error => console.log("El navegador bloqueó el autoplay", error));

    let banner = document.getElementById('banner-anuncio-turno');

    const contenedorMapa = document.querySelector('.tablero-viewport');
    const tableroInterior = document.getElementById('tableroMapa'); // 🔥 Buscamos el mapa interno

    if (!banner) {
        banner = document.createElement('div');
        banner.id = 'banner-anuncio-turno';
        banner.style.cssText = `
            position: absolute; 
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) scale(0.6);
            background: linear-gradient(135deg, #6a1b9a, #ab47bc);
            color: white;
            padding: 25px 45px;
            border-radius: 20px;
            box-shadow: 0 15px 35px rgba(0, 0, 0, 0.6);
            z-index: 10000;
            opacity: 0;
            pointer-events: none;
            transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            border: 4px solid #ffd54f;
            font-family: inherit;

            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
            width: max-content; 
            max-width: 90%;
        `;

        if (contenedorMapa) {
            contenedorMapa.style.position = 'relative';
            contenedorMapa.appendChild(banner);
        } else {
            document.body.appendChild(banner);
        }
    }

    banner.innerHTML = `
        <div style="font-size: 1.1rem; text-transform: uppercase; letter-spacing: 2px; color: #ffd54f; font-weight: bold; margin-bottom: 5px; width: 100%; text-align: center;">
            ✨ ¡NUEVO TURNO! ✨
        </div>
        <div style="font-size: 1.8rem; font-weight: 800; margin: 8px 0; text-shadow: 1px 2px 4px rgba(0,0,0,0.3); width: 100%; text-align: center;">
            Turno de ${nombreJugador}
        </div>
        <div style="font-size: 1.1rem; font-weight: 500; opacity: 0.95; display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%;">
            <img src="assets/imagenes/iconos/icono_ruleta.png" alt="Ruleta" style="width: 28px; height: 28px; object-fit: contain;">
            ¡Gira la ruleta para avanzar!
        </div>
    `;

    // 🔥 1. Oscurecer el mapa con una transición suave
    if (tableroInterior) {
        tableroInterior.style.transition = 'filter 0.4s ease';
        tableroInterior.style.filter = 'brightness(0.4)';
    }

    // Mostrar animación (zoom in + fade in)
    setTimeout(() => {
        banner.style.opacity = '1';
        banner.style.transform = 'translate(-50%, -50%) scale(1)';
    }, 50);

    // Ocultar suavemente después de 2.2 segundos
    clearTimeout(window.timerAnuncioTurno);
    window.timerAnuncioTurno = setTimeout(() => {
        banner.style.opacity = '0';
        banner.style.transform = 'translate(-50%, -50%) scale(0.6)';

        // 🔥 2. Devolverle el brillo normal al mapa
        if (tableroInterior) {
            tableroInterior.style.filter = 'brightness(1)';
        }
    }, 2200);
}
function actualizarIndicadorTablero() {
    const jugadorActual = window.jugadores[window.indiceTurnoActual];
    const indicador = document.querySelector('.indicador-turno');
    if (indicador && jugadorActual) {
        indicador.innerHTML = `¡Es el turno de <strong>${jugadorActual.nombre}</strong>! 🎲`;
    }

    // Lanza el anuncio central en la pantalla
    if (jugadorActual) {
        mostrarAnuncioTurno(jugadorActual.nombre);
    }
}
function siguienteTurnoTablero() {
    window.esMovimientoBono = false;
    const idJugadorActual = window.jugadores[window.indiceTurnoActual].id;
    const tarjetaActual = document.getElementById(`tarjeta-jugador-${idJugadorActual}`);
    if (tarjetaActual) tarjetaActual.classList.remove('turno-activo');

    window.indiceTurnoActual++;

    if (window.indiceTurnoActual >= window.jugadores.length) {
        window.indiceTurnoActual = 0;
    }

    const idNuevoJugador = window.jugadores[window.indiceTurnoActual].id;
    const nuevaTarjeta = document.getElementById(`tarjeta-jugador-${idNuevoJugador}`);
    if (nuevaTarjeta) nuevaTarjeta.classList.add('turno-activo');

    actualizarIndicadorTablero();

    // 🔥 NUEVO: Actualizar qué llaves ve el nuevo jugador en su turno 🔥
    if (typeof window.actualizarVisibilidadLlaves === 'function') {
        window.actualizarVisibilidadLlaves();
    }

    const btnGirar = document.getElementById('btnGirar');
    if (btnGirar) {
        btnGirar.disabled = false;
    }
}
// =========================================================
// 3. EVENTOS DE LA RULETA (ALINEACIÓN EXACTA Y MORADOS)
// =========================================================
document.addEventListener('DOMContentLoaded', () => {
    const btnGirar = document.getElementById('btnGirar');
    const discoPequeno = document.getElementById('ruletaDisco');

    if (btnGirar) {
        btnGirar.addEventListener('click', () => {
            btnGirar.disabled = true;
            btnGirar.textContent = "Girando...";

            const numeroObtenido = Math.floor(Math.random() * 6) + 1;

            if (discoPequeno) {
                discoPequeno.style.transition = 'transform 2s cubic-bezier(0.2, 0.8, 0.2, 1)';

                // Ángulo exacto del centro del sector objetivo
                const anguloDestino = 360 - (numeroObtenido * 60 - 30);

                const rotacionActual = discoPequeno.dataset.rotacion ? parseInt(discoPequeno.dataset.rotacion) : 0;
                const anguloActualRelativo = rotacionActual % 360;

                // 4 vueltas completas (1440°) + el ajuste exacto al centro del número
                let gradosGiro = (anguloDestino - anguloActualRelativo) + 1440;
                if (gradosGiro < 1440) gradosGiro += 360;

                const nuevaRotacion = rotacionActual + gradosGiro;
                discoPequeno.dataset.rotacion = nuevaRotacion;

                discoPequeno.style.transform = `rotate(${nuevaRotacion}deg)`;
            }

            setTimeout(() => {
                btnGirar.textContent = `¡Salió el ${numeroObtenido}!`;
                btnGirar.style.backgroundColor = "#9333ea"; // Morado destacado al ganar
                btnGirar.style.color = "white";

                mostrarAnuncioResultado(numeroObtenido);

                setTimeout(() => {
                    btnGirar.textContent = "GIRAR";
                    btnGirar.style.backgroundColor = "";
                    btnGirar.style.color = "";

                    window.moverJugadorActual(numeroObtenido);
                }, 1500);

            }, 2000);
        });
    }

});

// --- FUNCIÓN PARA MOSTRAR EL NÚMERO OBTENIDO CENTRADO EN EL MAPA ---
function mostrarAnuncioResultado(numero) {
    let banner = document.getElementById('banner-resultado-ruleta');

    const contenedorMapa = document.querySelector('.tablero-viewport');
    const tableroInterior = document.getElementById('tableroMapa'); // 🔥 Buscamos el mapa interno

    if (!banner) {
        banner = document.createElement('div');
        banner.id = 'banner-resultado-ruleta';

        banner.style.cssText = `
            position: absolute; 
            top: 50%; 
            left: 50%; 
            transform: translate(-50%, -50%) scale(0.5);
            background: linear-gradient(135deg, #9333ea, #6b21a8);
            color: white;
            padding: 20px 50px; 
            border-radius: 20px; 
            box-shadow: 0 10px 30px rgba(0,0,0,0.6);
            z-index: 10000; 
            opacity: 0; 
            pointer-events: none;
            transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            border: 4px solid #c084fc; 
            font-family: inherit; 
            font-size: 2.2rem; 
            font-weight: 900;
            text-shadow: 0 3px 6px rgba(0,0,0,0.5);

            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
            width: max-content;
            max-width: 90%;
        `;

        if (contenedorMapa) {
            contenedorMapa.style.position = 'relative';
            contenedorMapa.appendChild(banner);
        } else {
            document.body.appendChild(banner);
        }
    }

    banner.innerHTML = `¡Avanzas ${numero} pasos!`;

    // 🔥 1. Oscurecer el mapa
    if (tableroInterior) {
        tableroInterior.style.transition = 'filter 0.3s ease';
        tableroInterior.style.filter = 'brightness(0.4)';
    }

    // Animación de entrada (Efecto rebote / Zoom In)
    setTimeout(() => {
        banner.style.opacity = '1';
        banner.style.transform = 'translate(-50%, -50%) scale(1)';
    }, 10);

    // Animación de salida (Zoom Out y Fade) antes de que el jugador empiece a moverse
    setTimeout(() => {
        banner.style.opacity = '0';
        banner.style.transform = 'translate(-50%, -50%) scale(0.5)';

        // 🔥 2. Devolverle el brillo normal al mapa
        if (tableroInterior) {
            tableroInterior.style.filter = 'brightness(1)';
        }
    }, 1400);
}

// =========================================================
// 🗝️ VISIBILIDAD DE LLAVES (MAGIA MULTIJUGADOR)
// =========================================================
window.actualizarVisibilidadLlaves = function () {
    const jugador = window.jugadores[window.indiceTurnoActual];
    if (!jugador || !window.casillasConLlave) return;

    const llavesRecogidas = jugador.llavesRecogidas || [];

    // Recorremos todas las casillas que tienen llave en el tablero
    window.casillasConLlave.forEach(idCasilla => {
        const iconoLlave = document.getElementById(`llave-${idCasilla}`);
        if (iconoLlave) {
            if (llavesRecogidas.includes(idCasilla)) {
                // Si ESTE jugador ya recogió esta llave, se la ocultamos
                iconoLlave.style.display = 'none';
            } else {
                // Si aún no la ha recogido, se la mostramos
                iconoLlave.style.display = 'block';
            }
        }
    });
};
window.comprobarYRecogerLlave = function (jugador) {
    if (window.casillasConLlave && window.casillasConLlave.includes(jugador.posicion)) {

        if (!jugador.llavesRecogidas) jugador.llavesRecogidas = [];

        if (!jugador.llavesRecogidas.includes(jugador.posicion)) {
            jugador.llavesRecogidas.push(jugador.posicion);

            const iconoLlave = document.getElementById(`llave-${jugador.posicion}`);
            if (iconoLlave) {
                const llaveAnimacion = iconoLlave.cloneNode(true);
                iconoLlave.parentNode.appendChild(llaveAnimacion);

                llaveAnimacion.style.animation = "none";
                void llaveAnimacion.offsetWidth;

                llaveAnimacion.style.transform = "translate(-50%, -50%) scale(1.5) translateY(-50px)";
                llaveAnimacion.style.opacity = "0";
                setTimeout(() => llaveAnimacion.remove(), 400);
                iconoLlave.style.display = "none";
            }

            // 🔥 SEGURO DE CARGA: Si por alguna razón los cofres están vacíos, los volvemos a llamar de tu data
            if (!window.cofresDisponibles || window.cofresDisponibles.length === 0) {
                window.cofresDisponibles = (window.camino1 && window.camino1.cofresData) ? [...window.camino1.cofresData] : [];
            }

            // Asignar el contenido de TU data a la llave pendiente
            if (!jugador.tieneLlavePendiente && window.cofresDisponibles.length > 0) {
                const indiceCofre = (jugador.llavesRecogidas.length - 1) % window.cofresDisponibles.length;
                jugador.tieneLlavePendiente = window.cofresDisponibles[indiceCofre];
            }
        }
    }
};
window.moverJugadorActual = function (pasos) {
    if (typeof window.indiceTurnoActual === 'undefined') window.indiceTurnoActual = 0;
    const jugador = window.jugadores[window.indiceTurnoActual];

    if (!jugador) return;

    const ficha = document.getElementById(`ficha-${jugador.id}`);
    if (!ficha) return;

    const casillaFinalTablero = window.coordenadasActuales.length - 1;
    let pasosRestantes = pasos;

    const intervaloMovimiento = setInterval(() => {
        if (pasosRestantes > 0 && jugador.posicion < casillaFinalTablero) {
            jugador.posicion++;
            pasosRestantes--;

            const datosBase = window.coordenadasActuales.find(c => c.id == jugador.posicion);
            const extra = (window.contenidoExtra && (Array.isArray(window.contenidoExtra) ? window.contenidoExtra[jugador.posicion - 1] : window.contenidoExtra[jugador.posicion])) || {};
            const datosCasilla = { ...datosBase, ...extra };

            if (datosCasilla && ficha) {
                ficha.style.left = `${datosCasilla.x}%`;
                ficha.style.top = `${datosCasilla.y}%`;
                window.moverCamara(datosCasilla.x, datosCasilla.y);
            }

            // 🔥 AQUI LLAMAMOS A LA FUNCIÓN MAESTRA EN CADA PASITO
         // Dentro de setInterval en window.moverJugadorActual
            window.comprobarYRecogerLlave(jugador); // Esto no hará nada en el Camino 2 porque el array está vacío

            const tipoCasilla = datosCasilla && datosCasilla.tipo ? datosCasilla.tipo.toLowerCase().trim() : '';
            
            // 🔥 AGREGAMOS tipoCasilla === 'info' PARA QUE DETENGA EL AVANCE EN EL CAMINO 2
            const esParada = datosCasilla && (datosCasilla.esParadaObligatoria || tipoCasilla === 'video' || tipoCasilla === 'info' || tipoCasilla === 'meta');

            if (esParada && pasosRestantes > 0) {
                clearInterval(intervaloMovimiento);
                window.pasosPendientes = pasosRestantes;
                window.evaluarCasillaDestino();
                return;
            }

        } else {
            clearInterval(intervaloMovimiento);
            window.pasosPendientes = 0;
            window.evaluarCasillaDestino();
        }
    }, 400);
};

window.moverFichaSilencioso = function (bono, callback) {
    const jugador = window.jugadores[window.indiceTurnoActual];
    const ficha = document.getElementById(`ficha-${jugador.id}`);
    const limiteTablero = window.coordenadasActuales.length;

    let pasosRestantes = Math.abs(bono);
    const direccion = bono > 0 ? 1 : -1;

    const intervaloBono = setInterval(() => {
        if (pasosRestantes > 0) {
            const nuevaPosicion = jugador.posicion + direccion;

            if (nuevaPosicion >= 1 && nuevaPosicion <= limiteTablero) {
                jugador.posicion = nuevaPosicion;

                const datosBase = window.coordenadasActuales.find(c => c.id == jugador.posicion);
                const extra = (window.contenidoExtra && (Array.isArray(window.contenidoExtra) ? window.contenidoExtra[jugador.posicion - 1] : window.contenidoExtra[jugador.posicion])) || {};
                const datosCasilla = { ...datosBase, ...extra };

                if (datosCasilla && ficha) {
                    ficha.style.left = `${datosCasilla.x}%`;
                    ficha.style.top = `${datosCasilla.y}%`;
                    window.moverCamara(datosCasilla.x, datosCasilla.y);
                }

               // Dentro de setInterval en window.moverFichaSilencioso
                window.comprobarYRecogerLlave(jugador);

                const tipoCasilla = datosCasilla && datosCasilla.tipo ? datosCasilla.tipo.toLowerCase().trim() : '';
                
                // 🔥 ASEGURAMOS QUE 'info' TAMBIÉN FRENE LOS BONOS DE AVANCE
                const esParadaObligatoria = datosCasilla && (datosCasilla.esParadaObligatoria || tipoCasilla === 'video' || tipoCasilla === 'info' || tipoCasilla === 'meta');

                pasosRestantes--;

                if (esParadaObligatoria) {
                    clearInterval(intervaloBono);
                    window.pasosPendientes = pasosRestantes;
                    window.esMovimientoBono = true;
                    window.evaluarCasillaDestino();
                    return;
                }
            } else {
                pasosRestantes--;
            }
        } else {
            clearInterval(intervaloBono);

            const btnGirar = document.getElementById('btnGirar');
            if (btnGirar) btnGirar.disabled = false;

            // 🔥 SI RECOGIÓ UNA LLAVE DURANTE EL BONO, LANZAMOS EL COFRE ANTES DE PASAR EL TURNO
            if (jugador.tieneLlavePendiente) {
                window.iniciarMiniJuegoCofre(jugador);
            } else if (callback) {
                callback();
            }
        }
    }, 400);
};

// =========================================================
// 5. EVALUACIÓN DE CASILLAS (VIDEOS, INFO Y CARTAS FIREBASE)
// =========================================================
window.evaluarCasillaDestino = async function () {
    await new Promise(resolve => setTimeout(resolve, 500));

    const jugadorActual = window.jugadores[window.indiceTurnoActual];
    const casillaActual = jugadorActual.posicion;

    const datosBase = window.coordenadasActuales.find(c => c.id == casillaActual);
    const extra = (window.contenidoExtra && (Array.isArray(window.contenidoExtra) ? window.contenidoExtra[casillaActual - 1] : window.contenidoExtra[casillaActual])) || {};
    const datosCasilla = { ...datosBase, ...extra };

    if (!datosCasilla) {
        siguienteTurnoTablero();
        return;
    }

    const modal = obtenerOCrearModalJS();
    const tituloContenedor = document.getElementById('modal-educativo-titulo');
    const cuerpoContenedor = document.getElementById('modal-educativo-cuerpo');
    const btnCerrar = document.getElementById('btn-cerrar-educativo');

    const tipoCasilla = datosCasilla.tipo ? datosCasilla.tipo.toLowerCase().trim() : '';
    const casillaFinalTablero = window.coordenadasActuales.length - 1; // La casilla 51

    // 🌟 1. VERIFICAR SI ES LA META
    if (datosCasilla.esMeta === true || tipoCasilla === 'meta' || casillaActual >= casillaFinalTablero) {

        // 🔥 NUEVO: DETENER EL RELOJ PORQUE YA GANARON 🔥
        if (window.intervaloTemporizador) {
            clearInterval(window.intervaloTemporizador); // Frena el contador

            // Opcional: Ocultar el reloj para que la pantalla quede limpia
            const relojUI = document.getElementById('contenedor-reloj-panel');
            if (relojUI) relojUI.style.display = 'none';
        }
        const rutaVideoMeta = datosCasilla.rutaVideo || 'assets/videos/camino1/videoreflexion.mp4';

        cuerpoContenedor.innerHTML = `
            <div style="padding: 10px; text-align: center;">
                <p style="margin-bottom: 15px; color: white; text-shadow: 1px 1px 2px rgba(0,0,0,0.8); font-size: 1.05rem;">
                    Antes de ver tu evaluación final, tómate un momento para reflexionar:
                </p>
                <video controls autoplay style="width:100%; max-height: 350px; border-radius:12px; border: 2px solid rgba(255, 255, 255, 0.8); box-shadow: 0 10px 25px rgba(0, 0, 0, 0.6); background: #000;">
                    <source src="${rutaVideoMeta}" type="video/mp4">
                    Tu navegador no soporta el video.
                </video>
            </div>
        `;

        if (btnCerrar) {
            btnCerrar.textContent = "Ir a la Evaluación Final ➔";
            btnCerrar.style.display = 'inline-block';
        }

        // 🔥 ESTA BANDERA ES LA QUE ACTIVA EL PASO 1 DE ARRIBA
        window.juegoTerminado = true;

        modal.classList.remove('hidden');
        modal.style.display = 'flex';

        return;
    }

    // 🌟 2. SI ES UNA CASILLA DE VIDEO O INFO NORMAL
    if (tipoCasilla === 'video' || tipoCasilla === 'info') {

        // Lee el título de los datos de la casilla y lo pone en el modal.
        tituloContenedor.textContent = datosCasilla.titulo || "Información";
        tituloContenedor.style.display = 'inline-block';

        if (!jugadorActual.paradasVisitadas) {
            jugadorActual.paradasVisitadas = []; // Creamos el historial si no existe
        }

        let alertaPuntos = "";

        // Si el jugador NO ha visitado esta casilla antes...
        if (!jugadorActual.paradasVisitadas.includes(casillaActual)) {
            jugadorActual.puntos += 2; // Sumamos 2 puntos
            jugadorActual.paradasVisitadas.push(casillaActual); // Marcamos la casilla como visitada

            // Actualizamos la tarjeta visual del jugador en el tablero
            const tarjetaJugador = document.getElementById(`tarjeta-jugador-${jugadorActual.id}`);
            if (tarjetaJugador) {
                const elementoPuntos = tarjetaJugador.querySelector('.puntos-jugador');
                if (elementoPuntos) {
                    elementoPuntos.innerHTML = `⭐ ${jugadorActual.puntos} pts`;
                }
            }
            window.animarSumaPuntos(jugadorActual.id, 2);

            // 🔥 NUEVO ESTILO: Dorado brillante como una moneda/recompensa real
            alertaPuntos = `
                <div style="background: linear-gradient(135deg, #5e2a84, #5e2a84); 
                            color: #f8f7f8; padding: 12px; margin-top: 20px; border-radius: 12px; 
                            font-weight: 900; border: 2px solid #FFFFFF;
                            box-shadow: 0 6px 15px rgba(0,0,0,0.5); text-align: center;
                            text-shadow: 0px 1px 1px rgba(255,255,255,0.6);">
                    ⭐ ¡Has ganado 2 puntos! Informarse es el primer paso para prevenir la violencia.
                </div>
            `;
        }

        cuerpoContenedor.innerHTML = '';
        let contenidoCasilla = "";

        if (datosCasilla.rutaVideo) {

            // 🔥 MAGIA DE RA: Si el switch está activo y tenemos una imagen de marcador
            if (window.modoRA && datosCasilla.imagenRA) {
                contenidoCasilla = `
                    <!-- 🔥 EL CAMBIO: Quitamos el 'dashed' y pusimos un borde sólido y fino estilo cristal -->
                    <div style=" padding: 20px; border-radius: 12px;  margin-bottom: 10px;">
                        <p style="font-size: 0.95rem; color: #ffffff; background: rgba(0, 0, 0, 0.45); padding: 10px 15px; border-radius: 8px; border: 1px solid rgba(255, 255, 255, 0.1); margin: 0 auto 20px auto; max-width: 90%; text-shadow: 1px 1px 2px rgba(0,0,0,0.9);">
    Abre tu aplicación de Realidad Aumentada ITCA Academy 2.0 y apunta la cámara a esta imagen:
</p>
                       <img src="${datosCasilla.imagenRA}" alt="Marcador RA" style="display: block; margin: 0 auto; width: auto; height: auto; max-width: 250px; max-height: 35vh; border-radius: 12px; box-shadow: 0 8px 20px rgba(0,0,0,0.6); border: 3px solid rgba(255,255,255,0.8); background: #ffffff;">
                    </div>
                `;
            }
            // Si el modo RA está apagado (o no hay marcador), mostramos el video normal
            else {
                contenidoCasilla = `
                    <video controls autoplay style="width:100%; max-height: 350px; border-radius:12px; border: 2px solid rgba(255, 255, 255, 0.8); box-shadow: 0 10px 25px rgba(0, 0, 0, 0.6), 0 0 15px rgba(255, 255, 255, 0.15); background: #000;">
                        <source src="${datosCasilla.rutaVideo}" type="video/mp4">
                        Tu navegador no soporta el video.
                    </video>
                `;
            }

        } else if (datosCasilla.descripcion) {
            contenidoCasilla = `
                <div style="text-align: justify; line-height: 1.6; font-size: 1rem; color: #fff; text-shadow: 1px 1px 3px rgba(0,0,0,0.8);">
                    ${datosCasilla.descripcion}
                </div>
            `;
        } else {
            contenidoCasilla = '<p style="color: #ccc; text-shadow: 1px 1px 2px rgba(0,0,0,0.8);">Contenido no disponible para esta casilla.</p>';
        }

        // 🔥 EL CAMBIO CLAVE: Primero insertamos el contenido (Video/Texto) y DESPUÉS la alerta de puntos
        cuerpoContenedor.innerHTML = contenidoCasilla + alertaPuntos;

        if (btnCerrar) btnCerrar.style.display = 'inline-block';
        modal.classList.remove('hidden');
        modal.style.display = 'flex';
    }
    else if (tipoCasilla === 'carta') {
        // 1. Normalizar el nombre del personaje (ej: "Mía" -> "mia")
        const personajeBase = window.normalizarId(jugadorActual.personaje || 'paula');

        // 2. Determinar camino y sufijo para Firestore
        const caminoActual = window.caminoSeleccionado || 'Violencia de Género';
        const esCamino2 = caminoActual === 'Estereotipos' || caminoActual.toLowerCase().includes('camino2');
        const sufijoCamino = esCamino2 ? '_c2' : '_c1';
        const personajeIdBD = `${personajeBase}${sufijoCamino}`;

        // 3. Extraer fondos y avatar de forma segura
        const fondoFrente = fondosCartillas?.[personajeBase]?.frente || '';
        const fondoReverso = fondosCartillas?.[personajeBase]?.reverso || '';
        const imgPersonaje = jugadorActual.imagenPersonaje || personajesData?.[personajeBase]?.imagenFull || 'assets/imagenes/default.png';

        tituloContenedor.textContent = "";
        tituloContenedor.style.display = 'none';
        cuerpoContenedor.innerHTML = `<p>Cargando situación de <b>${personajeBase.toUpperCase()}</b>...</p>`;

        if (btnCerrar) btnCerrar.style.display = 'none';
        modal.classList.remove('hidden');
        modal.style.display = 'flex';

        try {
            let datosCarta = await obtenerCartaAleatoria(personajeIdBD);

            if (datosCarta) {
                let opciones = [
                    {
                        texto: datosCarta.opcion_empatica,
                        retro: datosCarta.retro_empatica,
                        icono: '<img src="assets/imagenes/iconos/icono_resp_empatica.png" alt="Empática" style="width: 60px; height: 60px; object-fit: contain;">',
                        bono: 2,
                        puntos: 2,
                        tipo: 'Empática' // 🔥 AÑADIDO
                    },
                    {
                        texto: datosCarta.opcion_poco_empatica,
                        retro: datosCarta.retro_poco_empatica,
                        icono: '<img src="assets/imagenes/iconos/icono_resp_pocoempatica.png" alt="Poco Empática" style="width: 60px; height: 60px; object-fit: contain;">',
                        bono: 1,
                        puntos: 1,
                        tipo: 'Poco Empática' // 🔥 AÑADIDO
                    },
                    {
                        texto: datosCarta.opcion_nada_empatica,
                        retro: datosCarta.retro_nada_empatica,
                        icono: '<img src="assets/imagenes/iconos/icono_resp_nadaempatica.png" alt="Nada Empática" style="width: 60px; height: 60px; object-fit: contain;">',
                        bono: 0,
                        puntos: 0,
                        tipo: 'Nada Empática' // 🔥 AÑADIDO
                    }
                ];

                opciones = mezclarArreglo(opciones);


               // 1. Botones de opciones limpios con el texto justificado
                const botonesHtml = opciones.map((opc, index) => `
                    <button class="opcion-btn" data-index="${index}" style="text-align: justify; line-height: 1.4; padding: 12px 15px;">
                        ${opc.texto}
                    </button>
                `).join('');

                // 2. Estructura de la carta usando CSS limpio
                cuerpoContenedor.innerHTML = `
                    <div class="modal-carta-container">
                        <div id="carta-animada" class="carta-flipper">
                            
                            <!-- FRENTE DE LA CARTILLA -->
                           <!-- FRENTE DE LA CARTILLA -->
                            <div class="carta-cara carta-frente" style="background-image: url('${fondoFrente}');">
                                <h2>Situación</h2>
                                <img src="${imgPersonaje}" alt="${personajeBase}">
                                
                                <!-- Contenedor cristalizado blanco para el texto -->
                                <div style="padding: 12px; width: 100%; flex-grow: 1; display: flex; align-items: center; overflow-y: auto; 
                                            background: rgba(255, 255, 255, 0.65); 
                                            backdrop-filter: blur(8px); 
                                            -webkit-backdrop-filter: blur(8px); 
                                            border-radius: 12px; 
                                            border: 1px solid rgba(255, 255, 255, 0.9); 
                                            box-shadow: 0 4px 10px rgba(0,0,0,0.15); 
                                            box-sizing: border-box;">
                                    
                                    <!-- 🔥 AQUÍ: La etiqueta p limpia, tomará todo el estilo de tu CSS (.carta-frente p) -->
                                    <p>${datosCarta.descripcion}</p>
                                    
                                </div>
                                
                                <button id="btn-girar-carta" style="margin-top: 10px; background: linear-gradient(135deg, #9C27B0, #6A1B9A); color: white; padding: 10px; border-radius: 8px; border: none; cursor: pointer; font-weight: bold; width: 100%; flex-shrink: 0; box-shadow: 0 4px 8px rgba(0,0,0,0.3);">Tomar decisión 🔄</button>
                            </div>
                           <!-- REVERSO DE LA CARTILLA -->
                            <div class="carta-cara carta-reverso" style="background-image: url('${fondoReverso}');">
                                
                                <!-- Opciones -->
                                <div id="reverso-opciones" style="width: 100%; height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center; background: transparent; padding: 12px; border-radius: 10px;">
                                    
                                    <!-- 🔥 El título se mantiene centrado -->
                                    <h3 style="margin: 0 0 15px 0; color: #000000; font-size: 1.1rem; text-shadow: 1px 1px 2px rgba(255, 255, 255, 0.8); text-align: center;">
                                        ¿Qué decisión tomas?
                                    </h3>
                                    
                                    <div style="width: 100%; display: flex; flex-direction: column; gap: 8px;">
                                        ${botonesHtml}
                                    </div>
                                </div>

                             <!-- Feedback (Oculto al inicio, se muestra al elegir una opción) -->
                                <div id="reverso-retro" class="hidden" style="
                                    display: none; flex-direction: column; align-items: center; 
                                    width: 100%; height: 100%; padding: 15px; box-sizing: border-box; text-align: center;
                                    /* 🔥 EFECTO CRISTALIZADO BLANCO */
                                    background: rgba(255, 255, 255, 0.2); 
                                    backdrop-filter: blur(10px); 
                                    -webkit-backdrop-filter: blur(10px); 
                                    border-radius: 10px;
                                    border: 1px solid rgba(255, 255, 255, 0.9); 
                                ">
                                                                    
                                    <!-- Ícono (Fijo en la parte superior, no se encoge) -->
                                    <div id="retro-icono" style="flex-shrink: 0; margin-bottom: 10px;"></div>
                                                                    
                                    <!-- Contenedor de Textos (Responsive con Scroll Automático) -->
                                    <div style="flex-grow: 1; flex-shrink: 1; width: 100%; overflow-y: auto; display: flex; flex-direction: column;">
                                        
                                        <!-- 🔥 EL SECRETO: margin: auto 0; centra el texto si hay espacio, pero permite leer desde arriba si es muy largo -->
                                        <div id="retro-texto" style="margin: auto 0; font-weight: 700; color: #222222; width: 100%; display: flex; flex-direction: column; align-items: center;"></div>
                                        
                                    </div>

                                    <!-- Botón continuar (Fijo en la parte inferior, no se encoge) -->
                                    <button id="btn-cerrar-carta" style="flex-shrink: 0; margin-top: 10px; background: linear-gradient(135deg, #9C27B0, #6A1B9A); color: white; padding: 10px 25px; border-radius: 8px; border: none; cursor: pointer; font-weight: 900; width: auto; box-shadow: 0 4px 10px rgba(106, 27, 154, 0.4);">Continuar</button>
                                </div>

                            </div>
                        </div>
                    </div>
                `;
                document.getElementById('btn-girar-carta').addEventListener('click', () => {
                    document.getElementById('carta-animada').style.transform = 'rotateY(180deg)';
                    bancoSonidos.carta.currentTime = 0;
                    bancoSonidos.carta.play().catch(err => console.log("Audio bloqueado:", err));
                });

                document.querySelectorAll('.opcion-btn').forEach(boton => {
                    boton.addEventListener('click', (e) => {
                        const index = e.target.getAttribute('data-index');
                        const elegida = opciones[index];
                        window.bonoCartaActual = elegida.bono;

                        jugadorActual.puntos += elegida.puntos;

                        const tarjetaJugador = document.getElementById(`tarjeta-jugador-${jugadorActual.id}`);
                        if (tarjetaJugador) {
                            const elementoPuntos = tarjetaJugador.querySelector('.puntos-jugador');
                            if (elementoPuntos) {
                                elementoPuntos.innerHTML = `⭐ ${jugadorActual.puntos} pts`;
                            }
                        }

                        if (elegida.puntos > 0) {
                            window.animarSumaPuntos(jugadorActual.id, elegida.puntos);
                        }

                        document.getElementById('reverso-opciones').style.display = 'none';
                        const retro = document.getElementById('reverso-retro');
                        retro.style.display = 'flex';
                        retro.classList.remove('hidden');
                        document.getElementById('retro-icono').innerHTML = elegida.icono;


                        let textoAccion = elegida.bono > 0
                            ? `<img src="assets/imagenes/iconos/icono_regalo.png" alt="Premio" style="width: 22px; height: 22px; vertical-align: middle; margin-right: 5px; transform: translateY(-2px);"> ¡Avanzas ${elegida.bono} casilla(s) y ganas ${elegida.puntos} puntos!`
                            : `🛑 No avanzas casillas ni ganas puntos.`;

                        // Construimos el HTML Responsive con texto justificado
                        document.getElementById('retro-texto').innerHTML = `
                            <span style="text-align: center; margin-bottom: 8px; font-size: 0.9rem; color: #555;">
                                Tu respuesta ha sido: <br>
                                <strong style="color: #6A1B9A; font-size: 1.05rem; text-transform: uppercase;">${elegida.tipo}</strong>
                            </span>
                            
                            <!-- 🔥 AQUÍ ESTÁ EL CAMBIO: text-align: justify; para que quede cuadradito y ordenado -->
                            <span style="text-align: justify; margin-bottom: 15px; line-height: 1.4; width: 100%; font-size: 0.95rem;">
                                ${elegida.retro}
                            </span>
                            
                            <!-- El premio sigue centrado para que parezca una etiqueta/botón -->
                            <span style="background: rgba(156, 39, 176, 0.1); padding: 8px 12px; border-radius: 8px; color: #6A1B9A; border: 1px solid rgba(156, 39, 176, 0.3); text-align: center; font-size: 0.9rem; margin-top: 5px;">
                                <strong>${textoAccion}</strong>
                            </span>
                        `;
                    });
                });

                document.getElementById('btn-cerrar-carta').addEventListener('click', () => {
                    if (btnCerrar) btnCerrar.click();
                });

            } else {
                cuerpoContenedor.innerHTML = `<p style="color:#6a1b9a; font-weight:bold;">¡Zona Segura! Ya respondiste todas las situaciones de este camino.</p><button id="btn-err-close" style="background:#4CAF50; color:white; padding:10px 20px; border-radius:8px; border:none; cursor:pointer; margin-top:15px;">Continuar</button>`;
                document.getElementById('btn-err-close').addEventListener('click', () => { if (btnCerrar) btnCerrar.click(); });
            }
        } catch (error) {
            cuerpoContenedor.innerHTML = `<p style="color:red;">Error de BD: ${error.message}</p><button id="btn-err-close">Continuar</button>`;
            document.getElementById('btn-err-close').addEventListener('click', () => { if (btnCerrar) btnCerrar.click(); });
        }

    }
    else {
        // 🔥 FRENO 1: Si cae en una casilla vacía, obligamos a buscar el cofre antes de pasar turno
        if (jugadorActual.tieneLlavePendiente) {
            // 🔥 FIX 3: Rescatamos el dato y limpiamos la variable antes de lanzar el minijuego
            const cofrePendiente = jugadorActual.tieneLlavePendiente;
            jugadorActual.tieneLlavePendiente = null;
            window.iniciarMiniJuegoCofre(jugadorActual, cofrePendiente);
        } else {
            siguienteTurnoTablero();
        }
    }
};

// Auxiliar para mezclar arreglos
function mezclarArreglo(arreglo) {
    for (let i = arreglo.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arreglo[i], arreglo[j]] = [arreglo[j], arreglo[i]];
    }
    return arreglo;
}
// =========================================================
// 6. DELEGACIÓN DE EVENTO PARA CERRAR EL MODAL
// =========================================================
document.addEventListener('click', (e) => {
    // Si el clic fue en el botón de cerrar el modal educativo
    if (e.target && e.target.id === 'btn-cerrar-educativo') {
        const modal = document.getElementById('modal-contenido-casilla');
        if (modal) {
            modal.classList.add('hidden');
            modal.style.display = 'none';
        }

        // Pausar y reiniciar el video si lo hay
        const video = document.querySelector('#modal-educativo-cuerpo video');
        if (video) {
            video.pause();
            video.currentTime = 0;
        }

        // 🌟 1. SI ES LA META (Usamos la bandera súper rápida)
        if (window.juegoTerminado) {
            console.log("¡Cerrando modal de meta! Pasando al Post-Quiz en Paso 4...");

            // Regresamos el botón del modal a la normalidad
            e.target.textContent = "Continuar Juego";
            window.juegoTerminado = false; // Apagamos la bandera de juegoTerminado

            // 🛑 ¡ESTA ES LA LÍNEA CLAVE QUE FALTABA! 🛑
            window.tableroCompletado = true; // Avisamos a main.js que ya terminamos el tablero

            // 🔥 MAGIA DE REUTILIZACIÓN: Cambiamos los textos del HTML del Paso 4
            const tituloQuiz = document.querySelector('#paso-4 .quiz-titulos h2');
            const subTituloQuiz = document.querySelector('#paso-4 .quiz-titulos p');
            const btnFinalizarPaso4 = document.getElementById('btn-finalizar-quiz');
            const marcadorGlobal = document.getElementById('marcador-global');

            // Actualizamos los títulos para que parezca una pantalla nueva
            if (tituloQuiz) tituloQuiz.innerHTML = "Evaluación Final 🎓";
            if (subTituloQuiz) subTituloQuiz.textContent = "Demuestren todo lo que han aprendido en este viaje.";

            // Actualizamos el botón inferior y lo bloqueamos
            if (btnFinalizarPaso4) {
                btnFinalizarPaso4.textContent = "Ver Resultados Finales ➔";
                btnFinalizarPaso4.disabled = true;
                btnFinalizarPaso4.style.opacity = "0.5";
            }

            // Aseguramos que el contador "1 de 5" vuelva a verse
            if (marcadorGlobal) marcadorGlobal.style.display = 'block';

            // 🔥 Y finalemente cambiamos de pantalla al PASO 4 (Ahora sí main.js sabrá qué hacer)
            if (typeof window.cambiarPaso === 'function') {
                window.cambiarPaso(4);
            }

            return; // 🛑 DETIENE EL CÓDIGO AQUÍ PARA QUE NO PASE EL TURNO
        }

        // 🌟 2. SI NO ES LA META, FLUJO NORMAL DEL JUEGO

        // Nos aseguramos de que el texto del botón esté correcto
        e.target.textContent = "Continuar Juego";

        const continuarFlujoGeneral = () => {
            const jugadorActual = window.jugadores[window.indiceTurnoActual];
            const casillaFinalTablero = window.coordenadasActuales.length;

            if (jugadorActual.tieneLlavePendiente) {
                // 🔥 FIX 4: Limpieza preventiva para evitar bugs de doble modal
                const cofrePendiente = jugadorActual.tieneLlavePendiente;
                jugadorActual.tieneLlavePendiente = null;
                window.iniciarMiniJuegoCofre(jugadorActual, cofrePendiente);
            }
            else if (window.pasosPendientes > 0 && jugadorActual.posicion < casillaFinalTablero) {
                // 2. Si paró por obligación pero le quedan pasos, termina de caminar
                window.moverJugadorActual(window.pasosPendientes);
            }
            else if (window.bonoCartaActual) {
                // 3. Si tiene un bono de movimiento por una carta, se mueve silenciosamente
                const bono = window.bonoCartaActual;
                window.bonoCartaActual = 0;
                window.moverFichaSilencioso(bono, () => {
                    siguienteTurnoTablero();
                });
            }
            else {
                // 4. Si no pasa nada de lo anterior, entonces SÍ pasa el turno (Una sola vez)
                siguienteTurnoTablero();
            }
        };

        continuarFlujoGeneral();
    }
});
// =========================================================
// EFECTOS VISUALES Y DE SONIDO PARA PUNTOS
// =========================================================
window.animarSumaPuntos = function (idJugador, cantidadPuntos) {
    if (cantidadPuntos <= 0) return; // Si no gana puntos, no hacemos nada

    // 1. REPRODUCIR SONIDO
    try {
        // Asegúrate de tener un sonido corto en esta ruta (mp3, wav, m4a)
        const sonidoPuntos = new Audio('assets/sonido/sonido_ganapuntos.mp3');
        sonidoPuntos.volume = 0.7; // Volumen al 70%
        sonidoPuntos.play();
    } catch (e) {
        console.log("No se pudo reproducir el sonido de puntos.");
    }

    // 2. ANIMACIÓN EN LA TARJETA DEL JUGADOR
    const tarjeta = document.getElementById(`tarjeta-jugador-${idJugador}`);
    if (tarjeta) {
        tarjeta.style.position = 'relative'; // Necesario para el efecto flotante

        const elementoPuntos = tarjeta.querySelector('.puntos-jugador');

        // Hacer que el texto de puntos palpite (crezca y se ponga verde)
        if (elementoPuntos) {
            elementoPuntos.style.transition = "all 0.3s ease";
            elementoPuntos.style.transform = "scale(1.4)";
            elementoPuntos.style.color = "#4CAF50";

            setTimeout(() => {
                elementoPuntos.style.transform = "scale(1)";
                elementoPuntos.style.color = ""; // Vuelve a su color original
            }, 500);
        }

        // Crear el texto flotante animado (Ej: "+2")
        const flotante = document.createElement('div');
        flotante.innerText = `+${cantidadPuntos}`;
        flotante.style.cssText = `
            position: absolute;
            right: 20px;
            top: 10px;
            color: #FFD700;
            font-weight: 900;
            font-size: 1.8rem;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.5), 0 0 10px #FF9800;
            z-index: 1000;
            opacity: 1;
            transition: all 1s ease-out;
            pointer-events: none;
        `;

        tarjeta.appendChild(flotante);

        // Desplazar hacia arriba y desvanecer después de 50ms (para que CSS detecte la transición)
        setTimeout(() => {
            flotante.style.top = '-40px';
            flotante.style.opacity = '0';
        }, 50);

        // Eliminar el elemento del HTML para que no acumule basura
        setTimeout(() => {
            flotante.remove();
        }, 1050);
    }

    // 3. ENFOCAR LA CÁMARA (VERSIÓN SEGURA)
    const caminoActualFinal = window.caminoSeleccionado || 'Violencia de Género';

    // 🔥 CORRECCIÓN: Usamos window.coordenadasActuales para que no dé el error de 'length'
    if (caminoActualFinal === 'Estereotipos' && window.coordenadasActuales && window.coordenadasActuales.length > 0) {
        setTimeout(() => {
            window.moverCamara(window.coordenadasActuales[0].x);
        }, 500);
    }
};


// Variable global para controlar el modo RA y si ya se vio el tutorial
window.modoRA = false;
window.tutorialRAMostrado = false; // 🔥 Evita que salga el modal a cada rato
document.addEventListener('DOMContentLoaded', () => {
    const toggleRA = document.getElementById('toggle-ra');
    // 🔥 SOLUCIÓN: Definimos quién es el mensaje buscándolo por su clase CSS
    const mensajeRA = document.querySelector('.mensaje-info-app');

    if (toggleRA) {
        toggleRA.addEventListener('change', (e) => {
            window.modoRA = e.target.checked;

            // Mostrar/Ocultar el globito de texto si existe
            if (mensajeRA) {
                if (window.modoRA) {
                    mensajeRA.style.display = 'block';
                } else {
                    mensajeRA.style.display = 'none';
                }
            }

            // Mostrar el modal de pasos a seguir SOLO la primera vez
            if (window.modoRA && !window.tutorialRAMostrado) {
                mostrarTutorialRA();
                window.tutorialRAMostrado = true;
            }
        });
    }
});
// 🔥 FUNCIÓN PARA CREAR Y MOSTRAR EL MODAL DEL TUTORIAL RA (SIN VIDEO)
function mostrarTutorialRA() {
    let modalTutorial = document.getElementById('modal-tutorial-ra');

    // Si no existe en el HTML, lo creamos dinámicamente
    if (!modalTutorial) {
        const modalHtml = `
            <div id="modal-tutorial-ra" style="
                position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; 
                background: rgba(0, 0, 0, 0.85); display: flex; 
                justify-content: center; align-items: center; z-index: 10001;
                opacity: 0; transition: opacity 0.4s ease;">
                
                <div style="
                    background: white; width: 90%; max-width: 500px; 
                    border-radius: 20px; overflow: hidden; 
                    box-shadow: 0 15px 35px rgba(0,0,0,0.6); 
                    display: flex; flex-direction: column;
                    transform: scale(0.8); transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);">
                    
                    <div style="background: linear-gradient(135deg, #9333ea, #6a1b9a); color: white; padding: 20px; text-align: center; border-bottom: 5px solid #f3a601;">
                        <h2 style="margin: 0; font-size: 1.5rem; font-weight: 900; letter-spacing: 1px;">¡Modo Escáner Activado! 📱✨</h2>
                    </div>

                    <div style="padding: 25px; text-align: center;">
                        <p style="font-size: 1.1rem; color: #333; margin-top: 0; margin-bottom: 20px; font-weight: bold;">
                            Sigue estos pasos para vivir la experiencia completa:
                        </p>

                        <!-- CONTENEDOR DE PASOS -->
                        <div style="display: flex; flex-direction: column; gap: 15px; text-align: left; background: #f9f9f9; padding: 20px; border-radius: 12px; border: 1px solid #e0e0e0;">
                            
                            <div style="display: flex; align-items: center; gap: 12px;">
                                <span style="background: #f3a601; color: white; width: 32px; height: 32px; display: flex; justify-content: center; align-items: center; border-radius: 50%; font-weight: bold; font-size: 1.1rem; flex-shrink: 0;">1</span>
                                <span style="font-size: 1rem; color: #444; line-height: 1.4;">Descarga gratis la app <b>ITCA Academy 2.0</b> en tu celular (Play Store o App Store).</span>
                            </div>
                            
                            <div style="display: flex; align-items: center; gap: 12px;">
                                <span style="background: #f3a601; color: white; width: 32px; height: 32px; display: flex; justify-content: center; align-items: center; border-radius: 50%; font-weight: bold; font-size: 1.1rem; flex-shrink: 0;">2</span>
                                <span style="font-size: 1rem; color: #444; line-height: 1.4;">Gira la ruleta y avanza normalmente por el tablero de juego.</span>
                            </div>
                            
                            <div style="display: flex; align-items: center; gap: 12px;">
                                <span style="background: #f3a601; color: white; width: 32px; height: 32px; display: flex; justify-content: center; align-items: center; border-radius: 50%; font-weight: bold; font-size: 1.1rem; flex-shrink: 0;">3</span>
                                <span style="font-size: 1rem; color: #444; line-height: 1.4;">Cuando llegues a una casilla con un <strong>marcador visual</strong>, abre la app y escanea.</span>
                            </div>
                            
                        </div>
                    </div>

                    <div style="padding: 15px 20px; background: #f3e5f5; text-align: center;">
                        <button id="btn-entendido-ra" style="
                            background: #9c27b0; color: white; border: none; 
                            padding: 12px 30px; font-size: 1.1rem; border-radius: 10px; 
                            cursor: pointer; font-weight: 900; box-shadow: 0 4px 10px rgba(156, 39, 176, 0.4);
                            text-transform: uppercase; letter-spacing: 1px; transition: transform 0.2s ease;">
                            ¡Entendido!
                        </button>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        modalTutorial = document.getElementById('modal-tutorial-ra');

        // Evento para cerrar el modal suavemente
        document.getElementById('btn-entendido-ra').addEventListener('click', () => {
            modalTutorial.style.opacity = '0';
            modalTutorial.children[0].style.transform = 'scale(0.8)';
            setTimeout(() => { modalTutorial.style.display = 'none'; }, 400);
        });
    }

    // Animación de entrada
    modalTutorial.style.display = 'flex';
    setTimeout(() => {
        modalTutorial.style.opacity = '1';
        modalTutorial.children[0].style.transform = 'scale(1)';
    }, 10);
}

// =========================================================
// 🗝️ MINIJUEGO: BÚSQUEDA DEL COFRE OCULTO (MODO EXPLORACIÓN)
// =========================================================
window.iniciarMiniJuegoCofre = function (jugador, datosInfo) {
    // Si datosInfo llega vacío por alguna razón, lo rescatamos de la mochila
    if (!datosInfo) {
        datosInfo = jugador.tieneLlavePendiente;
    }

    const tableroMapa = document.getElementById('tableroMapa');
    const posActual = window.coordenadasActuales.find(c => c.id == jugador.posicion);
    const jugadorY = posActual ? posActual.y : 50;

    const esconditesBase = (window.camino1 && window.camino1.esconditesCofres)
        ? window.camino1.esconditesCofres
        : [{ x: 20, y: 80 }, { x: 80, y: 50 }, { x: 20, y: 20 }];

    // Mantenemos que aparezca cerca del jugador (max 15% de distancia) para que no sea imposible de encontrar
    let esconditesCercanos = esconditesBase.filter(esc => Math.abs(esc.y - jugadorY) <= 15);
    if (esconditesCercanos.length === 0) esconditesCercanos = esconditesBase;

    const indiceFijo = jugador.posicion % esconditesCercanos.length;
    const esconditeElegido = esconditesCercanos[indiceFijo];

    let cofreX = esconditeElegido.x;
    let cofreY = esconditeElegido.y;
    if (!document.getElementById('animaciones-cofre')) {
        const style = document.createElement('style');
        style.id = 'animaciones-cofre';
        style.innerHTML = `
            @keyframes palpitarCofre {
                0% { transform: scale(1) translateY(0); filter: drop-shadow(0 0 10px #FFD700); }
                100% { transform: scale(1.25) translateY(-10px); filter: drop-shadow(0 0 30px #FFD700); }
            }
            /* 🔥 NUEVO: Animación para que el cartel suba desde la esquina inferior */
            @keyframes slideNotificacionAbajo { 
                from { bottom: -150px; opacity: 0; } 
                to { bottom: 20px; opacity: 1; } 
            }
        `;
        document.head.appendChild(style);
    }

    let notificacion = document.createElement('div');
    notificacion.id = 'notificacion-llave';

    // 🔥 CAMBIO: Modificamos el texto para invitar al jugador a explorar el mapa manualmente
    notificacion.innerHTML = `
        <div style="background: rgba(58, 28, 79, 0.95); backdrop-filter: blur(8px); color: white; padding: 15px 25px; border-radius: 15px; border: 2px solid #FFD700; box-shadow: 0 15px 35px rgba(0,0,0,0.6); display: flex; align-items: center; gap: 20px;">
            <span style="font-size: 3rem; text-shadow: 0 0 15px #FFD700;">🗝️</span>
            <div>
                <h3 style="margin: 0; color: #FFD700; text-transform: uppercase; font-size: 1.2rem;">¡Llave Encontrada!</h3>
                <p style="margin: 5px 0 0 0; font-size: 1.05rem;">
                    <b>${jugador.nombre}</b>, ¡desliza por el mapa para buscar y tocar el cofre escondido!
                </p>
            </div>
        </div>
    `;
    // 🔥 CAMBIO: Posicionado en bottom: 20px y right: 20px (Esquina inferior derecha)
    notificacion.style.cssText = `
        position: fixed; 
        bottom: 20px; 
        right: 20px; 
        z-index: 9999; 
        animation: slideNotificacionAbajo 0.6s ease; 
        width: auto; 
        max-width: 350px; /* Un poco más estrecho para que quede bien en la esquina */
    `;
    document.body.appendChild(notificacion);

    let cofre = document.createElement('div');
    cofre.style.cssText = `position: absolute; left: ${cofreX}%; top: ${cofreY}%; width: 70px; height: 70px; cursor: pointer; z-index: 500; animation: palpitarCofre 1s infinite alternate; display: flex; justify-content: center; align-items: center;`;
    cofre.innerHTML = `<img src="assets/imagenes/iconos/icono_cofre.png" alt="Cofre Secreto" style="width: 100%; height: 100%; object-fit: contain; filter: drop-shadow(0px 5px 10px rgba(0,0,0,0.5));">`;

    tableroMapa.appendChild(cofre);

    // 🔥 CAMBIO: Eliminamos la línea "window.moverCamara(cofreX, cofreY)" 
    // Ahora la cámara se queda donde está la ficha y el usuario debe buscar el cofre.

    cofre.addEventListener('click', () => {
        cofre.remove();
        if (document.getElementById('notificacion-llave')) document.getElementById('notificacion-llave').remove();

        if (!jugador.paradasVisitadas) jugador.paradasVisitadas = [];
        jugador.paradasVisitadas.push(datosInfo ? datosInfo.titulo : 'cofre-secreto');

        jugador.puntos += 2;
        window.animarSumaPuntos(jugador.id, 2);

        const modal = obtenerOCrearModalJS();

        const tituloCofre = (datosInfo && datosInfo.titulo) ? datosInfo.titulo : "¡Secreto Descubierto!";
        const descripcionCofre = (datosInfo && datosInfo.descripcion) ? datosInfo.descripcion : "Has encontrado información valiosa.";

        document.getElementById('modal-educativo-titulo').textContent = tituloCofre;
        document.getElementById('modal-educativo-titulo').style.display = 'inline-block';

        document.getElementById('modal-educativo-cuerpo').innerHTML = `
            <div style="text-align: justify; line-height: 1.6; font-size: 1.05rem; color: #000;">
                ${descripcionCofre}
            </div>
            <div style="background: linear-gradient(135deg, #5e2a84, #5e2a84); color: #faf8fc; padding: 12px; margin-top: 20px; border-radius: 12px; font-weight: 900; text-align: center;">
                ⭐ ¡Has ganado 2 puntos por abrir el cofre!
            </div>
        `;

        jugador.tieneLlavePendiente = null;

        const btnCerrar = document.getElementById('btn-cerrar-educativo');
        btnCerrar.textContent = "Continuar Juego";
        btnCerrar.style.display = 'inline-block';

        modal.classList.remove('hidden');
        modal.style.display = 'flex';
    });
};