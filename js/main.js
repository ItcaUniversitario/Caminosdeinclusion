// js/main.js

import { configurarBotonesJugadores } from './registro_usuarios.js';
import { configurarSidebar } from './slider_inicio.js'; 
import { configurarSeleccionCamino } from './seleccionar_camino.js';
import { configurarSeleccionPersonaje } from './seleccionar_personaje.js';
import { inicializarMapa } from './mapa_logic.js'; // <--- Importado

export function cambiarPantalla(nombreClase) {
    // 🚨 OPCIÓN NUCLEAR: Buscamos las pantallas por su nombre exacto en todo el documento
    const todasLasPantallas = document.querySelectorAll('.pantalla-inicio, .pantalla-caminos, .pantalla-personajes, .pantalla-quiz, .pantalla-mapa');
    
    // Las apagamos TODAS sin piedad
    todasLasPantallas.forEach(p => {
        p.classList.remove('activa');
        p.style.display = 'none'; // Forzamos por JS que desaparezcan
    });

    const pantallaDestino = document.querySelector(`.${nombreClase}`);
    if (pantallaDestino) {
        pantallaDestino.classList.add('activa');
        pantallaDestino.style.display = 'flex'; // La encendemos
        
        localStorage.setItem('pantallaActual', nombreClase);

        if (nombreClase === 'pantalla-mapa') {
            inicializarMapa();
        }
    } else {
        console.error(`❌ Error: No se encontró la pantalla .${nombreClase}`);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    console.log("🚀 Arrancando Caminos de Inclusión...");

    // 🛑 TRUCO DE DESARROLLO: Fuerza el reinicio borrando la memoria.
    // (Bórralo o coméntalo cuando ya vayas a lanzar el juego a producción)
    localStorage.removeItem('pantallaActual'); 

    try {
        // --- A. Restaurar Pantalla ---
        const pantallaGuardada = localStorage.getItem('pantallaActual'); 
        
        if (pantallaGuardada) {
            cambiarPantalla(pantallaGuardada);
        } else {
            cambiarPantalla('pantalla-inicio');
        }

        // ... (el resto de tu código sigue igual)
        // --- B. Encender los módulos ---
        configurarSidebar();
        configurarBotonesJugadores();
        configurarSeleccionCamino();
        configurarSeleccionPersonaje();
        
        // Nota: inicializarMapa NO se llama aquí, se llama dentro de cambiarPantalla
        
        console.log("🎮 Todos los módulos cargados correctamente.");
    } catch (error) {
        console.error("❌ Error grave al inicializar el juego:", error);
    }
});