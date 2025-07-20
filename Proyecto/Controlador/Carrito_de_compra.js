// --- Funciones de carrito ---
function listarCarrito() {
  return JSON.parse(localStorage.getItem('carrito')) || [];
}

function eliminarProductoDelCarrito(idProducto) {
  let carrito = listarCarrito();
  carrito = carrito.filter(item => Number(item.id) !== Number(idProducto));
  localStorage.setItem('carrito', JSON.stringify(carrito));
}

function modificarCantidadProducto(idProducto, nuevaCantidad) {
  let carrito = listarCarrito();
  const index = carrito.findIndex(item => item.id === idProducto);
  if (index !== -1) {
    carrito[index].cantidad = nuevaCantidad;
    localStorage.setItem('carrito', JSON.stringify(carrito));
  }
}

// --- Funciones Supabase ---
async function obtenerImagenesProducto(productoId) {
  const myHeaders = new Headers();
  myHeaders.append("apikey", SUPABASE_API_KEY);

  const requestOptions = {
    method: "GET",
    headers: myHeaders,
    redirect: "follow"
  };

  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/imagenes_productos?select=*&producto_id=eq.${productoId}` , requestOptions);
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Error al obtener imágenes del producto ${productoId}:`, errorText);
      return [];
    }
    const imagenes = await response.json();
    return imagenes;
  } catch (error) {
    console.error(`💥 Error al obtener imágenes del producto ${productoId}:`, error.message);
    return [];
  }
}

function generarUrlImagen(urlImagen) {
  const url = `${SUPABASE_URL}/storage/v1/object/public/${urlImagen}`;
  return url;
}

async function obtenerProductoConImagenes(productoId) {
  try {
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
      console.error('❌ Error al obtener producto:', errorText);
      return null;
    }
    const productos = await response.json();
    if (productos.length === 0) {
      console.warn('⚠️ Producto no encontrado');
      return null;
    }
    const producto = productos[0];
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

// --- Renderizado del carrito ---
async function renderizarCarritoSupabase() {
  const contenedor = document.querySelector('.productos');
  if (!contenedor) {
    console.error("Contenedor '.productos' no encontrado");
    return;
  }
  contenedor.innerHTML = '';

  const productosCarrito = listarCarrito();
  if (!productosCarrito.length) {
    contenedor.innerHTML = '<p style="color:white;text-align:center;">Tu carrito está vacío.</p>';
    // Actualizar resumen a 0
    document.querySelector('.pago').textContent = 'S/0';
    document.querySelector('.pagoDescuento').textContent = 'S/0';
    document.querySelectorAll('.pago')[1].textContent = 'S/15';
    document.querySelector('.pagoTotal').textContent = 'S/15';
    return;
  }

  let subtotal = 0;
  for (const item of productosCarrito) {
    const resultado = await obtenerProductoConImagenes(item.id);
    if (!resultado) continue;
    const { producto, imagenes } = resultado;
    const imagenPrincipal = imagenes.find(img => img.es_principal) || imagenes[0];
    const urlImagen = imagenPrincipal ? imagenPrincipal.url_completa : '../img/default.png';

    subtotal += (producto.precio * item.cantidad);

    const productoHTML =
      '<div class="productoxcomprar">' +
        '<div class="productoImagen">' +
          '<img src="' + urlImagen + '" alt="' + producto.nombre + '" class="imgProducto">' +
        '</div>' +
        '<div class="infoProducto">' +
          '<div class="tituloProducto">' +
            '<p class="nombreProducto">' + producto.nombre + '</p>' +
            '<button class="btnEliminar" aria-label="Eliminar producto" onclick="eliminarProductoDelCarrito(' + producto.id + '); location.reload();">' +
              '<svg width="30px" height="30px" viewBox="0 0 24.00 24.00" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="#ff0000" stroke-width="0.00024">' +
                '<g></g>' +
                '<path fill-rule="evenodd" clip-rule="evenodd" d="M12.663 1.5h-1.326c-1.069 0-1.49.09-1.921.27-.432.181-.792.453-1.084.82-.292.365-.493.746-.784 1.774L7.368 5H5a1 1 0 0 0 0 2h.563l.703 11.25c.082 1.32.123 1.98.407 2.481a2.5 2.5 0 0 0 1.083 1.017C8.273 22 8.935 22 10.258 22h3.484c1.323 0 1.985 0 2.502-.252a2.5 2.5 0 0 0 1.083-1.017c.284-.5.325-1.16.407-2.482L18.437 7H19a1 1 0 1 0 0-2h-2.367l-.18-.636c-.292-1.028-.493-1.409-.785-1.775a2.694 2.694 0 0 0-1.084-.819c-.431-.18-.852-.27-1.92-.27zm1.89 3.5-.025-.09c-.203-.717-.29-.905-.424-1.074a.696.696 0 0 0-.292-.221c-.2-.084-.404-.115-1.149-.115h-1.326c-.745 0-.95.031-1.149.115a.696.696 0 0 0-.292.221c-.135.169-.221.357-.424 1.074L9.446 5h5.108zM9.61 8.506a.75.75 0 0 0-.724.776l.297 8.495a.75.75 0 0 0 1.499-.053l-.297-8.494a.75.75 0 0 0-.775-.724zm4.008.724a.75.75 0 0 1 1.499.052l-.297 8.495a.75.75 0 0 1-1.499-.053l.297-8.494z" fill="#ff0000"></path>' +
              '</svg>' +
            '</button>' +
          '</div>' +
          '<div class="especificaciones">' +
            '<div class="precioProducto">' +
              '<p class="precio">S/. ' + producto.precio + '</p>' +
            '</div>' +
            '<div class="cantidadProducto">' +
              '<button class="quitar" onclick="modificarCantidadProducto(' + producto.id + ', Math.max(1, ' + item.cantidad + '-1)); location.reload();">-</button>' +
              '<p id="cantidad">' + item.cantidad + '</p>' +
              '<button class="aumentar" onclick="modificarCantidadProducto(' + producto.id + ', ' + (item.cantidad + 1) + '); location.reload();">+</button>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>';
    contenedor.innerHTML += productoHTML;
  }

  // Actualizar resumen de pago
  const descuento = 0;
  const tarifaEntrega = 15;
  const total = subtotal + descuento + tarifaEntrega;

  document.querySelector('.pago').textContent = 'S/' + subtotal;
  document.querySelector('.pagoDescuento').textContent = 'S/' + descuento;
  document.querySelectorAll('.pago')[1].textContent = 'S/' + tarifaEntrega;
  document.querySelector('.pagoTotal').textContent = 'S/' + total;
}

document.addEventListener('DOMContentLoaded', function() {
  renderizarCarritoSupabase();
});





