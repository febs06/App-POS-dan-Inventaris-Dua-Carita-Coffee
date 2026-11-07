import { MessageSquare, Users, Building, Sparkles, ArrowUpRight } from "lucide-react";
import InstagramIcon from "./InstagramIcon";

export default function PortfolioCollaboration() {
  const waUrl = "https://wa.me/6282119718463?text=Halo%20Dua%20Carita%20Coffee%2C%20saya%20ingin%20mengajak%20kolaborasi%20booth%20%2F%20memesan%20coffee%20catering%20untuk%20acara%20kami...";

  return (
    <section id="kolaborasi" className="py-20 px-4 sm:px-6 relative border-t border-[#261b15]">
      <div className="max-w-4xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center space-y-2">
          <span className="text-xs font-bold text-amber-500 uppercase tracking-widest">
            Ajak Kami ke Acara Anda
          </span>
          <h2 className="text-2xl sm:text-4xl font-black text-[#faf6ee] tracking-tight">
            Kolaborasi Pop-Up Booth & Catering Kopi
          </h2>
          <p className="text-xs sm:text-sm text-[#9f8d81] max-w-xl mx-auto">
            Hadirkan aroma seduhan kopi segar dan kehangatan Dua Carita Coffee untuk menyemarakkan acara spesial Anda.
          </p>
          <div className="w-12 h-0.5 bg-amber-500/40 mx-auto mt-3" />
        </div>

        {/* 3 Collaboration Formats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="p-5 rounded-3xl bg-[#1d140f] border border-[#2e2017] space-y-3 text-center sm:text-left">
            <div className="h-10 w-10 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto sm:mx-0">
              <Users className="h-5 w-5" />
            </div>
            <h3 className="font-extrabold text-sm text-[#f6f0e6]">
              Bazaar Kampus & Festival
            </h3>
            <p className="text-xs text-[#a29185] leading-relaxed">
              Pop-up booth lengkap dengan tim barista, siap melayani antrean mahasiswa dan pengunjung acara dengan cepat.
            </p>
          </div>

          <div className="p-5 rounded-3xl bg-[#1d140f] border border-[#2e2017] space-y-3 text-center sm:text-left">
            <div className="h-10 w-10 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto sm:mx-0">
              <Building className="h-5 w-5" />
            </div>
            <h3 className="font-extrabold text-sm text-[#f6f0e6]">
              Gathering Kantor & Workshop
            </h3>
            <p className="text-xs text-[#a29185] leading-relaxed">
              Paket coffee break segar untuk meeting, seminar, atau perayaan pencapaian tim kerja Anda di Bandung.
            </p>
          </div>

          <div className="p-5 rounded-3xl bg-[#1d140f] border border-[#2e2017] space-y-3 text-center sm:text-left">
            <div className="h-10 w-10 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto sm:mx-0">
              <Sparkles className="h-5 w-5" />
            </div>
            <h3 className="font-extrabold text-sm text-[#f6f0e6]">
              Wedding & Intimate Party
            </h3>
            <p className="text-xs text-[#a29185] leading-relaxed">
              Suguhan kopi susu aren otentik dan kemasan botol custom untuk souvenir atau sajian tamu undangan.
            </p>
          </div>
        </div>

        {/* Contact Action Box */}
        <div className="p-8 rounded-3xl bg-gradient-to-r from-[#241710] to-[#1c120c] border border-amber-500/30 text-center space-y-4 shadow-xl">
          <h3 className="text-lg sm:text-xl font-black text-[#faf6ee]">
            Siap Berkolaborasi? Mari Mengobrol!
          </h3>
          <p className="text-xs text-[#b8a69a] max-w-md mx-auto">
            Sampaikan tanggal dan konsep acara Anda kepada kami. Tim Dua Carita akan menyiapkan penawaran paket seduhan terbaik.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-[#140e0b] font-black text-xs shadow-lg shadow-amber-500/20 transition flex items-center gap-2"
            >
              <MessageSquare className="h-4 w-4" />
              <span>Hubungi Kami via WhatsApp</span>
            </a>
            <a
              href="https://www.instagram.com/duacaritacoffee"
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-3.5 rounded-2xl bg-[#20150f] hover:bg-[#291b14] text-[#ebd8c6] border border-[#3b291e] font-bold text-xs transition flex items-center gap-2"
            >
              <InstagramIcon className="h-4 w-4 text-amber-400" />
              <span>DM Instagram @duacaritacoffee</span>
              <ArrowUpRight className="h-3 w-3 text-[#9a887c]" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

