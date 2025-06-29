// Script para el modal de login
const openLoginModal = document.getElementById("openLoginModal");
const loginModal = document.getElementById("loginModal");
const closeLoginModal = document.getElementById("closeLoginModal");

// Nos aseguramos que los elementos existen antes de añadir listeners
if (openLoginModal && loginModal && closeLoginModal) {
  openLoginModal.addEventListener("click", () => {
    loginModal.style.display = "flex";
  });

  closeLoginModal.addEventListener("click", () => {
    loginModal.style.display = "none";
  });

  // Cierra el modal si se hace clic fuera de él
  window.addEventListener("click", (event) => {
    if (event.target === loginModal) {
      loginModal.style.display = "none";
    }
  });
}

// --- Lógica de autenticación ---

const loginForm = document.getElementById('loginForm');

// Las claves ahora se leen de forma segura desde el entorno de Vite
const LINK_BACK = 'https://iwbpiptomqaugtbxrlln.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml3YnBpcHRvbXFhdWd0YnhybGxuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA5ODAwNDQsImV4cCI6MjA2NjU1NjA0NH0.MkfOyv_39_GkSScVS28I0p8-2GGoAyTRH5LKSlKsQJA';

const Login = {
  /**
   * Autentica a un usuario contra la API.
   * @param {string} email - El correo del usuario.
   * @param {string} password - La contraseña del usuario.
   * @returns {Promise<string|boolean>} - Devuelve el token si es exitoso, o false si falla.
   */
  authenticate: async function(email, password) {
    const loginUrl = `${LINK_BACK}/auth/v1/token?grant_type=password`;

    try {
      const response = await fetch(loginUrl, {
        method: "POST",
        headers: {
          "apikey": ANON_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error_description || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result.access_token; // Devuelve el token de acceso

    } catch (error) {
      console.error("Error en el login:", error.message);
      return false;
    }
  },

  /**
   * Guarda un valor en una cookie.
   * @param {string} name - El nombre de la cookie.
   * @param {string} value - El valor de la cookie.
   * @param {number} days - El número de días que la cookie debe ser válida.
   */
  setCookie: function(name, value, days) {
    let expires = "";
    if (days) {
      const date = new Date();
      date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
      expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "") + expires + "; path=/";
  },

  /**
   * Obtiene el valor de una cookie por su nombre.
   * @param {string} name - El nombre de la cookie.
   * @returns {string|null} - El valor de la cookie o null si no existe.
   */
  getCookie: function(name) {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
  }
};

if (loginForm) {
  loginForm.addEventListener('submit', async function(event) {
    event.preventDefault();

    const emailInput = document.getElementById('loginEmail');
    const passwordInput = document.getElementById('loginPassword');

    const email = emailInput.value;
    const password = passwordInput.value;

    const token = await Login.authenticate(email, password);

    if (token) {
      alert('Login confirmado');
      Login.setCookie('supabase_token', token, 7);
      console.log('Token guardado en la cookie:', token);
      loginModal.style.display = "none";
    } else {
      alert('Login no completado. Revisa tus credenciales.');
    }
  });
}