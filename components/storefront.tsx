import Link from "next/link";
import { PageShell } from "@/components/page-shell";
import { pageCards } from "@/lib/site-content";

export function Storefront() {
  return (
    <PageShell>
      <section className="hero" id="inicio">
        <div className="hero-art" aria-hidden="true" />
        <div className="container hero-inner">
          <p className="eyebrow">Destinity ES</p>
          <h1>Accesorios tecnológicos con estilo y confianza</h1>
          <p>
            En Destinity ES, encuentra productos innovadores y funcionales que combinan diseño
            moderno con calidad garantizada. Ahora cada bloque principal vive en su propia subpágina
            para que la navegación sea más clara y profesional.
          </p>
          <div className="hero-actions">
            <Link className="button button-primary" href="/catalogo">Ver catálogo</Link>
            <Link className="button button-light" href="/servicios">Conocer servicios</Link>
          </div>
        </div>
      </section>

      <section className="intro-section">
        <div className="container split-grid">
          <div>
            <p className="eyebrow">Navegación por subpáginas</p>
            <h2>Todo el contenido de la web queda separado y fácil de encontrar</h2>
          </div>
          <div>
            <p>
              Servicios, catálogo, promociones, preguntas frecuentes, información de marca y contacto
              tienen rutas independientes, manteniendo una portada limpia enfocada en dirigir al usuario.
            </p>
            <Link className="text-link" href="/catalogo">Explorar catálogo completo</Link>
          </div>
        </div>
      </section>

      <section className="catalog-section">
        <div className="container">
          <div className="section-heading">
            <p className="eyebrow">Secciones disponibles</p>
            <h2>Elige la página que quieres visitar</h2>
          </div>
          <div className="page-card-grid">
            {pageCards.map((card) => (
              <Link className="page-card" href={card.href} key={card.href}>
                <h3>{card.title}</h3>
                <p>{card.copy}</p>
                <span>Entrar →</span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </PageShell>
  );
}
