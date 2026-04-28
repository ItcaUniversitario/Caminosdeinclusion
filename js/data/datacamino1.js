// js/data/datacamino1.js

export const personajesData = {
    "paula": {
        nombre: "Paula",
        historia: "Paula es una microempresaria de 30 años de Tulcán que levantó su tienda de ropa con esfuerzo propio. Embarazada y activa, enfrenta cada día con energía y convicción. Su historia se centra en la independencia económica, el derecho a decidir sobre su propio negocio y su cuerpo, y la fuerza de seguir adelante.",
        imagenFull: "assets/imagenes/personajes/camino1/paula.png"
    },
    "nina": {
        nombre: "Nina",
        historia: "Nina es una joven kichwa otavaleña de 20 años que estudia tecnología mientras mantiene viva su identidad y su lengua. Vive entre dos mundos y saca fuerza de los dos. Su historia se centra en el empoderamiento, la identidad cultural y el derecho a ocupar todos los espacios que le pertenecen.",
        imagenFull: "assets/imagenes/personajes/camino1/nina.png"
    },
    "josefa": {
        nombre: "Josefa",
        historia: "Doña Josefa es una mujer afroecuatoriana de 67 años de Esmeraldas, cocinera tradicional y referente de su comunidad. Con décadas de experiencia y una sabiduría que no cabe en los libros, enfrenta cada día con dignidad y determinación. Su historia se centra en el respeto, la memoria y el derecho a ser escuchada.",
        imagenFull: "assets/imagenes/personajes/camino1/josefa.png"
    },
    "martina": {
        nombre: "Martina",
        historia: "Martina es una niña de 13 años de Andrade Marín, Imbabura, que vive con su mamá y su hermano menor. Le encanta dibujar y tiene una sensibilidad especial para notar lo que otros sienten. Su historia se centra en el derecho a crecer en un entorno seguro, a ser escuchada y a pedir ayuda cuando algo no está bien.",
        imagenFull: "assets/imagenes/personajes/camino1/martina.png"
    },
    "paty": {
        nombre: "Paty",
        historia: "Paty es una mujer de 55 años de Ibarra, maestra de braille y referente en su asociación. Nació con discapacidad visual y ha construido una vida plena con determinación y talento. Su historia se centra en la autonomía, el acceso a derechos en igualdad de condiciones y el valor de no dejarse definir por las limitaciones que otros le imponen.",
        imagenFull: "assets/imagenes/personajes/camino1/paty.png"
    },
    "yuleisy": {
        nombre: "Yuleisy",
        historia: "Yuleisy es una joven venezolana de 26 años que llegó a Ecuador a los 15 y construyó su vida en el sur de Quito. Trabajadora y resiliente, sostiene a su mamá con lo que gana cada día. Su historia se centra en la valentía de echar raíces lejos de casa y en el derecho a vivir con dignidad sin importar el origen.",
        imagenFull: "assets/imagenes/personajes/camino1/yuleisy.png"
    },
    "mia": {
        nombre: "Mía",
        historia: "Mía es una mujer trans de 29 años, estilista y activista en Guayaquil. Con mucho talento y más valentía, construyó su identidad y su comunidad desde cero. Su historia se centra en el derecho a ser quien se es, a ocupar espacios con orgullo y a luchar porque las cosas cambien para todas.",
        imagenFull: "assets/imagenes/personajes/camino1/mia.png"
    }
};
// js/data/datacamino1.js

