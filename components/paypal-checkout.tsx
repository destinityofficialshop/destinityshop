"use client";

import { useEffect, useRef, useState } from "react";
import { trackMetaPurchase } from "@/lib/meta-pixel";

type CartItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
};

type PaypalConfig = {
  clientId: string;
  currency: string;
  configured: boolean;
};

declare global {
  interface Window {
    paypal?: {
      Buttons: (options: {
        createOrder: () => Promise<string>;
        onApprove: (data: { orderID: string }) => Promise<void>;
        onError: (error: unknown) => void;
      }) => { render: (selector: string) => Promise<void> };
    };
  }
}

type PaypalCheckoutProps = {
  items: CartItem[];
  total: number;
  onPaid: () => void;
};

export function PaypalCheckout({ items, total, onPaid }: PaypalCheckoutProps) {
  const [message, setMessage] = useState("Cargando configuracion de PayPal...");
  const [status, setStatus] = useState<"idle" | "ready" | "error">("idle");
  const [enabled, setEnabled] = useState(false);
  const [currency, setCurrency] = useState("EUR");
  const hasRenderedButtons = useRef(false);
  const itemsRef = useRef(items);
  const totalRef = useRef(total);
  const onPaidRef = useRef(onPaid);

  useEffect(() => {
    itemsRef.current = items;
    totalRef.current = total;
    onPaidRef.current = onPaid;
  }, [items, onPaid, total]);

  useEffect(() => {
    let active = true;

    async function bootstrap() {
      try {
        const response = await fetch("/api/paypal/config");
        const config = (await response.json()) as PaypalConfig;

        if (!config.configured) {
          if (!active) {
            return;
          }

          setStatus("error");
          setMessage(
            "PayPal no esta configurado. Copia .env.example a .env y rellena tus credenciales."
          );
          return;
        }

        await loadPaypalSdk(config.clientId, config.currency);

        if (!active) {
          return;
        }

        setCurrency(config.currency);
        setEnabled(true);
        setStatus("ready");
        setMessage("PayPal listo. Puedes completar el pago desde este bloque.");
      } catch (error) {
        console.error(error);
        if (!active) {
          return;
        }

        setStatus("error");
        setMessage("No se pudo inicializar PayPal en el navegador.");
      }
    }

    bootstrap();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!enabled || !window.paypal || hasRenderedButtons.current) {
      return;
    }

    hasRenderedButtons.current = true;

    window.paypal
      .Buttons({
        createOrder: async () => {
          if (!itemsRef.current.length || totalRef.current <= 0) {
            setStatus("error");
            setMessage("Anade un producto al carrito antes de iniciar el pago.");
            throw new Error("Carrito vacio");
          }

          const response = await fetch("/api/paypal/order", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ items: itemsRef.current, total: totalRef.current })
          });
          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error ?? "No se pudo crear el pedido");
          }

          return data.id as string;
        },
        onApprove: async (data) => {
          const response = await fetch(`/api/paypal/order/${data.orderID}/capture`, {
            method: "POST"
          });
          const capture = await response.json();

          if (!response.ok) {
            throw new Error(capture.error ?? "No se pudo capturar el pedido");
          }

          trackMetaPurchase({
            currency,
            total: totalRef.current,
            items: itemsRef.current.map((item) => ({
              id: item.id,
              name: item.name,
              quantity: item.quantity
            }))
          });
          setStatus("ready");
          setMessage("Pago completado correctamente. El carrito se ha vaciado.");
          onPaidRef.current();
        },
        onError: (error) => {
          console.error(error);
          setStatus("error");
          setMessage("PayPal devolvio un error durante el proceso de pago.");
        }
      })
      .render("#paypal-button-container")
      .catch((error) => {
        console.error(error);
        setStatus("error");
        setMessage("No se pudieron renderizar los botones de PayPal.");
      });
  }, [currency, enabled]);

  return (
    <>
      <div
        className={`checkout-status ${status === "ready" ? "ready" : ""} ${status === "error" ? "error" : ""}`}
      >
        {message}
      </div>
      <div className="paypal-shell">
        <div id="paypal-button-container" />
      </div>
    </>
  );
}

function loadPaypalSdk(clientId: string, currency: string) {
  return new Promise<void>((resolve, reject) => {
    if (window.paypal) {
      resolve();
      return;
    }

    const existing = document.querySelector<HTMLScriptElement>("script[data-paypal-sdk='true']");
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("SDK de PayPal no disponible")), {
        once: true
      });
      return;
    }

    const script = document.createElement("script");
    script.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(clientId)}&currency=${encodeURIComponent(currency)}`;
    script.async = true;
    script.dataset.paypalSdk = "true";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("SDK de PayPal no disponible"));
    document.head.appendChild(script);
  });
}
