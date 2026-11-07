"use client";

import { MessageCircle, MapPin } from "lucide-react";
import InstagramIcon from "./InstagramIcon";

export default function PortfolioFooter() {
  return (
    <footer className="border-t border-[#241913] bg-[#120c09] py-12 px-4 sm:px-6 text-[#9a887c]">
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
        {/* Brand Info */}
        <div className="space-y-2">
          <div className="flex items-center justify-center md:justify-start gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-[#221711] border border-[#3b2a1f] p-1 flex items-center justify-center">
              <img
                src="/uploads/1789759502114-Logo-Dua_Carita_Coffee.png"
                alt="Logo Dua Carita Coffee"
                className="h-full w-full object-contain"
              />
            </div>
            <span className="font-extrabold text-base text-[#f5ebd9] tracking-tight">
              Dua Carita Coffee
            </span>
          </div>
          <p className="text-xs text-[#86756a] max-w-sm">
            Kopi susu aren otentik, seduhan fresh, dan kisah persahabatan di setiap event bazaar Kota Bandung.
          </p>
          <div className="flex items-center justify-center md:justify-start gap-1.5 text-xs text-[#a69588] pt-1">
            <MapPin className="h-3.5 w-3.5 text-amber-500 shrink-0" />
            <span>Bandung, Jawa Barat, Indonesia</span>
          </div>
        </div>

        {/* Quick Links & Socials */}
        <div className="flex flex-col sm:flex-row items-center gap-6 text-xs">
          <a
            href="https://www.instagram.com/duacaritacoffee"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 hover:text-amber-400 transition"
          >
            <InstagramIcon className="h-4 w-4 text-amber-400" />
            <span>@duacaritacoffee</span>
          </a>
          <a
            href="https://wa.me/6282119718463"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 hover:text-amber-400 transition"
          >
            <MessageCircle className="h-4 w-4 text-amber-400" />
            <span>+62 821-1971-8463</span>
          </a>
        </div>
      </div>

      <div className="max-w-5xl mx-auto pt-8 mt-8 border-t border-[#1e140f] text-center text-[11px] text-[#716156]">
        <p>&copy; {new Date().getFullYear()} Dua Carita Coffee. Diseduh dengan hati di Kota Bandung.</p>
      </div>
    </footer>
  );
}