// =======================================================================
// 1. EL ESQUELETO DEL MAPA (Solo IDs, tipos y coordenadas)
// =======================================================================
const posicionesBase = [
   { id: 0, tipo: 'carta', x: 34.15, y: 22.66 },
    { id: 1, tipo: 'carta', x: 28.75, y: 27.92 },
    { id: 2, tipo: 'carta', x: 24.58, y: 30.26 },
    { id: 3, tipo: 'video', x: 20.19, y: 33.76 },
    { id: 4, tipo: 'carta', x: 15.92, y: 38.05 },
    { id: 5, tipo: 'info', x: 12.43, y: 44.28 },
    { id: 6, tipo: 'carta', x: 8.82, y: 50.52 },
    { id: 7, tipo: 'carta', x: 7.02, y: 57.72 },
    { id: 8, tipo: 'video', x: 7.47, y: 65.91 },
    { id: 9, tipo: 'carta', x: 10.18, y: 72.33 },
    { id: 10, tipo: 'info', x: 15.13, y: 75.06 },
    { id: 11, tipo: 'carta', x: 19.41, y: 70.97 },
    { id: 12, tipo: 'carta', x: 23.68, y: 65.91 },
    { id: 13, tipo: 'video', x: 26.05, y: 59.87 },
    { id: 14, tipo: 'carta', x: 30.55, y: 52.46 },
    { id: 15, tipo: 'info', x: 33.70, y: 46.62 },
    { id: 16, tipo: 'carta', x: 37.08, y: 40.58 },
    { id: 17, tipo: 'carta', x: 40.79, y: 37.27 },
    { id: 18, tipo: 'video', x: 45.97, y: 34.54 },
    { id: 19, tipo: 'carta', x: 50.92, y: 37.27 },
    { id: 20, tipo: 'carta', x: 54.41, y: 42.72 },
    { id: 21, tipo: 'carta', x: 58.80, y: 46.43 },
    { id: 22, tipo: 'video', x: 63.76, y: 46.23 },
    { id: 23, tipo: 'carta', x: 68.60, y: 42.72 },
    { id: 24, tipo: 'info', x: 72.31, y: 36.49 },
    { id: 25, tipo: 'carta', x: 76.36, y: 32.59 },
    { id: 26, tipo: 'carta', x: 80.41, y: 30.84 },
    { id: 27, tipo: 'video', x: 84.92, y: 30.45 },
    { id: 28, tipo: 'carta', x: 90.09, y: 32.79 },
    { id: 29, tipo: 'info', x: 93.25, y: 40.19 },
    { id: 30, tipo: 'carta', x: 93.81, y: 49.54 },
    { id: 31, tipo: 'carta', x: 90.88, y: 56.56 },
    { id: 32, tipo: 'video', x: 87.73, y: 61.82 },
    { id: 33, tipo: 'carta', x: 84.35, y: 66.88 },
    { id: 34, tipo: 'carta', x: 81.09, y: 73.50 },
    { id: 35, tipo: 'carta', x: 76.81, y: 77.98 },
    { id: 36, tipo: 'video', x: 71.18, y: 80.13 },
    { id: 37, tipo: 'carta', x: 66.57, y: 79.54 },
    { id: 38, tipo: 'carta', x: 62.40, y: 74.67 },
    { id: 39, tipo: 'meta', x: 59.48, y: 64.54 }
];



