
// Obtener token de las cookies
const SUPABASE_BEARER_TOKEN = document.cookie.split('; ').find(row => row.startsWith('supabase_token='))?.split('=')[1];

console.log('🔧 ModificarProducto.js cargado');
console.log('Token disponible:', SUPABASE_BEARER_TOKEN ? 'Sí' : 'No');

/**
 * Obtiene los datos de un producto específico por ID
 * @param {number} productoId - ID del producto a obtener
 * @returns {Promise<object|null>} - Objeto con los datos del producto o null si hay error
 */
async function obtenerProductoPorId(productoId) {
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
    console.log(`🔍 Obteniendo producto ID: ${productoId}`);
    const response = await fetch(`${SUPABASE_URL}/rest/v1/productos?id=eq.${productoId}&select=*`, requestOptions);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error al obtener producto:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });

      if (response.status === 401) {
        console.error('🔐 JWT INVÁLIDO O EXPIRADO al obtener producto');
        throw new Error('Token de autenticación inválido. Inicia sesión nuevamente.');
      }

      throw new Error(`Error al obtener producto: ${response.status} - ${response.statusText}`);
    }
    
    const productos = await response.json();
    
    if (productos.length === 0) {
      console.warn(`⚠️ No se encontró producto con ID: ${productoId}`);
      return null;
    }
    
    const producto = productos[0];
    console.log('✅ Producto obtenido:', producto);
    return producto;
    
  } catch (error) {
    console.error('💥 Error al obtener producto por ID:', error.message);
    throw error;
  }
}

/**
 * Modifica un producto existente en la base de datos
 * @param {number} productoId - ID del producto a modificar
 * @param {object} datosActualizados - Objeto con los nuevos datos del producto
 * @returns {Promise<boolean>} - true si se modificó exitosamente, false si hubo error
 */
async function modificarProducto(productoId, datosActualizados) {
  // Verificar autenticación
  if (!SUPABASE_BEARER_TOKEN) {
    console.error('🔐 No hay token de autenticación disponible');
    throw new Error('Debes iniciar sesión para modificar productos.');
  }

  const myHeaders = new Headers();
  myHeaders.append("apikey", SUPABASE_API_KEY);
  myHeaders.append("Authorization", `Bearer ${SUPABASE_BEARER_TOKEN}`);
  myHeaders.append("Content-Type", "application/json");

  // Validar y limpiar los datos
  const datosLimpios = {
    nombre: datosActualizados.nombre?.trim(),
    marca: datosActualizados.marca?.trim(),
    descripcion: datosActualizados.descripcion?.trim(),
    precio: parseFloat(datosActualizados.precio),
    stock: parseInt(datosActualizados.stock, 10),
    disponible: Boolean(datosActualizados.disponible)
  };

  // Validaciones básicas
  if (!datosLimpios.nombre || datosLimpios.nombre.length < 2) {
    throw new Error('El nombre del producto debe tener al menos 2 caracteres.');
  }
  if (!datosLimpios.marca || datosLimpios.marca.length < 2) {
    throw new Error('La marca debe tener al menos 2 caracteres.');
  }
  if (isNaN(datosLimpios.precio) || datosLimpios.precio < 0) {
    throw new Error('El precio debe ser un número válido mayor o igual a 0.');
  }
  if (isNaN(datosLimpios.stock) || datosLimpios.stock < 0) {
    throw new Error('El stock debe ser un número entero mayor o igual a 0.');
  }

  const requestOptions = {
    method: "PATCH",
    headers: myHeaders,
    body: JSON.stringify(datosLimpios),
    redirect: "follow"
  };

  try {
    console.log(`🔄 Modificando producto ID: ${productoId}`);
    console.log('📝 Datos a actualizar:', datosLimpios);

    const response = await fetch(`${SUPABASE_URL}/rest/v1/productos?id=eq.${productoId}`, requestOptions);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error al modificar producto:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });

      if (response.status === 401) {
        console.error('🔐 JWT INVÁLIDO O EXPIRADO al modificar producto');
        throw new Error('Token de autenticación inválido. Inicia sesión nuevamente.');
      }
      
      if (response.status === 404) {
        console.error('🔍 Producto no encontrado para modificar');
        throw new Error('El producto que intentas modificar no existe.');
      }

      throw new Error(`Error al modificar producto: ${response.status} - ${response.statusText}`);
    }
    
    console.log('✅ Producto modificado exitosamente');
    return true;
    
  } catch (error) {
    console.error('💥 Error al modificar producto:', error.message);
    throw error;
  }
}

