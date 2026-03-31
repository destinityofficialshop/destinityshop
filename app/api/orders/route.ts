import { NextResponse } from "next/server";
import { readOrders } from "@/lib/store-data";

export async function GET() {
  const orders = await readOrders();
  return NextResponse.json({ orders });
}
