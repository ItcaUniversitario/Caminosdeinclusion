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
// 🃏 OBTENER CARTA DE FIREBASE (Optimizada para Caminos de Inclusión)
// ==========================================================================
// 🚨 CAMBIO: Ahora solo necesitamos pedir el "personajeIdBuscado" (Ej: josefa_c1)
export async function obtenerCartaAleatoria(personajeIdBuscado) {
    try {
        const cartasRef = collection(db, "cartas_personajes"); 

        // 🚨 CAMBIO: Consulta más limpia y rápida, solo buscamos por el ID compuesto
        const q = query(
            cartasRef, 
            where("personajeId", "==", personajeIdBuscado)
        );
        
        // 3. Traemos los resultados
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
            console.warn(`⚠️ No hay cartas registradas para el ID: ${personajeIdBuscado}`);
            return null; 
        }

        // 4. Guardamos las cartas y elegimos una al azar
        const cartasEncontradas = [];
        querySnapshot.forEach((doc) => {
            cartasEncontradas.push({ id: doc.id, ...doc.data() });
        });

        const indiceAleatorio = Math.floor(Math.random() * cartasEncontradas.length);
        return cartasEncontradas[indiceAleatorio];

    } catch (error) {
        console.error("🔥 Error interno en Firestore:", error);
        throw error; 
    }
}