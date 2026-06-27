import { PageShell, SubpageHero } from "@/components/page-shell";

export default function Sobre() {
  return (
    <PageShell>
      <SubpageHero
        eyebrow="Sobre Destinity ES"
        title="Una marca enfocada en accesorios tecnológicos con estilo"
        copy="Destinity ES brinda productos tecnológicos con estilo y confianza, respaldados por una atención profesional y eficiente."
      />
      <section className="about standalone-about">
        <div className="container about-card">
          <div className="portrait" aria-hidden="true">CM</div>
          <div>
            <h2>Carlos Méndez</h2>
            <p className="category">Experto en accesorios tecnológicos</p>
            <p>La página Sobre queda separada para presentar la historia, el enfoque y la confianza de la tienda sin mezclarlo con la compra.</p>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
