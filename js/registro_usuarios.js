
// 1. Importaciones de Firebase
import { db } from './firebase.js';
// ✅ CÓDIGO CORREGIDO (Con todas las herramientas)
import { doc, getDoc, setDoc, addDoc, collection, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
// 2. Variables globales para el flujo
let jugadorActual = 1;
let totalJugadores = 0;

// ✅ EXPORTAMOS este arreglo para que otras pantallas (como la de personajes) sepan quién está jugando
export let datosDeTodosLosJugadores = []; 

export function configurarBotonesJugadores() {
    console.log("¡La función de los botones SÍ arrancó!"); // 👈 AGREGA ESTO
    const botonesSeleccion = document.querySelectorAll('.btn-burbuja');
    const zonaFormularios = document.getElementById('zona-formularios');
    const textosSeleccion = document.querySelector('.textos-casual');
    const contenedorBotones = document.querySelector('.botones-burbuja-container');

    botonesSeleccion.forEach(boton => {
        boton.addEventListener('click', (e) => {
            boton.blur(); 
            
            totalJugadores = parseInt(boton.querySelector('.num-burbuja').textContent);
            jugadorActual = 1; 
            datosDeTodosLosJugadores = []; 
            
            if (textosSeleccion) textosSeleccion.style.display = 'none';
            if (contenedorBotones) contenedorBotones.style.display = 'none';
            
            mostrarFormularioPasoAPaso(zonaFormularios, textosSeleccion, contenedorBotones);
            
            setTimeout(() => {
                zonaFormularios.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
        });
    });
}

function mostrarFormularioPasoAPaso(contenedor, textosSeleccion, contenedorBotones) {
    contenedor.innerHTML = ''; 
    contenedor.style.display = 'flex';

    const formElement = document.createElement('form'); 
    formElement.classList.add('card-formulario');
    
    formElement.style.animation = 'none';
    formElement.offsetHeight; 
    formElement.style.animation = 'deslizarArriba 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards';

    const textoBoton = jugadorActual === totalJugadores ? "🚀 Comenzar Juego" : "➡️ Siguiente Jugador";

    // --- HTML DEL FORMULARIO ---
    formElement.innerHTML = `
        <button type="button" class="btn-volver-casual" id="btn-volver">
            ⬅️ Volver y cancelar
        </button>

        <h3><span style="font-size: 1.8rem;">👤</span> Registrar Jugador ${jugadorActual} de ${totalJugadores}</h3>
        
        <div class="grid-inputs">
            <div class="input-grupo grupo-busqueda-superior">
                <label>Documento de Identidad *</label>
                <div class="input-con-boton-doble">
                    <select class="input-casual select-doc" id="tipo_doc_j">
                        <option value="cedula_ec" selected>Cédula EC</option>
                        <option value="pasaporte">Pasaporte</option>
                        <option value="id_extranjero">ID Extranjero</option>
                    </select>
                    <input type="text" class="input-casual input-doc" id="cedula_j" placeholder="Ej: 1002345678" required>
                    <button type="button" class="btn-buscar-usuario" id="btn-buscar">
                        🔍 Buscar
                    </button>
                </div>
            </div>

            <div class="input-grupo">
                <label>Nombres *</label>
                <input type="text" class="input-casual" id="nombres_j" placeholder="Tus nombres" required>
            </div>
            <div class="input-grupo">
                <label>Apellidos *</label>
                <input type="text" class="input-casual" id="apellidos_j" placeholder="Tus apellidos" required>
            </div>
            <div class="input-grupo">
                <label>Celular *</label>
                <input type="tel" class="input-casual" id="celular_j" placeholder="099..." required>
            </div>

            <div class="input-grupo">
                <label>Correo <span class="etiqueta-opcional">(Opcional)</span></label>
                <input type="email" class="input-casual" id="correo_j" placeholder="correo@ejemplo.com">
            </div>
            <div class="input-grupo">
                <label>Sexo <span class="etiqueta-opcional">(Opcional)</span></label>
                <select class="input-casual" id="sexo_j">
                    <option value="" disabled selected>Selecciona...</option>
                    <option value="femenino">Femenino</option>
                    <option value="masculino">Masculino</option>
                </select>
            </div>
            <div class="input-grupo">
                <label>Edad <span class="etiqueta-opcional">(Opcional)</span></label>
                <input type="number" class="input-casual" id="edad_j" placeholder="Años">
            </div>
        </div>

        <div class="contenedor-terminos">
            <input type="checkbox" id="terminos_j" class="checkbox-casual" required>
            <p class="texto-terminos">
                Confirmo que he leído y acepto los <a href="#" target="_blank">Términos y Condiciones</a>, y autorizo el uso de mis datos para los fines del proyecto institucional. *
            </p>
        </div>

        <button type="submit" class="btn-burbuja" style="width: 100%; height: 60px; margin-top: 25px;">
            <span class="num-burbuja" style="color: var(--color-purple-main); font-size: 1.2rem;">${textoBoton}</span>
        </button>
    `;

    // =========================================================
    // EVENTOS DEL FORMULARIO
    // =========================================================

    // 1. Botón Volver
    formElement.querySelector('#btn-volver').addEventListener('click', () => {
        contenedor.innerHTML = '';
        if (textosSeleccion) textosSeleccion.style.display = 'flex';
        if (contenedorBotones) contenedorBotones.style.display = 'flex';
    });

    // 2. Buscar en Firebase
    const btnBuscar = formElement.querySelector('#btn-buscar');
    btnBuscar.addEventListener('click', async () => {
        const tipoDoc = document.getElementById('tipo_doc_j').value;
        let cedulaInput = document.getElementById('cedula_j').value.replace(/-/g, '').trim();
        
        if (!cedulaInput) {
            alert("⚠️ Por favor, ingresa un número de documento para buscar.");
            return;
        }

        if (tipoDoc === 'cedula_ec' && !validarCedulaEcuatoriana(cedulaInput)) {
            alert("⛔ La cédula ingresada no es válida. Por favor verifica que el número sea correcto.");
            return;
        }

        btnBuscar.innerHTML = "⏳ Buscando...";
        btnBuscar.disabled = true;

        try {
            const docRef = doc(db, "usuarios", cedulaInput);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const datos = docSnap.data();
                document.getElementById('nombres_j').value = datos.nombres || "";
                document.getElementById('apellidos_j').value = datos.apellidos || "";
                document.getElementById('celular_j').value = datos.celular || "";
                
                if (datos.correo) document.getElementById('correo_j').value = datos.correo;
                if (datos.edad) document.getElementById('edad_j').value = datos.edad;
                if (datos.tipoDocumento) document.getElementById('tipo_doc_j').value = datos.tipoDocumento;
                if (datos.sexo) document.getElementById('sexo_j').value = datos.sexo.toLowerCase(); 
                
                btnBuscar.innerHTML = "✅ Encontrado";
                btnBuscar.style.backgroundColor = "#2E7D32"; 
            } else {
                alert("Usuario no encontrado. Por favor completa tus datos para poder continuar con el juego.");
                btnBuscar.innerHTML = "🔍 Buscar";
                
                document.getElementById('nombres_j').value = "";
                document.getElementById('apellidos_j').value = "";
                document.getElementById('celular_j').value = "";
            }
        } catch (error) {
            console.error("Error al buscar en Firestore:", error);
            alert("Hubo un error al conectar con la base de datos.");
            btnBuscar.innerHTML = "🔍 Buscar";
        } finally {
            if (btnBuscar.innerHTML !== "✅ Encontrado") {
                btnBuscar.disabled = false;
            }
        }
    });

   // 3. Enviar Formulario (Siguiente Jugador / Comenzar)
    formElement.addEventListener('submit', async (e) => {
        e.preventDefault(); 

        const btnSubmit = formElement.querySelector('button[type="submit"]');
        const textoOriginalSubmit = btnSubmit.innerHTML;
        
        const tipoDoc = document.getElementById('tipo_doc_j').value;
        const cedula = document.getElementById('cedula_j').value.replace(/-/g, '').trim();
        
        if (tipoDoc === 'cedula_ec' && !validarCedulaEcuatoriana(cedula)) {
            alert("⛔ La cédula ingresada no es válida. Corrige el número antes de guardar.");
            return;
        }

        // 🚨 NUEVA VALIDACIÓN: ¿Ya se registró en esta misma partida?
        const yaEstaEnLaPartida = datosDeTodosLosJugadores.some(jugador => jugador.cedula === cedula);
        if (yaEstaEnLaPartida) {
            alert("⚠️ Este documento ya fue registrado para otro jugador en esta misma partida. Ingresa uno diferente.");
            return;
        }

        btnSubmit.innerHTML = `<span class="num-burbuja" style="color: var(--color-purple-main); font-size: 1.2rem;">⏳ Guardando...</span>`;
        btnSubmit.disabled = true;
        
       

        const nombres = document.getElementById('nombres_j').value.trim();
        const apellidos = document.getElementById('apellidos_j').value.trim();
        const celular = document.getElementById('celular_j').value.trim();
        const correo = document.getElementById('correo_j').value.trim();
        const sexo = document.getElementById('sexo_j').value;
        const edad = document.getElementById('edad_j').value;
        const aceptoTerminos = document.getElementById('terminos_j').checked;

        try {
            await setDoc(doc(db, "usuarios", cedula), {
                tipoDocumento: tipoDoc,
                cedula: cedula,
                nombres: nombres,
                apellidos: apellidos,
                celular: celular,
                correo: correo,
                sexo: sexo,
                edad: edad
            });

            // ✅ Se guarda localmente
            datosDeTodosLosJugadores.push({
                jugadorNumero: jugadorActual,
                tipoDocumento: tipoDoc,
                cedula, nombres, apellidos, celular, correo, sexo, edad, aceptoTerminos
            });

            // ¿Faltan jugadores por registrar?
            if (jugadorActual < totalJugadores) {
                jugadorActual++; 
                mostrarFormularioPasoAPaso(contenedor, textosSeleccion, contenedorBotones); 
            
            // ¿Ya se registraron TODOS?
          // ¿Ya se registraron TODOS?
            } else {
                console.log("¡Todos guardados! Datos locales listos:", datosDeTodosLosJugadores);
                
                // 🚨 LA LÍNEA MÁGICA: Guardamos los nombres reales en el sessionStorage
                sessionStorage.setItem('jugadoresRegistrados', JSON.stringify(datosDeTodosLosJugadores));
                
                // ==========================================
                // 🚀 AQUÍ CREAMOS LA PARTIDA EN FIREBASE
                // ==========================================
                console.log("Creando nueva partida...");
                try {
                    const partidaRef = await addDoc(collection(db, "partidas"), {
                        fechaInicio: serverTimestamp(),
                        jugadores: datosDeTodosLosJugadores,
                        estado: "seleccionando_camino" // Actualizamos el estado
                    });
                    
                    // Guardamos el ID en la mochila temporal del navegador
                    sessionStorage.setItem('idPartidaActual', partidaRef.id);
                    console.log("✅ Partida creada con ID:", partidaRef.id);
                } catch (errorPartida) {
                    console.error("Error al crear el documento de la partida:", errorPartida);
                    // Opcional: Podrías detener el juego aquí si la partida no se crea.
                }
                
                // ==========================================
                // CAMBIO DE PANTALLA CORRECTO USANDO CLASES
                // ==========================================
                const pantallaInicio = document.querySelector('.pantalla-inicio');
                const pantallaCaminos = document.querySelector('.pantalla-caminos');

                if (pantallaInicio && pantallaCaminos) {
                    pantallaInicio.classList.remove('activa'); 
                    pantallaCaminos.classList.add('activa'); 
                } else {
                    console.error("No se encontraron las pantallas en el HTML.");
                }
            }

        } catch (error) {
            console.error("Error al guardar en Firebase:", error);
            alert("⚠️ Hubo un problema al guardar tus datos. Revisa tu conexión.");
            btnSubmit.innerHTML = textoOriginalSubmit;
            btnSubmit.disabled = false;
        }
    });

    contenedor.appendChild(formElement);
}

// =========================================================
// FUNCIÓN MATEMÁTICA OFICIAL PARA CÉDULAS DE ECUADOR
// =========================================================
function validarCedulaEcuatoriana(cedula) {
    if (cedula.length !== 10 || isNaN(cedula)) return false;

    const provincia = parseInt(cedula.substring(0, 2), 10);
    if (provincia < 1 || (provincia > 24 && provincia !== 30)) return false;

    const tercerDigito = parseInt(cedula.charAt(2), 10);
    if (tercerDigito >= 6) return false;

    let suma = 0;
    for (let i = 0; i < 9; i++) {
        let valor = parseInt(cedula.charAt(i), 10);
        if (i % 2 === 0) { 
            valor *= 2;
            if (valor >= 10) valor -= 9;
        }
        suma += valor;
    }

    const digitoVerificadorCalculado = (Math.ceil(suma / 10) * 10) - suma;
    const digitoVerificadorReal = parseInt(cedula.charAt(9), 10);
    const digitoFinal = (digitoVerificadorCalculado === 10) ? 0 : digitoVerificadorCalculado;

    return digitoFinal === digitoVerificadorReal;
}


