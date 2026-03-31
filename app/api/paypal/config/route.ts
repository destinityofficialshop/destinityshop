import { NextResponse } from "next/server";
import { getPaypalConfig } from "@/lib/paypal";

export async function GET() {
  const config = getPaypalConfig();

  return NextResponse.json({
    clientId: config.clientId,
    currency: config.currency,
    configured: Boolean(config.clientId && config.clientSecret)
  });
}
