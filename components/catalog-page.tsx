"use client";

import { useEffect, useMemo, useState } from "react";
import { PageShell, SubpageHero } from "@/components/page-shell";
import { PaypalCheckout } from "@/components/paypal-checkout";
import { fetchCatalog } from "@/lib/catalog-storage";
import type { Product } from "@/lib/products";

type CartMap = Record<string, Product & { quantity: number }>;
const euro = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" });

export function CatalogPage() {
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
    return () => { active = false; };
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

  function clearCart() { setCart({}); }
  async function handlePaid() {
    clearCart();
    try { setCatalog(await fetchCatalog()); } catch (error) { console.error(error); }
  }

  return (
    <PageShell>
      <SubpageHero
        eyebrow="Catálogo destacado"
        title="Tecnología y Estilo a Tu Alcance"
        copy="Compra desde una subpágina dedicada al catálogo, con carrito y checkout separados del resto del contenido corporativo."
      />

      <section className="catalog-section">
        <div className="container">
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
                  <a className="view-cart" href="#carrito">Ver carrito ({cartCount})</a>
                </div>
              </article>
            ))}
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
          <div className="checkout-panel">
            <h2>Ir a finalizar compra</h2>
            <div className="summary-row"><span>Subtotal</span><strong>{euro.format(total)}</strong></div>
            <p>Los gastos de envío y descuentos se calculan en el momento del pago.</p>
            <PaypalCheckout items={items} total={total} onPaid={handlePaid} />
          </div>
        </div>
      </section>
    </PageShell>
  );
}
