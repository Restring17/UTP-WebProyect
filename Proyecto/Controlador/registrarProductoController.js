
const SUPABASE_URL = "https://iwbpiptomqaugtbxrlln.supabase.co";
const SUPABASE_API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml3YnBpcHRvbXFhdWd0YnhybGxuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA5ODAwNDQsImV4cCI6MjA2NjU1NjA0NH0.MkfOyv_39_GkSScVS28I0p8-2GGoAyTRH5LKSlKsQJA";

const SUPABASE_BEARER_TOKEN = 'eyJhbGciOiJIUzI1NiIsImtpZCI6IldVUVlGRzRWekpsU0M2TkIiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2l3YnBpcHRvbXFhdWd0YnhybGxuLnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiI5MzY4NWNkNi1hMDk3LTQyZDctOGQ2Yy01ZTQ2ZjYwNmZkZDIiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzUxMTczMjU4LCJpYXQiOjE3NTExNjk2NTgsImVtYWlsIjoiY3JpczE2Y29uZUBnbWFpbC5jb20iLCJwaG9uZSI6IiIsImFwcF9tZXRhZGF0YSI6eyJwcm92aWRlciI6ImVtYWlsIiwicHJvdmlkZXJzIjpbImVtYWlsIl19LCJ1c2VyX21ldGFkYXRhIjp7ImVtYWlsIjoiY3JpczE2Y29uZUBnbWFpbC5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwicGhvbmVfdmVyaWZpZWQiOmZhbHNlLCJzdWIiOiI5MzY4NWNkNi1hMDk3LTQyZDctOGQ2Yy01ZTQ2ZjYwNmZkZDIifSwicm9sZSI6ImF1dGhlbnRpY2F0ZWQiLCJhYWwiOiJhYWwxIiwiYW1yIjpbeyJtZXRob2QiOiJwYXNzd29yZCIsInRpbWVzdGFtcCI6MTc1MTE2OTY1OH1dLCJzZXNzaW9uX2lkIjoiNzZjNjk3NDktMDVmMC00YTYzLWI4NzUtNDAyMjQyNTgxNmJhIiwiaXNfYW5vbnltb3VzIjpmYWxzZX0.8vGB79brOmWTjQHZ69dzmcRQzI3HIBZ_kjWWZtVA8V4'


/**
 * LÓGICA 1: Guarda los datos de un producto en la tabla "productos".
 * @param {object} productoData - Objeto con los datos del producto (nombre, marca, etc.).
 * @returns {Promise<object>} Devuelve el objeto del producto que fue creado en la base de datos.
 */
async function guardarProducto(productoData) {
  // Prepara los encabezados de la petición.
  const myHeaders = new Headers();
  myHeaders.append("apikey", SUPABASE_API_KEY);
  myHeaders.append("Authorization", `Bearer ${SUPABASE_BEARER_TOKEN}`);
  myHeaders.append("Content-Type", "application/json");
  myHeaders.append("Prefer", "return=representation"); 

  // Configura la petición.
  const requestOptions = {
    method: "POST",
    headers: myHeaders,
    body: JSON.stringify(productoData),
    redirect: "follow"
  };

  // Realiza la petición a la API de Supabase.
  const response = await fetch(`${SUPABASE_URL}/rest/v1/productos`, requestOptions);

  // Si la respuesta no es exitosa, lanza un error.
  if (!response.ok) {
    throw new Error("Error al guardar el producto en la base de datos.");
  }

  // Convierte la respuesta a JSON y devuelve el primer elemento (el producto creado).
  const result = await response.json();
  return result[0];
}

/**
 * LÓGICA 2: Sube un archivo de imagen al Storage de Supabase.
 * @param {File} file - El archivo de imagen que se va a subir.
 * @returns {Promise<object>} Devuelve un objeto con la información de la imagen subida, incluyendo su "Key".
 */
async function subirImagen(file) {
  // Crea un nombre de archivo único para evitar que se sobreescriban.
  const nombreArchivo = `${Date.now()}-${file.name}`;

  // Prepara los encabezados.
  const myHeaders = new Headers();
  myHeaders.append("apikey", SUPABASE_API_KEY);
  myHeaders.append("Authorization", `Bearer ${SUPABASE_BEARER_TOKEN}`);
  myHeaders.append("Content-Type", file.type); // Usa el tipo de contenido del archivo.

  // Configura la petición.
  const requestOptions = {
    method: "POST",
    headers: myHeaders,
    body: file, // El cuerpo de la petición es el archivo mismo.
    redirect: "follow"
  };

  // Realiza la petición para subir el archivo al bucket "imagenes-productos".
  const response = await fetch(`${SUPABASE_URL}/storage/v1/object/imagenes-productos/${nombreArchivo}`, requestOptions);

  // Si falla, lanza un error.
  if (!response.ok) {
    throw new Error("Error al subir una de las imágenes al Storage.");
  }

  // Devuelve la respuesta de Supabase (que incluye la "Key" del archivo).
  return await response.json();
}

