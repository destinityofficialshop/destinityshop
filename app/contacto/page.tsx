import Link from "next/link";
import { PageShell, SubpageHero } from "@/components/page-shell";

export default function Contacto() {
  return (
    <PageShell>
      <SubpageHero
        eyebrow="Contacto"
        title="Hablemos sobre tu próximo accesorio tecnológico"
        copy="Usa esta subpágina para centralizar contacto, redes sociales y próximos canales de atención."
      />
      <section className="intro-section">
        <div className="container contact-card">
          <h2>Destinity ES</h2>
          <p>Instagram · Facebook · X</p>
          <p>Para comprar, entra en el catálogo y añade tus productos favoritos al carrito.</p>
          <Link className="button button-primary" href="/catalogo">Comprar ahora</Link>
        </div>
      </section>
    </PageShell>
  );
}
