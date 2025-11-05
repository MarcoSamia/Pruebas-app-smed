// DEBUG: Verificar que la función se carga correctamente
console.log("✅ Función guardarEstado cargada:", typeof guardarEstado);

// DEBUG: Verificar que los elementos del DOM existen
setTimeout(() => {
  console.log("✅ Elemento autosave-indicator:", document.getElementById('autosave-indicator'));
  console.log("✅ Elemento last-save-time:", document.getElementById('last-save-time'));
}, 1000);


// Actividades iniciales de la tabla
const actividadesBase = [
  "Desconectar molde",
  "Desmontaje de molde",
  "Bajar recamara",
  "Cambio de bloque de altura",
  "Cambio de vastago/pistón",
  "Colocar recamara nueva",
  "Meter molde a maquina",
  "Conectar molde",
  "Cambio de cabezal",
  "Desconectar y desmontar troquel",
  "Montar y conectar troquel",
  "Arranque de máquina (procesos)"  
];

let actividades = [...actividadesBase];

// Función para mostrar notificacioness toast
function mostrarToast(mensaje, tipo = 'success', duracion = 3000) {
  const toast = document.createElement('div');
  toast.className = `toast toast-${tipo}`;
  toast.innerHTML = `
    <span class="toast-icon">${tipo === 'success' ? '✓' : '✗'}</span>
    <span class="toast-message">${mensaje}</span>
  `;
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, duracion);
}



// Función para usar Sortable en Drag Handle - VERSIÓN SIMPLIFICADA
function inicializarSortable() {
  const tablaBody = document.querySelector("#tabla tbody");
  
  // Destruir instancia anterior si existe
  if (tablaBody.sortableInstance) {
    tablaBody.sortableInstance.destroy();
  }
  
  tablaBody.sortableInstance = new Sortable(tablaBody, {
    animation: 150,
    handle: ".drag-icon",
    ghostClass: "sortable-ghost",
    chosenClass: "sortable-chosen",
    dragClass: "sortable-drag",
    
    // CONFIGURACIÓN MEJORADA - SIMPLIFICADA
    forceFallback: false, // Usar HTML5 nativo cuando sea posible
    fallbackOnBody: false,
    
    // MEJORAS PARA MÓVILES - REDUCIDAS
    delay: 100, // Reducir delay para móviles
    delayOnTouchOnly: true,
    
    onStart: function(evt) {
      document.body.style.cursor = 'grabbing';
      document.body.style.userSelect = 'none';
      isDragging = true;
    },
    
    onEnd: function(evt) {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      isDragging = false;
      
      // Actualizar el estado inmediatamente
      guardarEstado();
    }
  });
}



// Llamar esta función al cargar la página
window.addEventListener('DOMContentLoaded', inicializarSortable);