// =======================================================================
// 2. EL CONTENIDO EDUCATIVO (Indexado por el número de ID)
// =======================================================================
const contenidoExtra = {
    // VIDEOS
    3: { titulo: '¿Qué es la violencia de género?', rutaVideo: 'assets/videos/camino1/1violenciadegenero.mp4' },
    8: { titulo: 'Violencia física y psicológica', rutaVideo: 'assets/videos/camino1/2fisicaypsicologica.mp4' },
    13: { titulo: 'Violencia Sexual y económica', rutaVideo: 'assets/videos/camino1/3sexualyeconomica.mp4' },
    18: { titulo: 'Violencia simbólica, política y gineco-obstétrica', rutaVideo: 'assets/videos/camino1/4simbolicapoliticagineco.mp4' },
    22: { titulo: 'Ruta de protección y denuncia', rutaVideo: 'assets/videos/camino1/5LGBTQ+.mp4' },
    27: { titulo: 'Alianza por la igualdad: Fundación CACMU e ITCA', rutaVideo: 'assets/videos/camino1/6cacmuitca.mp4' },
    32: { titulo: 'Historia del 25 de noviembre: Las hermanas Mirabal', rutaVideo: 'assets/videos/camino1/7noviembre25.mp4' },
    36: { titulo: 'Cifras de feminicidio en Ecuador', rutaVideo: 'assets/videos/camino1/8estadisticasecuador.mp4' },
    39: { titulo: 'Reflexión Final: El Poder de la Empatía', rutaVideo: 'assets/videos/camino1/videoreflexion.mp4' },

    // INFORMACIÓN (INFOS)
    5: {
        titulo: "La Carta de Derechos de las Mujeres",
        descripcion: `La Convención sobre la Eliminación de Todas las Formas de Discriminación contra la Mujer (CEDAW) fue adoptada por la ONU en 1979. Es considerada el tratado internacional más completo sobre los derechos de las mujeres.
        <ul style="text-align: left; margin-top: 15px; padding-left: 20px;">
            <li style="margin-bottom: 8px;"><strong>Alcance:</strong> Ha sido ratificada por más de 180 países, estableciendo compromisos legales para eliminar la discriminación.</li>
            <li style="margin-bottom: 8px;"><strong>Concepto clave:</strong> Busca alcanzar la equidad de género, que es la igualdad real de oportunidades.</li>
            <li><strong>Mandato:</strong> Los Estados deben actuar no solo contra las leyes discriminatorias, sino contra las prácticas sociales que perpetúan la desigualdad.</li>
        </ul>`
    },
    10: {
        titulo: "Convención de Belém do Pará",
        descripcion: `Adoptada en 1994, es el primer tratado regional que define la violencia contra las mujeres como una violación de los derechos humanos.
        <table style="width: 100%; margin-top: 15px; border-collapse: collapse; font-size: 0.9rem; text-align: left;">
            <thead><tr style="background-color: #f3e5f5; color: #4A148C;"><th style="padding: 8px; border: 1px solid #E1BEE7;">Obligación</th><th style="padding: 8px; border: 1px solid #E1BEE7;">Descripción</th></tr></thead>
            <tbody>
                <tr><td style="padding: 8px; border: 1px solid #E1BEE7; font-weight: bold;">Prevenir</td><td style="padding: 8px; border: 1px solid #E1BEE7;">Crear políticas y programas educativos.</td></tr>
                <tr><td style="padding: 8px; border: 1px solid #E1BEE7; font-weight: bold;">Sancionar</td><td style="padding: 8px; border: 1px solid #E1BEE7;">Garantizar que los agresores reciban penas.</td></tr>
                <tr><td style="padding: 8px; border: 1px solid #E1BEE7; font-weight: bold;">Erradicar</td><td style="padding: 8px; border: 1px solid #E1BEE7;">Eliminar las causas estructurales y culturales.</td></tr>
            </tbody>
        </table>`
    },
    15: {
        titulo: "ODS 5: Igualdad de Género",
        descripcion: `Forma parte de los 17 Objetivos de Desarrollo Sostenible para la Agenda 2030. Su meta es lograr la igualdad entre los géneros y empoderar a todas las mujeres y las niñas.
        <ul style="text-align: left; margin-top: 10px; padding-left: 20px;">
            <li><strong>Metas:</strong> Eliminar la violencia, asegurar participación plena y acceso a salud.</li>
            <li><strong>Economía del cuidado:</strong> Valora el trabajo doméstico no remunerado.</li>
        </ul>`
    },
    24: {
        titulo: "Calendario de Conmemoraciones",
        descripcion: `Las fechas clave nos permiten recordar luchas históricas y fortalecer el activismo actual.
        <ul style="text-align: left; margin-top: 15px; padding-left: 20px; line-height: 1.5;">
            <li style="margin-bottom: 8px;"><strong>8 de marzo:</strong> Día Internacional de la Mujer.</li>
            <li style="margin-bottom: 8px;"><strong>11 de octubre:</strong> Día Internacional de la Niña.</li>
            <li style="margin-bottom: 8px;"><strong>25 de noviembre:</strong> Día Internacional de la Eliminación de la Violencia contra la Mujer. <em>(Hermanas Mirabal)</em>.</li>
            <li><strong>16 Días de Activismo:</strong> Del 25 de nov. al 10 de dic.</li>
        </ul>`
    },
     29: {
        titulo: "Femicidio: La Expresión Extrema",
        descripcion: `El femicidio es el asesinato de una mujer motivado por razones de género. Es el resultado de relaciones de poder desiguales y discriminación estructural.
        
        <ul style="text-align: left; margin-top: 15px; padding-left: 20px; line-height: 1.5;">
            <li style="margin-bottom: 8px;"><strong>Legislación:</strong> Ecuador tipificó el femicidio como delito en el año 2014.</li>
            <li style="margin-bottom: 8px;"><strong>Frecuencia (Ecuador 2025):</strong> Ocurre un femicidio aproximadamente cada 22 horas.</li>
            <li><strong>Perfil del agresor:</strong> En el 33% de los casos, el agresor tenía o había tenido un vínculo sentimental con la víctima.</li>
        </ul>

        <div style="margin-top: 18px; padding: 12px 15px; background: rgba(156, 39, 176, 0.08); border-left: 5px solid #9C27B0; border-radius: 0 10px 10px 0; font-style: italic; color: #4A148C; text-align: left; font-weight: 500;">
            "La violencia contra la mujer es una ofensa a la dignidad humana y una manifestación de las relaciones de poder históricamente desiguales entre mujeres y hombres".
        </div>`
    },
    

};

// =======================================================================
// 3. LA FUSIÓN AUTOMÁTICA (El puente con mapa_logic.js)
// =======================================================================
// Aquí recorremos las coordenadas base y le "inyectamos" el contenido si existe.
// Usamos el operador "spread" (...) para clonar y combinar los datos.
const casillasCombinadas = posicionesBase.map(casilla => {
    return {
        ...casilla,
        ...(contenidoExtra[casilla.id] || {}) // Si hay contenido extra lo añade, si no, no hace nada
    };
});

// Finalmente exportamos la estructura EXACTA que mapa_logic.js está esperando
export const camino1 = {
    nombre: "Camino Prevención de la Violencia de género",
    casillas: casillasCombinadas
};