async function validarSupabaseToken() {
  const tokenCookie = document.cookie.split('; ').find(row => row.startsWith('supabase_token='));
  if (!tokenCookie) {
    alert('Token no existe');
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
        alert('Token no es válido o ha expirado (401)');
        return false;
      }
      if (response.status === 403) {
        alert('No tienes permisos para acceder (403)');
        return false;
      }
      alert('Error desconocido al verificar token: ' + response.status + ' ' + response.statusText);
      return false;
    }
    // Si la petición fue exitosa, el token es válido
    return true;
  } catch (error) {
    alert('Error de red al verificar token: ' + error.message);
    return false;
  }
}



