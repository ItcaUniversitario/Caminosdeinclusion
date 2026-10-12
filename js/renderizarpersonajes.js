// ==========================================
// 🗃️ 1. VARIABLES GLOBALES DEL PASO 3
// ==========================================
window.jugadores = [];
window.indiceTurnoActual = 0;
window.personajesBloqueados = [];
window.datosPersonajesActuales = {}; 

// Función auxiliar segura para actualizar indicador
function ejecutarActualizarIndicador() {
    if (typeof window.actualizarIndicadorTurno === 'function') {
        window.actualizarIndicadorTurno();
    }
}

// ==========================================
// 🚀 2. FUNCIONES PRINCIPALES Y LÓGICA
// ==========================================
window.inicializarPaso3 = function () {
    console.log("🚀 Inicializando Paso 3...");

    const partidaPreviaStr = sessionStorage.getItem("partidaActual");
    const partida = partidaPreviaStr ? JSON.parse(partidaPreviaStr) : null;

    if (!partida || !partida.jugadores || partida.jugadores.length === 0) {
        console.error("❌ No se encontraron jugadores en la memoria.");
        return;
    }

    window.jugadores = partida.jugadores;
    window.indiceTurnoActual = 0;
    
    window.personajesBloqueados = window.jugadores
        .map(j => j.personaje)
        .filter(p => p !== undefined && p !== null); 

    const camino = partida.camino || sessionStorage.getItem("caminoSeleccionado") || "Violencia de Género";

    setTimeout(() => {
        ejecutarActualizarIndicador();
        window.cargarPersonajesPorCamino(camino);
    }, 50);
};

// ==========================================
// 🚀 CARGA CON ETIQUETADO DE CAMINO
// ==========================================
window.cargarPersonajesPorCamino = async function (camino) {
    let textoCamino = typeof camino === 'object' && camino !== null ? (camino.camino || camino.nombre || String(camino)) : String(camino || "");
    const caminoLower = textoCamino.toLowerCase().trim();
    
    // Evaluación precisa para Camino 2 (evita falsos positivos con otros textos)
    const esCamino2 = caminoLower.includes('estereotipo') || 
                      caminoLower.includes('camino 2') || 
                      /\bcamino_?2\b/.test(caminoLower);

    // Adaptamos los textos de la interfaz antes de cargar
    if (typeof window.adaptarInterfazSegunCamino === 'function') {
        window.adaptarInterfazSegunCamino(esCamino2);
    }

    try {
        const personajesProcesados = {};
        
        // Traemos a Rosi y Wilo del Camino 1
        const moduloCamino1 = await import('./data/datacamino1.js');
        const rosiBase = moduloCamino1.personajesData['rosi'];
        const wiloBase = moduloCamino1.personajesData['wilo'];

        if (esCamino2) {
            console.log("📥 Descargando fichas del Camino 2 e inyectando guías...");
            const moduloCamino2 = await import('./data/datacamino2.js');
            
            // 1. Cargamos las fichas
            for (const [clave, obj] of Object.entries(moduloCamino2.personajesData)) {
                personajesProcesados[clave] = { ...obj, origenCamino: 2 };
            }
            
           // 2. Inyectamos a Rosi y Wilo como guías (manteniendo su historia de la data)
            if (rosiBase) {
                personajesProcesados['rosi'] = { 
                    ...rosiBase, 
                    origenCamino: 1
                    // 🔥 Quitamos la propiedad 'historia' para que conserve la de datacamino1.js
                };
            }
            if (wiloBase) {
                personajesProcesados['wilo'] = { 
                    ...wiloBase, 
                    origenCamino: 1
                };
            }

        } else {
            console.log("📥 Descargando SÓLO los personajes del Camino 1...");
            for (const [clave, obj] of Object.entries(moduloCamino1.personajesData)) {
                personajesProcesados[clave] = { ...obj, origenCamino: 1 };
            }
        }

        window.datosPersonajesActuales = personajesProcesados;
        window.renderizarPersonajes(window.datosPersonajesActuales);

    } catch (error) {
        console.error("❌ Error al importar personajes:", error);
    }
};

