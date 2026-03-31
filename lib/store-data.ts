import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { hasDatabase, getPool } from "@/lib/db";
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
const memoryStore: {
  catalog?: Product[];
  orders?: OrderRecord[];
} = {};

let databaseInitialized = false;

export async function readCatalog() {
  if (hasDatabase()) {
    await initDatabase();
    const result = await getPool().query<ProductRow>(
      `select id, name, category, description, price, badge, stock
       from products
       order by name asc`
    );
    return result.rows.map(mapProductRow);
  }

  return readJsonFile<Product[]>(catalogFile, cloneSeedProducts());
}

export async function writeCatalog(products: Product[]) {
  if (hasDatabase()) {
    await initDatabase();
    const client = await getPool().connect();

    try {
      await client.query("begin");
      await client.query("delete from products");

      for (const product of products) {
        await client.query(
          `insert into products (id, name, category, description, price, badge, stock)
           values ($1, $2, $3, $4, $5, $6, $7)`,
          [
            product.id,
            product.name,
            product.category,
            product.description,
            product.price,
            product.badge,
            product.stock
          ]
        );
      }

      await client.query("commit");
      return;
    } catch (error) {
      await client.query("rollback");
      throw error;
    } finally {
      client.release();
    }
  }

  await writeJsonFile(catalogFile, products);
}

export async function resetCatalog() {
  const products = cloneSeedProducts();
  await writeCatalog(products);
  return products;
}

export async function readOrders() {
  if (hasDatabase()) {
    await initDatabase();
    const result = await getPool().query<OrderRow>(
      `select id, paypal_order_id, status, total, currency, created_at, paid_at,
              customer_email, payer_name, items
       from orders
       order by created_at desc`
    );
    return result.rows.map(mapOrderRow);
  }

  return readJsonFile<OrderRecord[]>(ordersFile, []);
}

export async function writeOrders(orders: OrderRecord[]) {
  if (hasDatabase()) {
    await initDatabase();
    const client = await getPool().connect();

    try {
      await client.query("begin");
      await client.query("delete from orders");

      for (const order of orders) {
        await client.query(
          `insert into orders (
             id, paypal_order_id, status, total, currency, created_at, paid_at,
             customer_email, payer_name, items
           ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb)`,
          [
            order.id,
            order.paypalOrderId,
            order.status,
            order.total,
            order.currency,
            order.createdAt,
            order.paidAt ?? null,
            order.customerEmail ?? null,
            order.payerName ?? null,
            JSON.stringify(order.items)
          ]
        );
      }

      await client.query("commit");
      return;
    } catch (error) {
      await client.query("rollback");
      throw error;
    } finally {
      client.release();
    }
  }

  await writeJsonFile(ordersFile, orders);
}

