const SETTINGS = require('./Shared/config.js');

async function testLogin(email, password) {
  const loginUrl = `${SETTINGS.LINK_BACK}/auth/v1/token?grant_type=password`;

  try {
    const response = await fetch(loginUrl, {
      method: "POST",
      headers: {
        "apikey": SETTINGS.ANON,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      // Lanza un error si la respuesta no es exitosa (ej. 4xx, 5xx)
      const errorData = await response.json();
      throw new Error(errorData.error_description || `HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log("Login exitoso:", result.access_token);
    return response;

  } catch (error) {
    console.error("Error en el login:", error.message);
    return false;
  }
}

module.exports = { testLogin };

// Ejemplo de uso

const email1 = 'cris16cone@gmail.com' ;
const pass = 'peke@403'

testLogin(email1, pass)

const email2 = 'cris16cone@gmail.com' ;
const pass2 = '12234567890'

testLogin(email2, pass2)


const email3 = 'email@gmail.com' ;
const pass3 = '12234567890'

testLogin(email3, pass3)
