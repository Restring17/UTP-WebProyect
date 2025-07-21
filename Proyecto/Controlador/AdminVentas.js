const SUPABASE_BEARER_TOKEN = document.cookie.split('; ').find(row => row.startsWith('supabase_token='))?.split('=')[1];

async function listarVentas() {
    const myHeaders = new Headers();
    myHeaders.append("apikey", SUPABASE_API_KEY);
    myHeaders.append("Authorization", `Bearer ${SUPABASE_BEARER_TOKEN}`);

    const requestOptions = {
        method: "GET",
        headers: myHeaders,
        redirect: "follow"
    };

    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/documentos?select=*&venta_autorisada=eq.false`, requestOptions);
        if (!response.ok) {
            throw new Error(`Error fetching sales: ${response.statusText}`);
        }
        const ventas = await response.json();
        console.log('Ventas:', ventas);
        
        // Agregar esto para ver la estructura de los datos
        if (ventas.length > 0) {
            console.log('Estructura del primer registro de venta:', Object.keys(ventas[0]));
        }

        // CORRECCIÓN: Cambiar el selector para apuntar directamente al tbody con id tablaVentas
        const tablaVentasBody = document.querySelector('#tablaVentas');
        
        // Verificar que el elemento existe antes de intentar modificarlo
        if (!tablaVentasBody) {
            console.error('No se pudo encontrar el elemento con ID tablaVentas');
            return;
        }
        
        tablaVentasBody.innerHTML = ''; // Clear existing rows

        for (const venta of ventas) {
            const clienteResponse = await fetch(`${SUPABASE_URL}/rest/v1/clientes?select=nombre&id=eq.1`, requestOptions);
            if (!clienteResponse.ok) {
                console.error(`Error fetching client ${venta.id_cliente}: ${clienteResponse.statusText}`);
                continue; // Skip this sale if client data can't be fetched
            }
            const clienteData = await clienteResponse.json();
            const nombreCliente = clienteData.length > 0 ? clienteData[0].nombre : 'Desconocido';

            const row = `
                <tr>
                    <td>${venta.id_documento}</td>
                    <td>${nombreCliente}</td>
                    <td>S/.${venta.total}</td>
                    <td>${new Date(venta.created_at).toLocaleDateString()}</td>
                    <td><button class="vender-button">Detalles</button></td>
                </tr>
            `;
            tablaVentasBody.innerHTML += row;
        }

    } catch (error) {
        console.error('Error al listar ventas:', error);
    }
}

// Call the function to list sales when the page loads
document.addEventListener('DOMContentLoaded', listarVentas);