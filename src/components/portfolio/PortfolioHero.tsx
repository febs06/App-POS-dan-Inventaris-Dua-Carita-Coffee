import { ArrowDown, Sparkles, MapPin, Coffee, Heart } from "lucide-react";

export default function PortfolioHero() {
  return (
    <section className="relative min-h-[92vh] flex items-center justify-center pt-28 pb-16 px-4 sm:px-6 overflow-hidden">
      {/* Background Ambient Warm Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[650px] h-[450px] bg-gradient-to-b from-amber-600/15 via-orange-900/10 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-4xl mx-auto text-center relative z-10 space-y-6">
        {/* Origin Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#261b15]/90 border border-[#3f2c22] text-[#e8dacb] text-xs font-semibold shadow-xs">
          <MapPin className="h-3.5 w-3.5 text-amber-400 shrink-0" />
          <span>Seduhan Kopi Pilihan &bull; Berkelana di Kota Bandung</span>
        </div>

        {/* Main Editorial Headline */}
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-[#fbf7f0] tracking-tight leading-[1.15]">
          Ada Cerita di Setiap Seduhan, <br className="hidden sm:inline" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-400 to-orange-400">
            Kehangatan di Setiap Pertemuan.
          </span>
        </h1>

        {/* Narrative Subtext */}
        <p className="text-sm sm:text-base text-[#bdaaa0] leading-relaxed max-w-2xl mx-auto font-normal">
          Dua Carita Coffee meracik kopi susu gula aren otentik, racikan signature segar, dan cerita persahabatan yang hadir menyapa dari satu panggung bazaar kampus ke festival berikutnya di Kota Bandung.
        </p>

        {/* Action CTAs */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
          <a
            href="#menu"
            className="px-6 py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-[#140e0b] font-black text-xs tracking-wide shadow-lg shadow-amber-500/20 transition hover:scale-[1.02] active:scale-[0.98]"
          >
            Jelajahi Karya Rasa Kami
          </a>
          <a
            href="#event"
            className="px-6 py-3.5 rounded-2xl bg-[#231812] hover:bg-[#2b1f17] text-[#edd9c6] border border-[#3c2a1f] font-bold text-xs tracking-wide transition"
          >
            Rekam Jejak Event
          </a>
        </div>

        {/* Three Core Brand Pillars */}
        <div className="pt-12 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto text-left">
          <div className="p-4 rounded-2xl bg-[#1c130e]/80 border border-[#2e2017] flex items-start gap-3">
            <div className="h-9 w-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <Coffee className="h-4.5 w-4.5" />
            </div>
            <div>
              <h3 className="font-bold text-xs text-[#f4eee6]">Espresso Fresh Roast</h3>
              <p className="text-[11px] text-[#9f8d81] mt-0.5 leading-snug">
                Biji kopi pilihan yang diekstraksi tepat untuk aroma kopi mantap dan seimbang.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#1c130e]/80 border border-[#2e2017] flex items-start gap-3">
            <div className="h-9 w-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <Sparkles className="h-4.5 w-4.5" />
            </div>
            <div>
              <h3 className="font-bold text-xs text-[#f4eee6]">100% Gula Aren Murni</h3>
              <p className="text-[11px] text-[#9f8d81] mt-0.5 leading-snug">
                Manis legit alami tanpa esens buatan, memberikan karakter rasa khas Indonesia.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#1c130e]/80 border border-[#2e2017] flex items-start gap-3">
            <div className="h-9 w-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <Heart className="h-4.5 w-4.5" />
            </div>
            <div>
              <h3 className="font-bold text-xs text-[#f4eee6]">Pop-Up Booth & Bazaar</h3>
              <p className="text-[11px] text-[#9f8d81] mt-0.5 leading-snug">
                Berpengalaman melayani ratusan pengunjung di pameran, kampus, dan festival.
              </p>
            </div>
          </div>
        </div>

        {/* Subtle Scroll Down Prompt */}
        <div className="pt-8">
          <a
            href="#cerita"
            className="inline-flex items-center gap-1.5 text-xs text-[#8c7b70] hover:text-amber-400 transition"
          >
            <span>Baca kisah kami</span>
            <ArrowDown className="h-3.5 w-3.5 animate-bounce" />
          </a>
        </div>
      </div>
    </section>
  );
}

