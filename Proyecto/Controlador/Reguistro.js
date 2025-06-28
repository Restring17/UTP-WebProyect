

// JavaScript para el formulario multi-paso
let currentStep = 1;
let addressCount = 1;

function showStep(stepNumber) {
  document
    .querySelectorAll(".form-step")
    .forEach((step) => step.classList.remove("active"));
  document.getElementById(`step${stepNumber}`).classList.add("active");

  document
    .querySelectorAll(".registro-sidebar-step")
    .forEach((step) => step.classList.remove("active"));
  document
    .querySelector(`.registro-sidebar-step[data-step="${stepNumber}"]`)
    .classList.add("active");
  currentStep = stepNumber;
}

function nextStep(stepNumber) {
  // Aquí podrías añadir validación antes de pasar al siguiente paso
  if (validateStep(currentStep)) {
    showStep(stepNumber);
  }
}

function prevStep(stepNumber) {
  showStep(stepNumber);
}

function validateStep(stepNumber) {
  let isValid = true;
  const currentStepFields = document.querySelectorAll(
    `#step${stepNumber} [required]`
  );
  currentStepFields.forEach((field) => {
    if (!field.value.trim()) {
      isValid = false;
      // Podrías añadir una clase de error al campo o mostrar un mensaje
      field.style.borderColor = "red"; // Ejemplo simple de resaltado
    } else {
      field.style.borderColor = "#333"; // Restablecer borde
    }
  });
  if (!isValid) {
    // alert('Por favor, completa todos los campos obligatorios.'); // Evitar alerts
    console.warn("Por favor, completa todos los campos obligatorios.");
  }
  return isValid;
}

function addAddress() {
  addressCount++;
  const addressList = document.getElementById("addressList");
  const newAddressBlock = document.createElement("div");
  newAddressBlock.classList.add("address-block");
  newAddressBlock.innerHTML = `
                <h4>Dirección ${addressCount}</h4>
                <div class="form-group">
                    <label for="departamento${addressCount}">Departamento</label>
                    <input type="text" id="departamento${addressCount}" name="departamento${addressCount}" placeholder="Ej: Lima" required>
                </div>
                <div class="form-group">
                    <label for="provincia${addressCount}">Provincia</label>
                    <input type="text" id="provincia${addressCount}" name="provincia${addressCount}" placeholder="Ej: Lima" required>
                </div>
                <div class="form-group">
                    <label for="distrito${addressCount}">Distrito</label>
                    <input type="text" id="distrito${addressCount}" name="distrito${addressCount}" placeholder="Ej: Miraflores" required>
                </div>
                <div class="form-group">
                    <label for="direccion${addressCount}">Dirección</label>
                    <input type="text" id="direccion${addressCount}" name="direccion${addressCount}" placeholder="Av. Siempre Viva 123" required>
                </div>
                <div class="form-group">
                    <label for="referencia${addressCount}">Referencia (Opcional)</label>
                    <input type="text" id="referencia${addressCount}" name="referencia${addressCount}" placeholder="Frente al parque, casa verde">
                </div>
            `;
  addressList.appendChild(newAddressBlock);
}

// Manejar el envío del formulario
document
  .getElementById("multiStepForm")
  .addEventListener("submit", function (event) {
    event.preventDefault(); // Prevenir el envío real para este ejemplo
    if (validateStep(currentStep)) {
      alert("¡Registro completado exitosamente!"); // Reemplazar con lógica de envío real
      // Aquí enviarías los datos del formulario a tu backend
      // Por ejemplo:
      // const formData = new FormData(this);
      // fetch('/api/registro', { method: 'POST', body: formData })
      //    .then(response => response.json())
      //    .then(data => console.log(data))
      //    .catch(error => console.error('Error:', error));
      console.log("Formulario enviado (simulado)");
    }
  });

// Inicializar el primer paso
showStep(1);