/**
 * Carga los datos de un producto en el formulario de edición
 * @param {number} productoId - ID del producto a cargar
 */
async function cargarProductoEnFormulario(productoId) {
  try {
    console.log(`📋 Cargando producto ${productoId} en formulario`);
    
    // Mostrar indicador de carga en el modal
    mostrarIndicadorCarga(true);
    
    const producto = await obtenerProductoPorId(productoId);
    
    if (!producto) {
      throw new Error('No se pudo obtener los datos del producto.');
    }

    // Buscar el formulario con múltiples estrategias
    const form = obtenerFormularioModal();
    if (!form) {
      throw new Error('No se encontró el formulario en el modal');
    }

    console.log('📝 Llenando campos del formulario...');
    
    // Estrategia múltiple para encontrar y llenar campos
    const camposLlenados = llenarCamposFormulario(form, producto);
    
    // Cambiar el título del modal para indicar edición
    actualizarTituloModal(producto.nombre);
    
    // Guardar información del producto en el formulario
    form.setAttribute('data-producto-id', productoId);
    form.setAttribute('data-producto-nombre', producto.nombre);
    
    // Ocultar indicador de carga
    mostrarIndicadorCarga(false);
    
    console.log('✅ Producto cargado exitosamente en el formulario');
    console.log(`📊 Campos llenados: ${camposLlenados.exitosos}/${camposLlenados.total}`);
    
    // Mostrar resumen de datos cargados
    mostrarResumenDatosCargados(producto, camposLlenados);
    
  } catch (error) {
    console.error('💥 Error al cargar producto en formulario:', error.message);
    mostrarIndicadorCarga(false);
    
    // Mostrar error detallado al usuario
    mostrarErrorCarga(error.message, productoId);
  }
}

/**
 * Obtiene el formulario del modal con múltiples estrategias
 * @returns {HTMLElement|null} - El formulario encontrado o null
 */
function obtenerFormularioModal() {
  // Estrategia 1: Por ID específico
  let form = document.getElementById('formRegistrarProducto');
  if (form) {
    console.log('✅ Formulario encontrado por ID: formRegistrarProducto');
    return form;
  }
  
  // Estrategia 2: Buscar en el modal de edición
  const modal = document.getElementById('modalEditarProducto');
  if (modal) {
    form = modal.querySelector('form');
    if (form) {
      console.log('✅ Formulario encontrado dentro del modal');
      return form;
    }
  }
  
  // Estrategia 3: Buscar por clase
  form = document.querySelector('.product-form');
  if (form) {
    console.log('✅ Formulario encontrado por clase: product-form');
    return form;
  }
  
  // Estrategia 4: Buscar cualquier formulario en modales
  const todosLosModales = document.querySelectorAll('[id*="modal"], [class*="modal"]');
  for (const modalElement of todosLosModales) {
    form = modalElement.querySelector('form');
    if (form) {
      console.log('✅ Formulario encontrado en modal:', modalElement.id);
      return form;
    }
  }
  
  console.error('❌ No se pudo encontrar el formulario del modal');
  return null;
}

/**
 * Llena los campos del formulario con los datos del producto
 * @param {HTMLElement} form - El formulario a llenar
 * @param {Object} producto - Los datos del producto
 * @returns {Object} - Estadísticas de campos llenados
 */
