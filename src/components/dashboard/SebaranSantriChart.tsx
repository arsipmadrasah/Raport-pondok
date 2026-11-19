import React, { useState, useMemo } from 'react';
import { PieChart } from 'lucide-react';
import { normalizeTingkat } from '../../constants/initialData';
import { toRomanClass } from '../../utils/academicHelpers';

export const TINGKAT_CHART_COLORS = [
  '#059669', // Tingkat 1: Emerald 600
  '#0D9488', // Tingkat 2: Teal 600
  '#0284C7', // Tingkat 3: Sky 600
  '#6366F1', // Tingkat 4: Indigo 500
  '#8B5CF6', // Tingkat 5: Violet 500
  '#D97706', // Tingkat 6: Amber 600
  '#EC4899', // Tingkat 7+: Pink 500
  '#F97316'  // Extra: Orange 500
];

export function SebaranSantriChart({ santriList = [], kelasList = [] }: { santriList: any[]; kelasList: any[] }) {
  const [hoveredTingkat, setHoveredTingkat] = useState<number | null>(null);

  const { chartData, totalCount } = useMemo(() => {
    const activeSantri = santriList.filter((s) => s.statusAktif);
    const activeKelas = kelasList.filter((k) => k.isActive);

    const tingkatCounts: Record<number, any> = {};
    activeKelas.forEach((k) => {
      const t = normalizeTingkat(k.tingkat, k.namaKelas);
      if (!tingkatCounts[t]) {
        tingkatCounts[t] = {
          tingkat: t,
          namaTingkat: `Tingkat ${t}`,
          subLabel: `Kelas ${toRomanClass(t)}`,
          count: 0
        };
      }
    });

    activeSantri.forEach((s) => {
      const k = activeKelas.find((kls) => kls.id === s.kelasId);
      if (k) {
        const t = normalizeTingkat(k.tingkat, k.namaKelas);
        if (tingkatCounts[t]) {
          tingkatCounts[t].count += 1;
        } else {
          tingkatCounts[t] = {
            tingkat: t,
            namaTingkat: `Tingkat ${t}`,
            subLabel: `Kelas ${toRomanClass(t)}`,
            count: 1
          };
        }
      }
    });

    const list = Object.values(tingkatCounts)
      .sort((a: any, b: any) => a.tingkat - b.tingkat)
      .map((item: any, idx: number) => ({
        ...item,
        color: TINGKAT_CHART_COLORS[idx % TINGKAT_CHART_COLORS.length]
      }));

    const total = list.reduce((sum: number, item: any) => sum + item.count, 0);

    return {
      chartData: list.map((item: any) => ({
        ...item,
        percent: total > 0 ? Math.round((item.count / total) * 1000) / 10 : 0
      })),
      totalCount: total
    };
  }, [santriList, kelasList]);

  const radius = 68;
  const strokeWidth = 24;
  const circumference = 2 * Math.PI * radius;

  let accumulatedRatio = 0;
  const donutSegments = chartData.map((item) => {
    const segmentRatio = totalCount > 0 ? item.count / totalCount : 0;
    const strokeDasharray = `${segmentRatio * circumference} ${circumference}`;
    const strokeDashoffset = -(accumulatedRatio * circumference);
    accumulatedRatio += segmentRatio;

    return {
      ...item,
      strokeDasharray,
      strokeDashoffset
    };
  });

  return (
    <div className="bg-white rounded-xl border-2 border-slate-900 shadow-[4px_4px_0px_#0F172A] p-4 sm:p-5">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b-2 border-slate-900">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-[#DBEAFE] text-slate-950 flex items-center justify-center font-bold shrink-0 border-2 border-slate-900 shadow-[2px_2px_0px_#0F172A]">
            <PieChart className="w-4 h-4 stroke-[2.25]" />
          </div>
          <div>
            <h3 className="font-black text-sm text-slate-950 tracking-tight">
              Sebaran Santri per Tingkat
            </h3>
            <p className="text-[11px] font-medium text-slate-600">Komposisi santri aktif per tingkatan</p>
          </div>
        </div>
        <span className="px-2.5 py-1 rounded-lg bg-[#D1FAE5] text-slate-950 text-xs font-black border-2 border-slate-900 shadow-[2px_2px_0px_#0F172A] shrink-0">
          {totalCount} Santri
        </span>
      </div>

      {/* Donut Chart Visual */}
      <div className="flex flex-col items-center justify-center py-2">
        <div className="relative w-44 h-44 sm:w-48 sm:h-48 flex items-center justify-center">
          <svg
            className="w-full h-full transform -rotate-90"
            viewBox="0 0 200 200"
          >
            <circle
              cx="100"
              cy="100"
              r={radius}
              fill="transparent"
              stroke="#E2E8F0"
              strokeWidth={strokeWidth}
            />

            {totalCount > 0 &&
              donutSegments.map((seg) => {
                const isHovered = hoveredTingkat === seg.tingkat;
                return (
                  <circle
                    key={seg.tingkat}
                    cx="100"
                    cy="100"
                    r={radius}
                    fill="transparent"
                    stroke={seg.color}
                    strokeWidth={isHovered ? strokeWidth + 5 : strokeWidth}
                    strokeDasharray={seg.strokeDasharray}
                    strokeDashoffset={seg.strokeDashoffset}
                    strokeLinecap="butt"
                    className="transition-all duration-300 cursor-pointer"
                    onMouseEnter={() => setHoveredTingkat(seg.tingkat)}
                    onMouseLeave={() => setHoveredTingkat(null)}
                  />
                );
              })}
          </svg>

          {/* Teks Informasi di Tengah Lingkaran */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
            {hoveredTingkat ? (
              (() => {
                const activeItem = chartData.find((d) => d.tingkat === hoveredTingkat);
                return (
                  <>
                    <span
                      className="text-[11px] font-black uppercase tracking-wider"
                      style={{ color: activeItem?.color }}
                    >
                      {activeItem?.namaTingkat}
                    </span>
                    <span className="text-2xl sm:text-3xl font-black text-slate-950 leading-none my-0.5">
                      {activeItem?.count}
                    </span>
                    <span className="text-[10px] font-bold text-slate-600">
                      {activeItem?.percent}% santri
                    </span>
                  </>
                );
              })()
            ) : (
              <>
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  Total
                </span>
                <span className="text-2xl sm:text-3xl font-black text-slate-950 leading-none my-0.5">
                  {totalCount}
                </span>
                <span className="text-[10px] font-extrabold text-emerald-800">Santri Aktif</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Rincian Komposisi per Tingkat */}
      <div className="mt-3 pt-3 border-t-2 border-slate-900 space-y-2">
        <div className="text-[11px] font-extrabold uppercase tracking-wide text-slate-700 px-1">
          Rincian Jumlah Santri:
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-0.5">
          {chartData.map((item) => {
            const isHovered = hoveredTingkat === item.tingkat;
            return (
              <div
                key={item.tingkat}
                onMouseEnter={() => setHoveredTingkat(item.tingkat)}
                onMouseLeave={() => setHoveredTingkat(null)}
                className={`p-2 rounded-lg transition-all cursor-pointer flex flex-col gap-1.5 ${
                  isHovered
                    ? 'bg-[#FEF08A] border-2 border-slate-900 shadow-[2px_2px_0px_#0F172A]'
                    : 'bg-slate-50 border border-slate-200 hover:bg-[#FEF9C3]'
                }`}
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span
                      className="w-2.5 h-2.5 rounded-sm border border-slate-900 shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="font-extrabold text-slate-900 text-[11px] truncate">
                      {item.namaTingkat}
                    </span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-black text-slate-950 text-xs">{item.count}</span>
                    <span className="text-[10px] font-semibold text-slate-600 ml-1">({item.percent}%)</span>
                  </div>
                </div>

                {/* Progress bar mini */}
                <div className="w-full h-1.5 bg-white rounded-sm border border-slate-300 overflow-hidden">
                  <div
                    className="h-full transition-all duration-300"
                    style={{
                      width: `${item.percent}%`,
                      backgroundColor: item.color
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

