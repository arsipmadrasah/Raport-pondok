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

export function isMapelMasukRapor(mapel: any): boolean {
  if (!mapel) return false;
  if (mapel.masukRapor === false) return false;
  const nama = String(mapel.namaLatin || mapel.nama_latin || '').toLowerCase().trim();
  if (mapel.masukRapor === undefined && nama.includes('bahasa inggris')) {
    return false;
  }
  return true;
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

const MASEHI_MONTH_NAMES_ID = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember'
];

const MASEHI_MONTH_ALIASES: Record<string, number> = {
  januari: 0, jan: 0, january: 0,
  februari: 1, feb: 1, february: 1, pebruari: 1,
  maret: 2, mar: 2, march: 2,
  april: 3, apr: 3,
  mei: 4, may: 4,
  juni: 5, jun: 5, june: 5,
  juli: 6, jul: 6, july: 6,
  agustus: 7, agu: 7, agt: 7, aug: 7, august: 7,
  september: 8, sep: 8, sept: 8,
  oktober: 9, okt: 9, oct: 9, october: 9,
  november: 10, nov: 10, nopember: 10, nop: 10,
  desember: 11, des: 11, dec: 11, december: 11
};

const HIJRI_MONTH_NAMES_ID = [
  'Muharram',
  'Safar',
  'Rabiul Awal',
  'Rabiul Akhir',
  'Jumadil Awal',
  'Jumadil Akhir',
  'Rajab',
  "Sya'ban",
  'Ramadhan',
  'Syawal',
  "Dzulqa'dah",
  'Dzulhijjah'
];

const WITA_TIMEZONE = 'Asia/Makassar';

function makeWitaNoonDate(year: number, monthIndex: number, day: number): Date {
  // 04:00 UTC = 12:00 WITA (siang hari WITA) agar tidak pernah bergeser tanggal
  return new Date(Date.UTC(year, monthIndex, day, 4, 0, 0));
}

function getWitaDateParts(date: Date): { year: number; month: number; day: number } {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: WITA_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  const [y, m, d] = fmt.format(date).split('-').map(Number);
  return { year: y, month: m, day: d };
}

/**
 * Parse tanggal Masehi format Indonesia ("19 Desember 2026", "19 Desember 2026M"),
 * ISO ("2026-12-19"), atau DD/MM/YYYY menjadi Date pada zona waktu WITA (Asia/Makassar).
 */
export function parseIndonesianMasehiDate(input: string): Date | null {
  const clean = String(input || '').trim();
  if (!clean) return null;

  const validateAndBuild = (y: number, m: number, d: number): Date | null => {
    if (y < 1900 || y > 2100 || m < 0 || m > 11 || d < 1 || d > 31) return null;
    const dt = makeWitaNoonDate(y, m, d);
    const parts = getWitaDateParts(dt);
    if (parts.year === y && parts.month === m + 1 && parts.day === d) return dt;
    return null;
  };

  const isoMatch = clean.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (isoMatch) {
    return validateAndBuild(Number(isoMatch[1]), Number(isoMatch[2]) - 1, Number(isoMatch[3]));
  }

  const slashMatch = clean.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (slashMatch) {
    return validateAndBuild(Number(slashMatch[3]), Number(slashMatch[2]) - 1, Number(slashMatch[1]));
  }

  const textMatch = clean.match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})\s*[Mm]?$/);
  if (textMatch) {
    const m = MASEHI_MONTH_ALIASES[textMatch[2].toLowerCase()];
    if (m === undefined) return null;
    return validateAndBuild(Number(textMatch[3]), m, Number(textMatch[1]));
  }

  return null;
}

/** Format Date menjadi string rapor Masehi baku (WITA), misal "19 Desember 2026M". */
export function formatMasehiRaporString(date: Date): string {
  const { year, month, day } = getWitaDateParts(date);
  return `${day} ${MASEHI_MONTH_NAMES_ID[month - 1]} ${year}M`;
}

/** Format Date menjadi nilai input[type="date"] ("YYYY-MM-DD") sesuai WITA (Asia/Makassar). */
export function toInputDateValue(date: Date): string {
  const { year, month, day } = getWitaDateParts(date);
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/** Konversi Date Masehi menjadi string Hijriyah baku untuk rapor sesuai waktu WITA (Asia/Makassar). */
export function convertMasehiToHijriyahString(date: Date): string {
  const calendars = ['en-u-ca-islamic-umalqura-nu-latn', 'en-u-ca-islamic-nu-latn'];
  for (const locale of calendars) {
    try {
      const fmt = new Intl.DateTimeFormat(locale, {
        timeZone: WITA_TIMEZONE,
        day: 'numeric',
        month: 'numeric',
        year: 'numeric'
      });
      const parts = fmt.formatToParts(date);
      const hDay = Number(parts.find((p) => p.type === 'day')?.value);
      const hMonth = Number(parts.find((p) => p.type === 'month')?.value);
      const hYear = Number(parts.find((p) => p.type === 'year')?.value);

      if (hDay >= 1 && hDay <= 30 && hMonth >= 1 && hMonth <= 12 && hYear >= 1300 && hYear <= 1600) {
        const monthName = HIJRI_MONTH_NAMES_ID[hMonth - 1];
        return `${hDay} ${monthName} ${hYear}H`;
      }
    } catch (_) {
      // Lanjut ke fallback kalender berikutnya
    }
  }
  return '';
}


