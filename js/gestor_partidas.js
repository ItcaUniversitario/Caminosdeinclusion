// js/gestor_partidas.js

// 1. Importamos Firebase y las herramientas para crear colecciones
import { db } from './firebase.js';
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// 2. Importamos el arreglo de jugadores que ya guardaste en la pantalla anterior!
import { datosDeTodosLosJugadores } from './registro_usuarios.js';

/**
 * Función que se dispara cuando el último jugador elige su personaje
 * @param {string} camino - Ej: "Modulo 1"
 * @param {Array} personajesElegidos - Ej: ["Paula", "Nina"]
 */
export async function crearNuevaPartida(camino, personajesElegidos) {
    console.log("⏳ Generando nueva sesión de juego...");

    try {
        // Armamos el arreglo de jugadores mezclando sus datos personales con el personaje que eligieron
        const resumenJugadores = datosDeTodosLosJugadores.map((jugador, index) => {
            return {
                numeroJugador: jugador.jugadorNumero,
                cedula: jugador.cedula,
                nombres: jugador.nombres,
                apellidos: jugador.apellidos,
                personajeJugable: personajesElegidos[index] // Asignamos el personaje que eligió
            };
        });

        // Enviamos todo a la nueva colección "partidas" en Firebase
        const partidaRef = await addDoc(collection(db, "partidas"), {
            fechaInicio: serverTimestamp(), // Firebase pone la hora y fecha exacta del servidor (más seguro)
            caminoActivo: camino,
            estado: "en curso",
            progreso: 0, // Aquí puedes ir guardando el % de avance luego
            jugadores: resumenJugadores
        });

        console.log("✅ ¡Partida creada con éxito en Firebase!");
        console.log("🆔 ID de la partida:", partidaRef.id);

        // ==========================================
        // 🚀 AQUÍ LANZAS EL JUEGO REAL
        // ==========================================
        // window.location.href = "juego_3d.html"; 
        // o ocultas el HUD y muestras el Canvas de Unity/Juego

    } catch (error) {
        console.error("❌ Error al crear la partida:", error);
        alert("Hubo un problema al iniciar el juego. Revisa tu conexión.");
    }
}