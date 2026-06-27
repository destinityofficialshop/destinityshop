import Link from "next/link";
import { PageShell, SubpageHero } from "@/components/page-shell";

export default function Servicios() {
  return (
    <PageShell>
      <SubpageHero
        eyebrow="Servicios"
        title="Tecnología de vanguardia con garantía de confianza"
        copy="Descubre Destinity ES, tu tienda online ideal para accesorios tecnológicos con estilo y seguridad en cada compra."
      />
      <section className="intro-section">
        <div className="container split-grid">
          <article className="feature-card">
            <h3>Selección curada</h3>
            <p>Elegimos accesorios tecnológicos útiles para móvil, escritorio y vida diaria.</p>
          </article>
          <article className="feature-card">
            <h3>Compra guiada</h3>
            <p>Presentamos cada producto con información clara para que el cliente compre sin fricción.</p>
          </article>
          <article className="feature-card">
            <h3>Checkout conectado</h3>
            <p>El catálogo mantiene el flujo de carrito y pago con PayPal desde su propia subpágina.</p>
          </article>
          <article className="feature-card">
            <h3>Experiencia móvil</h3>
            <p>La estructura responsive facilita explorar la tienda desde cualquier dispositivo.</p>
          </article>
        </div>
        <div className="container centered-action"><Link className="button button-primary" href="/catalogo">Ver productos</Link></div>
      </section>
    </PageShell>
  );
}
