// ==========================================
// 🗃️ 1. VARIABLES GLOBALES DEL PASO 3
// ==========================================
window.jugadores = [];
window.indiceTurnoActual = 0;
window.personajesBloqueados = [];
window.datosPersonajesActuales = {}; 

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

    // 👇 Usamos un pequeñísimo delay para asegurar que el HTML esté listo
    setTimeout(() => {
        window.actualizarIndicadorTurno();
        window.cargarPersonajesPorCamino(camino);
    }, 50);
};

// ==========================================
// 🚀 CARGA CON ETIQUETADO DE CAMINO
// ==========================================
window.cargarPersonajesPorCamino = async function (camino) {
    let textoCamino = typeof camino === 'object' && camino !== null ? (camino.camino || camino.nombre || String(camino)) : String(camino || "");
    const caminoLower = textoCamino.toLowerCase().trim();
    const esCamino2 = caminoLower.includes('estereotipo') || caminoLower.includes('wilo');

    // 🎯 Adaptamos los textos de la interfaz antes de cargar
    window.adaptarInterfazSegunCamino(esCamino2);

    try {
        const moduloCamino1 = await import('./data/datacamino1.js');
        const personajesProcesados = {};

        for (const [clave, obj] of Object.entries(moduloCamino1.personajesData)) {
            personajesProcesados[clave] = { ...obj, origenCamino: 1 };
        }

        if (esCamino2) {
            const moduloCamino2 = await import('./data/datacamino2.js');
            for (const [clave, obj] of Object.entries(moduloCamino2.personajesData)) {
                personajesProcesados[clave] = { ...obj, origenCamino: 2 };
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
    
    // 🎯 prioriza la imagen del rostro/cara; si no existe, usa la completa
    const fotoRostro = datosDelPersonaje.cara || datosDelPersonaje.imagen || datosDelPersonaje.avatar || datosDelPersonaje.imagenFull;

    jugadorActual.personaje = claveElegida;
    jugadorActual.nombrePersonaje = datosDelPersonaje.nombre;
    jugadorActual.avatarUrl = fotoRostro; // 👈 Guardamos el rostro
    
    window.personajesBloqueados.push(claveElegida);

    window.indiceTurnoActual++;

    if (window.indiceTurnoActual < window.jugadores.length) {
        window.actualizarIndicadorTurno();
        window.renderizarPersonajes(window.datosPersonajesActuales); 
    } else {
        const partidaStr = sessionStorage.getItem("partidaActual");
        if (partidaStr) {
            const partidaActualizada = JSON.parse(partidaStr);
            partidaActualizada.jugadores = window.jugadores;
            sessionStorage.setItem("partidaActual", JSON.stringify(partidaActualizada));
        }
        if(typeof cambiarPaso === 'function') cambiarPaso(4);
    }
};
window.renderizarPersonajes = function(data) {
    const contenedorFila1 = document.getElementById('contenedor-caras-camino1');
    const contenedorFila2 = document.getElementById('contenedor-caras-camino2');
    const bloqueCamino2 = document.getElementById('bloque-camino-2');
    const cardRossy = document.getElementById('card-rossy');
    const cardWilo = document.getElementById('card-wilo');

    if (!contenedorFila1) return;

    contenedorFila1.innerHTML = '';
    if (contenedorFila2) contenedorFila2.innerHTML = '';

    let datosRossy = null;
    let datosWilo = null;

    // 📦 1. SEPARAR PERSONAJES POR CAMINO
    const grupoCamino1 = [];
    const grupoCamino2 = [];

    for (const [clave, personaje] of Object.entries(data)) {
        const claveLower = clave.toLowerCase();
        const nombreLower = (personaje.nombre || '').toLowerCase();

        // Extraer líderes
        if (claveLower.includes('rossy') || nombreLower.includes('rossy')) {
            datosRossy = { clave, ...personaje };
            continue;
        } 
        if (claveLower.includes('wilo') || nombreLower.includes('wilo')) {
            datosWilo = { clave, ...personaje };
            continue;
        }

        // Clasificar colaboradores en su grupo correspondiente
        const itemPersonaje = { clave, ...personaje };
        if (personaje.origenCamino === 2) {
            grupoCamino2.push(itemPersonaje);
        } else {
            grupoCamino1.push(itemPersonaje);
        }
    }

    // 🔀 2. FUNCIÓN PARA MEZCLAR ALEATORIAMENTE UN ARREGLO (Fisher-Yates)
    const mezclarGrupo = (arreglo) => {
        for (let i = arreglo.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arreglo[i], arreglo[j]] = [arreglo[j], arreglo[i]];
        }
        return arreglo;
    };

    // Mezclamos cada grupo de forma totalmente independiente
    mezclarGrupo(grupoCamino1);
    mezclarGrupo(grupoCamino2);

    // 🎨 3. FUNCIÓN AUXILIAR PARA RENDERIZAR LAS TARJETAS EN EL DOM
    const dibujarGrupo = (listaPersonajes, contenedor) => {
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
                document.querySelectorAll('.cara-item').forEach(c => c.classList.remove('activo'));
                caraCard.classList.add('activo');
                window.abrirModal(personaje, personaje.clave, false); // Abrir modal
            });

            contenedor.appendChild(caraCard);
        });
    };

    // 🚀 4. DIBUJAR CADA FILA MEZCLADA
    dibujarGrupo(grupoCamino1, contenedorFila1);
    dibujarGrupo(grupoCamino2, contenedorFila2);

    const hayPersonajesCamino2 = grupoCamino2.length > 0;

    // ==========================================
    // CONFIGURACIÓN DE ROSSY
    // ==========================================
    if (datosRossy && cardRossy) {
        cardRossy.style.display = 'flex';
        document.getElementById('rossy-img').src = datosRossy.imagenFull;
        document.getElementById('rossy-nombre').textContent = datosRossy.nombre;
        
        cardRossy.onclick = () => {
            window.resaltarGrupo(1); 
        };

        const btnHistoriaRossy = cardRossy.querySelector('.heroe-cta');
        if (btnHistoriaRossy) {
            btnHistoriaRossy.onclick = (e) => {
                e.stopPropagation();
                window.abrirModal(datosRossy, datosRossy.clave, true);
            };
        }
    }

    // ==========================================
    // CONFIGURACIÓN DE WILO
    // ==========================================
    if (cardWilo) {
        if (datosWilo) {
            cardWilo.style.display = 'flex';
            document.getElementById('wilo-img').src = datosWilo.imagenFull;
            document.getElementById('wilo-nombre').textContent = datosWilo.nombre;
            
            cardWilo.onclick = () => {
                window.resaltarGrupo(2); 
            };

            const btnHistoriaWilo = cardWilo.querySelector('.heroe-cta');
            if (btnHistoriaWilo) {
                btnHistoriaWilo.onclick = (e) => {
                    e.stopPropagation();
                    window.abrirModal(datosWilo, datosWilo.clave, true);
                };
            }
        } else {
            cardWilo.style.display = 'none';
        }
    }

    if (bloqueCamino2) {
        bloqueCamino2.style.display = hayPersonajesCamino2 ? 'block' : 'none';
    }
};
// ==========================================
// 👁️ 4. EVENTOS (OBSERVER DE PANTALLA)
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    const paso3El = document.getElementById('paso-3');

    if (paso3El) {
        const observador = new MutationObserver((mutations) => {
            // Usamos una variable para evitar que se ejecute múltiples veces de golpe
            let seActualizo = false; 

            mutations.forEach((mutation) => {
                if (!seActualizo && (paso3El.style.display !== 'none' || paso3El.classList.contains('activa'))) {
                    
                    seActualizo = true; // Bloqueamos para que no repita la acción

                    // 🔥 REGLA DE ORO: Siempre que entremos a esta pantalla, recargamos los jugadores
                    const partidaGuardada = sessionStorage.getItem("partidaActual");
                    if (partidaGuardada) {
                        const partida = JSON.parse(partidaGuardada);
                        if (partida && partida.jugadores) {
                            window.jugadores = partida.jugadores;
                            console.log("📥 Jugadores cargados en memoria:", window.jugadores);
                        }
                    }

                    // 🎯 Forzamos que se pinte el nombre correcto inmediatamente
                    setTimeout(() => {
                        window.actualizarIndicadorTurno();
                    }, 50);

                    // Revisamos si necesitamos dibujar los personajes o si ya están listos
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
    document.getElementById('modal-img').src = personaje.imagenFull;
    document.getElementById('modal-nombre').textContent = personaje.nombre;
    
    // Si el personaje no tiene historia (o es camino 2), ponemos un texto genérico
    const textoHistoria = personaje.historia || "Este avatar te representará durante todo el recorrido del juego.";
    document.getElementById('modal-texto-historia').textContent = textoHistoria;

    const btnElegir = document.getElementById('modal-btn-elegir');
    
    if (esLider) {
        btnElegir.style.display = 'none';
    } else {
        window.prepararSeleccionModal(clave, personaje, btnElegir);
    }

    modal.style.display = 'flex';
};

window.prepararSeleccionModal = function(clave, personaje, btnElegir) {
    btnElegir.replaceWith(btnElegir.cloneNode(true));
    const btnLimpio = document.getElementById('modal-btn-elegir');

    // Revisamos si el personaje actual pertenece al Camino 2 (ficha)
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
        
        // 💬 Texto personalizado según sea Personaje o Avatar
        if (esFichaAvatar) {
            btnLimpio.textContent = "✓ Usar como Avatar a " + personaje.nombre;
        } else {
            btnLimpio.textContent = "✓ Elegir Personaje " + personaje.nombre;
        }

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

    // Reiniciar animación por si se toca varias veces rápido
    bloque.classList.remove('resaltar-camino-1', 'resaltar-camino-2');
    void bloque.offsetWidth; // Forzar reflow

    bloque.classList.add(`resaltar-camino-${numeroCamino}`);
    
    // Limpiar la clase después de que termine la animación
    setTimeout(() => {
        bloque.classList.remove(`resaltar-camino-${numeroCamino}`);
    }, 1500);
};

window.prepararSeleccionModal = function(clave, personaje, btnElegir) {
    // Limpiar eventos anteriores clonando el botón
    btnElegir.replaceWith(btnElegir.cloneNode(true));
    const btnLimpio = document.getElementById('modal-btn-elegir');

    if (window.personajesBloqueados.includes(clave)) {
        btnLimpio.style.display = 'block';
        btnLimpio.disabled = true;
        btnLimpio.textContent = "🔒 Ya fue elegido";
        btnLimpio.style.background = "#cccccc";
        btnLimpio.style.cursor = "not-allowed";
    } else {
        btnLimpio.style.display = 'block';
        btnLimpio.disabled = false;
        btnLimpio.textContent = "✓ Elegir a " + personaje.nombre;
        btnLimpio.style.background = "var(--color-yellow-btn, #ffc107)";
        btnLimpio.style.cursor = "pointer";
        btnLimpio.onclick = () => {
            window.confirmarPersonaje(clave);
            window.cerrarModal();
        };
    }
};
window.adaptarInterfazSegunCamino = function (esCamino2) {
    const tituloPaso = document.querySelector('.cabecera-paso-3 h2');
    const descripcionPaso = document.querySelector('.descripcion-paso');

    if (esCamino2) {
        // ⚡ TEXTOS PARA CAMINO 2 (Ficha/Avatar de tablero)
        if (tituloPaso) tituloPaso.textContent = "Elige tu Avatar de Tablero";
        if (descripcionPaso) {
            descripcionPaso.innerHTML = `
                Elige la <strong>ficha o avatar</strong> que te representará durante el recorrido del tablero de la <strong>Fundación CAMCU</strong>.
            `;
        }
    } else {
        // 🌸 TEXTOS PARA CAMINO 1 (Personaje con cartillas/habilidades)
        if (tituloPaso) tituloPaso.textContent = "Selecciona tu Personaje";
        if (descripcionPaso) {
            descripcionPaso.innerHTML = `
                Conoce a los personajes de la <strong>Fundación CAMCU</strong>. 
                Cada personaje cuenta con sus propias cartillas y habilidades únicas para el juego.
            `;
        }
    }
};