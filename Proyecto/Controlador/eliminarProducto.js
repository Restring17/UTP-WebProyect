
function obtenerTokenDeAuth() {
  try {
    const token = document.cookie
      .split('; ')
      .find(row => row.startsWith('supabase_token='))
      ?.split('=')[1];
    
    if (!token) {
      console.warn('⚠️ No se encontró token de autenticación en las cookies');
      return null;
    }
    
    console.log('✅ Token de autenticación encontrado');
    return token;
  } catch (error) {
    console.error('❌ Error al obtener token de autenticación:', error);
    return null;
  }
}

/**
 * Extrae el nombre del producto desde el DOM para mostrarlo en mensajes
 */
function obtenerNombreProductoDelDOM(productoId) {
  try {
    const contenedorProducto = document.querySelector(`[data-producto-id="${productoId}"].productos`);
    if (contenedorProducto) {
      const nombre = contenedorProducto.getAttribute('data-producto-nombre') || 
                    contenedorProducto.querySelector('.nombre p')?.textContent?.trim();
      return nombre || `Producto ID: ${productoId}`;
    }
    return `Producto ID: ${productoId}`;
  } catch (error) {
    console.error('❌ Error al obtener nombre del producto:', error);
    return `Producto ID: ${productoId}`;
  }
}

/**
 * Muestra notificaciones al usuario
 */
