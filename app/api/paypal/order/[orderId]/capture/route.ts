import { NextResponse } from "next/server";
import { getPaypalAccessToken, getPaypalBaseUrl } from "@/lib/paypal";
import { markOrderPaid, readCatalog, readOrders, writeCatalog } from "@/lib/store-data";

type Context = {
  params: Promise<{ orderId: string }>;
};

export async function POST(_: Request, context: Context) {
  try {
    const { orderId } = await context.params;
    const orders = await readOrders();
    const localOrder = orders.find((entry) => entry.paypalOrderId === orderId);

    if (!localOrder) {
      return NextResponse.json({ error: "Pedido local no encontrado." }, { status: 404 });
    }

    if (localOrder.status === "paid") {
      return NextResponse.json({ error: "El pedido ya fue capturado." }, { status: 409 });
    }

    const accessToken = await getPaypalAccessToken();

    const response = await fetch(`${getPaypalBaseUrl()}/v2/checkout/orders/${orderId}/capture`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`
      }
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: "No se pudo capturar el pago en PayPal.", details: data },
        { status: response.status }
      );
    }

    const catalog = await readCatalog();
    const nextCatalog = [...catalog];

    for (const item of localOrder.items) {
      const index = nextCatalog.findIndex((product) => product.id === item.productId);

      if (index < 0) {
        return NextResponse.json(
          { error: `No se encontro el producto ${item.productId} para descontar stock.` },
          { status: 409 }
        );
      }

      if (nextCatalog[index].stock < item.quantity) {
        return NextResponse.json(
          { error: `No hay stock suficiente para ${nextCatalog[index].name}.` },
          { status: 409 }
        );
      }

      nextCatalog[index] = {
        ...nextCatalog[index],
        stock: nextCatalog[index].stock - item.quantity
      };
    }

    await writeCatalog(nextCatalog);
    await markOrderPaid(orderId, {
      paidAt: new Date().toISOString(),
      customerEmail: data?.payer?.email_address,
      payerName: [data?.payer?.name?.given_name, data?.payer?.name?.surname]
        .filter(Boolean)
        .join(" ")
        .trim()
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Error interno al capturar el pago de PayPal." },
      { status: 500 }
    );
  }
}