export async function upsertPendingOrder(order: OrderRecord) {
  if (hasDatabase()) {
    await initDatabase();
    await getPool().query(
      `insert into orders (
         id, paypal_order_id, status, total, currency, created_at, paid_at,
         customer_email, payer_name, items
       ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb)
       on conflict (paypal_order_id) do update set
         status = excluded.status,
         total = excluded.total,
         currency = excluded.currency,
         created_at = excluded.created_at,
         paid_at = excluded.paid_at,
         customer_email = excluded.customer_email,
         payer_name = excluded.payer_name,
         items = excluded.items`,
      [
        order.id,
        order.paypalOrderId,
        order.status,
        order.total,
        order.currency,
        order.createdAt,
        order.paidAt ?? null,
        order.customerEmail ?? null,
        order.payerName ?? null,
        JSON.stringify(order.items)
      ]
    );
    return;
  }

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
  if (hasDatabase()) {
    await initDatabase();
    const result = await getPool().query<OrderRow>(
      `update orders
       set status = 'paid',
           paid_at = $2,
           customer_email = $3,
           payer_name = $4
       where paypal_order_id = $1
       returning id, paypal_order_id, status, total, currency, created_at, paid_at,
                 customer_email, payer_name, items`,
      [paypalOrderId, updates.paidAt ?? null, updates.customerEmail ?? null, updates.payerName ?? null]
    );

    return result.rows[0] ? mapOrderRow(result.rows[0]) : null;
  }

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

async function initDatabase() {
  if (databaseInitialized) {
    return;
  }

  const pool = getPool();

  await pool.query(`
    create table if not exists products (
      id text primary key,
      name text not null,
      category text not null,
      description text not null,
      price numeric(12, 2) not null,
      badge text not null,
      stock integer not null default 0
    )
  `);

  await pool.query(`
    create table if not exists orders (
      id text primary key,
      paypal_order_id text not null unique,
      status text not null,
      total numeric(12, 2) not null,
      currency text not null,
      created_at timestamptz not null,
      paid_at timestamptz null,
      customer_email text null,
      payer_name text null,
      items jsonb not null
    )
  `);

  const existingProducts = await pool.query<{ count: string }>("select count(*)::text as count from products");
  if (Number(existingProducts.rows[0]?.count ?? "0") === 0) {
    for (const product of seedProducts) {
      await pool.query(
        `insert into products (id, name, category, description, price, badge, stock)
         values ($1, $2, $3, $4, $5, $6, $7)`,
        [
          product.id,
          product.name,
          product.category,
          product.description,
          product.price,
          product.badge,
          product.stock
        ]
      );
    }
  }

  databaseInitialized = true;
}

async function readJsonFile<T>(filePath: string, fallback: T) {
  try {
    await ensureDataDir();
    const raw = await readFile(filePath, "utf8");
    return JSON.parse(raw) as T;
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === "ENOENT") {
      try {
        await writeJsonFile(filePath, fallback);
      } catch {
        setMemoryValue(filePath, fallback);
      }
      return fallback;
    }

    if (isReadonlyError(error)) {
      const cached = getMemoryValue<T>(filePath);
      return cached ?? fallback;
    }

    throw error;
  }
}

async function writeJsonFile(filePath: string, data: unknown) {
  await ensureDataDir();
  try {
    await writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
  } catch (error) {
    if (isReadonlyError(error)) {
      setMemoryValue(filePath, data);
      return;
    }

    throw error;
  }
}

async function ensureDataDir() {
  try {
    await mkdir(dataDir, { recursive: true });
  } catch (error) {
    if (isReadonlyError(error)) {
      return;
    }

    throw error;
  }
}

function isReadonlyError(error: unknown) {
  const code = (error as NodeJS.ErrnoException).code;
  return code === "EROFS" || code === "EPERM" || code === "EACCES";
}

function setMemoryValue(filePath: string, data: unknown) {
  if (filePath === catalogFile) {
    memoryStore.catalog = data as Product[];
  }

  if (filePath === ordersFile) {
    memoryStore.orders = data as OrderRecord[];
  }
}

function getMemoryValue<T>(filePath: string) {
  if (filePath === catalogFile) {
    return memoryStore.catalog as T | undefined;
  }

  if (filePath === ordersFile) {
    return memoryStore.orders as T | undefined;
  }

  return undefined;
}

function mapProductRow(row: ProductRow): Product {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    description: row.description,
    price: Number(row.price),
    badge: row.badge,
    stock: row.stock
  };
}

function mapOrderRow(row: OrderRow): OrderRecord {
  return {
    id: row.id,
    paypalOrderId: row.paypal_order_id,
    status: row.status,
    total: Number(row.total),
    currency: row.currency,
    createdAt: row.created_at.toISOString(),
    paidAt: row.paid_at ? row.paid_at.toISOString() : undefined,
    customerEmail: row.customer_email ?? undefined,
    payerName: row.payer_name ?? undefined,
    items: row.items
  };
}

type ProductRow = {
  id: string;
  name: string;
  category: string;
  description: string;
  price: string;
  badge: string;
  stock: number;
};

type OrderRow = {
  id: string;
  paypal_order_id: string;
  status: "pending" | "paid";
  total: string;
  currency: string;
  created_at: Date;
  paid_at: Date | null;
  customer_email: string | null;
  payer_name: string | null;
  items: OrderItemRecord[];
};
