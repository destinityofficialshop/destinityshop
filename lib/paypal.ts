export function getPaypalConfig() {
  return {
    clientId: process.env.PAYPAL_CLIENT_ID ?? "",
    clientSecret: process.env.PAYPAL_CLIENT_SECRET ?? "",
    environment: process.env.PAYPAL_ENV === "live" ? "live" : "sandbox",
    currency: process.env.PAYPAL_CURRENCY ?? "EUR"
  };
}

export function getPaypalBaseUrl() {
  return getPaypalConfig().environment === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";
}

export async function getPaypalAccessToken() {
  const { clientId, clientSecret } = getPaypalConfig();

  if (!clientId || !clientSecret) {
    throw new Error("Faltan credenciales de PayPal en las variables de entorno.");
  }

  const response = await fetch(`${getPaypalBaseUrl()}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: "grant_type=client_credentials"
  });

  const data = await response.json();

  if (!response.ok || !data.access_token) {
    throw new Error(`No se pudo obtener el token de PayPal: ${JSON.stringify(data)}`);
  }

  return data.access_token as string;
}

export function formatMoney(value: number) {
  return Number(value).toFixed(2);
}
