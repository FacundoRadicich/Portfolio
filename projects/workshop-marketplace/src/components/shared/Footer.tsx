import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { SubscribeForm } from "./SubscribeForm";

export function Footer() {
  return (
    <footer className="bg-[#00BBAD] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          <div>
            <span className="font-black text-3xl text-white tracking-tight">OH My Chalk!</span>
            <p className="mt-3 text-sm font-bold text-white/70 leading-relaxed">
              La comunidad de pintura tiza más grande de Argentina. Talleres, cursos y demos en todo el país.
            </p>
            <div className="flex gap-4 mt-5">
              <a href="https://instagram.com/ohmychalk" target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-bold text-white/50 hover:text-[#00BBAD] transition-colors">
                <ExternalLink size={12} /> Instagram
              </a>
              <a href="https://facebook.com/ohmychalk" target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-bold text-white/50 hover:text-[#00BBAD] transition-colors">
                <ExternalLink size={12} /> Facebook
              </a>
            </div>
          </div>

          <div>
            <h3 className="font-black text-sm uppercase tracking-widest mb-4 text-white">Explorar</h3>
            <ul className="space-y-2 text-sm font-bold text-white/80">
              <li><Link href="/talleres" className="hover:text-white transition-colors">Todos los talleres</Link></li>
              <li><Link href="/profesoras" className="hover:text-white transition-colors">Nuestras profesoras</Link></li>
              <li><Link href="/talleres?type=DEMO" className="hover:text-white transition-colors">Demos gratuitas</Link></li>
              <li><a href="mailto:hola@ohmychalk.com.ar" className="hover:text-white transition-colors">¿Querés ser profesora?</a></li>
            </ul>
          </div>

          <div>
            <h3 className="font-black text-sm uppercase tracking-widest mb-2 text-white">Recibí novedades</h3>
            <p className="text-sm font-bold text-white/80 mb-4">Enterate de talleres cerca tuyo antes que nadie.</p>
            <SubscribeForm variant="footer" />
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-white/20 text-xs font-bold text-white/60 text-center">
          © {new Date().getFullYear()} OH My Chalk! Todos los derechos reservados.
        </div>
      </div>
    </footer>
  );
}
