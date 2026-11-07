"use client";

import { useState } from "react";
import { Coffee, Sparkles, MessageCircle } from "lucide-react";

interface MenuItem {
  name: string;
  category: "coffee" | "non-coffee";
  tagline: string;
  tastingNotes: string[];
  imageUrl: string;
  sizes: string[];
  description: string;
}

const MENU_ITEMS: MenuItem[] = [
  {
    name: "Aren Coffee Milk",
    category: "coffee",
    tagline: "Menu Paling Favorit & Selalu Dicari",
    tastingNotes: ["Karamel Aren", "Creamy Gurih", "Espresso Mantap"],
    imageUrl: "https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=600&auto=format&fit=crop&q=80",
    sizes: ["Cup Reguler / Large", "Botol 250 ML", "Botol 1 Liter"],
    description: "Kombinasi klasik espresso pilihan dengan susu segar dan 100% gula aren murni. Rasa manisnya pas, tidak mendominasi, dan meninggalkan aftertaste gurih yang nagih.",
  },
  {
    name: "Dua Carita Signature",
    category: "coffee",
    tagline: "Racikan Khas Barista Dua Carita",
    tastingNotes: ["Aromatik", "Balance Manis & Pahit", "Smooth Finish"],
    imageUrl: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&auto=format&fit=crop&q=80",
    sizes: ["Cup Reguler / Large", "Botol 250 ML", "Botol 1 Liter"],
    description: "Formula rahasia perpaduan blend kopi pilihan dengan racikan khusus yang menghasilkan rasa kopi lebih lembut namun kaya akan karakter aroma.",
  },
  {
    name: "Caffe Latte",
    category: "coffee",
    tagline: "Klasik, Lembut & Menenangkan",
    tastingNotes: ["Velvety Milk", "Subtle Sweetness", "Mild Espresso"],
    imageUrl: "https://images.unsplash.com/photo-1570968915860-54d5c301fa9f?w=600&auto=format&fit=crop&q=80",
    sizes: ["Cup Reguler / Large", "Botol 250 ML", "Botol 1 Liter"],
    description: "Pilihan pas bagi penikmat rasa kopi susu yang halus, tekstur susu selembut sutra dengan sentuhan kopi yang tetap terasa hangat.",
  },
  {
    name: "Hazelnut Coffee Milk",
    category: "coffee",
    tagline: "Aroma Kacang Panggang yang Wangi",
    tastingNotes: ["Roasted Nutty", "Creamy", "Aroma Wangi"],
    imageUrl: "https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=600&auto=format&fit=crop&q=80",
    sizes: ["Cup Reguler / Large", "Botol 250 ML", "Botol 1 Liter"],
    description: "Perpaduan kopi susu aren dengan sentuhan rasa hazelnut alami yang wangi, memberikan sensasi hangat di setiap tegukan.",
  },
  {
    name: "Matcha Latte",
    category: "non-coffee",
    tagline: "Pure Green Tea Khusus Pecinta Matcha",
    tastingNotes: ["Earthy Matcha", "Creamy Milk", "Sweet Balance"],
    imageUrl: "https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=600&auto=format&fit=crop&q=80",
    sizes: ["Cup Reguler / Large", "Botol 250 ML", "Botol 1 Liter"],
    description: "Racikan bubuk green tea pilihan dengan susu segar dingin. Tidak pahit pekat, melainkan seimbang, segar, dan menenangkan.",
  },
  {
    name: "Choco Blend Coffee",
    category: "non-coffee",
    tagline: "Pekatnya Cokelat Berpadu Kopi",
    tastingNotes: ["Rich Dark Cocoa", "Chocolate Fudge", "Full Bodied"],
    imageUrl: "https://images.unsplash.com/photo-1541167760496-1628856ab772?w=600&auto=format&fit=crop&q=80",
    sizes: ["Cup Reguler / Large", "Botol 250 ML", "Botol 1 Liter"],
    description: "Perpaduan rasa cokelat premium yang tebal dengan kopi. Cocok bagi penikmat rasa manis bernuansa moka cokelat pekat.",
  },
];

