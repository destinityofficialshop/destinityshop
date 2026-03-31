"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchCatalog } from "@/lib/catalog-storage";
import { PaypalCheckout } from "@/components/paypal-checkout";
import type { Product } from "@/lib/products";

type CartMap = Record<string, Product & { quantity: number }>;

const euro = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR"
});

export function Storefront() {
  const [catalog, setCatalog] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartMap>({});
  const [catalogMessage, setCatalogMessage] = useState("Cargando catalogo...");

  useEffect(() => {
    let active = true;

    async function loadCatalog() {
      try {
        const products = await fetchCatalog();
        if (!active) {
          return;
        }

        setCatalog(products);
        setCatalogMessage("");
      } catch (error) {
        console.error(error);
        if (!active) {
          return;
        }

        setCatalogMessage("No se pudo cargar el catalogo.");
      }
    }

    loadCatalog();

    return () => {
      active = false;
    };
  }, []);

  const items = useMemo(() => Object.values(cart), [cart]);
  const total = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items]
  );
  const cartCount = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items]
  );

  function addToCart(product: Product) {
    if (product.stock <= 0) {
      return;
    }

    setCart((current) => {
      const existing = current[product.id];
      const nextQuantity = existing ? existing.quantity + 1 : 1;

      if (nextQuantity > product.stock) {
        return current;
      }

      return {
        ...current,
        [product.id]: {
          ...product,
          quantity: nextQuantity
        }
      };
    });
  }

  function updateQuantity(productId: string, delta: number) {
    setCart((current) => {
      const item = current[productId];

      if (!item) {
        return current;
      }

      const nextQuantity = item.quantity + delta;
      if (nextQuantity <= 0) {
        const { [productId]: removed, ...rest } = current;
        void removed;
        return rest;
      }

      return {
        ...current,
        [productId]: {
          ...item,
          quantity: Math.min(nextQuantity, item.stock)
        }
      };
    });
  }

  function clearCart() {
    setCart({});
  }

  async function handlePaid() {
    clearCart();

    try {
      const products = await fetchCatalog();
      setCatalog(products);
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <div className="storefront">
      <div className="announcement-bar">
        Envio premium en Peninsula, pago seguro con PayPal y una base visual mas cercana a Shopify.
      </div>

      <header className="header">
        <div className="container header-shell">
          <a className="logo" href="#top">
            <span className="logo-badge">D</span>
            <span>Destinity ES</span>
          </a>
          <nav className="nav-links">
            <a href="#catalogo">Catalogo</a>
            <a href="#colecciones">Colecciones</a>
            <a href="#checkout">Checkout</a>
            <a href="/admin">Admin</a>
          </nav>
          <div className="header-actions">
            <a className="button button-secondary" href="#colecciones">
              Descubrir
            </a>
            <a className="cart-button" href="#checkout">
              Carrito ({cartCount})
            </a>
          </div>
        </div>
      </header>

      <main id="top">
        <section className="hero">
          <div className="container hero-grid">
            <div className="hero-content">
              <p className="eyebrow">Tienda online premium</p>
              <h1 className="hero-title">Un storefront limpio, vendible y listo para cobrar.</h1>
              <p className="hero-copy">
                Destinity ES ahora nace como una tienda React/Next.js con una direccion visual
                cercana a Shopify: bloques claros, producto al frente y checkout conectado a tu
                cuenta de PayPal Developer.
              </p>
              <div className="hero-cta">
                <a className="button button-primary" href="#catalogo">
                  Comprar ahora
                </a>
                <a className="button button-secondary" href="#checkout">
                  Ver checkout
                </a>
              </div>
              <div className="hero-metrics">
                <div className="metric">
                  <strong>48h</strong>
                  <span>Tiempo de preparacion de pedidos en el ejemplo.</span>
                </div>
                <div className="metric">
                  <strong>App Router</strong>
                  <span>Base moderna para crecer a colecciones, CMS o admin.</span>
                </div>
                <div className="metric">
                  <strong>PayPal API</strong>
                  <span>Checkout real listo para activar con tus credenciales.</span>
                </div>
              </div>
            </div>

            <aside className="hero-panel">
              <div className="hero-panel-inner">
                <span className="hero-panel-tag">Launch edit</span>
                <h2 className="hero-panel-title">Curated objects for digital living.</h2>
                <p>
                  Un bloque hero más comercial, con ritmo visual y jerarquía clara para empujar la
                  conversión desde la primera pantalla.
                </p>
                <ul className="hero-list">
                  <li>Colecciones destacadas y tarjetas con lectura inmediata.</li>
                  <li>Carrito claro para compras rápidas.</li>
                  <li>Base preparada para ampliar catálogo, CMS o inventario real.</li>
                </ul>
              </div>
            </aside>
          </div>
        </section>

        <section className="section" id="colecciones">
          <div className="container">
            <div className="promo-grid">
              <article className="promo-card">
                <strong>New arrival flow</strong>
                <span className="small-copy">
                  Presentacion sobria de productos destacados como en un storefront moderno.
                </span>
              </article>
              <article className="promo-card">
                <strong>Pago visible</strong>
                <span className="small-copy">
                  La integracion de PayPal queda visible desde la ficha comercial.
                </span>
              </article>
              <article className="promo-card">
                <strong>Base escalable</strong>
                <span className="small-copy">
                  Estructura pensada para migrar luego a CMS, base de datos o panel admin.
                </span>
              </article>
            </div>
          </div>
        </section>

        <section className="section" id="catalogo">
          <div className="container">
            <div className="section-header">
              <div>
                <p className="eyebrow">Catalogo</p>
                <h2 className="section-title">Shop the edit</h2>
              </div>
              <p className="section-copy">
                Productos demo listos para sustituir por tu catálogo real.
              </p>
            </div>

            {catalogMessage ? <div className="checkout-status error">{catalogMessage}</div> : null}

            <div className="product-grid">
              {catalog.map((product) => (
                <article className="product-card" key={product.id}>
                  <div className="product-media">
                    <span className="product-media-label">{product.badge}</span>
                  </div>
                  <div className="product-body">
                    <div className="product-head">
                      <div>
                        <p className="eyebrow">{product.category}</p>
                        <h3 className="product-name">{product.name}</h3>
                      </div>
                      <span className="price">{euro.format(product.price)}</span>
                    </div>
                    <p className="product-copy">{product.description}</p>
                    <div className="product-actions">
                      <span className="small-copy">
                        {product.stock > 0
                          ? `${product.stock} uds. disponibles`
                          : "Sin stock temporalmente"}
                      </span>
                      <button
                        className="button button-primary"
                        disabled={product.stock <= 0}
                        onClick={() => addToCart(product)}
                      >
                        {product.stock > 0 ? "Anadir al carrito" : "Agotado"}
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section">
          <div className="container story-grid">
            <article className="story-card">
              <p className="eyebrow">Brand story</p>
              <h2 className="section-title">Una estética más alineada con una tienda que vende.</h2>
              <p className="story-copy">
                Simplifiqué la navegación, ordené el hero como una landing comercial y dejé una
                rejilla de producto clara, con el comportamiento visual que suele esperarse en un
                storefront tipo Shopify.
              </p>
            </article>
            <article className="story-card alt">
              <p className="eyebrow">What ships now</p>
              <ul className="story-list">
                <li>App Router en Next.js y componentes React reutilizables.</li>
                <li>Rutas API para crear y capturar pedidos con PayPal.</li>
                <li>Carrito local que ya controla cantidades y total del pedido.</li>
              </ul>
            </article>
          </div>
        </section>

        <section className="section" id="checkout">
          <div className="container commerce-grid">
            <div className="cart-panel">
              <div className="cart-header">
                <div>
                  <p className="eyebrow">Carrito</p>
                  <h2 className="section-title">Tu pedido</h2>
                </div>
                <button className="button button-secondary" onClick={clearCart}>
                  Vaciar
                </button>
              </div>

              <div className="cart-list">
                {items.length === 0 ? (
                  <div className="cart-empty">
                    El carrito está vacío. Añade productos para activar el checkout real.
                  </div>
                ) : (
                  items.map((item) => (
                    <article className="cart-item" key={item.id}>
                      <div className="cart-item-visual" />
                      <div>
                        <p className="cart-item-title">{item.name}</p>
                        <span className="cart-item-meta">{euro.format(item.price)} por unidad</span>
                        <div className="quantity-controls">
                          <button
                            className="quantity-button"
                            onClick={() => updateQuantity(item.id, -1)}
                          >
                            -
                          </button>
                          <span>{item.quantity}</span>
                          <button
                            className="quantity-button"
                            onClick={() => updateQuantity(item.id, 1)}
                          >
                            +
                          </button>
                        </div>
                      </div>
                      <strong>{euro.format(item.price * item.quantity)}</strong>
                    </article>
                  ))
                )}
              </div>
            </div>

            <div className="checkout-panel">
              <p className="eyebrow">Checkout</p>
              <h2 className="section-title">Pago rápido y seguro</h2>
              <p className="section-copy">
                El total se calcula en cliente y el pedido se crea en el backend de Next.js usando
                tu cuenta de PayPal.
              </p>

              <div className="summary">
                <div className="summary-row">
                  <span>Subtotal</span>
                  <strong>{euro.format(total)}</strong>
                </div>
                <div className="summary-row">
                  <span>Envío</span>
                  <strong>Gratis</strong>
                </div>
                <div className="summary-row summary-total">
                  <span>Total</span>
                  <strong>{euro.format(total)}</strong>
                </div>
              </div>

              <PaypalCheckout items={items} total={total} onPaid={handlePaid} />
            </div>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="container">
          Destinity ES. Base de tienda en Next.js preparada para catálogo real, CMS e integración
          completa de PayPal.
        </div>
      </footer>
    </div>
  );
}
