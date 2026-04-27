import { db } from '../../js/firebase.js';
import { collection, getDocs, orderBy, query } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

async function cargarUsuarios() {
    const tablaBody = document.getElementById('tabla-usuarios-body');
    tablaBody.innerHTML = '<tr><td colspan="6" class="text-center">Cargando datos...</td></tr>';

    try {
        const q = query(collection(db, "usuarios"), orderBy("fechaRegistro", "desc"));
        const querySnapshot = await getDocs(q);
        
        tablaBody.innerHTML = ''; // Limpiamos

        querySnapshot.forEach((doc) => {
            const u = doc.data();
            const fila = `
                <tr>
                    <td><strong>${u.cedula}</strong></td>
                    <td>${u.nombres} ${u.apellidos}</td>
                    <td>${u.correo}</td>
                    <td><span class="badge bg-info text-dark">${u.edad} años</span> <br> <small>${u.sexo}</small></td>
                    <td>${new Date(u.lastLogin).toLocaleString()}</td>
                    <td>
                        <button class="btn btn-sm btn-outline-primary" onclick="verDetalle('${u.cedula}')"><i class="bi bi-eye"></i></button>
                    </td>
                </tr>
            `;
            tablaBody.innerHTML += fila;
        });
    } catch (error) {
        console.error("Error al cargar usuarios:", error);
        tablaBody.innerHTML = '<tr><td colspan="6" class="text-center text-danger">Error al cargar datos.</td></tr>';
    }
}

// Ejecutar al cargar la página
window.onload = cargarUsuarios;