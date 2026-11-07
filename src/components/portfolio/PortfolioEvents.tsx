import { Calendar, MapPin, Sparkles, CheckCircle2 } from "lucide-react";

interface EventItem {
  name: string;
  location: string;
  badge: string;
  isUpcoming?: boolean;
  description: string;
}

const EVENTS_LIST: EventItem[] = [
  {
    name: "Bazar Pendidikan Broadcasting Vol.14",
    location: "Kampus IKOPIN, Bandung",
    badge: "Upcoming Event",
    isUpcoming: true,
    description: "Siap hadir kembali menyapa mahasiswa dan pengunjung festival penyiaran dengan racikan kopi susu aren segar andalan.",
  },
  {
    name: "Bazar PMI",
    location: "Jl. Aceh No. 79, Cihapit, Bandung Wetan",
    badge: "Sukses Digelar",
    description: "Menemani semangat para relawan dan masyarakat Kota Bandung dalam perhelatan aksi kemanusiaan PMI Jawa Barat.",
  },
  {
    name: "CONEXT",
    location: "Kampus UPI Cibiru, Bandung",
    badge: "Sukses Digelar",
    description: "Meramaikan panggung festival kreatif mahasiswa UPI Cibiru dengan antusiasme ratusan cup terjual.",
  },
  {
    name: "PRABASWARA",
    location: "Kampus IKOPIN, Bandung",
    badge: "Sukses Digelar",
    description: "Booth Dua Carita Coffee menjadi titik kumpul hangat peserta festival seni dan budaya di IKOPIN.",
  },
  {
    name: "ORKAFEST",
    location: "Kampus UPI Cibiru, Bandung",
    badge: "Sukses Digelar",
    description: "Pesta musik dan orkestrasi kampus yang disemarakkan oleh aroma kopi segar Dua Carita.",
  },
  {
    name: "MOKAZAR",
    location: "Bazaar MOKAZAR, Bandung",
    badge: "Sukses Digelar",
    description: "Pengalaman bazaar awal yang mengukir cerita persahabatan dan sambutan hangat para penikmat kopi pertama kami.",
  },
];

export default function PortfolioEvents() {
  return (
    <section id="event" className="py-20 px-4 sm:px-6 relative border-t border-[#261b15] bg-[#17100c]/40">
      <div className="max-w-5xl mx-auto space-y-10">
        {/* Header */}
        <div className="text-center space-y-2">
          <span className="text-xs font-bold text-amber-500 uppercase tracking-widest">
            Rekam Jejak & Dokumentasi
          </span>
          <h2 className="text-2xl sm:text-4xl font-black text-[#faf6ee] tracking-tight">
            Perjalanan Pop-Up Booth di Bandung
          </h2>
          <p className="text-xs sm:text-sm text-[#9f8d81] max-w-xl mx-auto">
            Dari festival seni kampus hingga bazaar kemanusiaan di pusat kota, kami selalu bangga menjadi bagian dari keriaan acara Anda.
          </p>
          <div className="w-12 h-0.5 bg-amber-500/40 mx-auto mt-3" />
        </div>

        {/* Events Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {EVENTS_LIST.map((ev) => (
            <div
              key={ev.name}
              className={`p-5 rounded-3xl border transition-all duration-300 flex flex-col justify-between space-y-4 ${
                ev.isUpcoming
                  ? "bg-gradient-to-br from-[#291910] to-[#1c120c] border-amber-500/40 shadow-lg shadow-amber-500/10"
                  : "bg-[#1d140f] border-[#2e2017] hover:border-[#3d2b20]"
              }`}
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${
                      ev.isUpcoming
                        ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                        : "bg-[#271b14] text-[#b3a195] border-[#38271d]"
                    }`}
                  >
                    {ev.badge}
                  </span>
                  {ev.isUpcoming && (
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                    </span>
                  )}
                </div>

                <h3 className="font-extrabold text-base text-[#fbf7f0] leading-snug">
                  {ev.name}
                </h3>

                <div className="flex items-center gap-1.5 text-xs text-amber-400 font-medium">
                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{ev.location}</span>
                </div>

                <p className="text-xs text-[#a39286] leading-relaxed pt-1">
                  {ev.description}
                </p>
              </div>

              <div className="pt-3 border-t border-[#2a1d15] flex items-center justify-between text-[11px] text-[#7d6c61]">
                <span>Dua Carita Booth</span>
                <span className="text-amber-500/80 font-semibold">Bandung</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

