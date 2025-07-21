document.addEventListener('DOMContentLoaded', function() {
  const btnEnviar = document.querySelector('.button');
  if (!btnEnviar) return;

  btnEnviar.addEventListener('click', async function() {
    const nombre = document.querySelector('input[placeholder="Nombre Completo"]').value.trim();
    const email = document.querySelector('input[placeholder="Correo Electrónico"]').value.trim();
    const mensaje = document.querySelector('textarea.mens').value.trim();

    if (!nombre || !email || !mensaje) {
      alert('Por favor, completa todos los campos.');
      return;
    }

    const myHeaders = new Headers();
    myHeaders.append("apikey", SUPABASE_API_KEY);
    myHeaders.append("Content-Type", "application/json");
    myHeaders.append("Prefer", "return=representation");

    const raw = JSON.stringify({
      nombre: nombre,
      email: email,
      mensaje: mensaje
    });

    const requestOptions = {
      method: "POST",
      headers: myHeaders,
      body: raw,
      redirect: "follow"
    };

    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/Comentarios_clientes`, requestOptions);
      const text = await response.text();
      if (!response.ok) {
        alert('Error al enviar el mensaje: ' + text);
        return;
      }
      alert('¡Mensaje enviado con éxito!');
      document.querySelector('form').reset();
    } catch (error) {
      alert('Error de red al enviar el mensaje.');
      console.error(error);
    }
  });
});