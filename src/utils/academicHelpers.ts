// ============================================================================
// ACADEMIC HELPERS, PREDIKAT RESOLUTION, EXPORT & FORMATTERS
// ============================================================================

import { normalizeTingkat } from '../constants/initialData';

export function toArabicNumerals(input: any): string {
  if (input === null || input === undefined) return '—';
  const map = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return String(input).replace(/[0-9]/g, (d) => map[Number(d)]);
}

export function toRomanClass(tingkat: any): string {
  const map: Record<number, string> = { 1: 'VII', 2: 'VIII', 3: 'IX', 4: 'X', 5: 'XI', 6: 'XII' };
  return map[Number(tingkat)] || `Tingkat ${tingkat}`;
}

export function getTingkatBadgeStyle(tingkat: any): string {
  switch (Number(tingkat)) {
    case 1:
      return 'bg-[#064E3B] text-amber-300 border border-emerald-800';
    case 2:
      return 'bg-amber-100 text-amber-900 border border-amber-200';
    case 3:
      return 'bg-purple-100 text-purple-900 border border-purple-200';
    case 4:
      return 'bg-blue-100 text-blue-900 border border-blue-200';
    case 5:
      return 'bg-teal-100 text-teal-900 border border-teal-200';
    case 6:
      return 'bg-rose-100 text-rose-900 border border-rose-200';
    default:
      return 'bg-slate-100 text-slate-700 border border-slate-200';
  }
}

export function resolvePredikat(nilai: any, predikatRules: any[] = []) {
  if (nilai === null || nilai === undefined || Number.isNaN(Number(nilai))) {
    return {
      predikatArab: '—',
      predikatLatin: '—',
      keterangan: 'Belum dinilai',
      badgeColor: 'bg-slate-100 text-slate-500 border-slate-200'
    };
  }
  const n = Math.round(Number(nilai) * 100) / 100;
  const sorted = [...predikatRules].sort((a, b) => b.batasBawah - a.batasBawah);
  for (const rule of sorted) {
    if (n >= rule.batasBawah && n <= rule.batasAtas) {
      let badgeColor = 'bg-emerald-50 text-emerald-800 border-emerald-200';
      if (rule.batasBawah >= 4.0) badgeColor = 'bg-amber-50 text-amber-800 border-amber-300';
      else if (rule.batasBawah >= 3.5) badgeColor = 'bg-emerald-50 text-emerald-800 border-emerald-300';
      else if (rule.batasBawah >= 3.0) badgeColor = 'bg-sky-50 text-sky-800 border-sky-200';
      else if (rule.batasBawah >= 2.7) badgeColor = 'bg-violet-50 text-violet-800 border-violet-200';
      else badgeColor = 'bg-rose-50 text-rose-800 border-rose-200';

      return {
        predikatArab: rule.predikatArab,
        predikatLatin: rule.predikatLatin,
        keterangan: rule.keterangan,
        badgeColor
      };
    }
  }
  return {
    predikatArab: '—',
    predikatLatin: 'Dhaif',
    keterangan: 'Belum mencapai standar',
    badgeColor: 'bg-rose-50 text-rose-700 border-rose-200'
  };
}

export function isMapelForKelas(mapel: any, kelasId: string): boolean {
  if (!kelasId || kelasId === 'ALL') return true;
  if (!mapel) return false;
  const targets = mapel.targetKelasIds;
  if (!targets || !Array.isArray(targets) || targets.length === 0 || targets.includes('ALL')) {
    return true;
  }
  return targets.includes(kelasId);
}