window.confirmarPersonaje = function(claveElegida) {
    const jugadorActual = window.jugadores[window.indiceTurnoActual];
    const datosDelPersonaje = window.datosPersonajesActuales[claveElegida];
    
    const fotoRostro = datosDelPersonaje.cara || datosDelPersonaje.imagen || datosDelPersonaje.avatar || datosDelPersonaje.imagenFull;

    jugadorActual.personaje = claveElegida;
    jugadorActual.nombrePersonaje = datosDelPersonaje.nombre;
    jugadorActual.avatarUrl = fotoRostro; 
    
    window.personajesBloqueados.push(claveElegida);
    window.indiceTurnoActual++;

    if (window.indiceTurnoActual < window.jugadores.length) {
        ejecutarActualizarIndicador();
        window.renderizarPersonajes(window.datosPersonajesActuales); 
    } else {
        const partidaStr = sessionStorage.getItem("partidaActual");
        if (partidaStr) {
            const partidaActualizada = JSON.parse(partidaStr);
            partidaActualizada.jugadores = window.jugadores;
            sessionStorage.setItem("partidaActual", JSON.stringify(partidaActualizada));
        }
        if (typeof cambiarPaso === 'function') cambiarPaso(4);
    }
};

window.renderizarPersonajes = function(data) {
    const contenedorFila1 = document.getElementById('contenedor-caras-camino1');
    const contenedorFila2 = document.getElementById('contenedor-caras-camino2');
    const bloqueCamino1 = document.getElementById('bloque-camino-1');
    const bloqueCamino2 = document.getElementById('bloque-camino-2');
    const cardRosi = document.getElementById('card-rosi');
    const cardWilo = document.getElementById('card-wilo');
    const seccionSuperior = document.querySelector('.seccion-superior-personajes');
    const escenarioProtagonistas = document.querySelector('.escenario-protagonistas'); 
    const seccionInferior = document.querySelector('.seccion-seleccion-inferior');
    const paso3Contenedor = document.getElementById('paso-3');

    const indicadorTurno = document.querySelector('.indicador-turno');
    const tarjetaGeneral = document.querySelector('.tarjeta-general.contenedor-vista-dual');

    if (!contenedorFila1) return;

    contenedorFila1.innerHTML = '';
    if (contenedorFila2) contenedorFila2.innerHTML = '';

    // 📦 1. SEPARAR DATOS
    let datosRosi = null;
    let datosWilo = null;
    const fichasJugables = [];
    
    for (const [clave, personaje] of Object.entries(data)) {
        const itemPersonaje = { clave, ...personaje };
        if (clave === 'rosi') datosRosi = itemPersonaje;
        else if (clave === 'wilo') datosWilo = itemPersonaje;
        else fichasJugables.push(itemPersonaje);
    }

    if (seccionInferior) seccionInferior.style.display = 'block';

    // 🛠️ 2. DIBUJAR FICHAS
    const dibujarFichas = (listaPersonajes, contenedor) => {
        if (!contenedor) return;
        listaPersonajes.forEach(personaje => {
            const caraCard = document.createElement('div');
            caraCard.classList.add('cara-item');
            caraCard.dataset.clave = personaje.clave;

            if (window.personajesBloqueados.includes(personaje.clave)) {
                caraCard.classList.add('bloqueado');
            }

            caraCard.innerHTML = `
                <img src="${personaje.imagenFull}" alt="${personaje.nombre}">
                <span>${personaje.nombre}</span>
            `;

            caraCard.addEventListener('click', () => {
                if (window.personajesBloqueados.includes(personaje.clave)) return;
                document.querySelectorAll('.cara-item').forEach(c => c.classList.remove('activo'));
                caraCard.classList.add('activo');
                
                if (personaje.origenCamino === 2) {
                    window.confirmarPersonaje(personaje.clave);
                } else {
                    window.abrirModal(personaje, personaje.clave, false);
                }
            });

            contenedor.appendChild(caraCard);
        });
    };

    const esCamino2 = paso3Contenedor && paso3Contenedor.classList.contains('tema-camino-2');

    // 🚀 MOVER INDICADOR DE TURNO
    if (indicadorTurno && tarjetaGeneral && seccionSuperior && seccionInferior) {
        if (esCamino2) {
            tarjetaGeneral.insertBefore(indicadorTurno, seccionSuperior);
            indicadorTurno.style.marginBottom = '25px';
        } else {
            seccionInferior.insertBefore(indicadorTurno, seccionInferior.firstChild);
            indicadorTurno.style.marginBottom = '15px';
        }
    }

    // 🚀 3. ORGANIZACIÓN DE TARJETAS
    if (seccionSuperior) seccionSuperior.style.display = 'flex';
    if (escenarioProtagonistas) escenarioProtagonistas.style.display = '';

    if (esCamino2) {
        const fichasRosi = fichasJugables.filter(p => p.clave.includes('rosi'));
        const fichasWilo = fichasJugables.filter(p => p.clave.includes('wilo'));

        dibujarFichas(fichasRosi, contenedorFila1);
        dibujarFichas(fichasWilo, contenedorFila2);
        
        // Insertamos dentro del contenedor .heroe-info si existe para no romper Flexbox
        const rosiInfo = cardRosi ? cardRosi.querySelector('.heroe-info') : null;
        const wiloInfo = cardWilo ? cardWilo.querySelector('.heroe-info') : null;

        if (rosiInfo && contenedorFila1) rosiInfo.appendChild(contenedorFila1);
        else if (cardRosi && contenedorFila1) cardRosi.appendChild(contenedorFila1);

        if (wiloInfo && contenedorFila2) wiloInfo.appendChild(contenedorFila2);
        else if (cardWilo && contenedorFila2) cardWilo.appendChild(contenedorFila2);
        
        if (bloqueCamino1) bloqueCamino1.style.display = 'none';
        if (bloqueCamino2) bloqueCamino2.style.display = 'none';
        
    } else {
        const mitad = Math.ceil(fichasJugables.length / 2);
        dibujarFichas(fichasJugables.slice(0, mitad), contenedorFila1);
        dibujarFichas(fichasJugables.slice(mitad), contenedorFila2);
        
        if (bloqueCamino1 && contenedorFila1) bloqueCamino1.appendChild(contenedorFila1);
        if (bloqueCamino2 && contenedorFila2) bloqueCamino2.appendChild(contenedorFila2);

        if (bloqueCamino1) bloqueCamino1.style.display = 'block';
        if (contenedorFila2 && contenedorFila2.children.length === 0 && bloqueCamino2) {
            bloqueCamino2.style.display = 'none';
        } else if (bloqueCamino2) {
            bloqueCamino2.style.display = 'block';
        }
    }
// 🏆 4. CONFIGURAR DATOS DE LOS GUÍAS
   // 🏆 4. CONFIGURAR DATOS DE LOS GUÍAS
    if (datosRosi && cardRosi) {
        cardRosi.style.display = ''; 
        document.getElementById('rosi-img').src = datosRosi.imagenFull;
        document.getElementById('rosi-nombre').textContent = datosRosi.nombre;
        const parrafoHistoriaRosi = document.getElementById('rosi-historia');
        if (parrafoHistoriaRosi) parrafoHistoriaRosi.textContent = datosRosi.historia || "Rosi te guiará en este camino.";
        
        // 🔥 CORRECCIÓN: En el Camino 2, Rosi es solo guía. No debe abrir modal.
        if (esCamino2) {
            cardRosi.onclick = null; // Apagamos el clic
            cardRosi.style.cursor = 'default'; // Quitamos la manito de botón
        } else {
            cardRosi.onclick = () => window.abrirModal(datosRosi, 'rosi', true);
            cardRosi.style.cursor = 'pointer';
        }
    } else if (cardRosi) {
        cardRosi.style.display = 'none';
    }

    if (datosWilo && cardWilo) {
        cardWilo.style.display = ''; 
        document.getElementById('wilo-img').src = datosWilo.imagenFull;
        document.getElementById('wilo-nombre').textContent = datosWilo.nombre;
        const parrafoHistoriaWilo = document.getElementById('wilo-historia');
        if (parrafoHistoriaWilo) parrafoHistoriaWilo.textContent = datosWilo.historia || "Wilo te acompañará en esta aventura.";
        
        // 🔥 CORRECCIÓN: Lo mismo para Wilo
        if (esCamino2) {
            cardWilo.onclick = null; 
            cardWilo.style.cursor = 'default';
        } else {
            cardWilo.onclick = () => window.abrirModal(datosWilo, 'wilo', true);
            cardWilo.style.cursor = 'pointer';
        }
    } else if (cardWilo) {
        cardWilo.style.display = 'none';
    }
};
// ==========================================
// 👁️ 4. EVENTOS Y MODALES
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    const paso3El = document.getElementById('paso-3');

    if (paso3El) {
        const observador = new MutationObserver((mutations) => {
            let seActualizo = false; 

            mutations.forEach((mutation) => {
                if (!seActualizo && (paso3El.style.display !== 'none' || paso3El.classList.contains('activa'))) {
                    seActualizo = true; 

                    const partidaGuardada = sessionStorage.getItem("partidaActual");
                    if (partidaGuardada) {
                        const partida = JSON.parse(partidaGuardada);
                        if (partida && partida.jugadores) {
                            window.jugadores = partida.jugadores;
                        }
                    }

                    setTimeout(() => { ejecutarActualizarIndicador(); }, 50);

                    const contenedorFila1 = document.getElementById('contenedor-caras-camino1');
                    const caminoActual = sessionStorage.getItem("caminoSeleccionado");

                    if (contenedorFila1 && (contenedorFila1.children.length === 0 || contenedorFila1.dataset.caminoRenderizado !== caminoActual)) {
                        contenedorFila1.dataset.caminoRenderizado = caminoActual;
                        window.inicializarPaso3();
                    }
                }
            });
        });

        observador.observe(paso3El, { attributes: true, attributeFilter: ['class', 'style'] });
    }
});
window.abrirModal = function(personaje, clave, esLider) {
    const modal = document.getElementById('modal-historia');
    if (!modal) {
        console.error("❌ No se encontró el modal con ID 'modal-historia'.");
        return;
    }

    // 🔥 TRUCO MAESTRO: Si el modal está dentro de la tarjeta, lo sacamos al <body>
    // Esto garantiza 100% que no se corte y cubra toda la pantalla.
    if (modal.parentNode !== document.body) {
        document.body.appendChild(modal);
    }

    document.getElementById('modal-img').src = personaje.imagenFull;
    document.getElementById('modal-nombre').textContent = personaje.nombre;
    
    const textoHistoria = personaje.historia || "Este avatar te representará durante todo el recorrido del juego.";
    document.getElementById('modal-texto-historia').textContent = textoHistoria;

    const btnElegir = document.getElementById('modal-btn-elegir');
    
    if (esLider) {
        btnElegir.style.display = 'none';
    } else {
        window.prepararSeleccionModal(clave, personaje, btnElegir);
    }

    // 🔥 Mostrar el modal (usando flex para que tu layout funcione)
    modal.style.display = 'flex';
};

