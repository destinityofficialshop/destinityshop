import Link from "next/link";
import { navItems } from "@/lib/site-content";

export function SiteHeader() {
  return (
    <header className="site-header">
      <a className="skip-link" href="#contenido">Saltar al contenido</a>
      <div className="container header-shell">
        <Link className="brand" href="/" aria-label="Destinity ES inicio">
          <span className="brand-mark">D</span>
          <span>Destinity ES</span>
        </Link>
        <nav className="nav-links" aria-label="Navegación principal">
          {navItems.map((item) => (
            <Link href={item.href} key={item.href}>{item.label}</Link>
          ))}
        </nav>
        <Link className="cart-link" href="/catalogo#carrito" aria-label="Ir al carrito">
          🛒 <span>Carrito</span>
        </Link>
      </div>
    </header>
  );
}
