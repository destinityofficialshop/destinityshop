import { NextResponse } from "next/server";
import { resetCatalog } from "@/lib/store-data";

export async function POST() {
  const products = await resetCatalog();
  return NextResponse.json({ products });
}
