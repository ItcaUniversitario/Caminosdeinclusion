// js/sliderinicio.js

export function configurarSidebar() {
    console.log("Módulo Sidebar cargado.");

    // ==========================================
    // 1. CONFIGURACIÓN BOTÓN INICIO
    // ==========================================
    const btnInicioSidebar = document.querySelector('.btn-mini[title="Inicio"]');

    if (btnInicioSidebar) {
        btnInicioSidebar.addEventListener('click', () => {
            const quiereSalir = confirm(
                "⚠️ ¿Volver al Inicio?\n\n" +
                "Si regresas ahora, se perderá todo tu progreso y los registros actuales de los jugadores.\n\n" +
                "¿Estás seguro de que deseas salir?"
            );

            if (quiereSalir) {
                window.location.reload(); 
            }
        });
    } else {
        console.warn("Módulo Sidebar: No se encontró el botón de inicio.");
    }
// ==========================================
// 2. CONFIGURACIÓN BOTÓN AUDIO
// ==========================================
const btnAudioSidebar = document.querySelector('.btn-mini[title="Audio"]');

if (btnAudioSidebar) {
    // CAMBIO: Ahora seleccionamos la imagen (img) en lugar del span
    const iconoAudio = btnAudioSidebar.querySelector('.icono-custom');
    const textoAudio = btnAudioSidebar.querySelector('.texto-btn-mini');
    
    let estaSilenciado = false;

    // Rutas de tus iconos locales (Asegúrate de que los nombres coincidan con tus archivos)
    const rutaAudioOn = 'assets/imagenes/iconos/icono_sonido.png';
    const rutaAudioOff = 'assets/imagenes/iconos/icono_sinsonido.png';

    btnAudioSidebar.addEventListener('click', () => {
        estaSilenciado = !estaSilenciado;

        if (estaSilenciado) {
            // 1. Cambio Visual (IMAGEN LOCAL)
            iconoAudio.src = rutaAudioOff; // Cambia a la imagen de silencio
            textoAudio.textContent = 'Mutear';

            // 2. Lógica de silencio
            if (typeof window.controlarMusica === 'function') {
                window.controlarMusica(true); 
            }
            document.querySelectorAll('audio, video').forEach(media => media.muted = true);

        } else {
            // 1. Cambio Visual (IMAGEN LOCAL)
            iconoAudio.src = rutaAudioOn; // Cambia a la imagen de sonido activo
            textoAudio.textContent = 'Audio';

            // 2. Lógica de sonido
            if (typeof window.controlarMusica === 'function') {
                window.controlarMusica(false); 
            }
            document.querySelectorAll('audio, video').forEach(media => media.muted = false);
        }
    });
} else {
    console.warn("Módulo Sidebar: No se encontró el botón de audio.");
}
}