export default function PortfolioMenu() {
  const [activeCategory, setActiveCategory] = useState<"all" | "coffee" | "non-coffee">("all");

  const filteredItems = MENU_ITEMS.filter((item) => {
    if (activeCategory === "all") return true;
    return item.category === activeCategory;
  });

  return (
    <section id="menu" className="py-20 px-4 sm:px-6 relative border-t border-[#261b15]">
      <div className="max-w-5xl mx-auto space-y-10">
        {/* Header */}
        <div className="text-center space-y-2">
          <span className="text-xs font-bold text-amber-500 uppercase tracking-widest">
            Karya Rasa Dua Carita
          </span>
          <h2 className="text-2xl sm:text-4xl font-black text-[#faf6ee] tracking-tight">
            Menu Pilihan & Profil Rasa
          </h2>
          <p className="text-xs sm:text-sm text-[#9f8d81] max-w-xl mx-auto">
            Setiap racikan diracik segar untuk dinikmati langsung di booth maupun dalam kemasan botol sharing.
          </p>
          <div className="w-12 h-0.5 bg-amber-500/40 mx-auto mt-3" />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setActiveCategory("all")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeCategory === "all"
                ? "bg-amber-500 text-[#140e0b] shadow-md shadow-amber-500/20"
                : "bg-[#201610] text-[#a9998d] hover:text-white border border-[#302117]"
            }`}
          >
            Semua Menu
          </button>
          <button
            onClick={() => setActiveCategory("coffee")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeCategory === "coffee"
                ? "bg-amber-500 text-[#140e0b] shadow-md shadow-amber-500/20"
                : "bg-[#201610] text-[#a9998d] hover:text-white border border-[#302117]"
            }`}
          >
            Kopi Susu & Espresso
          </button>
          <button
            onClick={() => setActiveCategory("non-coffee")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeCategory === "non-coffee"
                ? "bg-amber-500 text-[#140e0b] shadow-md shadow-amber-500/20"
                : "bg-[#201610] text-[#a9998d] hover:text-white border border-[#302117]"
            }`}
          >
            Matcha & Cokelat
          </button>
        </div>

        {/* Menu Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => (
            <div
              key={item.name}
              className="rounded-3xl bg-[#1c130e] border border-[#2e2017] overflow-hidden hover:border-amber-500/40 transition-all duration-300 flex flex-col group shadow-md"
            >
              {/* Product Photo */}
              <div className="relative h-48 w-full overflow-hidden bg-[#2a1d15]">
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1c130e] via-transparent to-black/30" />
                <span className="absolute top-3 left-3 text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-lg bg-[#140e0b]/80 backdrop-blur-md text-amber-400 border border-[#3a281d]">
                  {item.category === "coffee" ? "Coffee Series" : "Non-Coffee"}
                </span>
              </div>

              {/* Product Details */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <h3 className="font-extrabold text-base text-[#faf6ee] group-hover:text-amber-400 transition-colors">
                    {item.name}
                  </h3>
                  <p className="text-[11px] text-amber-400/90 font-medium italic">
                    "{item.tagline}"
                  </p>
                  <p className="text-xs text-[#a7968b] leading-relaxed">
                    {item.description}
                  </p>
                </div>

                {/* Tasting Notes Tags */}
                <div className="space-y-2 pt-2 border-t border-[#2a1d15]">
                  <div className="text-[10px] font-bold text-[#86756a] uppercase tracking-wider">
                    Profil Rasa:
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {item.tastingNotes.map((note) => (
                      <span
                        key={note}
                        className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-[#251a13] border border-[#37271c] text-[#d6c7ba]"
                      >
                        {note}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Available Sizes & WhatsApp Inquire */}
                <div className="pt-2 flex items-center justify-between text-[11px] text-[#86756a]">
                  <span className="font-medium text-[#b5a396]">
                    Cup &bull; Botol 250ml &bull; 1 Liter
                  </span>
                  <a
                    href={`https://wa.me/6282119718463?text=Halo%20Dua%20Carita%20Coffee%2C%20saya%20tertarik%20dengan%20menu%20${encodeURIComponent(item.name)}...`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-amber-400 hover:text-amber-300 font-bold"
                  >
                    <MessageCircle className="h-3 w-3" />
                    <span>Tanya Menu</span>
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 1 Litre Sharing Series Highlight */}
        <div className="p-6 rounded-3xl bg-gradient-to-r from-[#241710] to-[#1c120d] border border-[#3a281e] flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="space-y-2">
            <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md bg-amber-500/20 text-amber-400 border border-amber-500/30 inline-block">
              Seri Botol 1 Liter (Ready to Share)
            </span>
            <h4 className="text-lg sm:text-xl font-black text-[#faf6ee]">
              Stok Kopi Segar untuk Kosan, Kantor, atau Acara Keluarga
            </h4>
            <p className="text-xs text-[#a9998d] max-w-xl">
              Dibuat fresh tanpa bahan pengawet. Tahan 4–5 hari di dalam lemari es. Cukup tuang dengan es batu kapan pun Anda butuh asupan kopi berkualitas.
            </p>
          </div>
          <a
            href="https://wa.me/6282119718463?text=Halo%20Dua%20Carita%20Coffee%2C%20saya%20ingin%20pesan%20kopi%20botol%201%20Liter..."
            target="_blank"
            rel="noopener noreferrer"
            className="px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-[#140e0b] font-black text-xs shrink-0 transition"
          >
            Pesan Botol 1 Liter via WhatsApp
          </a>
        </div>
      </div>
    </section>
  );
}

