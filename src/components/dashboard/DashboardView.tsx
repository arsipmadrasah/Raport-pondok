import React, { useMemo } from 'react';
import {
  Users,
  Layers,
  FileCheck2,
  AlertTriangle,
  BookOpen,
  Edit3,
  Printer,
  ChevronRight
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
      {/* 4 KARTU STATISTIK */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Santri */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center shrink-0 text-emerald-700">
            <Users className="w-6 h-6" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-slate-500">Total Santri</p>
            <h4 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight">
              {monitoring.totalSantriCount}
            </h4>
            <p className="text-[11px] text-slate-500 truncate">
              Tersebar di {monitoring.totalKelasCount} kelas
            </p>
          </div>
        </div>

        {/* Card 2: Total Kelas */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-sky-100 flex items-center justify-center shrink-0 text-sky-600">
            <Layers className="w-6 h-6" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-slate-500">Total Kelas</p>
            <h4 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight">
              {monitoring.totalKelasCount}
            </h4>
            <p className="text-[11px] text-slate-500 truncate">
              {kelasSummaryText}
            </p>
          </div>
        </div>

        {/* Card 3: Rapor Lengkap */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-100 flex items-center justify-center shrink-0 text-purple-600">
            <FileCheck2 className="w-6 h-6" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-slate-500">Rapor Lengkap</p>
            <h4 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight">
              {monitoring.totalComplete}{' '}
              <span className="text-sm font-medium text-slate-400">/ {monitoring.totalSantriCount}</span>
            </h4>
            <p className="text-[11px] text-slate-500 truncate">
              {monitoring.overallPercent}% siap cetak PDF
            </p>
          </div>
        </div>

        {/* Card 4: Belum Lengkap */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center shrink-0 text-amber-600">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-slate-500">Belum Lengkap</p>
            <h4 className="text-2xl sm:text-3xl font-extrabold text-amber-600 leading-tight">
              {monitoring.totalIncomplete}
            </h4>
            <p className="text-[11px] text-slate-500 truncate">
              Menunggu nilai wajib
            </p>
          </div>
        </div>
      </div>

      {/* MONITORING KELAS & PANEL SAMPING */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
        {/* KOLOM KIRI (2/3): MONITORING KELENGKAPAN NILAI */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="p-4 sm:px-6 sm:py-5 border-b border-slate-100 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-100">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm sm:text-base tracking-tight">
                Monitoring Kelengkapan Nilai per Kelas ({monitoring.totalKelasCount} Tingkat)
              </h3>
              <p className="text-xs text-slate-500">
                Klik tombol untuk langsung menginput nilai atau mencetak rapor
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4 sm:px-6">Tingkat</th>
                  <th className="py-3 px-4">Kelas</th>
                  <th className="py-3 px-4">Wali Kelas</th>
                  <th className="py-3 px-4">Kelengkapan Nilai</th>
                  <th className="py-3 px-4 sm:px-6 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {monitoring.perKelasStats.map((item) => {
                  const tingkatNum = normalizeTingkat(item.kelas.tingkat, item.kelas.namaKelas);
                  const badgeClass = getTingkatBadgeStyle(tingkatNum);
                  const isFinished = item.avgCompletion === 100;

                  return (
                    <tr key={item.kelas.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 sm:px-6 whitespace-nowrap">
                        <span className={`inline-block px-3 py-1 rounded-full text-[11px] font-extrabold ${badgeClass}`}>
                          Tingkat {tingkatNum}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900 text-sm whitespace-nowrap">
                        {item.kelas.namaKelas}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                        {item.kelas.waliKelas || 'Belum Ditugaskan'}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="space-y-1">
                          <span className="text-xs font-semibold text-slate-800">
                            {item.completeCount}/{item.totalSantri} ({item.avgCompletion}%)
                          </span>
                          <div className="w-28 sm:w-36 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${isFinished ? 'bg-emerald-600' : item.avgCompletion > 0 ? 'bg-emerald-500' : 'bg-slate-200'
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
                            className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1 shadow-2xs transition"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                            <span>Input</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => onNavigate('cetak-rapor', item.kelas.id)}
                            className="px-2.5 py-1.5 rounded-lg bg-[#064E3B] hover:bg-emerald-900 text-white text-xs font-semibold flex items-center gap-1 shadow-2xs transition"
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