// Función para formatear el tiempo 
function formatearTiempo(segundos) {
  const m = Math.floor(segundos / 60).toString().padStart(2, '0');
  const s = Math.floor(segundos % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}



// Función para coneguir el numero de la semana 
function obtenerNumeroSemana(fecha) {
  const primerDia = new Date(fecha.getFullYear(), 0, 1);
  const diaDelAño = Math.floor((fecha - primerDia) / (24 * 60 * 60 * 1000));
  return Math.ceil((diaDelAño + primerDia.getDay() + 1) / 7);
}



// Constantes y variables universales
const tiempos = {};
const tabla = document.querySelector("#tabla tbody");
let dragTimeout;
let dragStartTime = 0;
let isDragging = false;
let currentDragElement = null;


//AUTOSAVE
let autoSaveInterval = null;
const AUTO_SAVE_INTERVAL = 10000; // Guardar cada 5 segundos

// Función para iniciar el autoguardado
function iniciarAutoguardado() {
  // Limpiar intervalo anterior si existe
  if (autoSaveInterval) {
    clearInterval(autoSaveInterval);
  }
  
  // Configurar nuevo intervalo
  autoSaveInterval = setInterval(() => {
    const hayCronometrosActivos = Object.values(tiempos).some(t => 
      t && (t.estado === "corriendo" || t.estado === "pausado")
    ) || Object.values(parosExternos).some(p => 
      p && (p.estado === "corriendo" || p.estado === "pausado")
    );
    
    if (hayCronometrosActivos) {
      guardarEstado();
      console.log("Autoguardado realizado -", new Date().toLocaleTimeString());
    }
  }, AUTO_SAVE_INTERVAL);
}

// Función para detener el autoguardado
function detenerAutoguardado() {
  if (autoSaveInterval) {
    clearInterval(autoSaveInterval);
    autoSaveInterval = null;
  }
}













// Crear filas iniciales
actividades.forEach(nombre => agregarFila(nombre));

function agregarFila(nombre) {
  const id = nombre.replace(/\s+/g, "_");
  const fila = document.createElement("tr");
  
  // Obtener responsable guardado (si existe)
  const responsableGuardado = tiempos[nombre]?.responsable || "";

  fila.innerHTML = `
    <td class="drag-handle" >
      <div class="drag-icon">☰</div>
    </td> 
    <td class="editable" data-label="Actividad" ondblclick="editarNombre(this, '${nombre}')">${nombre}</td>
    <td data-label="Acciones">
      <div class="mobile-actions">
        <button class="btn iniciar" onclick="iniciarPorNombre('${nombre}')">▶</button>
        <button class="btn pausar" onclick="pausarReanudar('${nombre}', this)">⏸</button>
        <button class="btn detener" onclick="detenerPorNombre('${nombre}')">⏹</button>
      </div>
    </td>
    <td data-label="Duración" id="duracion-${id}" 
      ondblclick="editarDuracion('actividad', '${nombre}')"
      ontouchstart="handleTouchStart(this)"
      ontouchend="handleTouchEnd(this)">
    ${formatearTiempo(0)}
  </td>
    <td data-label="Responsable">
      <select onchange="actualizarResponsable('${nombre}', this.value)" class="responsive-select">
        <option value="">--</option>
        <option value="SMED" ${responsableGuardado === "SMED" ? "selected" : ""}>SMED</option>
        <option value="Mantenimiento" ${responsableGuardado === "Mantenimiento" ? "selected" : ""}>Mantenimiento</option>
        <option value="Moldes" ${responsableGuardado === "Moldes" ? "selected" : ""}>Moldes</option>
        <option value="Procesos" ${responsableGuardado === "Procesos" ? "selected" : ""}>Procesos</option>
        <option value="Producción" ${responsableGuardado === "Producción" ? "selected" : ""}>Producción</option>
        <option value="Proyectos" ${responsableGuardado === "Proyectos" ? "selected" : ""}>Proyectos</option>
        <option value="Calidad" ${responsableGuardado === "Calidad" ? "selected" : ""}>Calidad</option>
      </select>
    </td>
    <td data-label="Eliminar"><button onclick="eliminarActividad(this, '${nombre}')">🗑️</button></td>
  `;

  tabla.appendChild(fila);

  // Inicializar el objeto si no existe
  if (!tiempos[nombre]) {
    tiempos[nombre] = {
      nombre: nombre,
      inicio: null,
      fin: null,
      duracion: 0,
      tiempoAcumulado: 0,
      estado: "detenido",
      timerID: null,
      responsable: responsableGuardado // Asegurar que se guarde el responsable
    };
  } else {
    // Si ya existe, asegurar que tenga la propiedad responsable
    tiempos[nombre].responsable = tiempos[nombre].responsable || responsableGuardado;
  }
}

// Función para crear filas iniciales usando el array actual
function crearFilasIniciales() {
  tabla.innerHTML = "";
  actividades.forEach(nombre => agregarFila(nombre));
}


// Función para actualizar el responsable de las actividades
function actualizarResponsable(nombre, departamento) {
  if (!tiempos[nombre]) {
    tiempos[nombre] = { nombre: nombre };
  }
  
  tiempos[nombre].responsable = departamento;
  
  // Guardar inmediatamente
  guardarEstado();
  
  // Actualizar visualmente (opcional)
  const id = nombre.replace(/\s+/g, "_");
  const select = document.getElementById(`responsable-${id}`);
  if (select) select.value = departamento;
}



// Función para iniciar a correr actividad 
function iniciarPorNombre(nombre) {
  const t = tiempos[nombre];
  if (!t || t.estado === "corriendo") {
    alert("Esta actividad ya está corriendo.");
    return;
  }

  t.inicio = new Date();
  t.estado = "corriendo";
  const celda = document.getElementById(`duracion-${nombre.replace(/\s+/g, "_")}`);

  t.timerID = setInterval(() => {
    const ahora = new Date();
    const tiempoTotal = t.tiempoAcumulado + (ahora - t.inicio) / 1000;
    celda.innerText = formatearTiempo(tiempoTotal);
  }, 100);

  guardarEstado();
  actualizarBotones(nombre);
}



// Función para detener actividad
function detenerPorNombre(nombre) {
  const t = tiempos[nombre];
  if (!t || t.estado === "detenido") {
    alert("Esta actividad no se ha iniciado.");
    return;
  }

  if (t.timerID !== null) {
    clearInterval(t.timerID);
  }

  if (t.estado === "corriendo") {
    const ahora = new Date();
    t.tiempoAcumulado += (ahora - t.inicio) / 1000;
  }

  t.fin = new Date();
  t.estado = "detenido";
  t.timerID = null;
  t.duracion = t.tiempoAcumulado;

  const celda = document.getElementById(`duracion-${nombre.replace(/\s+/g, "_")}`);
  celda.innerText = formatearTiempo(t.duracion);

  actualizarBotones(nombre);
  guardarEstado();
  
}



// Función para agregar una nueva actividad
function agregarActividad() {
  const input = document.getElementById("nuevaActividad");
  const nombre = input.value.trim();
  
  if (!nombre) {
    alert("Por favor, escribe el nombre de la actividad.");
    return;
  }

  // Usar la misma lógica de verificación que en renombrar
  const nombresEnUso = Array.from(document.querySelectorAll("#tabla tbody tr td:nth-child(2)"))
    .map(td => td.textContent.trim());

  if (nombresEnUso.includes(nombre)) {
    alert(`Ya existe una actividad llamada "${nombre}".`);
    return;
  }

  // AGREGAR AL ARRAY DE ACTIVIDADES ACTUALES
  actividades.push(nombre);
  
  agregarFila(nombre);
  input.value = "";
  const nuevaFila = tabla.lastElementChild;
  nuevaFila.classList.add('guardado');
  setTimeout(() => nuevaFila.classList.remove('guardado'), 500);
  mostrarToast(`Actividad "${nombre}" agregada`, 'success');
  guardarEstado();
}

function mostrarInputActividad() {
  const nombre = prompt("Escribe el nombre de la nueva actividad:");
  if (nombre && nombre.trim() !== "") {
    // Usa la función existente
    const input = document.getElementById("nuevaActividad");
    input.value = nombre.trim();
    agregarActividad();
  }
}



// Funciones para editar el nombre de una actividad
function editarNombre(celda, nombreViejo) {
  const input = document.createElement("input");
  input.type = "text";
  input.value = nombreViejo;
  input.style.width = "90%";

  celda.innerText = "";
  celda.appendChild(input);
  input.focus();

  input.onblur = () => confirmarCambioNombre(celda, nombreViejo, input.value);
  input.onkeydown = (e) => {
    if (e.key === "Enter") {
      confirmarCambioNombre(celda, nombreViejo, input.value);
    }
  };
}


function confirmarCambioNombre(celda, nombreViejo, nuevoNombre) {
  nuevoNombre = nuevoNombre.trim();

  if (!nuevoNombre || nuevoNombre === nombreViejo) {
    celda.innerText = nombreViejo;
    return;
  }

  // Verificación de nombres duplicados
  const nombresEnUso = Array.from(document.querySelectorAll("#tabla tbody tr td:nth-child(2)"))
    .map(td => td.textContent.trim())
    .filter(n => n !== nombreViejo);

  if (nombresEnUso.includes(nuevoNombre)) {
    alert(`El nombre "${nuevoNombre}" ya está en uso por otra actividad.`);
    celda.innerText = nombreViejo;
    return;
  }

  // Guardar la posición actual de la fila
  const fila = celda.parentElement;
  const tablaBody = fila.parentElement;
  const indiceFila = Array.from(tablaBody.children).indexOf(fila);

  // Actualizar el array actividades manteniendo la posición
  const indiceEnActividades = actividades.indexOf(nombreViejo);
  if (indiceEnActividades !== -1) {
    actividades[indiceEnActividades] = nuevoNombre;
  }

  // Copiar datos del objeto tiempos
  tiempos[nuevoNombre] = { 
    ...tiempos[nombreViejo], 
    nombre: nuevoNombre
  };
  delete tiempos[nombreViejo];

  const idViejo = nombreViejo.replace(/\s+/g, "_");
  const idNuevo = nuevoNombre.replace(/\s+/g, "_");

  // Actualizar celda de nombre
  fila.children[1].innerText = nuevoNombre;
  fila.children[1].setAttribute("ondblclick", `editarNombre(this, '${nuevoNombre}')`);

  // Actualizar celda de duración
  const celdaDuracion = fila.querySelector(`#duracion-${idViejo}`);
  if (celdaDuracion) {
    celdaDuracion.id = `duracion-${idNuevo}`;
    celdaDuracion.setAttribute("ondblclick", `editarDuracion('actividad', '${nuevoNombre}')`);
  }

  // Actualizar botones de acciones
  const botonesAcciones = fila.querySelectorAll("td[data-label='Acciones'] button");
  if (botonesAcciones.length === 3) {
    botonesAcciones[0].setAttribute("onclick", `iniciarPorNombre('${nuevoNombre}')`);
    botonesAcciones[1].setAttribute("onclick", `pausarReanudar('${nuevoNombre}', this)`);
    botonesAcciones[2].setAttribute("onclick", `detenerPorNombre('${nuevoNombre}')`);
  }

  // Actualizar botón de eliminar
  const botonEliminar = fila.querySelector("td[data-label='Eliminar'] button");
  if (botonEliminar) {
    botonEliminar.setAttribute("onclick", `eliminarActividad(this, '${nuevoNombre}')`);
  }

  // Actualizar select de responsable
  const selectResponsable = fila.querySelector("select");
  if (selectResponsable) {
    selectResponsable.setAttribute("onchange", `actualizarResponsable('${nuevoNombre}', this.value)`);
  }

  // Reiniciar el timer si estaba corriendo (para evitar NaN:NaN)
  if (tiempos[nuevoNombre].estado === "corriendo") {
    clearInterval(tiempos[nuevoNombre].timerID);
    const celda = document.getElementById(`duracion-${idNuevo}`);
    tiempos[nuevoNombre].timerID = setInterval(() => {
      const ahora = new Date();
      const tiempoTotal = tiempos[nuevoNombre].tiempoAcumulado + (ahora - tiempos[nuevoNombre].inicio) / 1000;
      celda.innerText = formatearTiempo(tiempoTotal);
    }, 100);
  }

  // Asegurar que la fila mantenga su posición en el DOM
  // (Sortable.js ya maneja el orden visual, pero por si acaso)
  if (indiceFila !== -1 && fila.parentElement === tablaBody) {
    // La fila ya está en la posición correcta, no necesitamos moverla
  }

  guardarEstado();
  mostrarToast(`Actividad renombrada a "${nuevoNombre}"`, 'success');
}



// Función para eliminar una actividad
function eliminarActividad(boton, nombre) {
  const confirmar = confirm(`¿Estás seguro de que deseas eliminar la actividad "${nombre}"?`);
  if (!confirmar) return;

  // Detener cronómetro si está corriendo
  if (tiempos[nombre].timerID !== null) {
    clearInterval(tiempos[nombre].timerID);
  }

  // Eliminar de estructura de datos
  delete tiempos[nombre];

  // Eliminar del array actividades
  const index = actividades.indexOf(nombre);
  if (index !== -1) {
    actividades.splice(index, 1);
  }

  // Eliminar fila del DOM
  const fila = boton.closest("tr");
  fila.remove();

  mostrarToast(`Actividad "${nombre}" eliminada`, 'warning');
  guardarEstado();
}

function actualizarBotones(nombre) {
  const fila = Array.from(tabla.querySelectorAll("tr"))
    .find(tr => tr.children[1].innerText === nombre);
  if (!fila) return;

  const [btnIniciar, btnPausar, btnDetener] = fila.querySelectorAll("td[data-label='Acciones'] button");
  const estado = tiempos[nombre].estado;

  // Resetear todos los botones primero
  btnIniciar.disabled = false;
  btnPausar.disabled = false;
  btnDetener.disabled = false;

  // Aplicar lógica según el estado
  if (estado === "detenido") {
    btnIniciar.disabled = false;
    btnPausar.disabled = true;  // No se puede pausar si está detenido
    btnDetener.disabled = true; // No se puede detener si está detenido
  } else if (estado === "corriendo") {
    btnIniciar.disabled = true;  // No se puede iniciar si ya está corriendo
    btnPausar.disabled = false;  // Se puede pausar
    btnDetener.disabled = false; // Se puede detener
  } else if (estado === "pausado") {
    btnIniciar.disabled = true;  // No se puede iniciar si está pausado
    btnPausar.disabled = false;  // Se puede reanudar (mismo botón)
    btnDetener.disabled = true; // Se puede detener
  }

  // Actualizar también el texto/icono del botón de pausa/reanudar
  if (estado === "pausado") {
    btnPausar.innerHTML = '<span class="icon-reanudar">▶</span>';
    btnPausar.classList.remove('pausar');
    btnPausar.classList.add('reanudar');
  } else {
    btnPausar.innerHTML = '<span class="icon-pausar">⏸</span>';
    btnPausar.classList.remove('reanudar');
    btnPausar.classList.add('pausar');
  }
}


// Función para pausar y reanudar el tiempo 
function pausarReanudar(nombre, boton) {
  const t = tiempos[nombre];
  const celda = document.getElementById(`duracion-${nombre.replace(/\s+/g, "_")}`);

  if (t.estado !== "corriendo" && t.estado !== "pausado") {
    mostrarToast(`La actividad "${nombre}" no se ha iniciado aún`, "warning");
    return;
  }

  if (t.estado === "corriendo") {
    clearInterval(t.timerID);
    t.estado = "pausado";
    const ahora = new Date();
    t.tiempoAcumulado += (ahora - t.inicio) / 1000;
    
    // Cambiar solo la clase, no el HTML interno
    boton.innerHTML = '<span class="icon-reanudar">▶</span>';
    boton.classList.remove('pausar');
    boton.classList.add('reanudar');
    
  } else if (t.estado === "pausado") {
    t.inicio = new Date();
    t.estado = "corriendo";
    
    // Cambiar solo la clase, no el HTML interno
    boton.innerHTML = '<span class="icon-pausar">⏸</span>';
    boton.classList.remove('reanudar');
    boton.classList.add('pausar');
    
    t.timerID = setInterval(() => {
      const ahora = new Date();
      const tiempoTotal = t.tiempoAcumulado + (ahora - t.inicio) / 1000;
      celda.innerText = formatearTiempo(tiempoTotal);
    }, 100);
  }

  actualizarBotones(nombre);
  guardarEstado();
}



function guardarEstado() {
  try {
    // Actualizar indicador visual a "guardando"
    const autosaveIndicator = document.getElementById('autosave-indicator');
    const autosaveStatus = document.getElementById('autosave-status');
    const autosaveIcon = document.getElementById('autosave-icon');
    
    if (autosaveIndicator && autosaveStatus && autosaveIcon) {
      autosaveIndicator.className = 'autosave-saving';
      autosaveStatus.textContent = 'Guardando...';
      autosaveIcon.textContent = '⏳';
    }
    
    // Obtener las actividades en el orden actual de la tabla
    const actividadesEnOrden = Array.from(document.querySelectorAll("#tabla tbody tr"))
      .map(fila => {
        const nombre = fila.children[1].innerText;
        return tiempos[nombre];
      })
      .filter(actividad => actividad && actividad.nombre);

    // Actualizar el array actividades con el nuevo orden
    actividades = actividadesEnOrden.map(a => a.nombre);

    const datos = {
      actividades: actividadesEnOrden,
      parosExternos: Object.values(parosExternos),
      datosCambio: {
        inyectora: document.getElementById("inyectora").value,
        moldeSale: document.getElementById("moldeSale").value,
        moldeEntra: document.getElementById("moldeEntra").value,
        tipoCambio: document.getElementById("tipoCambio").value,
        tiempoObjetivo: document.getElementById("tiempoObjetivo").value,
        horaInicio: document.getElementById("horaInicio").value,
        horaTermino: document.getElementById("horaTermino").value,
        fechaCambio: document.getElementById("fechaCambio").value,
        semanaCambio: document.getElementById("semanaCambio").value,
        razonCambio: document.getElementById("razonCambio").value
      },
      // Agregar metadata de autoguardado
      metadata: {
        lastSave: new Date().toISOString(),
        version: "1.0"
      }
    };
    
    localStorage.setItem("estadoSMED", JSON.stringify(datos));
    
    // Actualizar indicador visual a éxito
    if (autosaveIndicator && autosaveStatus && autosaveIcon) {
      autosaveIndicator.className = 'autosave-success';
      autosaveStatus.textContent = 'Autoguardado activo';
      autosaveIcon.textContent = '✅';
    }
    
    const lastSaveElement = document.getElementById('last-save-time');
    if (lastSaveElement) {
      lastSaveElement.textContent = `Último guardado: ${new Date().toLocaleTimeString()}`;
    }
    
    return true;
    
  } catch (error) {
    console.error("Error al guardar estado:", error);
    
    // Actualizar indicador visual con error
    const autosaveIndicator = document.getElementById('autosave-indicator');
    const autosaveStatus = document.getElementById('autosave-status');
    const autosaveIcon = document.getElementById('autosave-icon');
    
    if (autosaveIndicator && autosaveStatus && autosaveIcon) {
      autosaveIndicator.className = 'autosave-error';
      autosaveStatus.textContent = 'Error en autoguardado';
      autosaveIcon.textContent = '❌';
    }
    
    return false;
  }
}


function cargarEstado() {
  const datos = JSON.parse(localStorage.getItem("estadoSMED"));
  
  // Si no hay datos guardados, usar actividades base
  if (!datos) {
    crearFilasIniciales();
    iniciarAutoguardado(); // Iniciar autoguardado
    return;
  }

  const { actividades: actividadesGuardadas, datosCambio, parosExternos: parosGuardados } = datos;

  // Cargar datos del cambio
  if (datosCambio) {
    document.getElementById("inyectora").value = datosCambio.inyectora || "";
    document.getElementById("moldeSale").value = datosCambio.moldeSale || "";
    document.getElementById("moldeEntra").value = datosCambio.moldeEntra || "";
    document.getElementById("tipoCambio").value = datosCambio.tipoCambio || "";
    document.getElementById("tiempoObjetivo").value = datosCambio.tiempoObjetivo || "";
    document.getElementById("fechaCambio").value = datosCambio.fechaCambio || "";
    document.getElementById("semanaCambio").value = datosCambio.semanaCambio || "";
    document.getElementById("horaInicio").value = datosCambio.horaInicio || "";
    document.getElementById("horaTermino").value = datosCambio.horaTermino || "";
    document.getElementById("razonCambio").value = datosCambio.razonCambio || "";
  }

  // Limpiar tabla y objeto tiempos
  tabla.innerHTML = "";
  
  // PRIMERO cargar actividades guardadas si existen
  if (actividadesGuardadas && actividadesGuardadas.length > 0) {
    // Usar las actividades guardadas manteniendo el orden
    actividades = actividadesGuardadas.map(a => a.nombre);
    
    // Crear las filas en el orden guardado
    actividadesGuardadas.forEach(actividad => {
      if (actividad && actividad.nombre) {
        agregarFila(actividad.nombre);
        tiempos[actividad.nombre] = { ...actividad };
        
        // MEJORA: Verificar y corregir estados inconsistentes
        if (tiempos[actividad.nombre].estado === "corriendo") {
          // Si estaba corriendo pero no tenemos timerID válido, poner en pausado
          if (!tiempos[actividad.nombre].timerID) {
            tiempos[actividad.nombre].estado = "pausado";
          }
        }
        
        const celdaDuracion = document.getElementById(`duracion-${actividad.nombre.replace(/\s+/g, "_")}`);
        
        if (actividad.estado === "corriendo") {
          const t = tiempos[actividad.nombre];
          // MEJORA: Verificar que la fecha de inicio sea válida
          if (t.inicio && !isNaN(new Date(t.inicio).getTime())) {
            t.inicio = new Date(t.inicio);
            t.timerID = setInterval(() => {
              const ahora = new Date();
              const tiempoTotal = t.tiempoAcumulado + (ahora - t.inicio) / 1000;
              celdaDuracion.innerText = formatearTiempo(tiempoTotal);
            }, 100);
          } else {
            // Si la fecha no es válida, poner en estado pausado
            t.estado = "pausado";
            celdaDuracion.innerText = formatearTiempo(t.tiempoAcumulado || 0);
          }
        } else {
          celdaDuracion.innerText = formatearTiempo(actividad.tiempoAcumulado || 0);
        }
        
        const select = tabla.querySelector(`tr:last-child select`);
        if (select && actividad.responsable) {
          select.value = actividad.responsable;
        }
        
        // Actualizar estado visual de botones
        actualizarBotones(actividad.nombre);
      }
    });
  } else {
    // Si no hay actividades guardadas, usar actividades base
    actividades = [...actividadesBase];
    crearFilasIniciales();
  }

  // Cargar paros externos
  if (parosGuardados) {
    parosGuardados.forEach(p => {
      parosExternos[p.id] = p;

      const fila = document.createElement("tr");
      fila.innerHTML = `
        <td data-label="Departamento">${p.departamento}</td>
        <td data-label="Paro">${p.nombre}</td>
        <td data-label="Acciones">
          <button class="btn iniciar" onclick="iniciarParo('${p.id}')">▶</button>
          <button class="btn pausar" onclick="pausarReanudarParo('${p.id}', this)">⏸</button>
          <button class="btn detener" onclick="detenerParo('${p.id}')">⏹</button>
        </td>
        <td data-label="Duración" id="duracion-paro-${p.id}" 
            ondblclick="editarDuracion('paro', '${p.id}')"
            ontouchstart="handleTouchStart(this)"
            ontouchend="handleTouchEnd(this)">${formatearTiempo(p.tiempoAcumulado)}</td>
        <td data-label="Eliminar">
          <button onclick="eliminarParo('${p.id}', this)">🗑️</button>
        </td>
      `;
      tablaParos.appendChild(fila);

      if (p.estado === "corriendo") {
        const celda = document.getElementById(`duracion-paro-${p.id}`);
        // MEJORA: Verificar que la fecha de inicio sea válida
        if (p.inicio && !isNaN(new Date(p.inicio).getTime())) {
          p.inicio = new Date(p.inicio);
          p.timerID = setInterval(() => {
            const ahora = new Date();
            const tiempoTotal = p.tiempoAcumulado + (ahora - p.inicio) / 1000;
            celda.innerText = formatearTiempo(tiempoTotal);
          }, 100);
        } else {
          // Si la fecha no es válida, poner en estado pausado
          p.estado = "pausado";
          celda.innerText = formatearTiempo(p.tiempoAcumulado);
        }
      }
    });
  }

  setTimeout(() => {
    CAMPOS_OBLIGATORIOS.forEach(id => {
      const campo = document.getElementById(id);
      if (campo && campo.value.trim()) {
        campo.classList.add('campo-valido');
      }
    });
  }, 100);
  
  // INICIAR AUTOGUARDADO después de cargar todo
  iniciarAutoguardado();
}


function reiniciarTabla() {
  tabla.innerHTML = "";
  actividades = [...actividadesBase]; // Resetear a actividades base
  actividades.forEach(nombre => agregarFila(nombre));
}


// Función para cambiar de pantallas
function cambiarPantalla(idMostrar) {
    const pantallas = ['pantalla-tiempos', 'pantalla-checklist', 'pantalla-gestion-moldes'];
    pantallas.forEach(id => {
      document.getElementById(id).style.display = (id === idMostrar) ? 'block' : 'none';
    });
    if (idMostrar === 'pantalla-gestion-moldes') {
      mostrarListaMoldes();
    }
  }



// Funciones para la tabla de paros externos
const tablaParos = document.querySelector("#tablaParos tbody");
const parosExternos = {};

function agregarParo() {
  const departamento = document.getElementById("departamentoParo").value;
  const nombre = document.getElementById("nombreParo").value.trim();
  if (nombre === "") {
    alert("Escribe el nombre del paro.");
    return;
  }

  const id = nombre.replace(/\s+/g, "_") + "_" + Date.now();
  const fila = document.createElement("tr");
  
  fila.innerHTML = `
    <td data-label="Departamento">${departamento}</td>
    <td data-label="Paro">${nombre}</td>
    <td data-label="Acciones">
      <button class="btn iniciar" onclick="iniciarParo('${id}')">▶</button>
      <button class="btn pausar" onclick="pausarReanudarParo('${id}', this)">⏸</button>
      <button class="btn detener" onclick="detenerParo('${id}')">⏹</button>
    </td>
    <td data-label="Duración" id="duracion-paro-${id}" 
        ondblclick="editarDuracion('paro', '${id}')"
        ontouchstart="handleTouchStart(this)"
        ontouchend="handleTouchEnd(this)">00:00</td>
    <td data-label="Eliminar">
      <button class="icon-btn" onclick="eliminarParo('${id}', this)">🗑️</button>
    </td>
  `;

  tablaParos.appendChild(fila);

  parosExternos[id] = {
    id,
    departamento,
    nombre,
    inicio: null,
    fin: null,
    tiempoAcumulado: 0,
    estado: "detenido",
    timerID: null
  };

  guardarEstado();
  mostrarToast(`Paro "${nombre}" agregado`, 'success');
  document.getElementById("nombreParo").value = "";
  document.getElementById("departamentoParo").selectedIndex = 0;
}
function iniciarParo(id) {
  const p = parosExternos[id];
  if (!p || p.estado === "corriendo") return;

  p.inicio = new Date();
  p.estado = "corriendo";

  const celda = document.getElementById(`duracion-paro-${id}`);
  p.timerID = setInterval(() => {
    const ahora = new Date();
    const tiempoTotal = p.tiempoAcumulado + (ahora - p.inicio) / 1000;
    celda.innerText = formatearTiempo(tiempoTotal);
  }, 100);

  guardarEstado();
}
function pausarReanudarParo(id, btn) {
  const p = parosExternos[id];
  const celda = document.getElementById(`duracion-paro-${id}`);

  if (p.estado !== "corriendo" && p.estado !== "pausado") {
    mostrarToast(`El paro "${p.nombre}" no se ha iniciado aún`, "warning");
    return;
  }

  if (p.estado === "corriendo") {
    clearInterval(p.timerID);
    p.estado = "pausado";
    const ahora = new Date();
    p.tiempoAcumulado += (ahora - p.inicio) / 1000;
    btn.innerHTML = '<span class="icon-reanudar">▶</span>';
  } else if (p.estado === "pausado") {
    p.inicio = new Date();
    p.estado = "corriendo";
    btn.innerHTML = '<span class="icon-pausar">⏸</span>';
    p.timerID = setInterval(() => {
      const ahora = new Date();
      const tiempoTotal = p.tiempoAcumulado + (ahora - p.inicio) / 1000;
      celda.innerText = formatearTiempo(tiempoTotal);
    }, 100);
  }

  guardarEstado();
}
function detenerParo(id) {
  const p = parosExternos[id];
  if (!p || p.estado === "detenido") return;

  if (p.timerID) clearInterval(p.timerID);

  if (p.estado === "corriendo") {
    const ahora = new Date();
    p.tiempoAcumulado += (ahora - p.inicio) / 1000;
  }

  p.estado = "detenido";
  p.timerID = null;

  const celda = document.getElementById(`duracion-paro-${id}`);
  celda.innerText = formatearTiempo(p.tiempoAcumulado);

  guardarEstado();
}
function eliminarParo(id, btn) {
  const confirmar = confirm("¿Eliminar este paro?");
  if (!confirmar) return;

  if (parosExternos[id].timerID) clearInterval(parosExternos[id].timerID);
  delete parosExternos[id];

  const fila = btn.closest("tr");
  fila.remove();
  mostrarToast(`Paro eliminado`, 'warning');
  guardarEstado();
}



// Función para cargar elementos de la aplicación
window.onload = function() {
  // Mostrar mensaje de carga
  console.log("Cargando estado guardado...");
  
  try {
    cargarEstado();
    inicializarValidacion();

    const fechaInput = document.getElementById("fechaCambio");
    const semanaInput = document.getElementById("semanaCambio");

    if (!fechaInput.value || !semanaInput.value) {
      const hoy = new Date();
      const fechaStr = hoy.toLocaleDateString("es-MX");
      const semana = obtenerNumeroSemana(hoy);
      fechaInput.value = fechaStr;
      semanaInput.value = semana;
    }
    
    console.log("Estado cargado correctamente");
    
  } catch (error) {
    console.error("Error al cargar el estado:", error);
    // En caso de error, crear actividades base
    actividades = [...actividadesBase];
    crearFilasIniciales();
    iniciarAutoguardado();
  }
  inicializarSistemaMoldes();

  // Resto del código del evento onload...
  document.getElementById("btn-reset").addEventListener("click", () => {
    const confirmar = confirm("¿Seguro que quieres borrar todos los datos y reiniciar la aplicación?");
    if (!confirmar) return;

    // Detener autoguardado antes del reset
    detenerAutoguardado();

    function limpiarValidaciones() {
      // Limpiar mensajes de error
      document.querySelectorAll('.mensaje-error').forEach(mensaje => {
        mensaje.style.display = 'none';
      });
      
      // Limpiar estilos de campos
      document.querySelectorAll('.campo-obligatorio, .campo-valido').forEach(campo => {
        campo.classList.remove('campo-obligatorio');
        campo.classList.remove('campo-valido');
      });
      
      // Limpiar mensaje de feedback general
      document.getElementById('feedback').innerText = '';
    }

    // Limpiar localStorage
    localStorage.removeItem("estadoSMED");
    localStorage.removeItem("checklistSMED");

    // Limpiar checklist visual
    const items = document.querySelectorAll("#tabla-checklist input[type=checkbox]");
    items.forEach(item => item.checked = false);

    // Limpiar cronómetros normales
    for (const key in tiempos) {
      if (tiempos[key].timerID) clearInterval(tiempos[key].timerID);
    }
    Object.keys(tiempos).forEach(k => delete tiempos[k]);
    tabla.innerHTML = "";

    // Limpiar cronómetros de paros
    for (const key in parosExternos) {
      if (parosExternos[key].timerID) clearInterval(parosExternos[key].timerID);
    }
    Object.keys(parosExternos).forEach(k => delete parosExternos[k]);
    const tablaParos = document.querySelector("#tablaParos tbody");
    if (tablaParos) tablaParos.innerHTML = "";

    // Limpiar inputs de datos cambio molde
    document.getElementById("inyectora").value = "";
    document.getElementById("moldeSale").value = "";
    document.getElementById("moldeEntra").value = "";
    document.getElementById("tipoCambio").value = "";
    document.getElementById("tiempoObjetivo").value = "";
    document.getElementById("tiempoObjetivo").value = "";
    document.getElementById("fechaCambio").value = "";
    document.getElementById("semanaCambio").value = "";
    document.getElementById("horaInicio").value = "";
    document.getElementById("horaTermino").value = "";
    document.getElementById("razonCambio").value = "";

    // Recargar actividades base
    console.log("Actividades base:", actividades);
    reiniciarTabla();
    const hoy = new Date();
    document.getElementById("fechaCambio").value = hoy.toLocaleDateString("es-MX");
    document.getElementById("semanaCambio").value = obtenerNumeroSemana(hoy);

    setTimeout(() => {
      inicializarSortable(); // Reinicializar Sortable después del reset
      iniciarAutoguardado(); // Reiniciar autoguardado
    }, 500);
  });
}

// Agregar evento beforeunload para guardar al cerrar/recargar
window.addEventListener('beforeunload', function(e) {
  // Guardar estado final antes de salir
  guardarEstado();
  
  // Opcional: Mostrar confirmación si hay cronómetros activos
  const hayCronometrosActivos = Object.values(tiempos).some(t => 
    t && t.estado === "corriendo"
  ) || Object.values(parosExternos).some(p => 
    p && p.estado === "corriendo"
  );
  
  if (hayCronometrosActivos) {
    e.preventDefault();
    e.returnValue = 'Tienes cronómetros activos. ¿Estás seguro de que quieres salir?';
    return e.returnValue;
  }
});



// Tiempos objetivos de cada molde
const tiemposObjetivos = {
  "CYLINDER WITH SLEEVE 176|CC": 495,
  "CYLINDER WITH SLEEVE 176|MxM": 360,
  "CYLINDER WITH SLEEVE 177|CC": 495,
  "CYLINDER WITH SLEEVE 177|MxM": 360,
  "IGNITION COVER 225|CC": 390,
  "IGNITION COVER 225|MxM": 255,
  "BODY BALANCE K5|CC": 480,
  "BODY BALANCE K5|MxM": 345,
  "BODY BALANCE K7|CC": 480,
  "BODY BALANCE K7|MxM": 345,
  "TIMMING 002|CC": 490,
  "TIMMING 002|MxM": 355,
  "TIMMING 661|CC": 490,
  "TIMMING 661|MxM": 355,
  "IGNITION WOLF 852|CC": 420,
  "IGNITION WOLF 852|MxM": 285,
  "IGNITION DOITER 061|CC": 450,
  "IGNITION DOITER 061|MxM": 315,
  "HSG AS 060|CC": 420,
  "HSG AS 060|MxM": 285,
  "HSG MS 071|CC": 420,
  "HSG MS 071|MxM": 285,
  "GHL 331|CC": 420,
  "GHL 331|MxM": 285,
  "GHR 336|CC": 420,
  "GHR 336|MxM": 285,
  "MAIN HOUSING 285|CC": 600,
  "MAIN HOUSING 285|MxM": 465,
  "CLUTCH HOUSING 308|CC": 490,
  "CLUTCH HOUSING 308|MxM": 355,
  "CRANKCASE AS 821|CC": 600,
  "CRANKCASE AS 821|MxM": 465,
  "CRANKCASE AS 822|CC": 600,
  "CRANKCASE AS 822|MxM": 465,
  "CRANKCASE MS 831|CC": 600,
  "CRANKCASE MS 831|MxM": 465,
  "CRANKCASE MS 832|CC": 600,
  "CRANKCASE MS 832|MxM": 465,
  "CRANKCASE HALF 701|CC": 600,
  "CRANKCASE HALF 701|MxM": 465,
  "EATON 697|CC": 555,
  "EATON 697|MxM": 420,
  "EATON 438|CC": 555,
  "EATON 438|MxM": 420,
  "EATON 130|CC": 555,
  "EATON 130|MxM": 420,
  "GHL 055|CC": 420,
  "GHL 055|MxM": 285,
  "TRANSMISSION COVER MIDDLE 045|CC": 600,
  "TRANSMISSION COVER MIDDLE 045|MxM": 465,
  "IGNITION COVER 059|CC": 390,
  "IGNITION COVER 059|MxM": 255,
  "IGNITION COVER 063|CC": 390,
  "IGNITION COVER 063|MxM": 255,
};
function actualizarTiempoObjetivo() {
  const molde = document.getElementById("moldeEntra").value;
  const tipo = document.getElementById("tipoCambio").value;

  const clave = `${molde}|${tipo}`;
  const tiempo = tiemposObjetivos[clave];

  if (tiempo !== undefined) {
    document.getElementById("tiempoObjetivo").value = tiempo;
  }
}



// Función para subir los datos al Google Sheets
function subirADatosGoogle() {
  if (!validarCampos()) {
    const feedback = document.getElementById("feedback");
    feedback.innerHTML = '<span style="color:red">❌ Complete todos los campos obligatorios</span>';
    
    // Hacer scroll al primer campo inválido
    const primerError = document.querySelector('.campo-obligatorio');
    if (primerError) {
      primerError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      primerError.focus();
    }
    
    return;
  }

  const feedback = document.getElementById("feedback");
  feedback.innerText = "Enviando datos...";
  feedback.style.color = "#333";

  const actividadesValidas = Object.values(tiempos).filter(a => a && a.tiempoAcumulado > 0);
  const parosValidos = Object.values(parosExternos).filter(p => p && p.tiempoAcumulado > 0);

  const datos = {
    semanaCambio: document.getElementById("semanaCambio").value,
    razonCambio: document.getElementById("razonCambio").value,
    tipoCambio: document.getElementById("tipoCambio").value,
    fechaCambio: document.getElementById("fechaCambio").value,
    inyectora: document.getElementById("inyectora").value,
    moldeSale: document.getElementById("moldeSale").value,
    moldeEntra: document.getElementById("moldeEntra").value,
    horaInicio: document.getElementById("horaInicio").value,
    horaTermino: document.getElementById("horaTermino").value,
    tiempoObjetivo: document.getElementById("tiempoObjetivo").value,
    actividades: actividadesValidas,
    parosExternos: parosValidos
  };


  console.log("Responsables de actividades:");
  Object.values(tiempos).forEach(a => {
    console.log(a.nombre, "=>", a.responsable);
});
  console.log("Datos enviados:", JSON.stringify(datos, null, 2));

  enviarDatosGoogle(datos)
    .then(resultado => {
        if (resultado.exito) {
            feedback.innerText = "✅ Datos enviados correctamente";
            feedback.style.color = "green";
        } else {
            feedback.innerText = "❌ Error al enviar los datos";
            feedback.style.color = "red";
        }
    })
    .catch(error => {
        console.error('Error al enviar:', error);
        feedback.innerText = "⚠️ Error de conexión";
        feedback.style.color = "orange";
    });
  }

// Funciones para editar la duración de la actividades
function editarDuracion(tipo, id) {
  if (tipo === "actividad" && tiempos[id]) {
    if (tiempos[id].estado === "corriendo") {
      mostrarToast(`La actividad "${id}" debe pausarse o detenerse antes de editar el tiempo.`, "warning");
      return;
    }
  } else if (tipo === "paro" && parosExternos[id]) {
    if (parosExternos[id].estado === "corriendo") {
      mostrarToast(`El paro "${parosExternos[id].nombre}" debe pausarse o detenerse antes de editar el tiempo.`, "warning");
      return;
    }
  }

  // Si pasa la validación, abrimos el editor
  editarDuracionDesktop(tipo, id);
}

function editarDuracionDesktop(tipo, id) {
  // Validar que la actividad/paro no esté corriendo
  if (tipo === "actividad" && tiempos[id]) {
    if (tiempos[id].estado === "corriendo") {
      mostrarToast(`La actividad "${id}" debe pausarse o detenerse antes de editar el tiempo.`, "warning");
      return;
    }
  } else if (tipo === "paro" && parosExternos[id]) {
    if (parosExternos[id].estado === "corriendo") {
      mostrarToast(`El paro "${parosExternos[id].nombre}" debe pausarse o detenerse antes de editar el tiempo.`, "warning");
      return;
    }
  }

  const celdaID = tipo === "actividad" ? `duracion-${id.replace(/\s+/g, "_")}` : `duracion-paro-${id}`;
  const celda = document.getElementById(celdaID);
  if (!celda) return;

  const valorActual = celda.innerText.trim();
  const [minActual, segActual] = valorActual.split(":").map(part => part.padStart(2, '0'));

  // Guardar el estado actual ANTES de editar
  const estadoAnterior = tipo === "actividad" ? tiempos[id].estado : parosExternos[id].estado;

  // Crear modal - ENFOQUE SIMPLIFICADO
  const modal = document.createElement('div');
  modal.id = 'modal-editar-tiempo';
  modal.style.position = 'fixed';
  modal.style.top = '0';
  modal.style.left = '0';
  modal.style.width = '100%';
  modal.style.height = '100%';
  modal.style.backgroundColor = 'rgba(0,0,0,0.5)';
  modal.style.display = 'flex';
  modal.style.justifyContent = 'center';
  modal.style.alignItems = 'center';
  modal.style.zIndex = '10000';

  // Contenedor del editor
  const editor = document.createElement('div');
  editor.style.backgroundColor = 'white';
  editor.style.padding = '20px';
  editor.style.borderRadius = '8px';
  editor.style.width = '300px';
  editor.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';

  editor.innerHTML = `
    <h3 style="margin: 0 0 15px 0; color: #1e37a4; text-align: center;">Editar Tiempo</h3>
    <div style="display: flex; gap: 10px; margin-bottom: 20px; align-items: center; justify-content: center;">
      <div>
        <label style="display: block; margin-bottom: 5px; font-weight: bold; text-align: center;">Minutos</label>
        <input type="number" id="edit-min" value="${parseInt(minActual)}" min="0" max="999" 
               style="width: 80px; padding: 8px; text-align: center; border: 1px solid #ccc; border-radius: 4px; font-size: 16px;">
      </div>
      <span style="font-size: 20px; margin-top: 20px;">:</span>
      <div>
        <label style="display: block; margin-bottom: 5px; font-weight: bold; text-align: center;">Segundos</label>
        <input type="number" id="edit-sec" value="${parseInt(segActual)}" min="0" max="59" 
               style="width: 80px; padding: 8px; text-align: center; border: 1px solid #ccc; border-radius: 4px; font-size: 16px;">
      </div>
    </div>
    <div style="display: flex; gap: 10px;">
      <button type="button" id="edit-cancel" 
              style="flex: 1; padding: 10px; background: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px;">
        Cancelar
      </button>
      <button type="button" id="edit-save" 
              style="flex: 1; padding: 10px; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px;">
        Guardar
      </button>
    </div>
  `;

  modal.appendChild(editor);
  document.body.appendChild(modal);

  // Referencias a los elementos
  const inputMin = document.getElementById('edit-min');
  const inputSec = document.getElementById('edit-sec');
  const btnCancel = document.getElementById('edit-cancel');
  const btnSave = document.getElementById('edit-save');

  // Función para cerrar el modal
  function cerrarModal() {
    if (document.body.contains(modal)) {
      document.body.removeChild(modal);
    }
  }

  // Función para guardar los cambios
  function guardarCambios() {
    const minutos = parseInt(inputMin.value) || 0;
    const segundos = parseInt(inputSec.value) || 0;
    
    if (minutos < 0 || segundos < 0 || segundos > 59) {
      mostrarToast("Valores de tiempo inválidos", "error");
      return;
    }

    const segundosTotales = minutos * 60 + segundos;
    const tiempoFormateado = `${minutos.toString().padStart(2, '0')}:${segundos.toString().padStart(2, '0')}`;

    // Actualizar el objeto correspondiente
    if (tipo === "actividad" && tiempos[id]) {
      tiempos[id].tiempoAcumulado = segundosTotales;
      tiempos[id].duracion = segundosTotales;
      tiempos[id].estado = estadoAnterior;

      // Si estaba corriendo, reiniciar el timer
      if (estadoAnterior === "corriendo") {
        tiempos[id].inicio = new Date();
        if (tiempos[id].timerID) clearInterval(tiempos[id].timerID);
        tiempos[id].timerID = setInterval(() => {
          const ahora = new Date();
          const tiempoTotal = tiempos[id].tiempoAcumulado + (ahora - tiempos[id].inicio) / 1000;
          celda.innerText = formatearTiempo(tiempoTotal);
        }, 100);
      }
    } else if (tipo === "paro" && parosExternos[id]) {
      parosExternos[id].tiempoAcumulado = segundosTotales;
      parosExternos[id].duracion = segundosTotales;
      parosExternos[id].estado = estadoAnterior;

      // Si estaba corriendo, reiniciar el timer
      if (estadoAnterior === "corriendo") {
        parosExternos[id].inicio = new Date();
        if (parosExternos[id].timerID) clearInterval(parosExternos[id].timerID);
        parosExternos[id].timerID = setInterval(() => {
          const ahora = new Date();
          const tiempoTotal = parosExternos[id].tiempoAcumulado + (ahora - parosExternos[id].inicio) / 1000;
          celda.innerText = formatearTiempo(tiempoTotal);
        }, 100);
      }
    }

    // Actualizar la celda visualmente
    celda.innerText = tiempoFormateado;
    guardarEstado();
    cerrarModal();
    
    if (tipo === "actividad") {
      actualizarBotones(id);
    }
    
    mostrarToast("Tiempo actualizado correctamente", "success");
  }

  // Event listeners DIRECTOS - sin delegación
  btnCancel.onclick = cerrarModal;
  btnSave.onclick = guardarCambios;

  // Eventos de teclado
  const handleKeydown = function(e) {
    if (e.key === 'Enter') {
      guardarCambios();
    } else if (e.key === 'Escape') {
      cerrarModal();
    }
  };

  document.addEventListener('keydown', handleKeydown);

  // Cerrar al hacer clic fuera del modal
  modal.onclick = function(e) {
    if (e.target === modal) {
      cerrarModal();
    }
  };

  // Limpiar event listeners cuando se cierre el modal
  const originalCerrarModal = cerrarModal;
  cerrarModal = function() {
    document.removeEventListener('keydown', handleKeydown);
    originalCerrarModal();
  };

  // Enfoque automático
  setTimeout(() => {
    inputMin.focus();
    inputMin.select();
  }, 100);
}


// Funciones para editar la fecha
function editarCampoFecha(idCampo) {
  const campo = document.getElementById(idCampo);

  if (campo.hasAttribute("readonly")) {
    campo.removeAttribute("readonly");
    campo.style.border = "1px solid #ccc";
    campo.style.backgroundColor = "#fff";
    campo.focus();
  }

  campo.addEventListener("blur", () => {
    campo.setAttribute("readonly", true);
    campo.style.border = "";
    campo.style.backgroundColor = "";
    guardarEstado(); // Guardar al terminar edición
  }, { once: true });

  campo.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      campo.blur(); // Forzar blur y guardar
    } else if (e.key === "Escape") {
      campo.value = campo.defaultValue;
      campo.blur();
    }
  });
}
function finalizarEdicionCampoFecha(input, idCampo, valorAnterior) {
  const nuevoValor = input.value.trim();
  const span = document.createElement("input");
  span.type = "text";
  span.id = idCampo;
  span.readOnly = true;
  span.value = nuevoValor;
  span.ondblclick = () => editarCampoFecha(idCampo);
  input.replaceWith(span);
  guardarEstado(); // Opcional si quieres guardar de inmediato
}
function cancelarEdicionCampoFecha(input, idCampo, valorAnterior) {
  const span = document.createElement("input");
  span.type = "text";
  span.id = idCampo;
  span.readOnly = true;
  span.value = valorAnterior;
  span.ondblclick = () => editarCampoFecha(idCampo);
  input.replaceWith(span);
}



