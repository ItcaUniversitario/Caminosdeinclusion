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
// 🎒 CACHÉ DE CARTAS (La Mochila en Memoria)
// ==========================================================================
let mochilaDeCartas = {}; 

// 🚨 NUEVA FUNCIÓN: Descarga todas las cartas de golpe y las guarda en la mochila
export async function precargarTodasLasCartas(numeroCamino) {
    try {
        console.log(`📥 Llenando la mochila con las cartas del Camino ${numeroCamino}...`);
        
        // La lista de todos tus personajes
        const personajesBase = ["paula", "nina", "josefa", "martina", "paty", "yuleisy", "mia"];
        
        // Creamos los IDs que vamos a buscar (ej: "paula_c1", "nina_c1")
        const idsABuscar = personajesBase.map(nombre => `${nombre}_c${numeroCamino}`);

        const cartasRef = collection(db, "cartas_personajes");
        
        // 🚨 Usamos 'in' para buscar todos los IDs en un solo viaje a Firebase
        const q = query(cartasRef, where("personajeId", "in", idsABuscar));
        const querySnapshot = await getDocs(q);
        
        mochilaDeCartas = {}; // Limpiamos la mochila por si jugaron antes
        
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const pId = data.personajeId;
            
            // Agrupamos las cartas por personaje
            if (!mochilaDeCartas[pId]) {
                mochilaDeCartas[pId] = [];
            }
            mochilaDeCartas[pId].push({ id: doc.id, ...data });
        });

        console.log("✅ Mochila llena. Cartas listas para uso instantáneo:", mochilaDeCartas);
    } catch (error) {
        console.error("🔥 Error al llenar la mochila de cartas:", error);
    }
}

// ==========================================================================
// 🃏 OBTENER CARTA (Ahora saca de la mochila en lugar de ir a internet)
// ==========================================================================
export async function obtenerCartaAleatoria(personajeIdBuscado) {
    try {
        // 🚨 1. LA MAGIA: Revisamos si la carta YA ESTÁ en la mochila
        if (mochilaDeCartas[personajeIdBuscado] && mochilaDeCartas[personajeIdBuscado].length > 0) {
            const cartasEncontradas = mochilaDeCartas[personajeIdBuscado];
            const indiceAleatorio = Math.floor(Math.random() * cartasEncontradas.length);
            return cartasEncontradas[indiceAleatorio]; // ¡Respuesta instantánea!
        }

        // 🚨 2. PLAN B: Si no está en la mochila (solo por precaución), va a Firebase
        console.warn(`⚠️ ${personajeIdBuscado} no estaba en la mochila. Buscando en Firebase...`);
        const cartasRef = collection(db, "cartas_personajes"); 
        const q = query(cartasRef, where("personajeId", "==", personajeIdBuscado));
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) return null; 

        const cartasEncontradas = [];
        querySnapshot.forEach((doc) => {
            cartasEncontradas.push({ id: doc.id, ...doc.data() });
        });

        const indiceAleatorio = Math.floor(Math.random() * cartasEncontradas.length);
        return cartasEncontradas[indiceAleatorio];

    } catch (error) {
        console.error("🔥 Error interno al obtener la carta:", error);
        throw error; 
    }
}