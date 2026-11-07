export default function PortfolioStory() {
  return (
    <section id="cerita" className="py-20 px-4 sm:px-6 relative border-t border-[#261b15] bg-[#17100c]/60">
      <div className="max-w-4xl mx-auto space-y-12">
        {/* Section Header */}
        <div className="text-center space-y-2">
          <span className="text-xs font-bold text-amber-500 uppercase tracking-widest">
            Filosofi & Nilai
          </span>
          <h2 className="text-2xl sm:text-4xl font-black text-[#faf6ee] tracking-tight">
            Kisah di Balik "Dua Carita"
          </h2>
          <div className="w-12 h-0.5 bg-amber-500/40 mx-auto mt-3" />
        </div>

        {/* Story Text Editorial Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="space-y-4 text-xs sm:text-sm text-[#bcaaa0] leading-relaxed font-normal">
            <p>
              Setiap cangkir kopi selalu memiliki dua sisi cerita. Cerita pertama lahir dari barista di balik bar—tentang ketelitian memilih biji kopi nusantara, menjaga suhu ekstraksi, dan memasak gula aren murni hingga mendapatkan karamelisasi yang pas.
            </p>
            <p>
              Cerita kedua adalah milik Anda—para penikmat yang memesan kopi untuk menemani obrolan santai bersama sahabat, bekal energi sebelum ujian semester, atau pelepas lelah di tengah padatnya keriuhan bazaar kampus.
            </p>
            <p className="text-[#f1e6d7] font-semibold italic border-l-2 border-amber-500 pl-4 py-1">
              "Ketika seduhan kami bertemu dengan senyum dan obrolan Anda, di sanalah Dua Carita menjadi satu kisah yang bermakna."
            </p>
          </div>

          {/* Visual Showcase Card */}
          <div className="p-6 rounded-3xl bg-[#201610] border border-[#34241a] space-y-5 relative shadow-xl">
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block">
                Janji Seduhan Kami
              </span>
              <h3 className="text-lg font-black text-[#f8f3ea]">
                Kopi Jujur, Rasa yang Tak Pernah Berbohong
              </h3>
            </div>

            <ul className="space-y-3 text-xs text-[#bdaaa0]">
              <li className="flex items-start gap-2.5">
                <span className="h-5 w-5 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                  ✓
                </span>
                <span>
                  <strong className="text-[#f1e6d7]">Gula Aren Alami:</strong> Diproses langsung tanpa bahan pengawet atau pemanis buatan agar manisnya terasa legit di tenggorokan.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="h-5 w-5 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                  ✓
                </span>
                <span>
                  <strong className="text-[#f1e6d7]">Racikan Fresh:</strong> Setiap varian botol maupun cup dibuat fresh sehingga cita rasa kopi tetap aromatik dan optimal.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="h-5 w-5 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                  ✓
                </span>
                <span>
                  <strong className="text-[#f1e6d7]">Kemudahan Berbagi:</strong> Tersedia dalam botol 1 Liter dan 250 ML untuk dinikmati bersama teman atau keluarga.
                </span>
              </li>
            </ul>

            <div className="pt-2 border-t border-[#2e2017] flex items-center justify-between text-[11px] text-[#8e7e72]">
              <span>Diseduh dengan cinta di Bandung</span>
              <span className="font-semibold text-amber-400">Est. 2026</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

