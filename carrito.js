const productId = new URLSearchParams(window.location.search).get("id");
const detailPage = document.querySelector("#detalle-producto");
const errorMessage = document.querySelector("#detalle-error");
const mainImage = document.querySelector("#detalle-imagen");
const previousImageButton = document.querySelector("#imagen-anterior");
const nextImageButton = document.querySelector("#imagen-siguiente");
const imageIndicator = document.querySelector("#imagen-indicador");
const imageFrame = document.querySelector(".detalle-imagen-marco");
const variantSelect = document.querySelector("#detalle-opcion");
const price = document.querySelector("#detalle-precio");
const stock = document.querySelector("#detalle-stock");
const detailsList = document.querySelector("#detalle-lista");
const addToCartButton = document.querySelector("#agregar-carrito");
const cartFeedback = document.querySelector("#carrito-feedback");
const money = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
});
let selectedProduct = null;
let selectedVariant = null;
let currentImages = [];
let currentImageIndex = 0;

addToCartButton.addEventListener("click", () => {
  if (!selectedProduct || !selectedVariant) return;

  const added = window.PCELCarrito?.add(
    selectedProduct.id,
    selectedVariant.id,
    selectedVariant.stock
  );

  if (!added) {
    cartFeedback.textContent = "Ya agregaste todas las unidades disponibles.";
    return;
  }
  cartFeedback.textContent = "Producto agregado al carrito.";
});

function showImage(index) {
  if (currentImages.length === 0) {
    mainImage.removeAttribute("src");
    imageIndicator.textContent = "";
    previousImageButton.hidden = true;
    nextImageButton.hidden = true;
    return;
  }

  currentImageIndex = (index + currentImages.length) % currentImages.length;
  mainImage.src = currentImages[currentImageIndex];
  imageIndicator.textContent = `${currentImageIndex + 1} / ${currentImages.length}`;
  const showControls = currentImages.length > 1;
  previousImageButton.hidden = !showControls;
  nextImageButton.hidden = !showControls;
}

previousImageButton.addEventListener("click", () => showImage(currentImageIndex - 1));
nextImageButton.addEventListener("click", () => showImage(currentImageIndex + 1));

function showError(message) {
  errorMessage.textContent = message;
  errorMessage.hidden = false;
  detailPage.hidden = true;
}

function showVariant(product, variant) {
  selectedProduct = product;
  selectedVariant = variant;
  price.textContent = money.format(Number(variant.precio));
  stock.textContent = Number(variant.stock) > 0
    ? `${variant.stock} disponibles`
    : "Agotado";
  addToCartButton.disabled = Number(variant.stock) < 1;

  currentImages = variant.imagenes ?? [];
  detailsList.replaceChildren();
  mainImage.alt = `${product.nombre}, imagen principal`;
  showImage(0);

  (variant.detalles ?? []).forEach((detail) => {
    const item = document.createElement("li");
    item.textContent = detail;
    detailsList.append(item);
  });
}

async function loadProduct() {
  if (!productId) {
    showError("No se indicó qué producto mostrar. Regresa al catálogo y selecciona uno.");
    return;
  }

  try {
    const response = await fetch("./importante.json");
    if (!response.ok) throw new Error(`Error HTTP ${response.status}`);

    const products = await response.json();
    const product = products.find((item) => String(item.id) === productId);

    if (!product?.variantes?.length) {
      showError("No encontramos ese producto. Regresa al catálogo y elige otro.");
      return;
    }

    document.title = `${product.nombre} | PCEL2`;
    document.querySelector("#detalle-miga").textContent = product.nombre;
    document.querySelector("#detalle-categoria").textContent = product.categoria ?? "Producto";
    document.querySelector("#detalle-nombre").textContent = product.nombre;
    document.querySelector("#detalle-descripcion").textContent = product.descripcion ?? "";

    product.variantes.forEach((variant, index) => {
      const option = document.createElement("option");
      option.value = String(index);
      option.textContent = variant.opcion;
      variantSelect.append(option);
    });

    variantSelect.addEventListener("change", () => {
      showVariant(product, product.variantes[Number(variantSelect.value)]);
    });

    showVariant(product, product.variantes[0]);
    detailPage.hidden = false;
  } catch (error) {
    console.error("No se pudo cargar el producto:", error);
    showError("No se pudo cargar el producto. Abre esta página con Live Server.");
  }
}

loadProduct();