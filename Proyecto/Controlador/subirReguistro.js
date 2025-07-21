document.addEventListener('DOMContentLoaded', function() {
  const form = document.getElementById('multiStepForm');
  if (!form) return;

  form.addEventListener('submit', async function(event) {
    const password = document.getElementById('password').value;
    const passwordConfirm = document.getElementById('passwordConfirm').value;
    if (password !== passwordConfirm) {
      event.preventDefault();
      alert('Las contraseñas no coinciden. Por favor, verifica.');
      document.getElementById('password').focus();
      return false;
    }

    const email = document.getElementById('email').value;
    const { access_token, user } = await registrarUsuario(email, password);
    if (!access_token) {
      event.preventDefault();
      alert('Error al registrar el usuario. Por favor, intenta nuevamente.');
      return false;
    }

    // Aquí puedes continuar con el envío normal del formulario
  });
});

// Función para registrar usuario y obtener access_token
async function registrarUsuario(email, password) {

  const myHeaders = new Headers();
  myHeaders.append("apikey", SUPABASE_API_KEY);
  myHeaders.append("Content-Type", "application/json");

  const raw = JSON.stringify({
    email: email,
    password: password
  });

  const requestOptions = {
    method: "POST",
    headers: myHeaders,
    body: raw,
    redirect: "follow"
  };

  try {
    const response = await fetch(`${SUPABASE_URL}/auth/v1/signup`, requestOptions);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText);
    }
    const result = await response.json();
    console.log('Resultado registro:', result);
    return {
      access_token: result.access_token || null,
      user: result.user || null
    };
  } catch (error) {
    console.error('Error al registrar usuario:', error);
    return null;
  }
}

// Función para crear cliente en Supabase
async function crearClienteSupabase(user, access_token) {
  // Obtener datos del DOM
  const email = document.getElementById('email').value;
  const nombre = document.getElementById('nombre').value;
  const fecha_nacimiento = document.getElementById('cumpleanos').value;
  const tipo_documento = document.getElementById('tipoDocumento').value;
  const numero_documento = document.getElementById('numeroDocumento').value;

  const myHeaders = new Headers();
  myHeaders.append("apikey", SUPABASE_API_KEY);
  myHeaders.append("Authorization", `Bearer ${access_token}`);
  myHeaders.append("Content-Type", "application/json");
  myHeaders.append("Prefer", "return=representation");

  const raw = JSON.stringify({
    user_id: user.id,
    email: email,
    nombre: nombre,
    fecha_nacimiento: fecha_nacimiento,
    tipo_documento: tipo_documento,
    numero_documento: numero_documento
  });

  const requestOptions = {
    method: "POST",
    headers: myHeaders,
    body: raw,
    redirect: "follow"
  };

  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/clientes`, requestOptions);
    const result = await response.json();
    console.log('Cliente creado:', result);
    return result;
  } catch (error) {
    console.error('Error al crear cliente:', error);
    return null;
  }
}

// Función para manejar el paso 1 y crear el cliente
window.handleStep1Next = async function() {
  // Validar contraseñas
  const password = document.getElementById('password').value;
  const passwordConfirm = document.getElementById('passwordConfirm').value;
  if (password !== passwordConfirm) {
    alert('Las contraseñas no coinciden. Por favor, verifica.');
    document.getElementById('password').focus();
    return;
  }
  // Registrar usuario y crear cliente
  const email = document.getElementById('email').value;
  const { access_token, user } = await registrarUsuario(email, password);
  if (!access_token || !user) {
    alert('Error al registrar el usuario. Por favor, intenta nuevamente.');
    return;
  }
  const cliente = await crearClienteSupabase(user, access_token);
  if (!cliente) {
    alert('Error al crear el cliente.');
    return;
  }
  // Avanzar al siguiente paso
  nextStep(3);
}



