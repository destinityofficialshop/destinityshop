"use client";

import { useEffect, useMemo, useState } from "react";
import { PaypalCheckout } from "@/components/paypal-checkout";
import { fetchCatalog } from "@/lib/catalog-storage";
import type { Product } from "@/lib/products";

type CartMap = Record<string, Product & { quantity: number }>;

const euro = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" });

const benefits = [
  ["Diseño Innovador", "Cada accesorio está creado para aportar una estética moderna y funcionalidad superior."],
  ["Compra Segura", "Procesos pensados para transacciones protegidas y privacidad total para tu tranquilidad."],
  ["Experiencia Intuitiva", "Navega fácilmente y encuentra lo que necesitas gracias a un catálogo claro y optimizado para móvil."]
];

export function Storefront() {
  const [catalog, setCatalog] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartMap>({});
  const [catalogMessage, setCatalogMessage] = useState("Cargando catálogo...");

  useEffect(() => {
    let active = true;

    async function loadCatalog() {
      try {
        const products = await fetchCatalog();
        if (!active) return;
        setCatalog(products);
        setCatalogMessage("");
      } catch (error) {
        console.error(error);
        if (!active) return;
        setCatalogMessage("No se pudo cargar el catálogo.");
      }
    }

    loadCatalog();
    return () => {
      active = false;
    };
  }, []);

  const items = useMemo(() => Object.values(cart), [cart]);
  const total = useMemo(() => items.reduce((sum, item) => sum + item.price * item.quantity, 0), [items]);
  const cartCount = useMemo(() => items.reduce((sum, item) => sum + item.quantity, 0), [items]);

  function addToCart(product: Product) {
    if (product.stock <= 0) return;

    setCart((current) => {
      const existing = current[product.id];
      const nextQuantity = existing ? existing.quantity + 1 : 1;
      if (nextQuantity > product.stock) return current;

      return { ...current, [product.id]: { ...product, quantity: nextQuantity } };
    });
  }

  function updateQuantity(productId: string, delta: number) {
    setCart((current) => {
      const item = current[productId];
      if (!item) return current;
      const nextQuantity = item.quantity + delta;
      if (nextQuantity <= 0) {
        const { [productId]: removed, ...rest } = current;
        void removed;
        return rest;
      }
      return { ...current, [productId]: { ...item, quantity: Math.min(nextQuantity, item.stock) } };
    });
  }

  function clearCart() {
    setCart({});
  }

  async function handlePaid() {
    clearCart();
    try {
      setCatalog(await fetchCatalog());
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <div className="storefront">
      <header className="site-header">
        <a className="skip-link" href="#contenido">Saltar al contenido</a>
        <div className="container header-shell">
          <a className="brand" href="#inicio" aria-label="Destinity ES inicio">
            <span className="brand-mark">D</span>
            <span>Destinity ES</span>
          </a>
          <nav className="nav-links" aria-label="Navegación principal">
            <a href="#servicios">Servicios</a>
            <a href="#precios">Precios</a>
            <a href="#faq">FAQ</a>
            <a href="#sobre">Sobre</a>
            <a href="#contacto">Contacto</a>
          </nav>
          <a className="cart-link" href="#carrito" aria-label={`Carrito con ${cartCount} artículos`}>
            🛒 <span>{cartCount}</span>
          </a>
        </div>
      </header>

      <main id="contenido">
        <section className="hero" id="inicio">
          <div className="hero-art" aria-hidden="true" />
          <div className="container hero-inner">
            <p className="eyebrow">Destinity ES</p>
            <h1>Accesorios tecnológicos con estilo y confianza</h1>
            <p>
              En Destinity ES, encuentra productos innovadores y funcionales que combinan diseño
              moderno con calidad garantizada. Compra con seguridad y disfruta de una experiencia
              simple y confiable.
            </p>
            <a className="button button-primary" href="#catalogo">Ver catálogo</a>
          </div>
        </section>

        <section className="intro-section" id="servicios">
          <div className="container split-grid">
            <div>
              <p className="eyebrow">Tecnología de vanguardia</p>
              <h2>Tecnología de vanguardia con garantía de confianza</h2>
            </div>
            <div>
              <p>
                Descubre Destinity ES, tu tienda online ideal para accesorios tecnológicos con estilo
                y seguridad en cada compra.
              </p>
              <a className="text-link" href="#catalogo">Explorar catálogo completo</a>
            </div>
          </div>
        </section>

        <section className="catalog-section" id="catalogo">
          <div className="container">
            <div className="section-heading">
              <p className="eyebrow">Catálogo destacado</p>
              <h2>Tecnología y Estilo a Tu Alcance</h2>
              <p>Descubre nuestro catálogo exclusivo de accesorios tecnológicos diseñados para mejorar tu vida diaria con estilo y confianza.</p>
            </div>
            {catalogMessage ? <div className="status error">{catalogMessage}</div> : null}
            <div className="product-grid">
              {catalog.map((product) => (
                <article className="product-card" key={product.id}>
                  <div className="product-image"><span>{product.badge}</span></div>
                  <div className="product-body">
                    <h3>{product.name}</h3>
                    <p className="category">{product.category}</p>
                    <strong className="price">{euro.format(product.price)}</strong>
                    <p>{product.description}</p>
                    <button className="button button-dark" disabled={product.stock <= 0} onClick={() => addToCart(product)}>
                      {product.stock > 0 ? "Añadir al carrito" : "Agotado"}
                    </button>
                    <a className="view-cart" href="#carrito">Ver carrito</a>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="promo-band" id="precios">
          <div className="container promo-content">
            <h2>Tecnología y diseño que inspiran tu día a día</h2>
            <p>Descubre nuestras promociones exclusivas y ahorra en los mejores accesorios tecnológicos con total confianza.</p>
            <a className="button button-light" href="#catalogo">Ver catálogo completo</a>
          </div>
        </section>

        <section className="features" id="faq">
          <div className="container features-grid">
            <div className="feature-copy">
              <p className="eyebrow">Confianza cotidiana</p>
              <h2>Tecnología y estilo para cada día</h2>
              <p>Descubre productos exclusivos que combinan innovación y diseño, pensados para mejorar tu experiencia tecnológica con total confianza.</p>
            </div>
            {benefits.map(([title, copy]) => (
              <article className="feature-card" key={title}>
                <h3>{title}</h3>
                <p>{copy}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="about" id="sobre">
          <div className="container about-card">
            <div className="portrait" aria-hidden="true">CM</div>
            <div>
              <h2>Carlos Méndez</h2>
              <p className="category">Experto en accesorios tecnológicos</p>
              <p>Destinity ES brinda productos tecnológicos con estilo y confianza, respaldados por una atención profesional y eficiente.</p>
            </div>
          </div>
        </section>

        <section className="cart-section" id="carrito">
          <div className="container cart-grid">
            <div className="cart-panel">
              <h2>Tu carrito <span>(artículos: {cartCount})</span></h2>
              {items.length === 0 ? <p className="empty">¡Tu carrito está actualmente vacío!</p> : items.map((item) => (
                <article className="cart-item" key={item.id}>
                  <div>
                    <strong>{item.name}</strong>
                    <p>{euro.format(item.price)} / unidad</p>
                    <div className="quantity-controls">
                      <button onClick={() => updateQuantity(item.id, -1)}>−</button>
                      <span>{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, 1)}>＋</button>
                    </div>
                  </div>
                  <strong>{euro.format(item.price * item.quantity)}</strong>
                </article>
              ))}
              <button className="button button-light" onClick={clearCart}>Empezar a comprar / Vaciar</button>
            </div>
            <div className="checkout-panel" id="contacto">
              <h2>Ir a finalizar compra</h2>
              <div className="summary-row"><span>Subtotal</span><strong>{euro.format(total)}</strong></div>
              <p>Los gastos de envío y descuentos se calculan en el momento del pago.</p>
              <PaypalCheckout items={items} total={total} onPaid={handlePaid} />
            </div>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="container footer-inner">
          <strong>Destinity ES</strong>
          <span>Instagram · Facebook · X</span>
        </div>
      </footer>
    </div>
  );
}