export function calculateClassAcademicReport({
  santriInKelas = [],
  activeMapelList = [],
  nilaiList = [],
  semesterId = '',
  predikatRules = []
}: {
  santriInKelas: any[];
  activeMapelList: any[];
  nilaiList: any[];
  semesterId: string;
  predikatRules: any[];
}) {
  const wajibMapels = activeMapelList.filter((m) => m.statusAktif && m.statusWajib);
  const totalWajibCount = wajibMapels.length;

  const nilaiIndex = new Map<string, any>();
  for (const item of nilaiList) {
    if (item.semesterId === semesterId) {
      nilaiIndex.set(`${item.santriId}__${item.mapelId}`, item.angkaNilai);
    }
  }

  const rawEvaluations = santriInKelas.map((santri) => {
    const mapelScores: Record<string, any> = {};
    let sumWajib = 0;
    let filledWajibCount = 0;
    const missingWajibNames: string[] = [];

    for (const mp of activeMapelList.filter((m) => m.statusAktif)) {
      const key = `${santri.id}__${mp.id}`;
      const rawVal = nilaiIndex.has(key) ? nilaiIndex.get(key) : null;
      const isFilled = rawVal !== null && rawVal !== undefined && rawVal !== '';
      const numericVal = isFilled ? Math.round(Number(rawVal) * 100) / 100 : null;
      const predikat = resolvePredikat(numericVal, predikatRules);

      mapelScores[mp.id] = {
        angkaNilai: numericVal,
        isFilled,
        ...predikat
      };

      if (mp.statusWajib) {
        if (isFilled && numericVal !== null) {
          sumWajib += numericVal;
          filledWajibCount += 1;
        } else {
          missingWajibNames.push(mp.namaLatin);
        }
      }
    }

    const isComplete = totalWajibCount > 0 && filledWajibCount === totalWajibCount;
    const totalNilai = filledWajibCount > 0 ? Math.round(sumWajib * 100) / 100 : null;
    const rataRata =
      filledWajibCount > 0
        ? Math.round((sumWajib / filledWajibCount) * 100) / 100
        : null;
    const predikatRataRata =
      rataRata !== null
        ? resolvePredikat(rataRata, predikatRules)
        : { predikatArab: '—', predikatLatin: '—', keterangan: 'Belum Lengkap' };

    return {
      santri,
      mapelScores,
      filledWajibCount,
      totalWajibCount,
      missingWajibNames,
      completionPercent:
        totalWajibCount > 0 ? Math.round((filledWajibCount / totalWajibCount) * 100) : 100,
      isComplete,
      totalNilai,
      rataRata,
      predikatRataRata,
      peringkat: null as number | null
    };
  });

  const rankableGroup = rawEvaluations
    .filter((item) => item.filledWajibCount > 0)
    .sort((a, b) => {
      if ((b.rataRata || 0) !== (a.rataRata || 0)) return (b.rataRata || 0) - (a.rataRata || 0);
      if ((b.totalNilai || 0) !== (a.totalNilai || 0)) return (b.totalNilai || 0) - (a.totalNilai || 0);
      return a.santri.namaLengkap.localeCompare(b.santri.namaLengkap);
    });

  let currentRank = 1;
  for (let i = 0; i < rankableGroup.length; i++) {
    if (i > 0) {
      const prev = rankableGroup[i - 1];
      const curr = rankableGroup[i];
      if (curr.rataRata === prev.rataRata && curr.totalNilai === prev.totalNilai) {
        curr.peringkat = prev.peringkat;
      } else {
        curr.peringkat = i + 1;
      }
    } else {
      rankableGroup[i].peringkat = currentRank;
    }
  }

  return rawEvaluations;
}

export function getWitaTimeString(includeSeconds = false): string {
  return new Date().toLocaleTimeString('id-ID', {
    timeZone: 'Asia/Makassar',
    hour: '2-digit',
    minute: '2-digit',
    ...(includeSeconds ? { second: '2-digit' } : {})
  });
}

export function getWitaDateString(): string {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Makassar' }).format(new Date());
}

export function getWitaFormattedFullDate(): string {
  return new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Makassar',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(new Date());
}

export function exportSantriAndGradesToCSV({
  santriToExport,
  kelasList,
  activeMapels,
  nilaiList,
  selectedSemesterId,
  predikatList,
  filenameLabel = 'Kelas_6_Akhir'
}: {
  santriToExport: any[];
  kelasList: any[];
  activeMapels: any[];
  nilaiList: any[];
  selectedSemesterId: string;
  predikatList: any[];
  filenameLabel?: string;
}) {
  const evals = calculateClassAcademicReport({
    santriInKelas: santriToExport,
    activeMapelList: activeMapels,
    nilaiList,
    semesterId: selectedSemesterId,
    predikatRules: predikatList
  });

  const mapelHeaders = activeMapels.map((m) => `"${m.namaLatin}"`);
  const headers = [
    '"No"',
    '"NIS"',
    '"NISN"',
    '"Nama Lengkap"',
    '"Nama Arab"',
    '"Jenis Kelamin"',
    '"Kelas"',
    '"Tingkat"',
    '"Tahun Masuk"',
    '"Nama Wali"',
    '"Alamat"',
    ...mapelHeaders,
    '"Nilai Total"',
    '"Rata-rata"',
    '"Predikat Akhir"'
  ];

  const rows = evals.map((ev, idx) => {
    const s = ev.santri;
    const kls = kelasList.find((k) => k.id === s.kelasId);
    const mapelCols = activeMapels.map((m) => {
      const sc = ev.mapelScores[m.id];
      return sc?.isFilled ? `"${sc.angkaNilai.toFixed(2)}"` : '""';
    });

    return [
      idx + 1,
      `"${s.nis || ''}"`,
      `"${s.nisn || ''}"`,
      `"${(s.namaLengkap || '').replace(/"/g, '""')}"`,
      `"${(s.namaArab || '').replace(/"/g, '""')}"`,
      `"${s.jenisKelamin || 'L'}"`,
      `"${kls?.namaKelas || ''}"`,
      `"Tingkat ${normalizeTingkat(kls?.tingkat, kls?.namaKelas)}"`,
      `"${s.tahunMasuk || ''}"`,
      `"${(s.namaWali || '').replace(/"/g, '""')}"`,
      `"${(s.alamat || '').replace(/"/g, '""')}"`,
      ...mapelCols,
      ev.isComplete ? `"${(ev.totalNilai || 0).toFixed(2)}"` : '""',
      ev.isComplete ? `"${(ev.rataRata || 0).toFixed(2)}"` : '""',
      `"${ev.predikatRataRata?.predikatLatin || ''}"`
    ].join(',');
  });

  const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const dateStr = getWitaDateString();
  link.href = url;
  link.setAttribute('download', `Arsip_Data_Nilai_${filenameLabel}_${dateStr}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

