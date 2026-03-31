import type { Product } from "@/lib/products";

export type CatalogResponse = {
  products: Product[];
};

export type OrdersResponse = {
  orders: Array<{
    id: string;
    paypalOrderId: string;
    status: "pending" | "paid";
    total: number;
    currency: string;
    createdAt: string;
    paidAt?: string;
    customerEmail?: string;
    payerName?: string;
    items: Array<{
      productId: string;
      name: string;
      price: number;
      quantity: number;
    }>;
  }>;
};

export async function fetchCatalog() {
  const response = await fetch("/api/catalog", { cache: "no-store" });
  const data = (await response.json()) as CatalogResponse;

  if (!response.ok) {
    throw new Error("No se pudo cargar el catalogo.");
  }

  return data.products;
}

export async function saveCatalog(products: Product[]) {
  const response = await fetch("/api/catalog", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ products })
  });
  const data = (await response.json()) as CatalogResponse & { error?: string };

  if (!response.ok) {
    throw new Error(data.error ?? "No se pudo guardar el catalogo.");
  }

  return data.products;
}

export async function resetCatalog() {
  const response = await fetch("/api/catalog/reset", { method: "POST" });
  const data = (await response.json()) as CatalogResponse & { error?: string };

  if (!response.ok) {
    throw new Error(data.error ?? "No se pudo restaurar el catalogo.");
  }

  return data.products;
}

export async function fetchOrders() {
  const response = await fetch("/api/orders", { cache: "no-store" });
  const data = (await response.json()) as OrdersResponse & { error?: string };

  if (!response.ok) {
    throw new Error(data.error ?? "No se pudo cargar el historico.");
  }

  return data.orders;
}
