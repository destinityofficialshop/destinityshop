import Link from "next/link";
import { PageShell, SubpageHero } from "@/components/page-shell";

export default function Precios() {
  return (
    <PageShell>
      <SubpageHero
        eyebrow="Precios y promociones"
        title="Tecnología y diseño que inspiran tu día a día"
        copy="Descubre promociones exclusivas y ahorra en accesorios tecnológicos con una página comercial separada del catálogo."
      />
      <section className="promo-band inner-band">
        <div className="container promo-content">
          <h2>Promociones activas para accesorios esenciales</h2>
          <p>Consulta el precio final en el catálogo y revisa el subtotal antes de finalizar el pago.</p>
          <Link className="button button-light" href="/catalogo">Ver catálogo completo</Link>
        </div>
      </section>
    </PageShell>
  );
}
