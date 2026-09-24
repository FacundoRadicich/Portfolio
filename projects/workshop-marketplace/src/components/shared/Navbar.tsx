"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { Menu, X, ChevronDown } from "lucide-react";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [showProf, setShowProf] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowProf(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-[#E0E0E0]">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#00BBAD] shrink-0" />
          <span className="font-black text-[22px] tracking-tight text-[#111111] leading-none">
            OH My Chalk!
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-8">
          <Link href="/talleres"
            className="text-sm font-black text-[#333333] hover:text-[#00BBAD] transition-colors tracking-wide">
            Talleres
          </Link>
          <Link href="/donde-comprar"
            className="text-sm font-black text-[#333333] hover:text-[#00BBAD] transition-colors tracking-wide">
            Dónde comprar
          </Link>
          <Link href="/profesoras"
            className="text-sm font-black text-[#333333] hover:text-[#00BBAD] transition-colors tracking-wide">
            Profesoras
          </Link>
          <Link href="/cuenta"
            className="text-sm font-black text-[#333333] hover:text-[#00BBAD] transition-colors tracking-wide">
            Mi cuenta
          </Link>

          {/* Dropdown profesoras */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowProf(v => !v)}
              className="flex items-center gap-1 text-sm font-black bg-[#111111] text-white px-5 py-2 rounded-full hover:bg-[#00BBAD] transition-colors tracking-wide"
            >
              ¿Sos profesora?
              <ChevronDown size={13} className={`transition-transform ${showProf ? "rotate-180" : ""}`} />
            </button>
            {showProf && (
              <div className="absolute right-0 top-full mt-2 bg-white border border-[#E0E0E0] rounded-xl shadow-lg overflow-hidden w-44 z-50">
                <Link href="/registro-profesora"
                  onClick={() => setShowProf(false)}
                  className="block px-4 py-3 text-sm font-black text-[#111111] hover:bg-[#F5F5F5] transition-colors">
                  Registrarme
                </Link>
                <Link href="/portal/login"
                  onClick={() => setShowProf(false)}
                  className="block px-4 py-3 text-sm font-bold text-[#555555] hover:bg-[#F5F5F5] transition-colors border-t border-[#F0F0F0]">
                  Iniciar sesión
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Mobile toggle */}
        <button className="md:hidden p-2 text-[#111111]" onClick={() => setIsOpen(!isOpen)} aria-label="Menú">
          {isOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>

      {isOpen && (
        <div className="md:hidden border-t border-[#E0E0E0] bg-white px-4 py-5 flex flex-col gap-1">
          {/* Navegación */}
          <Link href="/talleres" className="text-sm font-black tracking-wide py-2.5" onClick={() => setIsOpen(false)}>Talleres</Link>
          <Link href="/profesoras" className="text-sm font-black tracking-wide py-2.5" onClick={() => setIsOpen(false)}>Profesoras</Link>

          <div className="border-t border-[#F0F0F0] my-2" />

          {/* Usuario final */}
          <Link href="/login"
            onClick={() => setIsOpen(false)}
            className="flex items-center justify-between py-2.5">
            <span className="text-sm font-black text-[#111111]">Mi cuenta</span>
            <span className="text-xs text-[#AAAAAA]">alumnas →</span>
          </Link>

          <div className="border-t border-[#F0F0F0] my-2" />

          {/* Profesoras */}
          <p className="text-xs font-black text-[#AAAAAA] uppercase tracking-widest pt-1">¿Sos profe?</p>
          <Link href="/registro-profesora"
            onClick={() => setIsOpen(false)}
            className="text-sm font-black text-[#00BBAD] py-2">
            Registrarme
          </Link>
          <Link href="/portal/login"
            onClick={() => setIsOpen(false)}
            className="text-sm font-bold text-[#555555] py-2">
            Iniciar sesión
          </Link>
        </div>
      )}
    </header>
  );
}