window.prepararSeleccionModal = function(clave, personaje, btnElegir) {
    btnElegir.replaceWith(btnElegir.cloneNode(true));
    const btnLimpio = document.getElementById('modal-btn-elegir');
    const esFichaAvatar = personaje.origenCamino === 2;

    if (window.personajesBloqueados.includes(clave)) {
        btnLimpio.style.display = 'block';
        btnLimpio.disabled = true;
        btnLimpio.textContent = "🔒 Ya fue elegido";
        btnLimpio.style.background = "#cccccc";
        btnLimpio.style.cursor = "not-allowed";
    } else {
        btnLimpio.style.display = 'block';
        btnLimpio.disabled = false;
        
        btnLimpio.textContent = esFichaAvatar 
            ? "✓ Usar como Avatar a " + personaje.nombre 
            : "✓ Elegir Personaje " + personaje.nombre;

        btnLimpio.style.background = "var(--color-yellow-btn, #ffc107)";
        btnLimpio.style.cursor = "pointer";
        btnLimpio.onclick = () => {
            window.confirmarPersonaje(clave);
            window.cerrarModal();
        };
    }
};

window.cerrarModal = function() {
    document.getElementById('modal-historia').style.display = 'none';
};

window.resaltarGrupo = function(numeroCamino) {
    const bloque = document.getElementById(`bloque-camino-${numeroCamino}`);
    if (!bloque) return;

    bloque.classList.remove('resaltar-camino-1', 'resaltar-camino-2');
    void bloque.offsetWidth; 

    bloque.classList.add(`resaltar-camino-${numeroCamino}`);
    
    setTimeout(() => {
        bloque.classList.remove(`resaltar-camino-${numeroCamino}`);
    }, 1500);
};

window.adaptarInterfazSegunCamino = function (esCamino2) {
    const tituloPaso = document.querySelector('.cabecera-paso-3 h2') || document.querySelector('.encabezado-paso-3 h2');
    const descripcionPaso = document.querySelector('.descripcion-paso');
    const paso3Contenedor = document.getElementById('paso-3');

    if (!paso3Contenedor) return;

    if (esCamino2) {
        paso3Contenedor.classList.remove('tema-camino-1');
        paso3Contenedor.classList.add('tema-camino-2');

        if (tituloPaso) tituloPaso.textContent = "Elige tu Ficha de Tablero";
        if (descripcionPaso) descripcionPaso.innerHTML = `Elige la <strong>ficha o avatar</strong> que te representará.`;
    } else {
        paso3Contenedor.classList.remove('tema-camino-2');
        paso3Contenedor.classList.add('tema-camino-1');

        if (tituloPaso) tituloPaso.textContent = "Selecciona tu Personaje";
        if (descripcionPaso) descripcionPaso.innerHTML = `Conoce a los personajes y sus historias.`;
    }
};