function mostrarNotificacionEliminar(mensaje, tipo = 'info', duracion = 5000) {
  try {
    // Remover notificación anterior si existe
    const notificacionAnterior = document.getElementById('notificacion-eliminar');
    if (notificacionAnterior) {
      notificacionAnterior.remove();
    }

    // Crear nueva notificación
    const notificacion = document.createElement('div');
    notificacion.id = 'notificacion-eliminar';
    notificacion.textContent = mensaje;
    
    const colores = {
      'success': { bg: '#d4edda', color: '#155724', border: '#c3e6cb' },
      'warning': { bg: '#fff3cd', color: '#856404', border: '#ffeaa7' },
      'error': { bg: '#f8d7da', color: '#721c24', border: '#f5c6cb' },
      'info': { bg: '#d1ecf1', color: '#0c5460', border: '#bee5eb' }
    };

    const estilo = colores[tipo] || colores.info;
    
    notificacion.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background-color: ${estilo.bg};
      color: ${estilo.color};
      border: 1px solid ${estilo.border};
      padding: 15px 20px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 10000;
      max-width: 400px;
      animation: slideInRight 0.3s ease-out;
    `;

    // Agregar estilos de animación si no existen
    if (!document.getElementById('notificacion-styles')) {
      const styles = document.createElement('style');
      styles.id = 'notificacion-styles';
      styles.textContent = `
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOutRight {
          from { transform: translateX(0); opacity: 1; }
          to { transform: translateX(100%); opacity: 0; }
        }
      `;
      document.head.appendChild(styles);
    }

    document.body.appendChild(notificacion);
    
    // Auto-remover después del tiempo especificado
    setTimeout(() => {
      if (notificacion && notificacion.parentNode) {
        notificacion.style.animation = 'slideOutRight 0.3s ease-in';
        setTimeout(() => notificacion.remove(), 300);
      }
    }, duracion);

  } catch (error) {
    console.error('❌ Error al mostrar notificación:', error);
    // Fallback con alert
    alert(mensaje);
  }
}

/**
 * Muestra indicador de carga en el modal
 */
function mostrarIndicadorCargaEliminar(mostrar = true) {
  try {
    const botonEliminar = document.getElementById('confirmarEliminar');
    const botonCancelar = document.getElementById('cancelarEliminar');
    
    if (mostrar) {
      if (botonEliminar) {
        botonEliminar.disabled = true;
        botonEliminar.innerHTML = `
          <span style="display: inline-flex; align-items: center; gap: 8px;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" style="animation: spin 1s linear infinite;">
              <circle cx="12" cy="12" r="10"/>
              <path d="m12 6 0 6 4 4"/>
            </svg>
            Eliminando...
          </span>
        `;
      }
      if (botonCancelar) {
        botonCancelar.disabled = true;
      }
    } else {
      if (botonEliminar) {
        botonEliminar.disabled = false;
        botonEliminar.textContent = 'Eliminar';
      }
      if (botonCancelar) {
        botonCancelar.disabled = false;
      }
    }

    // Agregar estilos de animación de carga si no existen
    if (!document.getElementById('loading-styles')) {
      const styles = document.createElement('style');
      styles.id = 'loading-styles';
      styles.textContent = `
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `;
      document.head.appendChild(styles);
    }

  } catch (error) {
    console.error('❌ Error al mostrar indicador de carga:', error);
  }
}

/**
 * Actualiza el contenido del modal con información del producto
 */
function actualizarModalConInfoProducto(productoId) {
  try {
    const nombreProducto = obtenerNombreProductoDelDOM(productoId);
    const textoConfirmacion = document.querySelector('#modalEliminarProducto .confirm-text');
    
    if (textoConfirmacion) {
      textoConfirmacion.innerHTML = `
        Esta acción no se puede deshacer. ¿Seguro que deseas eliminar el producto 
        <strong>"${nombreProducto}"</strong>?
      `;
    }
  } catch (error) {
    console.error('❌ Error al actualizar modal:', error);
  }
}

// =======================================================
// FUNCIÓN PRINCIPAL DE ELIMINACIÓN
// =======================================================

/**
 * Elimina un producto de Supabase
 * @param {number} productoId - ID del producto a eliminar
 * @returns {Promise<boolean>} - true si se eliminó exitosamente, false en caso contrario
 */
async function eliminarProductoDeSupabase(productoId) {
  console.log('🗑️ Iniciando eliminación de producto ID:', productoId);

  try {
    // 1. Mostrar indicador de carga
    mostrarIndicadorCargaEliminar(true);

    // 2. Obtener token de autenticación
    const token = obtenerTokenDeAuth();
    if (!token) {
      throw new Error('No se encontró token de autenticación. Por favor, inicia sesión nuevamente.');
    }

    // 3. Obtener nombre del producto para mensajes
    const nombreProducto = obtenerNombreProductoDelDOM(productoId);

    // 4. Configurar headers para la petición
    const myHeaders = new Headers();
    myHeaders.append("apikey", SUPABASE_API_KEY);
    myHeaders.append("Authorization", `Bearer ${token}`);
    myHeaders.append("Content-Type", "application/json");

    // 5. Configurar opciones de la petición
    const requestOptions = {
      method: "DELETE",
      headers: myHeaders,
      redirect: "follow"
    };

    // 6. Realizar petición DELETE a Supabase
    console.log('📡 Enviando petición DELETE a Supabase...');
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/productos?id=eq.${productoId}`,
      requestOptions
    );

    // 7. Verificar respuesta
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error en la respuesta de Supabase:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });

      // Manejo de errores específicos
      if (response.status === 401) {
        throw new Error('Token de autenticación inválido o expirado. Por favor, inicia sesión nuevamente.');
      } else if (response.status === 403) {
        throw new Error('No tienes permisos para eliminar este producto.');
      } else if (response.status === 404) {
        throw new Error('El producto no fue encontrado o ya fue eliminado.');
      } else {
        throw new Error(`Error del servidor: ${response.status} - ${response.statusText}`);
      }
    }

    // 8. Verificar si se eliminó algo
    const result = await response.text();
    console.log('✅ Respuesta de Supabase:', result);

    // 9. Ocultar indicador de carga
    mostrarIndicadorCargaEliminar(false);

    // 10. Mostrar notificación de éxito
    mostrarNotificacionEliminar(
      `✅ Producto "${nombreProducto}" eliminado exitosamente`,
      'success'
    );

    console.log(`✅ Producto ${productoId} eliminado exitosamente`);
    return true;

  } catch (error) {
    console.error('❌ Error al eliminar producto:', error);
    
    // Ocultar indicador de carga
    mostrarIndicadorCargaEliminar(false);
    
    // Mostrar notificación de error
    mostrarNotificacionEliminar(
      `❌ Error al eliminar producto: ${error.message}`,
      'error',
      8000
    );

    return false;
  }
}

/**
 * Elimina el elemento del producto del DOM
 */