function llenarCamposFormulario(form, producto) {
  const estadisticas = { total: 0, exitosos: 0, fallidos: [] };
  
  // Mapeo de campos con múltiples estrategias de búsqueda
  const mapeosCampos = [
    {
      campo: 'nombre',
      valor: producto.nombre,
      selectores: ['[name="nombre"]', '#productName', '[id*="name"]', '[placeholder*="nombre"]']
    },
    {
      campo: 'marca',
      valor: producto.marca,
      selectores: ['[name="marca"]', '#productBrand', '[id*="brand"]', '[placeholder*="marca"]']
    },
    {
      campo: 'descripcion',
      valor: producto.descripcion,
      selectores: ['[name="descripcion"]', '#productDescription', '[id*="description"]', 'textarea']
    },
    {
      campo: 'precio',
      valor: producto.precio,
      selectores: ['[name="precio"]', '#productPrice', '[id*="price"]', '[type="number"]']
    },
    {
      campo: 'stock',
      valor: producto.stock,
      selectores: ['[name="stock"]', '#productStock', '[id*="stock"]', '[placeholder*="stock"]']
    }
  ];
  
  mapeosCampos.forEach(mapeo => {
    estadisticas.total++;
    let campoEncontrado = false;
    
    // Intentar cada selector hasta encontrar el campo
    for (const selector of mapeo.selectores) {
      const input = form.querySelector(selector);
      if (input && !campoEncontrado) {
        try {
          // Limpiar el campo primero
          input.value = '';
          
          // Asignar el valor
          input.value = mapeo.valor || '';
          
          // Disparar evento change para formularios reactivos
          input.dispatchEvent(new Event('change', { bubbles: true }));
          input.dispatchEvent(new Event('input', { bubbles: true }));
          
          console.log(`✅ Campo ${mapeo.campo} llenado: "${mapeo.valor}" (${selector})`);
          estadisticas.exitosos++;
          campoEncontrado = true;
          
          // Agregar clase visual para indicar que se llenó
          input.classList.add('campo-cargado');
          setTimeout(() => input.classList.remove('campo-cargado'), 2000);
          
        } catch (error) {
          console.warn(`⚠️ Error al llenar ${mapeo.campo}:`, error.message);
        }
      }
    }
    
    if (!campoEncontrado) {
      console.warn(`⚠️ No se encontró el campo: ${mapeo.campo}`);
      estadisticas.fallidos.push(mapeo.campo);
    }
  });
  
  return estadisticas;
}

/**
 * Muestra u oculta el indicador de carga en el modal
 * @param {boolean} mostrar - true para mostrar, false para ocultar
 */