// Lista de campos obligatorios
const CAMPOS_OBLIGATORIOS = [
  'inyectora', 
  'moldeSale',
  'moldeEntra',
  'tipoCambio',
  'fechaCambio',
  'semanaCambio',
  'horaInicio',
  'horaTermino',
  'razonCambio'
];



// Función para validar todos los campos
function validarCampos() {
  let valido = true;
  
  CAMPOS_OBLIGATORIOS.forEach(id => {
    const campo = document.getElementById(id);
    const mensaje = campo.parentElement.querySelector('.mensaje-error');
    
    if (!campo.value.trim()) {
      campo.classList.add('campo-obligatorio');
      campo.classList.remove('campo-valido');
      mensaje.style.display = 'block';
      valido = false;
    } else {
      campo.classList.remove('campo-obligatorio');
      campo.classList.add('campo-valido');
      mensaje.style.display = 'none';
    }
  });
  
  return valido;
}



// Funciones para inicializar validación en tiempo real
function inicializarValidacion() {
  CAMPOS_OBLIGATORIOS.forEach(id => {
    const campo = document.getElementById(id);
    if (campo) {
      // Aplicar clase valido si ya tiene contenido al cargar
      if (campo.value.trim()) {
        campo.classList.add('campo-valido');
      }
      
      campo.addEventListener('blur', () => validarCampoIndividual(id));
      campo.addEventListener('input', function() {
        if (this.value.trim()) {
          this.classList.remove('campo-obligatorio');
          this.classList.add('campo-valido');
          this.parentElement.querySelector('.mensaje-error').style.display = 'none';
        } else {
          this.classList.remove('campo-valido');
        }
      });
    }
  });
}
function validarCampoIndividual(id) {
  const campo = document.getElementById(id);
  const mensaje = campo.parentElement.querySelector('.mensaje-error');
  
  if (!campo.value.trim()) {
    campo.classList.add('campo-obligatorio');
    campo.classList.remove('campo-valido');
    mensaje.style.display = 'block';
  } else {
    campo.classList.remove('campo-obligatorio');
    campo.classList.add('campo-valido');
    mensaje.style.display = 'none';
  }
}
function limpiarValidaciones() {
  CAMPOS_OBLIGATORIOS.forEach(id => {
    const campo = document.getElementById(id);
    if (campo) {
      campo.classList.remove('campo-obligatorio');
      const mensaje = campo.parentElement.querySelector('.mensaje-error');
      if (mensaje) mensaje.style.display = 'none';
      
      // Mantener clase valido si tiene contenido
      if (!campo.value.trim()) {
        campo.classList.remove('campo-valido');
      }
    }
  });
  document.getElementById('feedback').innerText = '';
}

