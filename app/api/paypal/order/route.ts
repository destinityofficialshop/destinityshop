import { NextRequest, NextResponse } from "next/server";
import { formatMoney, getPaypalAccessToken, getPaypalBaseUrl, getPaypalConfig } from "@/lib/paypal";
import { readCatalog, upsertPendingOrder } from "@/lib/store-data";

type OrderItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
};

export async function POST(request: NextRequest) {
  try {
    const { items, total } = (await request.json()) as {
      items?: OrderItem[];
      total?: number;
    };

    if (!Array.isArray(items) || items.length === 0 || !total || total <= 0) {
      return NextResponse.json({ error: "Pedido invalido." }, { status: 400 });
    }

    const catalog = await readCatalog();
    const catalogMap = new Map(catalog.map((product) => [product.id, product]));
    const recalculatedTotal = items.reduce((sum, item) => {
      const product = catalogMap.get(item.id);

      if (!product) {
        throw new Error(`Producto no encontrado: ${item.id}`);
      }

      if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
        throw new Error(`Cantidad invalida para ${item.id}`);
      }

      if (item.quantity > product.stock) {
        throw new Error(`Stock insuficiente para ${product.name}`);
      }

      return sum + product.price * item.quantity;
    }, 0);

    if (Math.abs(recalculatedTotal - total) > 0.001) {
      return NextResponse.json(
        { error: "El total del carrito no coincide con el catalogo actual." },
        { status: 400 }
      );
    }

    const accessToken = await getPaypalAccessToken();
    const config = getPaypalConfig();

    const response = await fetch(`${getPaypalBaseUrl()}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [
          {
            description: "Pedido Destinity ES",
            amount: {
              currency_code: config.currency,
              value: formatMoney(total),
              breakdown: {
                item_total: {
                  currency_code: config.currency,
                  value: formatMoney(total)
                }
              }
            },
            items: items.map((item) => {
              const product = catalogMap.get(item.id)!;

              return {
                name: product.name.slice(0, 127),
              unit_amount: {
                currency_code: config.currency,
                value: formatMoney(product.price)
              },
              quantity: String(item.quantity),
              category: "PHYSICAL_GOODS"
              };
            })
          }
        ]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: "No se pudo crear el pedido en PayPal.", details: data },
        { status: response.status }
      );
    }

    try {
      await upsertPendingOrder({
        id: crypto.randomUUID(),
        paypalOrderId: data.id as string,
        status: "pending",
        total: recalculatedTotal,
        currency: config.currency,
        createdAt: new Date().toISOString(),
        items: items.map((item) => {
          const product = catalogMap.get(item.id)!;

          return {
            productId: product.id,
            name: product.name,
            price: product.price,
            quantity: item.quantity
          };
        })
      });
    } catch (storageError) {
      console.warn("No se pudo registrar el pedido pendiente localmente.", storageError);
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error(error);
    const message =
      error instanceof Error ? error.message : "Error interno al crear el pedido de PayPal.";
    const status =
      error instanceof Error &&
      (message.includes("Stock insuficiente") ||
        message.includes("Producto no encontrado") ||
        message.includes("Cantidad invalida"))
        ? 409
        : 500;

    return NextResponse.json(
      { error: message },
      { status }
    );
  }
}
