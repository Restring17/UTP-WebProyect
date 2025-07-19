/**
 * Obtiene las imágenes asociadas a un producto por su ID
 * @param {number} productoId - ID del producto
 * @returns {Promise<Array>} - Array de objetos de imagen
 */
async function obtenerImagenesProducto(productoId) {
  const myHeaders = new Headers();
  myHeaders.append("apikey", SUPABASE_API_KEY);

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
 * Genera la URL completa de una imagen almacenada en Supabase Storage
 * @param {string} urlImagen - Ruta relativa de la imagen en el storage
 * @returns {string} - URL completa de la imagen
 */
function generarUrlImagen(urlImagen) {
  // Ajusta 'imagenes-productos' si tu bucket tiene otro nombre
  const bucket = "imagenes-productos";
  const url = `${SUPABASE_URL}/storage/v1/object/public/${urlImagen}`;
  console.log("URL generada para imagen:", url); // <-- Depuración

  // Verificar si la URL está disponible
  fetch(url)
    .then(response => {
      if (response.ok) {
        console.log(`✅ Imagen disponible: ${url}`);
      } else {
        console.warn(`❌ Imagen NO disponible: ${url} (status: ${response.status})`);
      }
    })
    .catch(error => {
      console.error(`💥 Error al verificar imagen: ${url}`, error);
    });

  return url;
}

/**
 * Obtiene un solo producto por su ID junto con sus imágenes
 * @param {number} productoId - ID del producto a obtener
 * @returns {Promise<Object|null>} - Objeto con el producto y sus imágenes, o null si no se encuentra
 */
async function obtenerProductoConImagenes(productoId) {
  try {
    // Obtener el producto por ID
    const myHeaders = new Headers();
    myHeaders.append("apikey", SUPABASE_API_KEY);

    const requestOptions = {
      method: "GET",
      headers: myHeaders,
      redirect: "follow"
    };

    const response = await fetch(`${SUPABASE_URL}/rest/v1/productos?id=eq.${productoId}&select=*`, requestOptions);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error al obtener producto:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });
      return null;
    }

    const productos = await response.json();
    if (productos.length === 0) {
      console.warn('⚠️ Producto no encontrado');
      return null;
    }
    const producto = productos[0];

    // Obtener imágenes del producto
    const imagenes = await obtenerImagenesProducto(productoId);
    const imagenesConUrls = imagenes.map(imagen => ({
      ...imagen,
      url_completa: generarUrlImagen(imagen.url_imagen)
    }));

    return {
      producto,
      imagenes: imagenesConUrls
    };
  } catch (error) {
    console.error("💥 Error al obtener producto con imágenes:", error.message);
    return null;
  }
}

/**
 * Renderiza un solo producto con sus imágenes en el DOM
 * @param {number} productoId - ID del producto a mostrar
 * @param {string} containerId - ID del contenedor donde mostrar el producto
 */
async function mostrarProducto(productoId, containerId = 'producto-container') {
  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`Contenedor con ID '${containerId}' no encontrado`);
    return;
  }

  try {
    container.innerHTML = '<p>Cargando producto...</p>';
    const resultado = await obtenerProductoConImagenes(productoId);

    container.innerHTML = '';
    if (!resultado) {
      container.innerHTML = '<p>Producto no encontrado</p>';
      return;
    }

    const { producto, imagenes } = resultado;
    const productoDiv = document.createElement('div');
    productoDiv.className = 'producto';

    // Imágenes principales y secundarias
    const imagenesHtml = imagenes.map(imagen => `
      <label class="labelProductos">
        <img src="${imagen.url_completa}"
             alt="${producto.nombre}"
             class="imagenProducto${imagen.es_principal ? ' imagen-principal' : ''}">
      </label>
    `).join('');

    productoDiv.innerHTML = `
      <div class="imagenes">
        ${imagenesHtml}
      </div>
      <div class="info-product">
        <div class="titleProduct">
          <h2 id="productName">${producto.nombre}</h2>
        </div>
        <div class="BLockprecio">
          <p class="precio">S/. ${producto.precio}</p>
        </div>
        <div class="informacionProduct">
          <p id="informacion">${producto.descripcion}</p>
        </div>
        <div class="Carrito">
          <div class="cantPreduct">
            <button class="quitar">-</button>
            <p id="cantidad">1</p>
            <button class="aumentar">+</button>
          </div>
          <div class="agregarCarrito">
            <button class="agregar" id="btnAgregar"> Añadir al carrito</button>
          </div>
        </div>
      </div>
    `;
    container.appendChild(productoDiv);
  } catch (error) {
    console.error('Error al renderizar producto:', error);
    container.innerHTML = '<p>Error al cargar producto</p>';
  }
}

// Exportar funciones para uso externo
export { obtenerProductoConImagenes, mostrarProducto };