function eliminarProductoDelDOM(productoId) {
  try {
    const contenedorProducto = document.querySelector(`[data-producto-id="${productoId}"].productos`);
    if (contenedorProducto) {
      // Agregar animación de salida
      contenedorProducto.style.animation = 'fadeOut 0.5s ease-out';
      
      setTimeout(() => {
        contenedorProducto.remove();
        console.log('✅ Producto eliminado del DOM');
        
        // Verificar si quedan productos
        const productosRestantes = document.querySelectorAll('.productos[data-producto-id]');
        if (productosRestantes.length === 0) {
          const container = document.getElementById('productos-container');
          if (container) {
            container.innerHTML = '<p>No se encontraron productos</p>';
          }
        }
      }, 500);
    }
  } catch (error) {
    console.error('❌ Error al eliminar producto del DOM:', error);
  }
}

// =======================================================
// FUNCIÓN PRINCIPAL EXPUESTA GLOBALMENTE
// =======================================================

/**
 * Función principal para eliminar producto (llamada desde el HTML)
 * @param {number} productoId - ID del producto a eliminar
 */
window.confirmarEliminacionProducto = async function(productoId) {
  console.log('🔄 Confirmando eliminación de producto ID:', productoId);

  try {
    // 1. Eliminar de Supabase
    const eliminadoExitosamente = await eliminarProductoDeSupabase(productoId);

    if (eliminadoExitosamente) {
      // 2. Eliminar del DOM
      eliminarProductoDelDOM(productoId);

      // 3. Cerrar modal
      const modal = document.getElementById('modalEliminarProducto');
      if (modal) {
        modal.style.display = 'none';
      }

      // 4. Limpiar variable global
      if (typeof window.productoIdAEliminar !== 'undefined') {
        window.productoIdAEliminar = null;
      }

      // 5. Opcional: Recargar la lista completa desde el servidor
      // Si quieres asegurar sincronización completa, descomenta la siguiente línea:
      // setTimeout(() => renderizarProductosAdmin(), 1000);

    } else {
      console.warn('⚠️ No se pudo eliminar el producto de Supabase');
    }

  } catch (error) {
    console.error('❌ Error crítico en eliminación:', error);
    mostrarNotificacionEliminar(
      `❌ Error crítico: ${error.message}`,
      'error',
      10000
    );
  }
};

/**
 * Función para preparar la eliminación (llamada cuando se abre el modal)
 */
window.prepararEliminacion = function(productoId) {
  console.log('🎯 Preparando eliminación para producto ID:', productoId);
  
  // Actualizar contenido del modal con información del producto
  actualizarModalConInfoProducto(productoId);
  
  // Almacenar ID globalmente
  window.productoIdAEliminar = productoId;
  
  console.log('✅ Eliminación preparada para:', obtenerNombreProductoDelDOM(productoId));
};

/**
 * Exponer función de eliminación directa globalmente para fallback
 */
window.eliminarProductoDeSupabase = eliminarProductoDeSupabase;

// =======================================================
// FUNCIONES DE DEBUG Y TESTING
// =======================================================

/**
 * Función de debug para probar eliminación sin confirmación
 */
window.debugEliminarProducto = async function(productoId) {
  console.log('🧪 DEBUG: Probando eliminación directa para ID:', productoId);
  const resultado = await eliminarProductoDeSupabase(productoId);
  console.log('🧪 DEBUG: Resultado de eliminación:', resultado);
  return resultado;
};

/**
 * Función para probar la obtención del token
 */
window.debugToken = function() {
  const token = obtenerTokenDeAuth();
  console.log('🧪 DEBUG: Token disponible:', token ? 'Sí' : 'No');
  if (token) {
    console.log('🧪 DEBUG: Token (primeros 50 caracteres):', token.substring(0, 50) + '...');
  }
  return token;
};

// =======================================================
// INICIALIZACIÓN
// =======================================================

console.log('✅ Controlador de eliminación de productos inicializado');
console.log('🔧 Funciones disponibles:');
console.log('   - window.confirmarEliminacionProducto(id)');
console.log('   - window.prepararEliminacion(id)');
console.log('   - window.eliminarProductoDeSupabase(id)');
console.log('   - window.debugEliminarProducto(id)');
console.log('   - window.debugToken()');

// Verificar que las funciones se hayan registrado correctamente
setTimeout(() => {
  console.log('🔍 Verificación de funciones registradas:');
  console.log('- confirmarEliminacionProducto:', typeof window.confirmarEliminacionProducto);
  console.log('- prepararEliminacion:', typeof window.prepararEliminacion);
  console.log('- eliminarProductoDeSupabase:', typeof window.eliminarProductoDeSupabase);
}, 100);
