const contenedor = document.querySelector("#productos");
const searchForm = document.querySelector("#catalog-search");
const searchInput = document.querySelector("#catalog-search-input");
const categoryFilter = document.querySelector("#catalog-category-filter");
const clearSearchButton = document.querySelector("#catalog-search-clear");
const resultCount = document.querySelector("#catalog-result-count");
const formatoPrecio = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
});
const easterEggDialog = document.querySelector("#easter-egg-dialog");
let productosCatalogo = [];

document.querySelector("#easter-egg-open").addEventListener("click", () => {
  easterEggDialog.showModal();
});

document.querySelector("#easter-egg-close").addEventListener("click", () => {
  easterEggDialog.close();
});

easterEggDialog.addEventListener("click", (event) => {
  if (event.target === easterEggDialog) easterEggDialog.close();
});

function normalizarTexto(texto) {
  return String(texto ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es-MX");
}

function mostrarProductos(consulta = "") {
  const termino = normalizarTexto(consulta.trim());
  const categoriaElegida = normalizarTexto(categoryFilter.value);
  const filtrados = productosCatalogo.filter((producto) => {
    const datos = [
      producto.nombre,
      producto.categoria,
      producto.descripcion,
      ...producto.variantes.flatMap((variante) => [
        variante.opcion,
        ...(variante.detalles ?? []),
      ]),
    ].join(" ");
    const coincideTexto = normalizarTexto(datos).includes(termino);
    const coincideCategoria = !categoriaElegida
      || normalizarTexto(producto.categoria) === categoriaElegida;
    return coincideTexto && coincideCategoria;
  });

  contenedor.replaceChildren();
  resultCount.textContent = `${filtrados.length} ${filtrados.length === 1 ? "producto encontrado" : "productos encontrados"}`;

  filtrados.forEach((producto) => {
    if (!producto.variantes?.length) return;

    const tarjeta = document.createElement("a");
    tarjeta.className = "producto-resumen";
    tarjeta.href = `carrito.html?id=${encodeURIComponent(producto.id)}`;
    tarjeta.setAttribute("aria-label", `Ver ${producto.nombre} y sus opciones`);

    const imagen = document.createElement("img");
    imagen.className = "producto-resumen-imagen";
    imagen.src = producto.variantes[0].imagenes?.[0] ?? "";
    imagen.alt = producto.nombre;

    const contenido = document.createElement("div");
    contenido.className = "producto-resumen-contenido";

    const categoria = document.createElement("p");
    categoria.className = "producto-resumen-categoria";
    categoria.textContent = producto.categoria ?? "Producto";

    const nombre = document.createElement("h2");
    nombre.textContent = producto.nombre;

    const descripcion = document.createElement("p");
    descripcion.className = "producto-resumen-descripcion";
    descripcion.textContent = producto.descripcion ?? "";

    const precios = producto.variantes
      .map((variante) => Number(variante.precio))
      .filter(Number.isFinite);
    const precioDesde = document.createElement("p");
    precioDesde.className = "producto-resumen-precio";
    precioDesde.textContent = precios.length
      ? `Desde ${formatoPrecio.format(Math.min(...precios))}`
      : "Consultar precio";

    const opciones = document.createElement("p");
    opciones.className = "producto-resumen-opciones";
    opciones.textContent = `${producto.variantes.length} ${producto.variantes.length === 1 ? "opción disponible" : "opciones disponibles"}`;

    const llamada = document.createElement("span");
    llamada.className = "producto-resumen-llamada";
    llamada.textContent = "Ver producto y opciones →";

    contenido.append(categoria, nombre, descripcion, precioDesde, opciones, llamada);
    tarjeta.append(imagen, contenido);
    contenedor.append(tarjeta);
  });

  if (filtrados.length === 0) {
    const mensaje = document.createElement("p");
    mensaje.className = "catalog-empty";
    mensaje.textContent = "No encontramos productos con esa búsqueda.";
    contenedor.append(mensaje);
  }
}

searchInput.addEventListener("input", () => mostrarProductos(searchInput.value));
categoryFilter.addEventListener("change", () => mostrarProductos(searchInput.value));
searchForm.addEventListener("submit", (event) => {
  event.preventDefault();
  mostrarProductos(searchInput.value);
});
clearSearchButton.addEventListener("click", () => {
  searchInput.value = "";
  categoryFilter.value = "";
  searchInput.focus();
  mostrarProductos();
});

async function cargarProductos() {
  try {
    const respuesta = await fetch("./importante.json");
    if (!respuesta.ok) throw new Error(`Error HTTP ${respuesta.status}`);

    productosCatalogo = await respuesta.json();
    const categorias = [...new Set(
      productosCatalogo
        .map((producto) => producto.categoria?.trim())
        .filter(Boolean)
    )].sort((a, b) => a.localeCompare(b, "es-MX"));

    categorias.forEach((categoria) => {
      const opcion = document.createElement("option");
      opcion.value = categoria;
      opcion.textContent = categoria;
      categoryFilter.append(opcion);
    });

    mostrarProductos(searchInput.value);
  } catch (error) {
    console.error("No se pudieron cargar los productos:", error);
    contenedor.textContent = "No se pudo cargar el catálogo. Abre esta página con Live Server.";
    resultCount.textContent = "";
  }
}

cargarProductos();