import { db } from './firebase-config.js';
import { doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// Variable global para el camino
window.caminoSeleccionado = sessionStorage.getItem("caminoSeleccionado") || null; 

// 2. INICIALIZACIÓN DE EVENTOS
document.addEventListener('DOMContentLoaded', () => {
    
    // Selección de tarjetas de caminos (PASO 1)
    const tarjetasCaminos = document.querySelectorAll('.opcion-card');
    tarjetasCaminos.forEach(tarjeta => {
        tarjeta.addEventListener('click', function() {
            // 1. Asignar a la variable global
            window.caminoSeleccionado = this.getAttribute('data-camino');
            
            // 2. GUARDAR INMEDIATAMENTE EN MEMORIA (Por si recargan la página)
            sessionStorage.setItem("caminoSeleccionado", window.caminoSeleccionado);
            
            // Estilos visuales
            tarjetasCaminos.forEach(card => card.classList.remove('seleccionado'));
            this.classList.add('seleccionado');

            window.cambiarPaso(2);
        });
    });

    // Botón Continuar del Paso 1
    const btnContinuar1 = document.getElementById('btn-continuar-paso1');
    if (btnContinuar1) {
        btnContinuar1.addEventListener('click', (event) => {
            event.preventDefault();
            if (!window.caminoSeleccionado) {
                alert("Por favor, selecciona un camino para comenzar tu aventura.");
                return; 
            }
            window.cambiarPaso(2); 
        });
    }

    // Botón Continuar del Paso 3 (Aquí vinculas el camino con la partida de Firebase)
    const btnContinuarPaso3 = document.getElementById('btn-continuar-paso3');
    if (btnContinuarPaso3) {
        btnContinuarPaso3.addEventListener('click', async (event) => {
            event.preventDefault();
            
            if (!window.caminoSeleccionado) {
                alert("Por favor, selecciona un camino para comenzar tu aventura.");
                return; 
            }
            
            const textoOriginal = btnContinuarPaso3.innerHTML;
            btnContinuarPaso3.innerHTML = "⏳ Descargando recursos... por favor espera";
            btnContinuarPaso3.disabled = true; 
            btnContinuarPaso3.style.cursor = "wait";
            btnContinuarPaso3.style.opacity = "0.7";

            try {
                console.log("1. Guardando en Firebase el camino:", window.caminoSeleccionado);
                
                // Precargar imágenes del camino
                await window.precargarRecursosCamino(window.caminoSeleccionado);
                
                // 3. ACTUALIZAR LA MEMORIA DE LA PARTIDA Y FIREBASE
                const datosSesion = sessionStorage.getItem("partidaActual");
                if (datosSesion) {
                    const partida = JSON.parse(datosSesion);
                    partida.camino = window.caminoSeleccionado; // Agregamos el camino al objeto
                    
                    // Sobrescribimos la memoria actualizada
                    sessionStorage.setItem("partidaActual", JSON.stringify(partida));
                    
                    // Actualizamos en Firebase si ya existe el ID de la partida
                    if (partida.idPartida) {
                        const docRef = doc(db, "partidas", partida.idPartida);
                        await updateDoc(docRef, { camino: window.caminoSeleccionado });
                        console.log("✅ Camino guardado correctamente en Firebase.");
                    }
                }
            } catch (error) {
                console.error("❌ Error al guardar o precargar:", error);
            }

            // Cargar los personajes correspondientes al camino seleccionado
            if (typeof window.cargarPersonajesPorCamino === 'function') {
                window.cargarPersonajesPorCamino(window.caminoSeleccionado);
            }

            // Restaurar botón
            btnContinuarPaso3.innerHTML = textoOriginal;
            btnContinuarPaso3.disabled = false;
            btnContinuarPaso3.style.cursor = "pointer";
            btnContinuarPaso3.style.opacity = "1";

            // Avanzamos al siguiente paso
            window.cambiarPaso(4);
        });
    }
});
// 3. PRECARGA DE RECURSOS
window.precargarRecursosCamino = async function(camino) {
    try {
        console.log("⏳ Iniciando precarga de imágenes para el camino:", camino);
        
        let moduloPrincipal;
        let moduloSecundario = null; // Lo usaremos si es el Camino 2 para cargar también a Rossy
        
        // Evaluamos qué camino es (reutilizando la misma lógica segura)
        const caminoLower = String(camino || "").toLowerCase().trim();
        const esCamino2 = caminoLower.includes('estereotipo') || 
                          caminoLower.includes('wilo') || 
                          caminoLower.includes('2');

        // Importamos dinámicamente los archivos correctos
        if (esCamino2) {
            moduloPrincipal = await import('./data/datacamino2.js');
            moduloSecundario = await import('./data/datacamino1.js'); // Traemos a Rossy también
        } else {
            moduloPrincipal = await import('./data/datacamino1.js');
        }

        const imagenesACargar = [];
        
        // 1. Cargar Mapa
        if (moduloPrincipal.mapaRuta) imagenesACargar.push(moduloPrincipal.mapaRuta);
        
        // 2. Cargar Personajes del grupo principal
        if (moduloPrincipal.personajesData) {
            Object.values(moduloPrincipal.personajesData).forEach(p => {
                if(p.imagenFull) imagenesACargar.push(p.imagenFull);
            });
        }

        // 3. Si es Camino 2, cargar también los personajes del grupo de Rossy
        if (moduloSecundario && moduloSecundario.personajesData) {
            Object.values(moduloSecundario.personajesData).forEach(p => {
                if(p.imagenFull) imagenesACargar.push(p.imagenFull);
            });
        }

        // 4. Cargar Fondos de Cartillas
        if (moduloPrincipal.fondosCartillas) {
            Object.values(moduloPrincipal.fondosCartillas).forEach(fondo => {
                if(fondo.frente) imagenesACargar.push(fondo.frente);
                if(fondo.reverso) imagenesACargar.push(fondo.reverso);
            });
        }

        // Ejecutar la descarga en caché
        imagenesACargar.forEach(src => {
            const img = new Image();
            img.src = src;
        });
        
        console.log(`✅ Imágenes del ${esCamino2 ? 'Camino 2' : 'Camino 1'} descargadas en la caché.`);
        
    } catch (error) {
        console.error("⚠️ Error en precarga de imágenes:", error);
    }
};