function mostrarIndicadorCarga(mostrar) {
  const modal = document.getElementById('modalEditarProducto');
  if (!modal) return;
  
  // Remover indicador existente
  const indicadorExistente = modal.querySelector('.indicador-carga');
  if (indicadorExistente) {
    indicadorExistente.remove();
  }
  
  if (mostrar) {
    // Crear y mostrar indicador de carga
    const indicador = document.createElement('div');
    indicador.className = 'indicador-carga';
    indicador.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(0,0,0,0.8);
      color: white;
      padding: 20px;
      border-radius: 8px;
      z-index: 1000;
      text-align: center;
      font-family: Arial, sans-serif;
    `;
    indicador.innerHTML = `
      <div style="font-size: 18px; margin-bottom: 10px;">🔄 Cargando datos...</div>
      <div style="font-size: 14px; opacity: 0.8;">Obteniendo información del producto</div>
    `;
    
    modal.appendChild(indicador);
  }
}

/**
 * Actualiza el título del modal para mostrar que se está editando
 * @param {string} nombreProducto - Nombre del producto que se está editando
 */
function actualizarTituloModal(nombreProducto) {
  const modal = document.getElementById('modalEditarProducto');
  if (!modal) return;
  
  const titulo = modal.querySelector('h1, h2, h3, .modal-title, [class*="title"]');
  if (titulo) {
    titulo.textContent = `Editando: ${nombreProducto}`;
    titulo.style.color = '#2563eb';
  }
}

/**
 * Muestra un resumen de los datos cargados en la consola
 * @param {Object} producto - Los datos del producto
 * @param {Object} estadisticas - Estadísticas de carga
 */
function mostrarResumenDatosCargados(producto, estadisticas) {
  console.log('📋 RESUMEN DE DATOS CARGADOS:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📦 Producto: ${producto.nombre}`);
  console.log(`🏢 Marca: ${producto.marca}`);
  console.log(`💰 Precio: S/ ${producto.precio}`);
  console.log(`📦 Stock: ${producto.stock} unidades`);
  console.log(`📝 Descripción: ${producto.descripcion ? producto.descripcion.substring(0, 50) + '...' : 'Sin descripción'}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`✅ Campos cargados: ${estadisticas.exitosos}/${estadisticas.total}`);
  if (estadisticas.fallidos.length > 0) {
    console.log(`❌ Campos no encontrados: ${estadisticas.fallidos.join(', ')}`);
  }
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

/**
 * Muestra un error detallado cuando falla la carga
 * @param {string} mensaje - Mensaje de error
 * @param {number} productoId - ID del producto que falló
 */
function mostrarErrorCarga(mensaje, productoId) {
  const errorDetallado = `
🚨 ERROR AL CARGAR PRODUCTO ${productoId}

❌ Problema: ${mensaje}

💡 Posibles soluciones:
• Verifica que estés conectado a internet
• Asegúrate de estar logueado correctamente
• Recarga la página e intenta nuevamente
• Si persiste, contacta al administrador

🔧 Información técnica:
• ID del producto: ${productoId}
• Timestamp: ${new Date().toLocaleString()}
• Token disponible: ${SUPABASE_BEARER_TOKEN ? 'Sí' : 'No'}
  `;
  
  console.error(errorDetallado);
  
  // Mostrar alerta amigable al usuario
  alert(`Error al cargar los datos del producto.\n\n${mensaje}\n\nPor favor, intenta nuevamente o recarga la página.`);
}

/**
 * Función global para abrir el modal de edición y cargar los datos del producto
 * @param {number} productoId - ID del producto a editar
 */
window.editarProductoModal = function(productoId) {
  console.log('🎯 Iniciando edición de producto ID:', productoId);
  
  // Validar que se proporcionó un ID válido
  if (!productoId || isNaN(productoId)) {
    console.error('❌ ID de producto inválido:', productoId);
    alert('Error: ID de producto inválido');
    return;
  }
  
  // Verificar que el token esté disponible
  if (!SUPABASE_BEARER_TOKEN) {
    console.error('❌ No hay token de autenticación disponible');
    alert('Error: Debes iniciar sesión para editar productos.\n\nPor favor, inicia sesión e intenta nuevamente.');
    return;
  }
  
  // Buscar y abrir el modal
  const modal = abrirModalEdicion();
  if (!modal) return;
  
  // Preparar el modal para la edición
  prepararModalParaEdicion(modal);
  
  // Cargar los datos del producto en el formulario
  cargarProductoEnFormulario(productoId)
    .then(() => {
      console.log('🎉 Modal de edición preparado exitosamente');
      
      // Enfocar el primer campo del formulario
      enfocarPrimerCampo();
      
      // Configurar eventos especiales para este modal
      configurarEventosModal(modal, productoId);
    })
    .catch(error => {
      console.error('💥 Error al preparar modal:', error.message);
      
      // Si falla la carga, mantener el modal abierto pero limpiar el formulario
      limpiarFormularioModal();
      alert(`No se pudieron cargar los datos del producto.\n\nPuedes editarlo manualmente o cerrar el modal e intentar nuevamente.`);
    });
};

/**
 * Abre el modal de edición con verificaciones
 * @returns {HTMLElement|null} - El modal abierto o null si falla
 */
function abrirModalEdicion() {
  // Buscar el modal con múltiples estrategias
  let modal = document.getElementById('modalEditarProducto');
  
  if (!modal) {
    // Buscar por clase o atributo
    modal = document.querySelector('[id*="modal"][id*="editar"]') || 
            document.querySelector('.modal[id*="producto"]') ||
            document.querySelector('[class*="modal"][class*="editar"]');
  }
  
  if (!modal) {
    console.error('❌ No se encontró el modal de edición');
    alert('Error: No se encontró el modal de edición.\n\nVerifica que la página esté cargada correctamente.');
    return null;
  }
  
  // Abrir el modal
  modal.style.display = 'flex';
  modal.style.visibility = 'visible';
  modal.style.opacity = '1';
  
  // Agregar clase activa si existe
  modal.classList.add('modal-activo', 'editando-producto');
  
  console.log('✅ Modal de edición abierto:', modal.id);
  return modal;
}

/**
 * Prepara el modal para la edición
 * @param {HTMLElement} modal - El modal a preparar
 */
function prepararModalParaEdicion(modal) {
  // Restaurar el título original si fue modificado
  const titulo = modal.querySelector('h1, h2, h3, .modal-title, [class*="title"]');
  if (titulo && !titulo.textContent.includes('Editando:')) {
    titulo.setAttribute('data-titulo-original', titulo.textContent);
  }
  
  // Limpiar mensajes de error anteriores
  const erroresAnteriores = modal.querySelectorAll('.error-mensaje, .alert-error');
  erroresAnteriores.forEach(error => error.remove());
  
  // Limpiar clases de error en campos
  const camposConError = modal.querySelectorAll('.campo-error, .input-error');
  camposConError.forEach(campo => {
    campo.classList.remove('campo-error', 'input-error');
  });
  
  // Agregar indicador visual de que está en modo edición
  modal.setAttribute('data-modo', 'edicion');
  
  console.log('✅ Modal preparado para edición');
}

/**
 * Enfoca el primer campo editable del formulario
 */
function enfocarPrimerCampo() {
  const form = obtenerFormularioModal();
  if (!form) return;
  
  const primerCampo = form.querySelector('input[type="text"], input[name="nombre"], #productName');
  if (primerCampo) {
    setTimeout(() => {
      primerCampo.focus();
      primerCampo.select();
    }, 100);
  }
}

/**
 * Configura eventos especiales para el modal durante la edición
 * @param {HTMLElement} modal - El modal
 * @param {number} productoId - ID del producto
 */
function configurarEventosModal(modal, productoId) {
  // Evento para cerrar con Escape
  const manejarEscape = (e) => {
    if (e.key === 'Escape') {
      cerrarModalConConfirmacion(modal, productoId);
      document.removeEventListener('keydown', manejarEscape);
    }
  };
  
  document.addEventListener('keydown', manejarEscape);
  
  // Agregar indicador de producto siendo editado
  modal.setAttribute('data-editando-producto', productoId);
  
  // Configurar auto-guardado cada 30 segundos (opcional)
  configurarAutoGuardado(productoId);
}

/**
 * Cierra el modal con confirmación si hay cambios
 * @param {HTMLElement} modal - El modal
 * @param {number} productoId - ID del producto
 */
function cerrarModalConConfirmacion(modal, productoId) {
  const form = obtenerFormularioModal();
  if (!form) {
    modal.style.display = 'none';
    return;
  }
  
  // Verificar si hay cambios no guardados
  const hayChangios = verificarCambiosNoGuardados(form);
  
  if (hayChangios) {
    const confirmar = confirm('Hay cambios sin guardar.\n\n¿Estás seguro de que quieres cerrar sin guardar?');
    if (!confirmar) return;
  }
  
  // Limpiar estado del modal
  modal.style.display = 'none';
  modal.classList.remove('modal-activo', 'editando-producto');
  modal.removeAttribute('data-editando-producto');
  modal.removeAttribute('data-modo');
  
  console.log('✅ Modal cerrado');
}

/**
 * Verifica si hay cambios no guardados en el formulario
 * @param {HTMLElement} form - El formulario
 * @returns {boolean} - true si hay cambios
 */
function verificarCambiosNoGuardados(form) {
  // Esta función puede ser mejorada comparando con datos originales
  // Por ahora, retorna false para simplificar
  return false;
}

/**
 * Limpia el formulario del modal
 */
function limpiarFormularioModal() {
  const form = obtenerFormularioModal();
  if (form) {
    form.reset();
    form.removeAttribute('data-producto-id');
    form.removeAttribute('data-producto-nombre');
    
    // Limpiar clases especiales
    const campos = form.querySelectorAll('input, textarea, select');
    campos.forEach(campo => {
      campo.classList.remove('campo-cargado', 'campo-error');
    });
    
    console.log('✅ Formulario limpiado');
  }
}

/**
 * Configura auto-guardado para evitar pérdida de datos
 * @param {number} productoId - ID del producto
 */
function configurarAutoGuardado(productoId) {
  // Implementación opcional: guardar borradores cada 30 segundos
  // Por ahora, solo registramos la intención
  console.log(`💾 Auto-guardado configurado para producto ${productoId}`);
}

/**
 * Configura el evento de envío del formulario de modificación
 */
function configurarFormularioModificacion() {
  const form = document.getElementById('formRegistrarProducto');
  
  if (!form) {
    console.warn('⚠️ Formulario de modificación no encontrado');
    return;
  }

  // Eliminar listeners anteriores para evitar duplicados
  const newForm = form.cloneNode(true);
  form.parentNode.replaceChild(newForm, form);

  newForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    
    const submitButton = newForm.querySelector('button[type="submit"]');
    const productoId = newForm.getAttribute('data-producto-id');
    
    if (!productoId) {
      alert('Error: No se ha especificado qué producto modificar.');
      return;
    }

    // Deshabilitar botón y cambiar texto
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = 'Actualizando...';
    }

    try {
      // Recopilar datos del formulario
      const formData = new FormData(newForm);
      const datosActualizados = {
        nombre: formData.get('nombre'),
        marca: formData.get('marca'),
        descripcion: formData.get('descripcion'),
        precio: formData.get('precio'),
        stock: formData.get('stock'),
        disponible: true // Por defecto siempre disponible
      };

      // Modificar el producto
      const exito = await modificarProducto(parseInt(productoId), datosActualizados);
      
      if (exito) {
        // Mostrar notificación de éxito en lugar de alert
        mostrarNotificacionExito(`¡Producto "${datosActualizados.nombre}" actualizado exitosamente!`);
        
        // Cerrar el modal después de un breve delay
        setTimeout(() => {
          const modal = document.getElementById('modalEditarProducto');
          if (modal) {
            modal.style.display = 'none';
            modal.classList.remove('modal-activo', 'editando-producto');
          }
        }, 1000);
        
        // Recargar la lista de productos si la función existe
        if (typeof renderizarProductosAdmin === 'function') {
          setTimeout(() => renderizarProductosAdmin(), 1200);
        } else {
          // Recargar la página si no hay función de recarga
          setTimeout(() => window.location.reload(), 2000);
        }
      }
      
    } catch (error) {
      console.error('💥 Error en el envío del formulario:', error.message);
      alert(`Error: ${error.message}`);
    } finally {
      // Rehabilitar botón
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = 'Actualizar Producto';
      }
    }
  });

  console.log('✅ Formulario de modificación configurado');
}

// Configurar el formulario cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
  configurarFormularioModificacion();
});

// También configurar si el DOM ya está cargado
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', configurarFormularioModificacion);
} else {
  configurarFormularioModificacion();
}

console.log('🎉 ModificarProducto.js inicializado correctamente');

/**
 * Agrega estilos CSS dinámicos para mejorar la experiencia visual
 */
function agregarEstilosVisuales() {
  // Verificar si ya se agregaron los estilos
  if (document.getElementById('estilos-modificar-producto')) return;
  
  const estilos = document.createElement('style');
  estilos.id = 'estilos-modificar-producto';
  estilos.textContent = `
    /* Animación para campos que se cargan */
    .campo-cargado {
      animation: campo-llenado 0.5s ease-in-out;
      border-left: 4px solid #10b981 !important;
    }
    
    @keyframes campo-llenado {
      0% { background-color: #f0f9ff; }
      50% { background-color: #dbeafe; }
      100% { background-color: transparent; }
    }
    
    /* Indicador de carga mejorado */
    .indicador-carga {
      backdrop-filter: blur(4px);
      animation: pulse-carga 1.5s infinite;
    }
    
    @keyframes pulse-carga {
      0%, 100% { opacity: 0.8; }
      50% { opacity: 1; }
    }
    
    /* Modal en modo edición */
    .modal-activo.editando-producto {
      border-top: 4px solid #3b82f6;
    }
    
    .modal-activo.editando-producto .form-container {
      box-shadow: 0 0 20px rgba(59, 130, 246, 0.1);
    }
    
    /* Título del modal en modo edición */
    .modal-activo.editando-producto h1,
    .modal-activo.editando-producto h2,
    .modal-activo.editando-producto .modal-title {
      color: #1e40af !important;
      position: relative;
    }
    
    .modal-activo.editando-producto h1::before,
    .modal-activo.editando-producto h2::before,
    .modal-activo.editando-producto .modal-title::before {
      content: "✏️ ";
      margin-right: 8px;
    }
    
    /* Campos del formulario con mejor feedback */
    .modal-activo.editando-producto input,
    .modal-activo.editando-producto textarea {
      transition: all 0.3s ease;
    }
    
    .modal-activo.editando-producto input:focus,
    .modal-activo.editando-producto textarea:focus {
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }
    
    /* Botón de actualizar con estado mejorado */
    .modal-activo.editando-producto .submit-btn {
      background: linear-gradient(135deg, #3b82f6, #1d4ed8);
      position: relative;
      overflow: hidden;
    }
    
    .modal-activo.editando-producto .submit-btn:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
    }
    
    .modal-activo.editando-producto .submit-btn:disabled {
      background: #9ca3af;
      cursor: not-allowed;
      transform: none;
    }
    
    /* Indicador de campo requerido */
    .modal-activo.editando-producto [required]::after {
      content: " *";
      color: #ef4444;
    }
    
    /* Animación suave para la apertura del modal */
    .modal-activo {
      animation: modal-aparecer 0.3s ease-out;
    }
    
    @keyframes modal-aparecer {
      from {
        opacity: 0;
        transform: scale(0.95);
      }
      to {
        opacity: 1;
        transform: scale(1);
      }
    }
    
    /* Notificación de éxito */
    .notificacion-exito {
      position: fixed;
      top: 20px;
      right: 20px;
      background: #10b981;
      color: white;
      padding: 16px 24px;
      border-radius: 8px;
      box-shadow: 0 8px 25px rgba(16, 185, 129, 0.3);
      z-index: 10000;
      animation: notif-aparecer 0.3s ease-out;
    }
    
    @keyframes notif-aparecer {
      from {
        opacity: 0;
        transform: translateX(100%);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }
  `;
  
  document.head.appendChild(estilos);
  console.log('✅ Estilos visuales agregados');
}

/**
 * Muestra una notificación de éxito
 * @param {string} mensaje - Mensaje a mostrar
 */
function mostrarNotificacionExito(mensaje) {
  const notificacion = document.createElement('div');
  notificacion.className = 'notificacion-exito';
  notificacion.innerHTML = `
    <div style="display: flex; align-items: center; gap: 8px;">
      <span style="font-size: 20px;">✅</span>
      <span>${mensaje}</span>
    </div>
  `;
  
  document.body.appendChild(notificacion);
  
  // Remover después de 3 segundos
  setTimeout(() => {
    notificacion.style.animation = 'notif-aparecer 0.3s ease-out reverse';
    setTimeout(() => notificacion.remove(), 300);
  }, 3000);
}

/**
 * Función para cargar datos completos desde Supabase sin abrir el modal
 * Útil cuando ya tenemos el modal abierto con datos básicos del DOM
 */
window.cargarDatosProductoDesdeSupabase = async function(productoId) {
  console.log('🔄 Cargando datos completos desde Supabase para ID:', productoId);
  
  try {
    // Mostrar indicador de carga en el formulario
    const form = document.getElementById('formRegistrarProducto');
    if (form) {
      mostrarIndicadorCarga(form, 'Cargando datos completos...');
    }

    // Obtener token de autenticación
    const token = obtenerTokenDeAuth();
    if (!token) {
      console.warn('⚠️ No hay token de autenticación, usando solo datos del DOM');
      ocultarIndicadorCarga();
      return;
    }

    // Configurar headers para Supabase
    const headers = {
      'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ4bXVidWNsZWJtcGRicWRwdWl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ2NjE0MDMsImV4cCI6MjA1MDIzNzQwM30.hP6WUXBqpC0jcJP4lTGWKqhvKkZQfYlTAL3vx_8PFFI',
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    // Hacer petición a Supabase
    const response = await fetch(
      `https://fxmubuclebmgdbqdpuiw.supabase.co/rest/v1/productos?id=eq.${productoId}&select=*`,
      {
        method: 'GET',
        headers: headers
      }
    );

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    const productos = await response.json();
    
    if (productos.length === 0) {
      console.warn('⚠️ Producto no encontrado en Supabase, manteniendo datos del DOM');
      ocultarIndicadorCarga();
      return;
    }

    const producto = productos[0];
    console.log('✅ Datos completos obtenidos de Supabase:', producto);

    // Llenar todos los campos del formulario con datos completos
    llenarTodosLosCamposDelFormulario(producto);
    
    ocultarIndicadorCarga();
    
    // Mostrar notificación de éxito
    mostrarNotificacion('Datos del producto cargados completamente', 'success');

  } catch (error) {
    console.error('❌ Error al cargar datos desde Supabase:', error);
    ocultarIndicadorCarga();
    mostrarNotificacion('No se pudieron cargar todos los datos. Usando información disponible.', 'warning');
  }
};

/**
 * Función auxiliar para llenar todos los campos del formulario
 */
function llenarTodosLosCamposDelFormulario(producto) {
  try {
    const campos = {
      'nombreProducto': producto.nombre,
      'marcaProducto': producto.marca,
      'descripcionProducto': producto.descripcion,
      'precioProducto': producto.precio,
      'stockProducto': producto.stock,
      'disponibleProducto': producto.disponible
    };

    // Llenar campos de texto
    Object.keys(campos).forEach(fieldId => {
      const field = document.getElementById(fieldId);
      if (field) {
        if (field.type === 'checkbox') {
          field.checked = Boolean(campos[fieldId]);
        } else {
          field.value = campos[fieldId] || '';
        }
        
        // Agregar efecto visual
        if (campos[fieldId]) {
          field.style.borderColor = '#28a745';
          setTimeout(() => {
            field.style.borderColor = '';
          }, 2000);
        }
      }
    });

    console.log('✅ Todos los campos llenados con datos de Supabase');

  } catch (error) {
    console.error('❌ Error al llenar campos del formulario:', error);
  }
}
