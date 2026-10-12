/**
 * Lógica de Autenticación con Firebase - Panel Admin
 */

// Importamos los módulos de Firebase directamente desde su CDN
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// ⚠️ REEMPLAZA ESTO: Configuración de tu proyecto Firebase
// La encuentras en Configuración del proyecto > General > Tus apps
const firebaseConfig = {
  apiKey: "AIzaSyATWYM-R92ngZhZKdzs_DqgvrmXDXUNaFE",
  authDomain: "caminos-de-empatia.firebaseapp.com",
  projectId: "caminos-de-empatia",
  storageBucket: "caminos-de-empatia.firebasestorage.app",
  messagingSenderId: "464927455216",
  appId: "1:464927455216:web:41107ad19784e7fbb20f35",
  measurementId: "G-QEZM1BHT58"
};

// Inicializamos Firebase y la Autenticación
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

document.addEventListener('DOMContentLoaded', () => {
    const formLogin = document.getElementById('form-login');
    const emailInput = document.getElementById('admin-email');
    const passwordInput = document.getElementById('admin-password');
    const submitBtn = formLogin.querySelector('button[type="submit"]');

    formLogin.addEventListener('submit', async (event) => {
        event.preventDefault();

        const email = emailInput.value.trim();
        const password = passwordInput.value;

        if (!email || !password) {
            showError('Por favor, completa todos los campos.');
            return;
        }

        setLoadingState(true);
        clearError();

        try {
            // Petición de login a Firebase
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            
            console.log("¡Inicio de sesión exitoso!", user.email);

            // Firebase maneja la sesión automáticamente, pero podemos guardar un indicador si lo deseas
            sessionStorage.setItem('isAdminLoggedIn', 'true');
            
            // Redirigir al panel de administración
            // Reemplaza 'dashboard.html' con la ruta real de tu panel
            window.location.href = 'dashboard.html';

        } catch (error) {
            console.error("Error de Firebase:", error.code);
            
            // Manejo de errores amigables para el usuario
            let mensajeError = 'Ocurrió un error al iniciar sesión.';
            
            switch (error.code) {
                case 'auth/invalid-credential':
                case 'auth/user-not-found':
                case 'auth/wrong-password':
                    mensajeError = 'El correo o la contraseña son incorrectos.';
                    break;
                case 'auth/invalid-email':
                    mensajeError = 'El formato del correo electrónico no es válido.';
                    break;
                case 'auth/too-many-requests':
                    mensajeError = 'Demasiados intentos fallidos. Intenta más tarde.';
                    break;
            }

            showError(mensajeError);
            passwordInput.value = ''; // Limpiar contraseña por seguridad
            passwordInput.focus();
            
        } finally {
            setLoadingState(false);
        }
    });

    /**
     * Funciones Auxiliares para la Interfaz (UI)
     */
    function setLoadingState(isLoading) {
        if (isLoading) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = `
                <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Verificando...
            `;
            emailInput.style.opacity = '0.7';
            passwordInput.style.opacity = '0.7';
        } else {
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Entrar';
            emailInput.style.opacity = '1';
            passwordInput.style.opacity = '1';
        }
    }

    function showError(message) {
        let alertBox = document.getElementById('login-alert');
        
        if (!alertBox) {
            alertBox = document.createElement('div');
            alertBox.id = 'login-alert';
            alertBox.className = 'alert alert-danger text-center mt-3 p-2';
            alertBox.style.fontSize = '0.9rem';
            alertBox.style.borderRadius = '8px';
            submitBtn.parentNode.insertBefore(alertBox, submitBtn);
        }
        
        alertBox.textContent = message;
        alertBox.style.display = 'block';
    }

    function clearError() {
        const alertBox = document.getElementById('login-alert');
        if (alertBox) {
            alertBox.style.display = 'none';
        }
    }
});