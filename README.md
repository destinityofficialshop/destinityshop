# Destinity ES

Tienda online en Next.js con una estetica inspirada en Shopify: home comercial, productos destacados, carrito y checkout integrado con PayPal.

## Requisitos

- Node.js 18 o superior
- Credenciales de PayPal Developer

## Arranque

1. Copia `.env.example` a `.env`
2. Rellena `PAYPAL_CLIENT_ID` y `PAYPAL_CLIENT_SECRET`
3. Ejecuta `npm install`
4. Ejecuta `npm run dev`
5. Abre `http://localhost:3000`

## Variables

- `PAYPAL_CLIENT_ID`: client ID de PayPal
- `PAYPAL_CLIENT_SECRET`: secret de PayPal
- `PAYPAL_ENV`: `sandbox` o `live`
- `PAYPAL_CURRENCY`: moneda del checkout, por defecto `EUR`
- `NEXT_PUBLIC_META_PIXEL_ID`: ID de Meta Pixel para cargar el base code y eventos en cliente

## Estructura

- `app/`: App Router y rutas API
- `components/`: componentes React de storefront y checkout
- `lib/`: catálogo inicial y utilidades de PayPal

## Flujo de pago

- El cliente consulta `/api/paypal/config`
- El componente de checkout carga el SDK de PayPal
- Next.js crea pedidos en `/api/paypal/order`
- Next.js captura pagos en `/api/paypal/order/[orderId]/capture`

Puedes cambiar el catálogo en `lib/products.ts`.
