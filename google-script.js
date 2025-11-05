// google-script.js - Versión de Bypass con Formulario Oculto
function enviarDatosGoogle(datos) {
    return new Promise((resolve, reject) => {
        // Usa la URL de tu script ORIGINAL, no la de las pruebas.
        const scriptUrl = "https://script.google.com/macros/s/AKfycbxjUs5VVUGPjKFf19UhTNPqWfFjDKerPmJpF3FIwPPzM8aPbkehBhKKMOacu_pPolgYfg/exec";
        
        // Crear un Iframe oculto para que la página no se recargue
        const iframe = document.createElement('iframe');
        iframe.name = 'iframeOculto';
        iframe.style.display = 'none';
        document.body.appendChild(iframe);
        
        // Crear un formulario que apunte al iframe
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = scriptUrl;
        form.target = iframe.name;
        
        // Añadir los datos como un campo del formulario
        const dataInput = document.createElement('input');
        dataInput.type = 'hidden';
        dataInput.name = 'data'; // Un nombre para el campo
        dataInput.value = JSON.stringify(datos);
        form.appendChild(dataInput);
        
        document.body.appendChild(form);
        form.submit();
        
        // Como este método no puede leer la respuesta del servidor,
        // asumimos que tuvo éxito después de un breve retraso.
        setTimeout(() => {
            document.body.removeChild(form);
            document.body.removeChild(iframe);
            console.log("Datos enviados mediante el método de bypass. Revisa Google Sheets.");
            resolve({ exito: true, respuesta: 'Datos enviados. Revisa la hoja de cálculo para confirmar.' });
        }, 1500); // Esperamos 1.5 segundos
    });
}

