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
        const iconoAudio = btnAudioSidebar.querySelector('.icono-emoji');
        const textoAudio = btnAudioSidebar.querySelector('.texto-btn-mini');
        
        // Variable para recordar el estado actual
        let estaSilenciado = false;

        btnAudioSidebar.addEventListener('click', () => {
            estaSilenciado = !estaSilenciado; // Cambia entre true/false

            if (estaSilenciado) {
                // 1. Cambio Visual
                iconoAudio.textContent = '🔇';
                textoAudio.textContent = 'Mutear';

                // 2. Silenciar a través de tu función global (si existe)
                if (typeof window.controlarMusica === 'function') {
                    // Llama a tu función para pausar (puedes ajustar esto según cómo funcione tu código)
                    window.controlarMusica(true); 
                }

                // 3. El Truco Infalible: Mutea a la fuerza cualquier <audio> o <video> del HTML
                document.querySelectorAll('audio, video').forEach(media => media.muted = true);

                // Si tuvieras un método mute() en audioManager, lo pondrías aquí:
                // if (window.audioManager) window.audioManager.pauseBGM();

            } else {
                // 1. Cambio Visual
                iconoAudio.textContent = '🔊';
                textoAudio.textContent = 'Audio';

                // 2. Restaurar tu función global
                if (typeof window.controlarMusica === 'function') {
                    window.controlarMusica(false); 
                }

                // 3. Desmutear todas las etiquetas
                document.querySelectorAll('audio, video').forEach(media => media.muted = false);
            }
        });
    } else {
        console.warn("Módulo Sidebar: No se encontró el botón de audio.");
    }
}