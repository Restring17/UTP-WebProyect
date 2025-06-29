const SUPABASE_URL = "https://iwbpiptomqaugtbxrlln.supabase.co";
const SUPABASE_API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml3YnBpcHRvbXFhdWd0YnhybGxuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA5ODAwNDQsImV4cCI6MjA2NjU1NjA0NH0.MkfOyv_39_GkSScVS28I0p8-2GGoAyTRH5LKSlKsQJA";


const SUPABASE_BEARER_TOKEN = document.cookie.split('; ').find(row => row.startsWith('supabase_token='))?.split('=')[1];

console.log('Bearer Token:', SUPABASE_BEARER_TOKEN);
/**
 * FUNCIÓN 1: Lista todos los productos de la base de datos
 * @returns {Promise<Array>} - Array con todos los productos
 */
async function listarProductos() {
  const myHeaders = new Headers();
  myHeaders.append("apikey", SUPABASE_API_KEY);
  if (SUPABASE_BEARER_TOKEN) {
    myHeaders.append("Authorization", `Bearer ${SUPABASE_BEARER_TOKEN}`);
  }

  const requestOptions = {
    method: "GET",
    headers: myHeaders,
    redirect: "follow"
  };

  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/productos?select=*`, requestOptions);
    
    if (!response.ok) {
      throw new Error(`Error al obtener productos: ${response.status}`);
    }
    
    const productos = await response.json();
    console.log('Productos obtenidos:', productos);
    return productos;
  } catch (error) {
    console.error("Error al listar productos:", error);
    return [];
  }
}

/**
 * FUNCIÓN 2: Obtiene las imágenes de un producto específico
 * @param {number} productoId - ID del producto
 * @returns {Promise<Array>} - Array con las imágenes del producto
 */
async function obtenerImagenesProducto(productoId) {
  const myHeaders = new Headers();
  myHeaders.append("apikey", SUPABASE_API_KEY);
  if (SUPABASE_BEARER_TOKEN) {
    myHeaders.append("Authorization", `Bearer ${SUPABASE_BEARER_TOKEN}`);
  }

  const requestOptions = {
    method: "GET",
    headers: myHeaders,
    redirect: "follow"
  };

  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/imagenes_productos?select=*&producto_id=eq.${productoId}`, requestOptions);
    
    if (!response.ok) {
      throw new Error(`Error al obtener imágenes: ${response.status}`);
    }
    
    const imagenes = await response.json();
    console.log(`Imágenes del producto ${productoId}:`, imagenes);
    return imagenes;
  } catch (error) {
    console.error(`Error al obtener imágenes del producto ${productoId}:`, error);
    return [];
  }
}

/**
 * FUNCIÓN 3: Genera URL completa para descargar imagen desde Supabase Storage
 * @param {string} imagenKey - La key/path de la imagen en el storage
 * @returns {string} - URL completa para acceder a la imagen
 */
function generarUrlImagen(imagenKey) {
  // Remover barra inicial si existe
  const cleanKey = imagenKey.startsWith('/') ? imagenKey.substring(1) : imagenKey;
  return `${SUPABASE_URL}/storage/v1/object/public/imagenes-productos/${cleanKey}`;
}

/**
 * FUNCIÓN 4: Combina productos con sus imágenes
 * @returns {Promise<Array>} - Array de productos con sus imágenes incluidas
 */
async function obtenerProductosConImagenes() {
  try {
    // Obtener todos los productos
    const productos = await listarProductos();
    
    // Para cada producto, obtener sus imágenes
    const productosConImagenes = await Promise.all(
      productos.map(async (producto) => {
        const imagenes = await obtenerImagenesProducto(producto.id);
        
        // Generar URLs completas para las imágenes
        const imagenesConUrls = imagenes.map(imagen => ({
          ...imagen,
          url_completa: generarUrlImagen(imagen.url_imagen)
        }));
        
        return {
          producto: producto,
          imagenes: imagenesConUrls
        };
      })
    );
    
    console.log('Productos con imágenes:', productosConImagenes);
    return productosConImagenes;
  } catch (error) {
    console.error("Error al obtener productos con imágenes:", error);
    return [];
  }
}

/**
 * FUNCIÓN 5: Renderiza los productos en el DOM
 * @param {string} containerId - ID del contenedor donde mostrar los productos
 */
async function renderizarProductosEnDOM(containerId) {
  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`Contenedor con ID '${containerId}' no encontrado`);
    return;
  }

  try {
    // Mostrar loading
    container.innerHTML = '<p>Cargando productos...</p>';
    
    // Obtener productos con imágenes
    const productosConImagenes = await obtenerProductosConImagenes();
    
    // Limpiar container
    container.innerHTML = '';
    
    // Renderizar cada producto
    productosConImagenes.forEach(({ producto, imagenes }) => {
      const productoDiv = document.createElement('div');
      productoDiv.className = 'producto-card';
      productoDiv.innerHTML = `
        <div class="producto-info">
          <h3>${producto.nombre}</h3>
          <p><strong>Marca:</strong> ${producto.marca}</p>
          <p><strong>Descripción:</strong> ${producto.descripcion}</p>
          <p><strong>Precio:</strong> S/ ${producto.precio}</p>
          <p><strong>Stock:</strong> ${producto.stock}</p>
          <p><strong>Disponible:</strong> ${producto.disponible ? 'Sí' : 'No'}</p>
        </div>
        <div class="producto-imagenes">
          ${imagenes.map(imagen => `
            <img src="${imagen.url_completa}" 
                 alt="${producto.nombre}" 
                 class="producto-imagen ${imagen.es_principal ? 'imagen-principal' : ''}"
                 style="max-width: 150px; height: auto; margin: 5px;">
          `).join('')}
        </div>
      `;
      
      container.appendChild(productoDiv);
    });
    
    if (productosConImagenes.length === 0) {
      container.innerHTML = '<p>No se encontraron productos</p>';
    }
    
  } catch (error) {
    console.error('Error al renderizar productos:', error);
    container.innerHTML = '<p>Error al cargar productos</p>';
  }
}

// =======================================================
// FUNCIONES DE USO DIRECTO
// =======================================================

/**
 * Función simplificada para obtener todos los productos con imágenes
 */
async function getProductos() {
  return await obtenerProductosConImagenes();
}

/**
 * Función simplificada para mostrar productos en una página
 * @param {string} containerId - ID del contenedor (por defecto: 'productos-container')
 */
async function mostrarProductos(containerId = 'productos-container') {
  await renderizarProductosEnDOM(containerId);
}



