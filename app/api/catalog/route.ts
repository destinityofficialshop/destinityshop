import { NextRequest, NextResponse } from "next/server";
import { readCatalog, writeCatalog } from "@/lib/store-data";
import type { Product } from "@/lib/products";

export async function GET() {
  const products = await readCatalog();
  return NextResponse.json({ products });
}

export async function PUT(request: NextRequest) {
  try {
    const body = (await request.json()) as { products?: Product[] };
    const products = Array.isArray(body.products) ? body.products : null;

    if (!products || products.some((product) => !isValidProduct(product))) {
      return NextResponse.json({ error: "Catalogo invalido." }, { status: 400 });
    }

    await writeCatalog(products);
    return NextResponse.json({ products });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "No se pudo guardar el catalogo." }, { status: 500 });
  }
}

function isValidProduct(product: Product) {
  return (
    typeof product.id === "string" &&
    typeof product.name === "string" &&
    typeof product.category === "string" &&
    typeof product.description === "string" &&
    typeof product.badge === "string" &&
    Number.isFinite(product.price) &&
    product.price > 0 &&
    Number.isInteger(product.stock) &&
    product.stock >= 0
  );
}
