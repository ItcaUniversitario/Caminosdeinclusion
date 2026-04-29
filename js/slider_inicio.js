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
    }

    // ==========================================
    // 2. CONFIGURACIÓN BOTÓN AUDIO
    // ==========================================
    const btnAudioSidebar = document.querySelector('.btn-mini[title="Audio"]');
    if (btnAudioSidebar) {
        const iconoAudio = btnAudioSidebar.querySelector('.icono-custom');
        const textoAudio = btnAudioSidebar.querySelector('.texto-btn-mini');
        let estaSilenciado = false;

        const rutaAudioOn = 'assets/imagenes/iconos/icono_sonido.png';
        const rutaAudioOff = 'assets/imagenes/iconos/icono_sinsonido.png';

        btnAudioSidebar.addEventListener('click', () => {
            estaSilenciado = !estaSilenciado;

            if (estaSilenciado) {
                iconoAudio.src = rutaAudioOff;
                textoAudio.textContent = 'Silencio';
                if (typeof window.controlarMusica === 'function') {
                    window.controlarMusica(true); 
                }
                document.querySelectorAll('audio, video').forEach(media => media.muted = true);
            } else {
                iconoAudio.src = rutaAudioOn;
                textoAudio.textContent = 'Sonido';
                if (typeof window.controlarMusica === 'function') {
                    window.controlarMusica(false); 
                }
                document.querySelectorAll('audio, video').forEach(media => media.muted = false);
                
                // 🔊 Aseguramos que al desmutear, el volumen siga bajito
                const musica = document.getElementById('musicaFondo');
                if(musica) musica.volume = 0.2; 
            }
        });
    }
}

// ==========================================
// LÓGICA DE MÚSICA DE FONDO Y VOLUMEN
// ==========================================
const musicaFondo = document.getElementById('musicaFondo');

// 🚨 CONFIGURACIÓN INICIAL DEL VOLUMEN (0.2 es el 20%)
if (musicaFondo) {
    musicaFondo.volume = 0.05; 
}

let audioIniciado = false;

function iniciarAudioGlobal() {
    if (!audioIniciado && musicaFondo) {
        // Doble seguridad de volumen antes de dar Play
        musicaFondo.volume = 0.05; 
        
        musicaFondo.play().then(() => {
            audioIniciado = true;
            console.log("Audio iniciado al 20% de volumen");
            document.removeEventListener('click', iniciarAudioGlobal);
        }).catch(error => {
            console.warn("El navegador aún bloquea el audio:", error);
        });
    }
}

document.addEventListener('click', iniciarAudioGlobal);

const todosLosVideos = document.querySelectorAll('video');

todosLosVideos.forEach(video => {
    video.addEventListener('play', () => {
        // Pausamos la música de fondo para que se escuche el video
        if (musicaFondo) musicaFondo.pause();
    });

    video.addEventListener('pause', () => {
        if (musicaFondo && !musicaFondo.muted) {
            musicaFondo.play();
        }
    });

    video.addEventListener('ended', () => {
        if (musicaFondo && !musicaFondo.muted) {
            musicaFondo.play();
        }
    });
});