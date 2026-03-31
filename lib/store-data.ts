import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { seedProducts, type Product } from "@/lib/products";

export type OrderItemRecord = {
  productId: string;
  name: string;
  price: number;
  quantity: number;
};

export type OrderRecord = {
  id: string;
  paypalOrderId: string;
  status: "pending" | "paid";
  total: number;
  currency: string;
  createdAt: string;
  paidAt?: string;
  customerEmail?: string;
  payerName?: string;
  items: OrderItemRecord[];
};

const dataDir = path.join(process.cwd(), "data");
const catalogFile = path.join(dataDir, "catalog.json");
const ordersFile = path.join(dataDir, "orders.json");

export async function readCatalog() {
  return readJsonFile<Product[]>(catalogFile, cloneSeedProducts());
}

export async function writeCatalog(products: Product[]) {
  await writeJsonFile(catalogFile, products);
}

export async function resetCatalog() {
  const products = cloneSeedProducts();
  await writeCatalog(products);
  return products;
}

export async function readOrders() {
  return readJsonFile<OrderRecord[]>(ordersFile, []);
}

export async function writeOrders(orders: OrderRecord[]) {
  await writeJsonFile(ordersFile, orders);
}

export async function upsertPendingOrder(order: OrderRecord) {
  const orders = await readOrders();
  const index = orders.findIndex((entry) => entry.paypalOrderId === order.paypalOrderId);

  if (index >= 0) {
    orders[index] = order;
  } else {
    orders.unshift(order);
  }

  await writeOrders(orders);
}

export async function markOrderPaid(
  paypalOrderId: string,
  updates: Pick<OrderRecord, "paidAt" | "customerEmail" | "payerName">
) {
  const orders = await readOrders();
  const index = orders.findIndex((entry) => entry.paypalOrderId === paypalOrderId);

  if (index < 0) {
    return null;
  }

  orders[index] = {
    ...orders[index],
    status: "paid",
    ...updates
  };

  await writeOrders(orders);
  return orders[index];
}

export function cloneSeedProducts() {
  return seedProducts.map((product) => ({ ...product }));
}

async function readJsonFile<T>(filePath: string, fallback: T) {
  try {
    await ensureDataDir();
    const raw = await readFile(filePath, "utf8");
    return JSON.parse(raw) as T;
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === "ENOENT") {
      await writeJsonFile(filePath, fallback);
      return fallback;
    }

    throw error;
  }
}

async function writeJsonFile(filePath: string, data: unknown) {
  await ensureDataDir();
  await writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

async function ensureDataDir() {
  await mkdir(dataDir, { recursive: true });
}
