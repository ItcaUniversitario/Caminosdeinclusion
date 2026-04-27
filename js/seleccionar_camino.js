// js/seleccionar_nivel.js

// ==========================================
// 1. IMPORTACIONES DE FIREBASE Y FUNCIONES
// ==========================================
import { db } from './firebase.js';
import { doc, updateDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { iniciarPantallaSeleccion } from './seleccionar_personaje.js'; 

export function configurarSeleccionCamino() {
    const botonesModulo = document.querySelectorAll('.pantalla-caminos .btn-modulo'); 
    const pantallaCaminos = document.querySelector('.pantalla-caminos');
    const pantallaPersonajes = document.querySelector('.pantalla-personajes');
    const btnVolverCaminos = document.getElementById('btn-volver-caminos'); 

   botonesModulo.forEach(boton => {
        boton.addEventListener('click', async () => {

            if (!boton.classList.contains('bloqueado')) {
                
                // ==========================================
                // 1. EFECTO VISUAL DE CARGA EN EL BOTÓN
                // ==========================================
                // Guardamos el contenido original para restaurarlo después
                const contenedorTextos = boton.querySelector('.textos-btn-modulo');
                const htmlOriginal = contenedorTextos.innerHTML;
                
                // Desactivamos el botón para evitar dobles clics y cambiamos el texto
                boton.style.pointerEvents = 'none';
                boton.style.opacity = '0.8';
                contenedorTextos.innerHTML = `
                    <h2 class="num-modulo">Cargando...</h2>
                    <p class="nombre-modulo">
                        <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Preparando el viaje
                    </p>
                `;

                // 2. Obtenemos los datos (Usamos el HTML original que guardamos)
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = htmlOriginal;
                const nombreModulo = tempDiv.querySelector('.nombre-modulo').textContent;
                const textoNum = tempDiv.querySelector('.num-modulo').textContent; 
                
                const numeroCamino = parseInt(textoNum.replace(/\D/g, '')) || 1; 

                console.log(`¡Módulo seleccionado! Entrando a: ${nombreModulo} (Camino ID: ${numeroCamino})`);

                sessionStorage.setItem('caminoSeleccionadoNum', numeroCamino);
                sessionStorage.setItem('caminoSeleccionadoNombre', nombreModulo);

                // ACTUALIZAR LA PARTIDA EN FIREBASE (No bloquea la UI)
                const idPartida = sessionStorage.getItem('idPartidaActual');
                if (idPartida) {
                    try {
                        const partidaRef = doc(db, "partidas", idPartida);
                        updateDoc(partidaRef, { // Le quitamos el await para que guarde en segundo plano y sea más rápido
                            caminoSeleccionado: nombreModulo,
                            caminoId: numeroCamino,
                            estado: "seleccionando_personajes",
                            ultimaActualizacion: serverTimestamp()
                        });
                    } catch (error) { console.error("❌ Error en Firebase:", error); }
                }

                // ==========================================
                // 3. ESPERAMOS LA PRECARGA DE ASSETS
                // ==========================================
                // 🚨 Al poner "await" aquí, obligamos al código a esperar que termine 
                // de organizar los videos antes de cambiar la pantalla.
                await precargarAssetsDelCamino(numeroCamino);

                // Preparamos la interfaz de la siguiente pantalla
                iniciarPantallaSeleccion();

                // ==========================================
                // 4. MAGIA DE LA TRANSICIÓN (UI)
                // ==========================================
                if (pantallaCaminos && pantallaPersonajes) {
                    pantallaCaminos.classList.remove('activa');
                    pantallaPersonajes.classList.add('activa');
                }

                // 5. Restauramos el botón a la normalidad por si el usuario presiona "Atrás"
                setTimeout(() => {
                    contenedorTextos.innerHTML = htmlOriginal;
                    boton.style.pointerEvents = 'auto';
                    boton.style.opacity = '1';
                }, 500); // Le damos medio segundo para que no se vea el cambio brusco

            } else {
                console.log("Este módulo está bloqueado por ahora.");
                boton.style.transform = "translateX(5px)";
                setTimeout(() => boton.style.transform = "none", 100);
            }
        });
    });

    if (btnVolverCaminos) {
        btnVolverCaminos.addEventListener('click', () => {
            pantallaPersonajes.classList.remove('activa');
            pantallaCaminos.classList.add('activa');
        });
    }
}
// ==========================================
// 🚀 PRECARGA EN SEGUNDO PLANO (ANTI-LAG)
// ==========================================
async function precargarAssetsDelCamino(numeroCamino) {
    console.log(`⏳ Iniciando precarga silenciosa para el Camino ${numeroCamino}...`);

    // 1. Precargar fondos de los personajes reales
    const personajes = ['paula', 'nina', 'josefa', 'martina', 'paty', 'yuleisy', 'mia'];
    
    personajes.forEach(p => {
        // 🚨 OJO: Revisa si tus imágenes son .jpg o .png y cámbialo aquí si es necesario
        const imgFrente = new Image();
        imgFrente.src = `assets/imagenes/fondos_cartillas/${p}_frente.jpg`; 
        
        const imgReverso = new Image();
        imgReverso.src = `assets/imagenes/fondos_cartillas/${p}_reverso.jpg`;
    });

    // 2. Precargar Videos dinámicamente según el camino elegido (Sin errores en la consola)
    try {
        const modulo = await import(`./data/datacamino${numeroCamino}.js`);
        const dataCamino = modulo[`camino${numeroCamino}`];

        if (dataCamino && dataCamino.casillas) {
            dataCamino.casillas.forEach(casilla => {
                if (casilla.rutaVideo) {
                    // 🚨 NUEVO MÉTODO: Creamos un video en memoria y le decimos que cargue
                    const videoInvisible = document.createElement('video');
                    videoInvisible.preload = 'auto'; // Esto fuerza al navegador a descargarlo en caché
                    videoInvisible.src = casilla.rutaVideo;
                    
                    // No hace falta agregarlo al HTML, con solo crearlo ya inicia la descarga en segundo plano.
                }
            });
            console.log("✅ Precarga de videos e imágenes enviada al navegador.");
        }
    } catch (error) {
        console.warn(`⚠️ Omitiendo precarga de videos del camino ${numeroCamino}.`, error);
    }
}
// En tu función precargarAssetsDelCamino
    const personajes = ['paula', 'nina', 'josefa', 'martina', 'paty', 'yuleisy', 'mia'];
    personajes.forEach(p => {
        const imgFrente = new Image();
        imgFrente.src = `assets/imagenes/fondos_cartillas/${p}_frente.jpg`;
        
        const imgReverso = new Image();
        imgReverso.src = `assets/imagenes/fondos_cartillas/${p}_reverso.jpg`;
    });