import { PageShell, SubpageHero } from "@/components/page-shell";
import { benefits } from "@/lib/site-content";

export default function FAQ() {
  return (
    <PageShell>
      <SubpageHero
        eyebrow="FAQ"
        title="Preguntas frecuentes para comprar con confianza"
        copy="Resolvemos las dudas principales sobre diseño, seguridad de compra y navegación por la tienda."
      />
      <section className="features">
        <div className="container features-grid">
          {benefits.map((benefit) => (
            <article className="feature-card" key={benefit.title}>
              <h3>{benefit.title}</h3>
              <p>{benefit.copy}</p>
            </article>
          ))}
        </div>
      </section>
    </PageShell>
  );
}
