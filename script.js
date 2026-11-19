// ===== CONFIGURACIÓN =====
// Cambiá este número por tu WhatsApp real (código país + número sin 0 ni 15)
const WHATSAPP_NUMERO = "5493510000000"; // Ejemplo: 5493515551234

// ===== FILTROS Y BÚSQUEDA =====
const botonesFiltro = document.querySelectorAll("[data-filtro]");
const productos = document.querySelectorAll(".producto");
const busqueda = document.getElementById("busqueda");
const sinResultados = document.getElementById("sin-resultados");

let filtroActual = "Todos";

function actualizarCatalogo() {
  const texto = busqueda.value.toLowerCase().trim();
  let cantidadVisible = 0;

  productos.forEach(function (producto) {
    const coincideCategoria =
      filtroActual === "Todos" ||
      producto.dataset.categoria === filtroActual;

    const coincideTexto =
      producto.textContent.toLowerCase().includes(texto);

    const mostrar = coincideCategoria && coincideTexto;
    producto.hidden = !mostrar;

    if (mostrar) cantidadVisible++;
  });

  sinResultados.hidden = cantidadVisible > 0;
}

botonesFiltro.forEach(function (boton) {
  boton.addEventListener("click", function () {
    filtroActual = boton.dataset.filtro;
    botonesFiltro.forEach(function (otro) {
      otro.classList.toggle("activo", otro === boton);
    });
    actualizarCatalogo();
  });
});

busqueda.addEventListener("input", actualizarCatalogo);

document.querySelectorAll(".categorias a").forEach(function (enlace) {
  enlace.addEventListener("click", function () {
    filtroActual = enlace.dataset.categoria;
    botonesFiltro.forEach(function (boton) {
      boton.classList.toggle("activo", boton.dataset.filtro === filtroActual);
    });
    actualizarCatalogo();
  });
});

// ===== CONTACTO =====
document.getElementById("boton-contacto").addEventListener("click", function () {
  document.getElementById("mensaje").textContent =
    "¡Gracias por visitar la tienda! Escribinos por WhatsApp o correo.";
});

// ===== MODO ADMINISTRADOR =====
const btnModoAdmin = document.getElementById("modo-admin");
let modoAdmin = localStorage.getItem("modoAdmin") === "true";

function actualizarModoAdmin() {
  document.body.classList.toggle("modo-admin", modoAdmin);
  btnModoAdmin.classList.toggle("activo", modoAdmin);
  localStorage.setItem("modoAdmin", modoAdmin);
}

btnModoAdmin.addEventListener("click", function () {
  modoAdmin = !modoAdmin;
  actualizarModoAdmin();
});

actualizarModoAdmin();

// ===== AGOTADOS =====
let agotados = JSON.parse(localStorage.getItem("agotados")) || [];

function aplicarAgotados() {
  productos.forEach(function (producto) {
    const id = producto.dataset.id;
    const estaAgotado = agotados.includes(id);
    producto.classList.toggle("agotado", estaAgotado);

    const btn = producto.querySelector(".btn-agotado");
    if (btn) {
      btn.textContent = estaAgotado ? "Quitar agotado" : "Marcar agotado";
      btn.classList.toggle("marcado", estaAgotado);
    }

    const btnAgregar = producto.querySelector(".agregar-carrito");
    if (btnAgregar) {
      btnAgregar.disabled = estaAgotado;
      if (estaAgotado) btnAgregar.textContent = "Agotado";
      else btnAgregar.textContent = "Agregar";
    }
  });
}

document.querySelectorAll(".btn-agotado").forEach(function (btn) {
  btn.addEventListener("click", function () {
    const id = btn.dataset.id;
    if (agotados.includes(id)) {
      agotados = agotados.filter((x) => x !== id);
    } else {
      agotados.push(id);
    }
    localStorage.setItem("agotados", JSON.stringify(agotados));
    aplicarAgotados();
  });
});

aplicarAgotados();

// ===== CARRITO =====
let carrito = JSON.parse(localStorage.getItem("carrito")) || [];

const carritoPanel = document.getElementById("carrito-panel");
const carritoOverlay = document.getElementById("carrito-overlay");
const carritoItems = document.getElementById("carrito-items");
const carritoVacio = document.getElementById("carrito-vacio");
const carritoFooter = document.getElementById("carrito-footer");
const carritoContador = document.getElementById("carrito-contador");
const carritoTotal = document.getElementById("carrito-total");

