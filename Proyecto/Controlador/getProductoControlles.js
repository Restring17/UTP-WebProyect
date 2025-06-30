
const SUPABASE_BEARER_TOKEN = document.cookie.split('; ').find(row => row.startsWith('supabase_token='))?.split('=')[1];

console.log('Bearer Token encontrado:', SUPABASE_BEARER_TOKEN ? 'Sí' : 'No');
if (SUPABASE_BEARER_TOKEN) {
  console.log('Token (primeros 50 caracteres):', SUPABASE_BEARER_TOKEN.substring(0, 50) + '...');
} else {
  console.warn('⚠️ No se encontró token de autenticación en las cookies');
}
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
    console.log('🔄 Intentando obtener productos...');
    const response = await fetch(`${SUPABASE_URL}/rest/v1/productos?select=*`, requestOptions);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error en la respuesta:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });

      // Detectar errores específicos de JWT
      if (response.status === 401) {
        console.error('🔐 JWT INVÁLIDO O EXPIRADO - El token de autenticación no es válido');
        console.error('💡 Solución: Hacer login nuevamente para obtener un token válido');
        throw new Error('Token de autenticación inválido o expirado. Por favor, inicia sesión nuevamente.');
      }
      
      if (response.status === 403) {
        console.error('🚫 ACCESO PROHIBIDO - No tienes permisos para acceder a este recurso');
        throw new Error('No tienes permisos para acceder a los productos.');
      }

      throw new Error(`Error al obtener productos: ${response.status} - ${response.statusText}`);
    }
    
    const productos = await response.json();
    console.log('✅ Productos obtenidos exitosamente:', productos.length, 'productos');
    console.log('📋 Lista de productos:', productos);
    return productos;
  } catch (error) {
    console.error("💥 Error al listar productos:", error.message);
    
    // Log adicional para errores de red
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      console.error('🌐 Error de conexión - Verifica tu conexión a internet');
    }
    
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
    console.log(`🖼️ Obteniendo imágenes para producto ID: ${productoId}`);
    const response = await fetch(`${SUPABASE_URL}/rest/v1/imagenes_productos?select=*&producto_id=eq.${productoId}`, requestOptions);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Error al obtener imágenes del producto ${productoId}:`, {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });

      // Detectar errores específicos de JWT
      if (response.status === 401) {
        console.error('🔐 JWT INVÁLIDO O EXPIRADO al obtener imágenes');
        throw new Error('Token de autenticación inválido para obtener imágenes.');
      }

      throw new Error(`Error al obtener imágenes: ${response.status} - ${response.statusText}`);
    }
    
    const imagenes = await response.json();
    console.log(`✅ Imágenes del producto ${productoId} obtenidas:`, imagenes.length, 'imágenes');
    return imagenes;
  } catch (error) {
    console.error(`💥 Error al obtener imágenes del producto ${productoId}:`, error.message);
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
  return `${SUPABASE_URL}/storage/v1/object/${cleanKey}`;

}

/**
 * FUNCIÓN 4: Combina productos con sus imágenes
 * @returns {Promise<Array>} - Array de productos con sus imágenes incluidas
 */
async function obtenerProductosConImagenes() {
  try {
    console.log('🚀 Iniciando obtención de productos con imágenes...');
    
    // Obtener todos los productos
    const productos = await listarProductos();
    
    if (productos.length === 0) {
      console.warn('⚠️ No se encontraron productos en la base de datos');
      return [];
    }

    console.log(`📦 Procesando ${productos.length} productos...`);
    
    // Para cada producto, obtener sus imágenes
    const productosConImagenes = await Promise.all(
      productos.map(async (producto, index) => {
        console.log(`📋 Procesando producto ${index + 1}/${productos.length}: ${producto.nombre}`);
        
        const imagenes = await obtenerImagenesProducto(producto.id);
        
        // Generar URLs completas para las imágenes
        const imagenesConUrls = imagenes.map(imagen => ({
          ...imagen,
          url_completa: generarUrlImagen(imagen.url_imagen)
        }));
        
        const resultado = {
          producto: producto,
          imagenes: imagenesConUrls
        };
        
        console.log(`✅ Producto ${producto.nombre} procesado con ${imagenesConUrls.length} imágenes`);
        return resultado;
      })
    );
    
    console.log('🎉 ¡Todos los productos con imágenes obtenidos exitosamente!');
    console.log('📊 Resumen final:', {
      totalProductos: productosConImagenes.length,
      productosConImagenes: productosConImagenes.filter(p => p.imagenes.length > 0).length,
      productosSinImagenes: productosConImagenes.filter(p => p.imagenes.length === 0).length
    });
    
    return productosConImagenes;
  } catch (error) {
    console.error("💥 Error crítico al obtener productos con imágenes:", error.message);
    console.error("🔍 Stack trace:", error.stack);
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



