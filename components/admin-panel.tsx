"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchCatalog, fetchOrders, resetCatalog, saveCatalog } from "@/lib/catalog-storage";
import type { OrderRecord } from "@/lib/store-data";
import type { Product } from "@/lib/products";

type ProductForm = {
  id: string;
  name: string;
  category: string;
  description: string;
  price: string;
  badge: string;
  stock: string;
};

const emptyForm: ProductForm = {
  id: "",
  name: "",
  category: "",
  description: "",
  price: "",
  badge: "",
  stock: ""
};

export function AdminPanel() {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [notice, setNotice] = useState("Cargando catalogo...");

  useEffect(() => {
    let active = true;

    async function bootstrap() {
      try {
        const [catalog, orderHistory] = await Promise.all([fetchCatalog(), fetchOrders()]);

        if (!active) {
          return;
        }

        setProducts(catalog);
        setOrders(orderHistory);
        setNotice("Catálogo y pedidos cargados desde el servidor.");
      } catch (error) {
        console.error(error);
        if (!active) {
          return;
        }

        setNotice("No se pudo cargar el panel admin.");
      }
    }

    bootstrap();

    return () => {
      active = false;
    };
  }, []);

  const sortedProducts = useMemo(
    () => [...products].sort((left, right) => left.name.localeCompare(right.name, "es")),
    [products]
  );

  async function persist(nextProducts: Product[], message: string) {
    const stored = await saveCatalog(nextProducts);
    setProducts(stored);
    setNotice(message);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const candidateId = slugify(form.id || form.name);
    const price = Number(form.price);
    const stock = Number(form.stock);

    if (
      !candidateId ||
      !form.name.trim() ||
      !form.category.trim() ||
      !form.description.trim() ||
      !form.badge.trim() ||
      !Number.isFinite(price) ||
      price <= 0 ||
      !Number.isInteger(stock) ||
      stock < 0
    ) {
      setNotice("Completa todos los campos con un precio válido y stock entero.");
      return;
    }

    const product: Product = {
      id: candidateId,
      name: form.name.trim(),
      category: form.category.trim(),
      description: form.description.trim(),
      price,
      badge: form.badge.trim(),
      stock
    };

    try {
      if (editingId) {
        const nextProducts = products.map((item) => (item.id === editingId ? product : item));
        await persist(nextProducts, `Producto ${product.name} actualizado.`);
      } else {
        const exists = products.some((item) => item.id === product.id);
        if (exists) {
          setNotice("Ese identificador ya existe. Cambia el nombre o el ID del producto.");
          return;
        }

        await persist([...products, product], `Producto ${product.name} creado.`);
      }
    } catch (error) {
      console.error(error);
      setNotice("No se pudo guardar el catálogo.");
      return;
    }

    setEditingId(null);
    setForm(emptyForm);
  }

  function handleEdit(product: Product) {
    setEditingId(product.id);
    setForm({
      id: product.id,
      name: product.name,
      category: product.category,
      description: product.description,
      price: String(product.price),
      badge: product.badge,
      stock: String(product.stock)
    });
    setNotice(`Editando ${product.name}.`);
  }

  async function handleDelete(productId: string) {
    const target = products.find((product) => product.id === productId);
    const nextProducts = products.filter((product) => product.id !== productId);

    try {
      await persist(nextProducts, `Producto ${target?.name ?? productId} eliminado.`);
    } catch (error) {
      console.error(error);
      setNotice("No se pudo eliminar el producto.");
      return;
    }

    if (editingId === productId) {
      setEditingId(null);
      setForm(emptyForm);
    }
  }

  async function handleReset() {
    try {
      const defaults = await resetCatalog();
      setProducts(defaults);
      setNotice("Catálogo restaurado a los productos iniciales.");
      setEditingId(null);
      setForm(emptyForm);
    } catch (error) {
      console.error(error);
      setNotice("No se pudo restaurar el catálogo.");
    }
  }

  return (
    <div className="storefront">
      <div className="announcement-bar">
        Panel admin simple. Gestiona catálogo local antes de conectar base de datos o CMS.
      </div>

      <main className="section">
        <div className="container">
          <div className="section-header">
            <div>
              <p className="eyebrow">Admin</p>
              <h1 className="section-title">Gestión de catálogo</h1>
            </div>
            <a className="button button-secondary" href="/">
              Volver a la tienda
            </a>
          </div>

          <div className="commerce-grid">
            <section className="checkout-panel">
              <p className="eyebrow">{editingId ? "Editar producto" : "Nuevo producto"}</p>
              <h2 className="section-title">
                {editingId ? "Actualiza una ficha" : "Crea un producto"}
              </h2>
              <p className="section-copy">
                Los cambios ahora se guardan en el servidor local del proyecto.
              </p>

              <form className="admin-form" onSubmit={handleSubmit}>
                <label className="admin-field">
                  <span>ID o slug</span>
                  <input
                    value={form.id}
                    onChange={(event) => setForm((current) => ({ ...current, id: event.target.value }))}
                    placeholder="nebula-speaker"
                  />
                </label>
                <label className="admin-field">
                  <span>Nombre</span>
                  <input
                    value={form.name}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, name: event.target.value }))
                    }
                    placeholder="Nebula Speaker"
                  />
                </label>
                <label className="admin-field">
                  <span>Categoría</span>
                  <input
                    value={form.category}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, category: event.target.value }))
                    }
                    placeholder="Audio"
                  />
                </label>
                <label className="admin-field">
                  <span>Descripción</span>
                  <textarea
                    value={form.description}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, description: event.target.value }))
                    }
                    rows={4}
                    placeholder="Describe el producto"
                  />
                </label>
                <label className="admin-field">
                  <span>Precio</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.price}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, price: event.target.value }))
                    }
                    placeholder="129"
                  />
                </label>
                <label className="admin-field">
                  <span>Etiqueta</span>
                  <input
                    value={form.badge}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, badge: event.target.value }))
                    }
                    placeholder="Best seller"
                  />
                </label>
                <label className="admin-field">
                  <span>Stock</span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={form.stock}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, stock: event.target.value }))
                    }
                    placeholder="8"
                  />
                </label>

                <div className="admin-actions">
                  <button className="button button-primary" type="submit">
                    {editingId ? "Guardar cambios" : "Crear producto"}
                  </button>
                  <button
                    className="button button-secondary"
                    type="button"
                    onClick={() => {
                      setEditingId(null);
                      setForm(emptyForm);
                      setNotice("Formulario limpiado.");
                    }}
                  >
                    Limpiar
                  </button>
                  <button className="button button-secondary" type="button" onClick={handleReset}>
                    Restaurar demo
                  </button>
                </div>
              </form>

              <div className="checkout-status ready">{notice}</div>
            </section>

            <section className="cart-panel">
              <p className="eyebrow">Productos actuales</p>
              <h2 className="section-title">{sortedProducts.length} fichas en catálogo</h2>
              <div className="admin-product-list">
                {sortedProducts.map((product) => (
                  <article className="admin-product-card" key={product.id}>
                    <div>
                      <strong>{product.name}</strong>
                      <p className="small-copy">
                        {product.category} · {product.badge} · Stock: {product.stock}
                      </p>
                      <p className="small-copy">{product.description}</p>
                    </div>
                    <div className="admin-product-footer">
                      <span className="price">{product.price.toFixed(2)} €</span>
                      <div className="admin-inline-actions">
                        <button className="button button-secondary" onClick={() => handleEdit(product)}>
                          Editar
                        </button>
                        <button
                          className="button button-secondary"
                          onClick={() => handleDelete(product.id)}
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </div>

          <section className="section">
            <div className="section-header">
              <div>
                <p className="eyebrow">Pedidos</p>
                <h2 className="section-title">Histórico de compras</h2>
              </div>
              <span className="small-copy">{orders.length} pedidos registrados</span>
            </div>

            <div className="admin-order-list">
              {orders.length === 0 ? (
                <div className="cart-empty">Todavía no hay pedidos registrados.</div>
              ) : (
                orders.map((order) => (
                  <article className="admin-order-card" key={order.id}>
                    <div className="admin-order-head">
                      <div>
                        <strong>{order.payerName || "Cliente PayPal"}</strong>
                        <p className="small-copy">
                          {order.customerEmail || "Sin email"} · {formatDate(order.createdAt)}
                        </p>
                      </div>
                      <div className="admin-order-meta">
                        <span className={`order-badge ${order.status}`}>{order.status}</span>
                        <strong>
                          {order.total.toFixed(2)} {order.currency}
                        </strong>
                      </div>
                    </div>
                    <div className="admin-order-items">
                      {order.items.map((item) => (
                        <div className="small-copy" key={`${order.id}-${item.productId}`}>
                          {item.name} · {item.quantity} x {item.price.toFixed(2)} €
                        </div>
                      ))}
                    </div>
                    <div className="small-copy">PayPal Order ID: {order.paypalOrderId}</div>
                  </article>
                ))
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-ES", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
