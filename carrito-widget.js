(() => {
  const header = document.querySelector(".site-header");
  const headerMain = header?.querySelector(".header-main");
  if (!headerMain) return;

  const storageKey = "pcel2-carrito";
  const money = new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  });
  let products = [];

  header.classList.add("carrito-site-header");
  const actions = document.createElement("div");
  actions.className = "carrito-header-actions";
  const catalogLink = headerMain.querySelector(".header-cta");
  if (catalogLink) {
    catalogLink.replaceWith(actions);
    actions.append(catalogLink);
  } else {
    headerMain.append(actions);
  }

  const openButton = document.createElement("button");
  openButton.className = "carrito-header-button";
  openButton.type = "button";
  openButton.setAttribute("aria-haspopup", "dialog");
  openButton.setAttribute("aria-controls", "panel-carrito");

  const openLabel = document.createElement("span");
  openLabel.textContent = "Carrito";
  const counter = document.createElement("span");
  counter.className = "carrito-contador";
  counter.textContent = "0";
  counter.setAttribute("aria-label", "0 artículos");
  openButton.append(openLabel, counter);
  actions.append(openButton);

  const dialog = document.createElement("dialog");
  dialog.className = "panel-carrito";
  dialog.id = "panel-carrito";
  dialog.setAttribute("aria-labelledby", "carrito-titulo");

  const dialogContent = document.createElement("div");
  dialogContent.className = "panel-carrito-contenido";
  const dialogHeader = document.createElement("header");
  dialogHeader.className = "panel-carrito-encabezado";
  const headingGroup = document.createElement("div");
  const eyebrow = document.createElement("p");
  eyebrow.className = "eyebrow";
  eyebrow.textContent = "PCEL2";
  const heading = document.createElement("h2");
  heading.id = "carrito-titulo";
  heading.textContent = "Tu carrito";
  headingGroup.append(eyebrow, heading);

  const closeButton = document.createElement("button");
  closeButton.className = "carrito-cerrar";
  closeButton.type = "button";
  closeButton.setAttribute("aria-label", "Cerrar carrito");
  closeButton.textContent = "×";
  dialogHeader.append(headingGroup, closeButton);

  const emptyMessage = document.createElement("p");
  emptyMessage.className = "carrito-vacio";
  emptyMessage.textContent = "Todavía no agregas productos.";
  const itemsContainer = document.createElement("div");
  itemsContainer.className = "carrito-articulos";

  const dialogFooter = document.createElement("footer");
  dialogFooter.className = "panel-carrito-pie";
  const subtotalLine = document.createElement("p");
  subtotalLine.append(document.createTextNode("Subtotal"));
  const subtotal = document.createElement("strong");
  subtotal.textContent = money.format(0);
  subtotal.id = "carrito-subtotal";
  subtotalLine.append(subtotal);
  const continueButton = document.createElement("button");
  continueButton.className = "carrito-seguir";
  continueButton.type = "button";
  continueButton.textContent = "Seguir viendo productos";
  const buyButton = document.createElement("button");
  buyButton.className = "carrito-comprar";
  buyButton.type = "button";
  buyButton.textContent = "Comprar";
  dialogFooter.append(subtotalLine, buyButton, continueButton);

  dialogContent.append(dialogHeader, emptyMessage, itemsContainer, dialogFooter);
  dialog.append(dialogContent);
  document.body.append(dialog);

  function readCart() {
    try {
      const savedCart = JSON.parse(localStorage.getItem(storageKey) ?? "[]");
      return Array.isArray(savedCart) ? savedCart : [];
    } catch {
      return [];
    }
  }

  function writeCart(cart) {
    localStorage.setItem(storageKey, JSON.stringify(cart));
    render();
  }

  function findLine(entry) {
    const product = products.find((item) => String(item.id) === String(entry.productId));
    const variant = product?.variantes.find((item) => String(item.id) === String(entry.variantId));
    return product && variant ? { entry, product, variant } : null;
  }

  function render() {
    const cart = readCart();
    const lines = cart.map(findLine).filter(Boolean);
    const count = products.length
      ? lines.reduce((sum, line) => sum + Number(line.entry.quantity || 0), 0)
      : cart.reduce((sum, entry) => sum + Number(entry.quantity || 0), 0);
    const total = lines.reduce(
      (sum, line) => sum + Number(line.variant.precio) * Number(line.entry.quantity || 0),
      0
    );

    counter.textContent = String(count);
    counter.setAttribute("aria-label", `${count} ${count === 1 ? "artículo" : "artículos"}`);
    itemsContainer.replaceChildren();
    subtotal.textContent = money.format(total);
    emptyMessage.hidden = cart.length > 0 && (lines.length > 0 || products.length === 0);
    dialogFooter.hidden = lines.length === 0;
    buyButton.disabled = lines.length === 0;
    if (cart.length > 0 && products.length === 0) {
      emptyMessage.hidden = false;
      emptyMessage.textContent = "Cargando los artículos del carrito…";
      return;
    }
    if (cart.length > 0 && lines.length === 0) {
      emptyMessage.hidden = false;
      emptyMessage.textContent = "No se pudieron encontrar los artículos guardados.";
      return;
    }
    emptyMessage.textContent = "Todavía no agregas productos.";

    lines.forEach(({ entry, product, variant }) => {
      const row = document.createElement("article");
      row.className = "carrito-articulo";

      const image = document.createElement("img");
      image.src = variant.imagenes?.[0] ?? "";
      image.alt = product.nombre;

      const info = document.createElement("div");
      info.className = "carrito-articulo-info";
      const name = document.createElement("h3");
      name.textContent = product.nombre;
      const option = document.createElement("p");
      option.textContent = variant.opcion;
      const linePrice = document.createElement("strong");
      linePrice.textContent = money.format(Number(variant.precio) * entry.quantity);

      const controls = document.createElement("div");
      controls.className = "carrito-cantidad";
      const decrease = document.createElement("button");
      decrease.type = "button";
      decrease.textContent = "−";
      decrease.setAttribute("aria-label", `Quitar una unidad de ${product.nombre}`);
      decrease.addEventListener("click", () => changeQuantity(entry, -1));
      const quantity = document.createElement("span");
      quantity.textContent = String(entry.quantity);
      const increase = document.createElement("button");
      increase.type = "button";
      increase.textContent = "+";
      increase.disabled = Number(entry.quantity) >= Number(variant.stock);
      increase.setAttribute("aria-label", `Agregar una unidad de ${product.nombre}`);
      increase.addEventListener("click", () => changeQuantity(entry, 1));
      const remove = document.createElement("button");
      remove.className = "carrito-quitar";
      remove.type = "button";
      remove.textContent = "Quitar";
      remove.addEventListener("click", () => removeLine(entry));

      controls.append(decrease, quantity, increase, remove);
      info.append(name, option, linePrice, controls);
      row.append(image, info);
      itemsContainer.append(row);
    });
  }

  function changeQuantity(entry, change) {
    const cart = readCart();
    const line = cart.find((item) =>
      String(item.productId) === String(entry.productId)
        && String(item.variantId) === String(entry.variantId)
    );
    if (!line) return;

    const resolved = findLine(line);
    if (!resolved) return;
    const nextQuantity = Number(line.quantity) + change;
    if (nextQuantity < 1) {
      writeCart(cart.filter((item) => item !== line));
      return;
    }
    line.quantity = Math.min(nextQuantity, Number(resolved.variant.stock));
    writeCart(cart);
  }

  function removeLine(entry) {
    writeCart(readCart().filter((item) =>
      String(item.productId) !== String(entry.productId)
        || String(item.variantId) !== String(entry.variantId)
    ));
  }

  openButton.addEventListener("click", () => dialog.showModal());
  closeButton.addEventListener("click", () => dialog.close());
  continueButton.addEventListener("click", () => dialog.close());
  buyButton.addEventListener("click", () => {
    if (readCart().length === 0) return;
    window.alert("Gracias por comprar en PCEL2");
    writeCart([]);
    dialog.close();
  });
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });
  window.addEventListener("storage", render);

  window.PCELCarrito = {
    add(productId, variantId, stockLimit) {
      const cart = readCart();
      const line = cart.find((entry) =>
        String(entry.productId) === String(productId)
          && String(entry.variantId) === String(variantId)
      );
      const variant = products
        .find((item) => String(item.id) === String(productId))
        ?.variantes.find((item) => String(item.id) === String(variantId));
      const limit = Number(variant?.stock ?? stockLimit);

      if ((Number(line?.quantity) || 0) >= limit) return false;
      if (line) line.quantity = (Number(line.quantity) || 0) + 1;
      else cart.push({ productId, variantId, quantity: 1 });

      try {
        writeCart(cart);
      } catch {
        return false;
      }
      dialog.showModal();
      return true;
    },
    refresh: render,
  };

  render();
  fetch("./importante.json")
    .then((response) => {
      if (!response.ok) throw new Error(`Error HTTP ${response.status}`);
      return response.json();
    })
    .then((catalog) => {
      products = catalog;
      render();
    })
    .catch((error) => console.error("No se pudo cargar el carrito:", error));
})();