// Funciones auxiliares para mejorar experiencia táctil
function handleTouchStart(element) {
  if (isDragging) return;
  // Permitir comportamiento normal si no estamos arrastrando
}

function handleTouchEnd(element) {
  if (isDragging) return;
  // Permitir comportamiento normal si no estamos arrastrando
}

// Prevenir problemas de scroll en móviles durante drag
document.addEventListener('touchmove', function(e) {
  if (isDragging) {
    e.preventDefault();
  }
}, { passive: false });





// =============================================
// SISTEMA DE GESTIÓN DE MOLDES
// =============================================

// Lista de moldes (se cargará desde localStorage o se migrará de la lista actual)
let listaMoldes = [];

// Función para inicializar el sistema de moldes
function inicializarSistemaMoldes() {
  cargarMoldes();
  actualizarSelectsMoldes();
}

// Función para cargar moldes desde localStorage
function cargarMoldes() {
  const moldesGuardados = localStorage.getItem("listaMoldesSMED");
  
  if (moldesGuardados) {
    listaMoldes = JSON.parse(moldesGuardados);
  } else {
    // Migrar de la lista actual en el código
    migrarMoldesDesdeCodigo();
  }
}

// Función para migrar los moldes actuales del código
function migrarMoldesDesdeCodigo() {
  const moldesActuales = [
    "CYLINDER WITH SLEEVE 176",
    "CYLINDER WITH SLEEVE 177", 
    "IGNITION COVER 225",
    "BODY BALANCE K5",
    "BODY BALANCE K7",
    "TIMMING 002",
    "TIMMING 661",
    "IGNITION WOLF 852",
    "IGNITION DOITER 061",
    "HSG AS 060",
    "HSG MS 071",
    "GHL 331",
    "GHR 336",
    "MAIN HOUSING 285",
    "CLUTCH HOUSING 308",
    "CRANKCASE AS 821",
    "CRANKCASE AS 822",
    "CRANKCASE MS 831",
    "CRANKCASE MS 832",
    "CRANKCASE HALF 701",
    "EATON 697",
    "EATON 438",
    "EATON 130",
    "GHL 055",
    "TRANSMISSION COVER MIDDLE 045",
    "IGNITION COVER 059",
    "IGNITION COVER 063"
  ];
  
  listaMoldes = moldesActuales;
  guardarMoldes();
  console.log("✅ Moldes migrados desde código:", listaMoldes.length);
}

