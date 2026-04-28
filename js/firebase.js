// js/firebase.js

// 1. Importamos las funciones necesarias directamente desde el CDN de Google
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// 2. Tu configuración de Firebase
const firebaseConfig = {
    apiKey: "AIzaSyATWYM-R92ngZhZKdzs_DqgvrmXDXUNaFE",
    authDomain: "caminos-de-empatia.firebaseapp.com",
    projectId: "caminos-de-empatia",
    storageBucket: "caminos-de-empatia.firebasestorage.app",
    messagingSenderId: "464927455216",
    appId: "1:464927455216:web:41107ad19784e7fbb20f35",
    measurementId: "G-QEZM1BHT58"
};

// 3. Inicializamos Firebase y Firestore
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app); 
// ==========================================================================
// 🃏 VARIABLE GLOBAL DEL MAZO (En memoria local)
// ==========================================================================
// Aquí guardaremos los mazos mezclados de todos los jugadores
let mochilaDeCartas = {}; 

// ==========================================================================
// 🚀 1. PRECARGAR Y MEZCLAR (Llamar a esta cuando el mapa está cargando)
// ==========================================================================
export async function precargarCartas(personajesElegidos, numeroCamino) {
    console.log("📦 Descargando y mezclando todas las cartas...");
    mochilaDeCartas = {}; // Limpiamos por si es una partida nueva

    try {
        // Hacemos una búsqueda rápida por cada personaje seleccionado
        for (let jugador of personajesElegidos) {
            const idBruto = jugador.id || jugador.nombre || "paula";
            const idPersonaje = idBruto.toLowerCase();
            const personajeIdBusqueda = `${idPersonaje}_c${numeroCamino}`;

            const cartasRef = collection(db, "cartas_personajes"); 
            const q = query(cartasRef, where("personajeId", "==", personajeIdBusqueda));
            const querySnapshot = await getDocs(q);

            let mazoDelJugador = [];
            querySnapshot.forEach((doc) => {
                mazoDelJugador.push({ id: doc.id, ...doc.data() });
            });

            // 🎲 BARAJAMOS EL MAZO AHORA MISMO (Fisher-Yates)
            for (let i = mazoDelJugador.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [mazoDelJugador[i], mazoDelJugador[j]] = [mazoDelJugador[j], mazoDelJugador[i]];
            }

            // Guardamos el mazo mezclado de este jugador
            mochilaDeCartas[personajeIdBusqueda] = mazoDelJugador;
            console.log(`✅ Mazo listo para ${jugador.nombre}: ${mazoDelJugador.length} cartas.`);
        }
    } catch (error) {
        console.error("🔥 Error al precargar cartas:", error);
    }
}

// ==========================================================================
// ⚡ 2. OBTENER CARTA (Instantáneo, cero demoras y sin repetidas)
// ==========================================================================
export async function obtenerCartaAleatoria(personajeIdBuscado) {
    // 🚨 Revisamos si el jugador tiene un mazo y si le quedan cartas
    if (mochilaDeCartas[personajeIdBuscado] && mochilaDeCartas[personajeIdBuscado].length > 0) {
        
        // 🚀 MAGIA: .pop() toma la última carta del arreglo Y LA ELIMINA del mazo.
        // Respuesta instantánea y 100% garantizado que no se repite.
        const cartaSacada = mochilaDeCartas[personajeIdBuscado].pop(); 
        
        console.log(`🃏 Carta sacada al instante. Le quedan ${mochilaDeCartas[personajeIdBuscado].length} en el mazo.`);
        return cartaSacada; 
    }

    // Si no quedan cartas en su mazo (se vació), devolvemos null para activar la Zona Segura
    console.warn(`⚠️ El mazo de ${personajeIdBuscado} está vacío.`);
    return null; 
}