function guardarCarrito() {
  localStorage.setItem("carrito", JSON.stringify(carrito));
}

function formatoPrecio(numero) {
  return "$ " + Number(numero).toLocaleString("es-AR");
}

function actualizarContador() {
  const totalItems = carrito.reduce((acc, item) => acc + item.cantidad, 0);
  carritoContador.textContent = totalItems;
}

function renderizarCarrito() {
  carritoItems.innerHTML = "";

  if (carrito.length === 0) {
    carritoVacio.hidden = false;
    carritoFooter.hidden = true;
    actualizarContador();
    return;
  }

  carritoVacio.hidden = true;
  carritoFooter.hidden = false;

  let total = 0;

  carrito.forEach(function (item) {
    total += item.precio * item.cantidad;

    const imgHtml = item.imagen
      ? `<img src="${item.imagen}" alt="${item.nombre}">`
      : `<div style="width:70px;height:70px;background:#e8e4dc;border-radius:8px;display:grid;place-items:center;font-size:28px">✦</div>`;

    const div = document.createElement("div");
    div.className = "carrito-item";
    div.innerHTML = `
      ${imgHtml}
      <div class="carrito-item-info">
        <h4>${item.nombre}</h4>
        <div class="precio">${formatoPrecio(item.precio)}</div>
        <div class="carrito-item-controles">
          <button class="restar" data-id="${item.id}">−</button>
          <span>${item.cantidad}</span>
          <button class="sumar" data-id="${item.id}">+</button>
          <button class="btn-eliminar" data-id="${item.id}" title="Eliminar">🗑</button>
        </div>
      </div>
    `;
    carritoItems.appendChild(div);
  });

  carritoTotal.textContent = formatoPrecio(total);
  actualizarContador();

  carritoItems.querySelectorAll(".sumar").forEach(function (btn) {
    btn.addEventListener("click", () => cambiarCantidad(btn.dataset.id, 1));
  });
  carritoItems.querySelectorAll(".restar").forEach(function (btn) {
    btn.addEventListener("click", () => cambiarCantidad(btn.dataset.id, -1));
  });
  carritoItems.querySelectorAll(".btn-eliminar").forEach(function (btn) {
    btn.addEventListener("click", () => eliminarDelCarrito(btn.dataset.id));
  });
}

function agregarAlCarrito(producto) {
  if (agotados.includes(producto.id)) {
    mostrarToast("Este producto está agotado");
    return;
  }

  const existente = carrito.find((item) => item.id === producto.id);
  if (existente) {
    existente.cantidad++;
  } else {
    carrito.push({
      id: producto.id,
      nombre: producto.nombre,
      precio: Number(producto.precio),
      imagen: producto.imagen || "",
      cantidad: 1,
    });
  }

  guardarCarrito();
  renderizarCarrito();
  mostrarToast("Agregado al carrito");
}

function cambiarCantidad(id, cambio) {
  const item = carrito.find((i) => i.id === id);
  if (!item) return;
  item.cantidad += cambio;
  if (item.cantidad <= 0) {
    carrito = carrito.filter((i) => i.id !== id);
  }
  guardarCarrito();
  renderizarCarrito();
}

function eliminarDelCarrito(id) {
  carrito = carrito.filter((i) => i.id !== id);
  guardarCarrito();
  renderizarCarrito();
}

function vaciarCarrito() {
  carrito = [];
  guardarCarrito();
  renderizarCarrito();
}

function abrirCarrito() {
  carritoPanel.classList.add("activo");
  carritoOverlay.classList.add("activo");
  document.body.style.overflow = "hidden";
}

function cerrarCarrito() {
  carritoPanel.classList.remove("activo");
  carritoOverlay.classList.remove("activo");
  document.body.style.overflow = "";
}

function mostrarToast(mensaje) {
  let toast = document.querySelector(".toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.className = "toast";
    document.body.appendChild(toast);
  }
  toast.textContent = mensaje;
  toast.classList.add("activo");
  setTimeout(() => toast.classList.remove("activo"), 1800);
}

document.querySelectorAll(".agregar-carrito").forEach(function (boton) {
  boton.addEventListener("click", function () {
    if (boton.disabled) return;
    agregarAlCarrito({
      id: boton.dataset.id,
      nombre: boton.dataset.nombre,
      precio: boton.dataset.precio,
      imagen: boton.dataset.imagen,
    });
    boton.classList.add("agregado");
    boton.textContent = "✓ Agregado";
    setTimeout(() => {
      if (!agotados.includes(boton.dataset.id)) {
        boton.classList.remove("agregado");
        boton.textContent = "Agregar";
      }
    }, 1200);
  });
});

