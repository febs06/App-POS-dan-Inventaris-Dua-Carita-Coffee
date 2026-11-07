"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Coffee, Menu, X, ArrowUpRight } from "lucide-react";
import InstagramIcon from "./InstagramIcon";

export default function PortfolioNav() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { href: "#cerita", label: "Cerita Kami" },
    { href: "#menu", label: "Karya Rasa" },
    { href: "#event", label: "Jejak Event" },
    { href: "#kolaborasi", label: "Kolaborasi Booth" },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-[#140e0b]/90 backdrop-blur-md border-b border-[#2d2018] py-3.5 shadow-xl"
          : "bg-transparent py-5"
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between">
        {/* Brand Logo & Name */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-2xl bg-[#251a14] border border-[#3e2c22] p-1.5 flex items-center justify-center shadow-md group-hover:border-amber-500/50 transition">
            <img
              src="/uploads/1789759502114-Logo-Dua_Carita_Coffee.png"
              alt="Logo Dua Carita Coffee"
              className="h-full w-full object-contain"
            />
          </div>
          <div>
            <span className="font-extrabold text-base sm:text-lg text-[#fbf8f3] tracking-tight block group-hover:text-amber-400 transition">
              Dua Carita Coffee
            </span>
            <span className="text-[11px] text-[#9d897b] font-medium tracking-wide block">
              Bandung, Indonesia
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-[#cdbeb3]">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="hover:text-amber-400 transition-colors py-1"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Instagram Social CTA */}
        <div className="hidden sm:flex items-center gap-3">
          <a
            href="https://www.instagram.com/duacaritacoffee"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#231812] border border-[#3c2a1f] hover:border-amber-500/40 text-xs font-bold text-[#f5ebd9] transition shadow-xs group"
          >
            <InstagramIcon className="h-4 w-4 text-amber-400 group-hover:scale-110 transition-transform" />
            <span>@duacaritacoffee</span>
            <ArrowUpRight className="h-3 w-3 text-[#9d897b] group-hover:text-amber-400" />
          </a>
        </div>

        {/* Mobile Hamburger Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 rounded-xl bg-[#231812] border border-[#3c2a1f] text-[#cdbeb3] hover:text-white"
          aria-label="Toggle Menu"
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Slide-Down Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden px-4 pt-3 pb-5 bg-[#17100c] border-b border-[#2d2018] space-y-3">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm font-semibold text-[#cdbeb3] hover:bg-[#251a14] hover:text-amber-400 transition"
            >
              {link.label}
            </a>
          ))}
          <a
            href="https://www.instagram.com/duacaritacoffee"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#251a14] border border-[#3e2c22] text-xs font-bold text-amber-400"
          >
            <InstagramIcon className="h-4 w-4" />
            <span>Kunjungi @duacaritacoffee di Instagram</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </a>
        </div>
      )}
    </header>
  );
}

