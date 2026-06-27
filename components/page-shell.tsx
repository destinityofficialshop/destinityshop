import type { ReactNode } from "react";
import { SiteHeader } from "@/components/site-header";

export function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="storefront">
      <SiteHeader />
      <main id="contenido">{children}</main>
      <footer className="footer">
        <div className="container footer-inner">
          <strong>Destinity ES</strong>
          <span>Instagram · Facebook · X</span>
        </div>
      </footer>
    </div>
  );
}

export function SubpageHero({ eyebrow, title, copy }: { eyebrow: string; title: string; copy: string }) {
  return (
    <section className="subpage-hero">
      <div className="container">
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p>{copy}</p>
      </div>
    </section>
  );
}