document.getElementById("abrir-carrito").addEventListener("click", abrirCarrito);
document.getElementById("cerrar-carrito").addEventListener("click", cerrarCarrito);
carritoOverlay.addEventListener("click", cerrarCarrito);
document.getElementById("vaciar-carrito").addEventListener("click", vaciarCarrito);

// WhatsApp
document.getElementById("finalizar-compra").addEventListener("click", function () {
  if (carrito.length === 0) return;

  let mensaje = "¡Hola! Quiero consultar por estos productos:%0A%0A";
  let total = 0;

  carrito.forEach(function (item) {
    mensaje += `• ${item.nombre} x${item.cantidad} — ${formatoPrecio(item.precio * item.cantidad)}%0A`;
    total += item.precio * item.cantidad;
  });

  mensaje += `%0A*Total: ${formatoPrecio(total)}*`;

  const url = `https://wa.me/${WHATSAPP_NUMERO}?text=${mensaje}`;
  window.open(url, "_blank");
});

renderizarCarrito();

// ===== COMENTARIOS =====
let comentarios = JSON.parse(localStorage.getItem("comentarios")) || [
  {
    id: 1,
    nombre: "Sofía M.",
    texto: "Excelente atención y el Catan llegó impecable. ¡Recomendado!",
    fecha: "2026-09-10",
    respuesta: "¡Gracias Sofía! Nos alegra que te haya gustado.",
  },
  {
    id: 2,
    nombre: "Martín R.",
    texto: "Compré el Warhammer y está genial. ¿Van a traer más de Space Marines?",
    fecha: "2026-09-15",
    respuesta: null,
  },
];

const listaComentarios = document.getElementById("lista-comentarios");

function guardarComentarios() {
  localStorage.setItem("comentarios", JSON.stringify(comentarios));
}

function renderizarComentarios() {
  if (comentarios.length === 0) {
    listaComentarios.innerHTML = '<p class="sin-comentarios">Todavía no hay comentarios. ¡Sé el primero!</p>';
    return;
  }

  listaComentarios.innerHTML = "";

  comentarios
    .slice()
    .reverse()
    .forEach(function (c) {
      const div = document.createElement("div");
      div.className = "comentario";
      div.dataset.id = c.id;

      let respuestaHtml = "";
      if (c.respuesta) {
        respuestaHtml = `
          <div class="comentario-respuesta">
            <strong>Respuesta de la tienda</strong>
            <p>${c.respuesta}</p>
          </div>
        `;
      }

      div.innerHTML = `
        <div class="comentario-header">
          <strong>${c.nombre}</strong>
          <small>${c.fecha}</small>
        </div>
        <p>${c.texto}</p>
        ${respuestaHtml}
        <div class="form-respuesta">
          <input type="text" placeholder="Escribí tu respuesta..." class="input-respuesta">
          <button class="btn-responder" data-id="${c.id}">Responder</button>
        </div>
      `;

      listaComentarios.appendChild(div);
    });

  // Eventos de responder (solo visibles en modo admin)
  listaComentarios.querySelectorAll(".btn-responder").forEach(function (btn) {
    btn.addEventListener("click", function () {
      const id = Number(btn.dataset.id);
      const input = btn.parentElement.querySelector(".input-respuesta");
      const texto = input.value.trim();
      if (!texto) return;

      const comentario = comentarios.find((c) => c.id === id);
      if (comentario) {
        comentario.respuesta = texto;
        guardarComentarios();
        renderizarComentarios();
        mostrarToast("Respuesta publicada");
      }
    });
  });
}

document.getElementById("form-comentario").addEventListener("submit", function (e) {
  e.preventDefault();

  const nombre = document.getElementById("comentario-nombre").value.trim();
  const texto = document.getElementById("comentario-texto").value.trim();

  if (!nombre || !texto) return;

  const hoy = new Date();
  const fecha = hoy.toISOString().slice(0, 10);

  comentarios.push({
    id: Date.now(),
    nombre: nombre,
    texto: texto,
    fecha: fecha,
    respuesta: null,
  });

  guardarComentarios();
  renderizarComentarios();

  document.getElementById("form-comentario").reset();
  const aviso = document.getElementById("aviso-comentario");
  aviso.hidden = false;
  setTimeout(() => (aviso.hidden = true), 2500);
});

renderizarComentarios();
