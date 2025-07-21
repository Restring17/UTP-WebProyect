async function validarSupabaseToken() {
  const tokenCookie = document.cookie.split('; ').find(row => row.startsWith('supabase_token='));
  if (!tokenCookie) {
    console.log('Token no existe');
    return false;
  }
  const token = tokenCookie.split('=')[1]; // <-- Corrección aquí
  // Verificar el token haciendo una petición real
  const myHeaders = new Headers();
  myHeaders.append("apikey", SUPABASE_API_KEY);
  myHeaders.append("Authorization", `Bearer ${token}`);
  const requestOptions = {
    method: "GET",
    headers: myHeaders,
    redirect: "follow"
  };
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/productos?select=*`, requestOptions);
    if (!response.ok) {
      if (response.status === 401) {
        console.log('Token no es válido o ha expirado (401)');
        return false;
      }
      if (response.status === 403) {
        console.log('No tienes permisos para acceder (403)');
        return false;
      }
      console.log('Error desconocido al verificar token:', response.status, response.statusText);
      return false;
    }
    // Si la petición fue exitosa, el token es válido
    return true;
  } catch (error) {
    console.log('Error de red al verificar token:', error.message);
    return false;
  }
}

// Exportar la función si se usa en módulos
// export { validarSupabaseToken };
