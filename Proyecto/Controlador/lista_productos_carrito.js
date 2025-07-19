function agregarProductoAlCarrito(idProducto, cantidad) {
  // Obtener el carrito actual (si existe)
  let carrito = JSON.parse(localStorage.getItem('carrito')) || [];

  // Buscar si el producto ya está en el carrito
  const index = carrito.findIndex(item => item.id === idProducto);
  if (index !== -1) {
    // Si existe, actualizar la cantidad
    carrito[index].cantidad += cantidad;
  } else {
    // Si no existe, agregar nuevo producto
    carrito.push({ id: idProducto, cantidad });
  }

  // Guardar el carrito actualizado en localStorage
  localStorage.setItem('carrito', JSON.stringify(carrito));
}

// Listar todos los productos del carrito
function listarCarrito() {
  return JSON.parse(localStorage.getItem('carrito')) || [];
}

// Eliminar un producto del carrito por su id
function eliminarProductoDelCarrito(idProducto) {
  let carrito = listarCarrito();
  carrito = carrito.filter(item => item.id !== idProducto);
  localStorage.setItem('carrito', JSON.stringify(carrito));
}

// Vaciar todo el carrito
function vaciarCarrito() {
  localStorage.removeItem('carrito');
}

// Modificar la cantidad de un producto
function modificarCantidadProducto(idProducto, nuevaCantidad) {
  let carrito = listarCarrito();
  const index = carrito.findIndex(item => item.id === idProducto);
  if (index !== -1) {
    carrito[index].cantidad = nuevaCantidad;
    localStorage.setItem('carrito', JSON.stringify(carrito));
  }
}

window.agregarProductoAlCarrito = agregarProductoAlCarrito;