// Función para guardar moldes en localStorage
function guardarMoldes() {
  localStorage.setItem("listaMoldesSMED", JSON.stringify(listaMoldes));
}

// Función para actualizar los selects de moldeEntra y moldeSale
function actualizarSelectsMoldes() {
  const selectMoldeEntra = document.getElementById("moldeEntra");
  const selectMoldeSale = document.getElementById("moldeSale");
  
  if (!selectMoldeEntra || !selectMoldeSale) return;
  
  // Guardar valores seleccionados actuales
  const valorEntraActual = selectMoldeEntra.value;
  const valorSaleActual = selectMoldeSale.value;
  
  // Limpiar opciones (excepto la primera)
  selectMoldeEntra.innerHTML = '<option value="">-- Selecciona --</option>';
  selectMoldeSale.innerHTML = '<option value="">-- Selecciona --</option>';
  
  // Agregar moldes
  listaMoldes.forEach(molde => {
    const optionEntra = new Option(molde, molde);
    const optionSale = new Option(molde, molde);
    
    selectMoldeEntra.add(optionEntra);
    selectMoldeSale.add(optionSale);
  });
  
  // Restaurar valores seleccionados si existen
  if (valorEntraActual && listaMoldes.includes(valorEntraActual)) {
    selectMoldeEntra.value = valorEntraActual;
  }
  
  if (valorSaleActual && listaMoldes.includes(valorSaleActual)) {
    selectMoldeSale.value = valorSaleActual;
  }
}