/**
 * LÓGICA 3: Crea una relación entre un producto y una URL de imagen.
 * @param {number} productoId - El ID del producto.
 * @param {string} imagenKey - La "Key" de la imagen devuelta por el Storage.
 * @param {boolean} esPrincipal - Indica si esta es la imagen principal del producto.
 */
async function enlazarImagenProducto(productoId, imagenKey, esPrincipal) {
  // Prepara los encabezados.
  const myHeaders = new Headers();
  myHeaders.append("apikey", SUPABASE_API_KEY);
  myHeaders.append("Authorization", `Bearer ${SUPABASE_BEARER_TOKEN}`);
  myHeaders.append("Content-Type", "application/json");

  // El objeto que se insertará en la tabla "imagenes_productos".
  const raw = JSON.stringify({
    "producto_id": productoId,
    "url_imagen": imagenKey, // Guardamos la "Key" como referencia.
    "es_principal": esPrincipal
  });

  // Configura la petición.
  const requestOptions = {
    method: "POST",
    headers: myHeaders,
    body: raw,
    redirect: "follow"
  };

  // Realiza la petición.
  const response = await fetch(`${SUPABASE_URL}/rest/v1/imagenes_productos`, requestOptions);

  // Si falla, lanza un error.
  if (!response.ok) {
    throw new Error("Error al enlazar una imagen con el producto.");
  }
}

// =======================================================
// 3. CONTROLADOR PRINCIPAL (MANEJO DEL FORMULARIO)
// =======================================================

// Se ejecuta cuando el contenido HTML de la página ha sido cargado.
document.addEventListener('DOMContentLoaded', () => {
  // Busca el formulario en el HTML por su ID.
  const form = document.getElementById('formRegistrarProducto');

  // Añade un "escuchador" que se activará cuando el usuario envíe el formulario.
  form.addEventListener('submit', async (event) => {
    // 1. Prevenir que la página se recargue (comportamiento por defecto del formulario).
    event.preventDefault();
    const submitButton = form.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    submitButton.textContent = 'Registrando...';

    try {
      // 2. Recolectar todos los datos del formulario.
      const formData = new FormData(form);
      const productoData = {
        nombre: formData.get('nombre'),
        marca: formData.get('marca'),
        descripcion: formData.get('descripcion'),
        precio: parseFloat(formData.get('precio')),
        stock: parseInt(formData.get('stock'), 10),
        disponible: true
      };
      
      // Obtener TODAS las imágenes seleccionadas por el usuario.
      const imagenFiles = formData.getAll('imagenes');

      // Validar que se haya seleccionado al menos una imagen.
      if (imagenFiles.length === 0 || imagenFiles[0].size === 0) {
        throw new Error("Debes seleccionar al menos una imagen.");
      }

      // --- INICIO DE LA SECUENCIA DE OPERACIONES ---

      // 3. Guardar primero los datos del producto para obtener su ID.
      console.log("Paso 1: Guardando la información del producto...");
      const productoGuardado = await guardarProducto(productoData);
      const nuevoProductoId = productoGuardado.id;
      console.log(`Producto creado con ID: ${nuevoProductoId}`);

      // 4. Subir y enlazar cada imagen, una por una.
      console.log(`Paso 2: Subiendo ${imagenFiles.length} imágenes...`);
      for (let i = 0; i < imagenFiles.length; i++) {
        const file = imagenFiles[i];
        console.log(` - Subiendo imagen ${i + 1}: ${file.name}`);
        
        // Sube la imagen actual.
        const imagenSubida = await subirImagen(file);
        
        // Define si es la imagen principal (solo la primera de la lista).
        const esImagenPrincipal = (i === 0);
        
        // Enlaza la imagen recién subida con el producto.
        console.log(` - Enlazando imagen ${i + 1} con el producto.`);
        await enlazarImagenProducto(nuevoProductoId, imagenSubida.Key, esImagenPrincipal);
      }
      
      // --- FIN DE LA SECUENCIA ---

      // 5. Si todo ha ido bien, mostrar un mensaje de éxito y limpiar el formulario.
      alert('¡Producto y sus imágenes han sido registrados con éxito!');
      form.reset();

    } catch (error) {
      // 6. Si algo falla en cualquier punto de la secuencia, se captura el error aquí.
      console.error("Ha ocurrido un error en el proceso:", error);
      alert(`Error: ${error.message}`);
    } finally {
      // 7. Se ejecuta siempre al final, para reactivar el botón de envío.
      submitButton.disabled = false;
      submitButton.textContent = 'Registrar Producto';
    }
  });
});