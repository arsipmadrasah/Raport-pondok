import React, { useMemo } from 'react';
import {
  AlertTriangle,
  BookOpen,
  Edit3,
  Printer
} from 'lucide-react';
import { normalizeTingkat } from '../../constants/initialData';
import { toRomanClass, getTingkatBadgeStyle } from '../../utils/academicHelpers';
import { SebaranSantriChart } from './SebaranSantriChart';

export function DashboardView({
  monitoring,
  activeTA,
  activeSemester,
  logs,
  kelasList = [],
  santriList = [],
  onNavigate
}) {
  const kelasSummaryText = useMemo(() => {
    const activeKelas = kelasList.filter((k) => k.isActive);
    const byTingkat = {};
    activeKelas.forEach((k) => {
      const t = normalizeTingkat(k.tingkat, k.namaKelas);
      byTingkat[t] = (byTingkat[t] || 0) + 1;
    });
    const parts = Object.entries(byTingkat)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([t, count]) => `${toRomanClass(Number(t))} (${count})`);
    return parts.length > 0 ? parts.join(' • ') : 'Belum ada kelas';
  }, [kelasList]);

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* 4 KARTU STATISTIK (NEO-BRUTALISM RAPI) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Santri */}
        <div className="bg-[#D1FAE5] rounded-xl p-5 border-2 border-slate-900 shadow-[4px_4px_0px_#0F172A] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_#0F172A] transition-all flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-white border-2 border-slate-900 p-1 flex items-center justify-center shrink-0">
            <img
              src="/icons/icon-total-santri.png"
              alt="Total Santri"
              className="w-full h-full object-contain"
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-extrabold uppercase tracking-wide text-slate-800">Total Santri</p>
            <h4 className="text-2xl sm:text-3xl font-black text-slate-950 leading-tight">
              {monitoring.totalSantriCount}
            </h4>
            <p className="text-[11px] font-semibold text-slate-700 truncate">
              Tersebar di {monitoring.totalKelasCount} kelas
            </p>
          </div>
        </div>

        {/* Card 2: Total Kelas */}
        <div className="bg-[#DBEAFE] rounded-xl p-5 border-2 border-slate-900 shadow-[4px_4px_0px_#0F172A] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_#0F172A] transition-all flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-white border-2 border-slate-900 p-1 flex items-center justify-center shrink-0">
            <img
              src="/icons/icon-total-kelas.png"
              alt="Total Kelas"
              className="w-full h-full object-contain"
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-extrabold uppercase tracking-wide text-slate-800">Total Kelas</p>
            <h4 className="text-2xl sm:text-3xl font-black text-slate-950 leading-tight">
              {monitoring.totalKelasCount}
            </h4>
            <p className="text-[11px] font-semibold text-slate-700 truncate">
              {kelasSummaryText}
            </p>
          </div>
        </div>

        {/* Card 3: Rapor Lengkap */}
        <div className="bg-[#EDE9FE] rounded-xl p-5 border-2 border-slate-900 shadow-[4px_4px_0px_#0F172A] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_#0F172A] transition-all flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-white border-2 border-slate-900 p-1 flex items-center justify-center shrink-0">
            <img
              src="/icons/icon-rapor-lengkap.png"
              alt="Rapor Lengkap"
              className="w-full h-full object-contain"
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-extrabold uppercase tracking-wide text-slate-800">Rapor Lengkap</p>
            <h4 className="text-2xl sm:text-3xl font-black text-slate-950 leading-tight">
              {monitoring.totalComplete}{' '}
              <span className="text-sm font-bold text-slate-600">/ {monitoring.totalSantriCount}</span>
            </h4>
            <p className="text-[11px] font-semibold text-slate-700 truncate">
              {monitoring.overallPercent}% siap cetak PDF
            </p>
          </div>
        </div>

        {/* Card 4: Belum Lengkap */}
        <div className="bg-[#FEF3C7] rounded-xl p-5 border-2 border-slate-900 shadow-[4px_4px_0px_#0F172A] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_#0F172A] transition-all flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#FDE047] border-2 border-slate-900 flex items-center justify-center shrink-0 text-slate-950">
            <AlertTriangle className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-extrabold uppercase tracking-wide text-slate-800">Belum Lengkap</p>
            <h4 className="text-2xl sm:text-3xl font-black text-slate-950 leading-tight">
              {monitoring.totalIncomplete}
            </h4>
            <p className="text-[11px] font-semibold text-slate-700 truncate">
              Menunggu nilai wajib
            </p>
          </div>
        </div>
      </div>

      {/* MONITORING KELAS & PANEL SAMPING */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
        {/* KOLOM KIRI (2/3): MONITORING KELENGKAPAN NILAI */}
        <div className="lg:col-span-2 bg-white rounded-xl border-2 border-slate-900 shadow-[4px_4px_0px_#0F172A] overflow-hidden">
          <div className="p-4 sm:px-6 sm:py-4 bg-[#F8FAFC] border-b-2 border-slate-900 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#A7F3D0] text-slate-950 flex items-center justify-center shrink-0 border-2 border-slate-900 shadow-[2px_2px_0px_#0F172A]">
              <BookOpen className="w-5 h-5 stroke-[2.25]" />
            </div>
            <div>
              <h3 className="font-black text-slate-950 text-sm sm:text-base tracking-tight">
                Monitoring Kelengkapan Nilai per Kelas ({monitoring.totalKelasCount} Tingkat)
              </h3>
              <p className="text-xs font-medium text-slate-600">
                Klik tombol untuk langsung menginput nilai atau mencetak rapor
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#FEF9C3] border-b-2 border-slate-900 text-[11px] font-black text-slate-900 uppercase tracking-wider">
                  <th className="py-3 px-4 sm:px-6">Tingkat</th>
                  <th className="py-3 px-4">Kelas</th>
                  <th className="py-3 px-4">Wali Kelas</th>
                  <th className="py-3 px-4">Kelengkapan Nilai</th>
                  <th className="py-3 px-4 sm:px-6 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/70 text-xs text-slate-800">
                {monitoring.perKelasStats.map((item) => {
                  const tingkatNum = normalizeTingkat(item.kelas.tingkat, item.kelas.namaKelas);
                  const badgeClass = getTingkatBadgeStyle(tingkatNum);
                  const isFinished = item.avgCompletion === 100;

                  return (
                    <tr key={item.kelas.id} className="hover:bg-[#FEFCE8]/70 transition-colors">
                      <td className="py-3.5 px-4 sm:px-6 whitespace-nowrap">
                        <span className={`inline-block px-3 py-1 rounded-lg text-[11px] font-black border-[1.5px] border-slate-900 shadow-[2px_2px_0px_#0F172A] ${badgeClass}`}>
                          Tingkat {tingkatNum}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-black text-slate-950 text-sm whitespace-nowrap">
                        {item.kelas.namaKelas}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-700 whitespace-nowrap">
                        {item.kelas.waliKelas || 'Belum Ditugaskan'}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="space-y-1.5">
                          <span className="text-xs font-extrabold text-slate-900">
                            {item.completeCount}/{item.totalSantri} ({item.avgCompletion}%)
                          </span>
                          <div className="w-28 sm:w-36 h-2.5 bg-slate-100 rounded-md border-[1.5px] border-slate-900 overflow-hidden">
                            <div
                              className={`h-full transition-all duration-300 ${isFinished ? 'bg-[#10B981]' : item.avgCompletion > 0 ? 'bg-[#34D399]' : 'bg-transparent'
                                }`}
                              style={{ width: `${item.avgCompletion}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 sm:px-6 whitespace-nowrap text-center">
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => onNavigate('input-nilai', item.kelas.id)}
                            className="px-2.5 py-1.5 rounded-lg border-2 border-slate-900 bg-white hover:bg-[#FEF08A] text-slate-900 text-xs font-extrabold flex items-center gap-1 shadow-[2px_2px_0px_#0F172A] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Input</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => onNavigate('cetak-rapor', item.kelas.id)}
                            className="px-2.5 py-1.5 rounded-lg border-2 border-slate-900 bg-[#059669] hover:bg-[#047857] text-white text-xs font-extrabold flex items-center gap-1 shadow-[2px_2px_0px_#0F172A] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>Rapor</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* KOLOM KANAN (1/3): PANEL SEBARAN SANTRI PER TINGKAT (DIAGRAM LINGKARAN) */}
        <div>
          <SebaranSantriChart santriList={santriList} kelasList={kelasList} />
        </div>
      </div>
    </div>
  );
}