// Función para mostrar la lista de moldes en la pantalla de gestión
// Función para mostrar la lista de moldes en la pantalla de gestión
function mostrarListaMoldes() {
  console.log("🔧 mostrarListaMoldes() ejecutándose...");
  
  const tbody = document.getElementById("lista-moldes");
  console.log("🔧 tbody encontrado:", tbody);
  
  if (!tbody) {
    console.error("❌ ERROR: No se encontró el elemento con id 'lista-moldes'");
    return;
  }
  
  console.log("🔧 listaMoldes:", listaMoldes);
  console.log("🔧 Cantidad de moldes:", listaMoldes.length);
  
  tbody.innerHTML = "";
  
  listaMoldes.forEach((molde, index) => {
    console.log("🔧 Procesando molde:", molde, "índice:", index);
    
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>
        <span class="nombre-molde">${molde}</span>
        <input type="text" class="edit-molde-input" value="${molde}" style="display: none; width: 100%;">
      </td>
      <td>
        <button onclick="editarMolde(${index})" class="btn-editar">✏️ Editar</button>
        <button onclick="eliminarMolde(${index})" class="btn-eliminar">🗑️ Eliminar</button>
        <button onclick="guardarEdicionMolde(${index})" class="btn-guardar" style="display: none;">💾 Guardar</button>
        <button onclick="cancelarEdicionMolde(${index})" class="btn-cancelar" style="display: none;">❌ Cancelar</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
  
  console.log("✅ mostrarListaMoldes() completado");
}

// Función para agregar un nuevo molde
function agregarMolde() {
  const input = document.getElementById("nuevoMoldeNombre");
  const nombre = input.value.trim();
  
  if (!nombre) {
    mostrarToast("Por favor, escribe el nombre del molde", "error");
    return;
  }
  
  if (listaMoldes.includes(nombre)) {
    mostrarToast(`El molde "${nombre}" ya existe`, "error");
    return;
  }
  
  listaMoldes.push(nombre);
  guardarMoldes();
  actualizarSelectsMoldes();
  mostrarListaMoldes();
  
  input.value = "";
  mostrarToast(`Molde "${nombre}" agregado correctamente`, "success");
}

// Función para editar un molde
function editarMolde(index) {
  const fila = document.getElementById("lista-moldes").children[index];
  const nombreSpan = fila.querySelector(".nombre-molde");
  const input = fila.querySelector(".edit-molde-input");
  const btnEditar = fila.querySelector(".btn-editar");
  const btnEliminar = fila.querySelector(".btn-eliminar");
  const btnGuardar = fila.querySelector(".btn-guardar");
  const btnCancelar = fila.querySelector(".btn-cancelar");
  
  nombreSpan.style.display = "none";
  input.style.display = "inline-block";
  btnEditar.style.display = "none";
  btnEliminar.style.display = "none";
  btnGuardar.style.display = "inline-block";
  btnCancelar.style.display = "inline-block";
  
  input.focus();
  input.select();
}

// Función para guardar la edición de un molde
function guardarEdicionMolde(index) {
  const fila = document.getElementById("lista-moldes").children[index];
  const input = fila.querySelector(".edit-molde-input");
  const nuevoNombre = input.value.trim();
  
  if (!nuevoNombre) {
    mostrarToast("El nombre del molde no puede estar vacío", "error");
    return;
  }
  
  if (listaMoldes.includes(nuevoNombre) && nuevoNombre !== listaMoldes[index]) {
    mostrarToast(`El molde "${nuevoNombre}" ya existe`, "error");
    return;
  }
  
  const nombreAnterior = listaMoldes[index];
  listaMoldes[index] = nuevoNombre;
  guardarMoldes();
  actualizarSelectsMoldes();
  mostrarListaMoldes();
  
  mostrarToast(`Molde actualizado: "${nombreAnterior}" → "${nuevoNombre}"`, "success");
}

// Función para cancelar la edición
function cancelarEdicionMolde(index) {
  mostrarListaMoldes();
}

// Función para eliminar un molde
function eliminarMolde(index) {
  const nombreMolde = listaMoldes[index];
  
  if (!confirm(`¿Estás seguro de que quieres eliminar el molde "${nombreMolde}"?`)) {
    return;
  }
  
  listaMoldes.splice(index, 1);
  guardarMoldes();
  actualizarSelectsMoldes();
  mostrarListaMoldes();
  
  mostrarToast(`Molde "${nombreMolde}" eliminado`, "warning");
}














