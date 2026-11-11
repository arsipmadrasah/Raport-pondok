import React, { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { Search, Download, Printer, FileSpreadsheet } from 'lucide-react';
import { isMapelForKelas, resolvePredikat, calculateClassAcademicReport, toArabicNumerals, exportSantriAndGradesToCSV } from '../../utils/academicHelpers';
import { normalizeTingkat } from '../../constants/initialData';

export function cleanMapelHeaderKey(namaMapel = '') {
  const clean = String(namaMapel || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
  return `predikat${clean}`;
}

export function RekapNilaiView({
  santriList,
  kelasList,
  selectedKelasId,
  setSelectedKelasId,
  selectedSemesterId,
  activeMapels,
  nilaiList,
  predikatList,
  tahunAjaran,
  semester,
  showToast,
  onJumpToInput,
  onJumpToPrint
}) {
  const [searchQuery, setSearchQuery] = useState('');

  const currentKelas = useMemo(
    () => kelasList.find((k) => k.id === selectedKelasId),
    [kelasList, selectedKelasId]
  );

  // 1. Ambil data santri berdasarkan kelas yang dipilih (atau seluruh kelas)
  const filteredSantri = useMemo(() => {
    return santriList.filter((s) => {
      if (!s.statusAktif) return false;
      const matchKelas = selectedKelasId === 'ALL' || s.kelasId === selectedKelasId;
      const matchSearch =
        !searchQuery ||
        s.namaLengkap.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.nis.includes(searchQuery);
      return matchKelas && matchSearch;
    });
  }, [santriList, selectedKelasId, searchQuery]);

  // 2. Buat index nilai cepat: santriId__mapelId -> angkaNilai
  const nilaiIndex = useMemo(() => {
    const idx = new Map();
    for (const item of nilaiList) {
      if (item.semesterId === selectedSemesterId) {
        idx.set(`${item.santriId}__${item.mapelId}`, item.angkaNilai);
      }
    }
    return idx;
  }, [nilaiList, selectedSemesterId]);

  // 3. Olah data setiap santri persis sesuai format Excel referensi (difilter berdasarkan peruntukan kelas)
  const activeMapelFiltered = useMemo(
    () => activeMapels.filter((m) => m.statusAktif && isMapelForKelas(m, selectedKelasId)),
    [activeMapels, selectedKelasId]
  );

  const rekapRows = useMemo(() => {
    const rows = filteredSantri.map((santri) => {
      const mapelScores = {};
      let sumNilai = 0;
      let filledCount = 0;
      let dhoifCount = 0;
      let kosongCount = 0;

      activeMapelFiltered.forEach((mp) => {
        const key = `${santri.id}__${mp.id}`;
        const rawVal = nilaiIndex.has(key) ? nilaiIndex.get(key) : null;
        const isFilled = rawVal !== null && rawVal !== undefined && rawVal !== '';
        const numericVal = isFilled ? Math.round(Number(rawVal) * 100) / 100 : null;
        const predikat = resolvePredikat(numericVal, predikatList);

        const isDhoif =
          isFilled &&
          (numericVal < 2.7 ||
            predikat.predikatLatin.toLowerCase().includes('dhaif') ||
            predikat.predikatLatin.toLowerCase().includes('dhoif'));

        const isKosong = !isFilled;

        if (isFilled) {
          sumNilai += numericVal;
          filledCount += 1;
        }
        if (isDhoif) dhoifCount += 1;
        if (isKosong) kosongCount += 1;

        mapelScores[mp.id] = {
          angkaNilai: numericVal,
          isFilled,
          isDhoif,
          isKosong,
          predikatLatin: isFilled ? predikat.predikatLatin : 'Kosong',
          predikatArab: isFilled ? predikat.predikatArab : '—'
        };
      });

      const totalScore = Math.round(sumNilai * 100) / 100;
      const averageScore = filledCount > 0 ? Math.round((sumNilai / filledCount) * 100) / 100 : 0;
      const kelasObj = kelasList.find((k) => k.id === santri.kelasId);

      return {
        santri,
        namaKelas: kelasObj ? kelasObj.namaKelas : '—',
        mapelScores,
        totalScore,
        averageScore,
        filledCount,
        dhoifCount,
        kosongCount,
        isComplete: activeMapelFiltered.length > 0 && filledCount === activeMapelFiltered.length
      };
    });

    // Urutkan berdasarkan totalScore descending untuk perangkingan
    const sorted = [...rows].sort((a, b) => b.totalScore - a.totalScore);
    let currentRank = 1;
    sorted.forEach((item, index) => {
      if (item.filledCount === 0) {
        item.rank = '—';
      } else {
        if (index > 0 && item.totalScore < sorted[index - 1].totalScore) {
          currentRank = index + 1;
        }
        item.rank = currentRank;
      }
    });

    return sorted;
  }, [filteredSantri, activeMapelFiltered, nilaiIndex, predikatList, kelasList]);

  // Statistik Ringkas
  const totalSantriDiRekap = rekapRows.length;
  const totalDhoif = rekapRows.reduce((acc, r) => acc + r.dhoifCount, 0);
  const totalKosong = rekapRows.reduce((acc, r) => acc + r.kosongCount, 0);

  // 4. FITUR DOWNLOAD EXCEL (.XLSX) SESUAI FORMAT REFERENSI
  const handleDownloadExcel = () => {
    const currentKelas = kelasList.find((k) => k.id === selectedKelasId);
    const kelasLabel =
      selectedKelasId === 'ALL'
        ? 'SEMUA_KELAS'
        : currentKelas
          ? currentKelas.namaKelas.replace(/\s+/g, '_')
          : 'KELAS';
    const taLabel = (tahunAjaran?.nama || '2026-2027').replace(/[\s–—/]+/g, '_');
    const semLabel = (semester?.nama || 'GANJIL').toUpperCase();

    // Baris Header Persis Gambar Referensi Excel
    const headerRow = ['No', 'NAMA', 'Kelas'];
    activeMapelFiltered.forEach((mp) => {
      headerRow.push(mp.namaLatin);
      headerRow.push(cleanMapelHeaderKey(mp.namaLatin));
    });
    headerRow.push('Jumlah');
    headerRow.push('ratarata');
    headerRow.push('perigkat');

    const aoa = [headerRow];

    // Baris Data Santri
    rekapRows.forEach((row, idx) => {
      const dataRow = [
        idx + 1,
        row.santri.namaLengkap.toUpperCase(),
        row.namaKelas
      ];

      activeMapelFiltered.forEach((mp) => {
        const sc = row.mapelScores[mp.id];
        if (sc && sc.isFilled && sc.angkaNilai !== null) {
          dataRow.push(sc.angkaNilai);
          dataRow.push(sc.predikatLatin || '—');
        } else {
          dataRow.push('Kosong');
          dataRow.push('Dhoif');
        }
      });

      dataRow.push(row.filledCount > 0 ? Number(row.totalScore.toFixed(2)) : '—');
      dataRow.push(row.filledCount > 0 ? Number(row.averageScore.toFixed(2)) : '—');
      dataRow.push(row.rank || '—');

      aoa.push(dataRow);
    });

    const ws = XLSX.utils.aoa_to_sheet(aoa);

    // Auto-lebar kolom
    const colWidths = [
      { wch: 6 },  // No
      { wch: 34 }, // NAMA
      { wch: 10 }  // Kelas
    ];
    activeMapelFiltered.forEach((mp) => {
      colWidths.push({ wch: Math.max(mp.namaLatin.length + 3, 15) });
      colWidths.push({ wch: 18 });
    });
    colWidths.push({ wch: 12 }); // Jumlah
    colWidths.push({ wch: 12 }); // ratarata
    colWidths.push({ wch: 10 }); // perigkat
    ws['!cols'] = colWidths;

    const wb = XLSX.utils.book_new();
    const sheetName = `Rekap_${kelasLabel}`.substring(0, 31);
    XLSX.utils.book_append_sheet(wb, ws, sheetName);

    const fileName = `REKAP_NILAI_${kelasLabel}_${taLabel}_${semLabel}.xlsx`;
    XLSX.writeFile(wb, fileName);

    if (showToast) {
      showToast(`Rekap nilai berhasil diunduh: ${fileName}`, 'success');
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden space-y-4">
      {/* TOOLBAR ATAS: SELECTOR KELAS, SEARCH, INDIKATOR MERAH, TOMBOL AKSI */}
      <div className="p-4 sm:p-5 border-b border-slate-200/90 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
        <div className="flex flex-wrap items-center gap-3">
          {/* PILIH KELAS */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-600 hidden sm:inline">Kelas:</span>
            <select
              value={selectedKelasId}
              onChange={(e) => setSelectedKelasId(e.target.value)}
              className="px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-bold bg-white text-slate-800 shadow-2xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            >
              <option value="ALL">🌟 Semua Kelas (Seluruh Santri)</option>
              {[...kelasList]
                .sort(
                  (a, b) =>
                    normalizeTingkat(a.tingkat, a.namaKelas) -
                    normalizeTingkat(b.tingkat, b.namaKelas)
                )
                .map((k) => (
                  <option key={k.id} value={k.id}>
                    Tingkat {normalizeTingkat(k.tingkat, k.namaKelas)} — Rekap Nilai Kelas {k.namaKelas} (Wali: {k.waliKelas})
                  </option>
                ))}
            </select>
          </div>

          {/* SEARCH BOX */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari santri..."
              className="pl-8 pr-3 py-2 rounded-xl border border-slate-300 text-xs bg-white text-slate-800 w-40 sm:w-48 shadow-2xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        {/* KANAN: INDIKATOR MERAH & TOMBOL AKSI */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* BADGE LEGENDA WARNA MERAH */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-[11px] font-semibold">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600 shrink-0 inline-block" />
            <span>Merah = Dhoif (&lt; 2.70) / Kosong</span>
          </div>

          {/* TOMBOL DOWNLOAD EXCEL */}
          <button
            type="button"
            onClick={handleDownloadExcel}
            className="px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition"
            title="Download Rekap Nilai format Excel (.xlsx)"
          >
            <Download className="w-4 h-4" />
            <span>Download Excel</span>
          </button>

          <button
            type="button"
            onClick={onJumpToInput}
            className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition"
          >
            Edit Nilai
          </button>

          <button
            type="button"
            onClick={onJumpToPrint}
            className="px-3.5 py-2 rounded-xl bg-[#064E3B] hover:bg-emerald-900 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Rapor</span>
          </button>
        </div>
      </div>

      {/* INFORMASI REKAP */}
      <div className="px-5 py-2 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2">
        <div className="flex flex-wrap items-center gap-3">
          <span>Menampilkan <strong>{totalSantriDiRekap}</strong> santri</span>
          {currentKelas && (
            <span className="font-semibold text-emerald-800">• Wali Kelas: <strong>{currentKelas.waliKelas}</strong></span>
          )}
          <span>• Periode: <strong>{tahunAjaran?.nama || '2026 – 2027'} ({semester?.nama || 'Ganjil'})</strong></span>
          {totalDhoif > 0 && (
            <span className="text-red-600 font-semibold">• {totalDhoif} nilai Dhoif</span>
          )}
          {totalKosong > 0 && (
            <span className="text-amber-600 font-semibold">• {totalKosong} nilai Kosong</span>
          )}
        </div>
        <div className="text-[11px] text-slate-400">
          Format: No • NAMA • Kelas • [Mapel &amp; Predikat] • Jumlah • ratarata • perigkat
        </div>
      </div>

      {/* TABEL REKAP NILAI FORMAT PERSIS EXCEL REFERENSI */}
      <div className="overflow-x-auto border-t border-slate-200">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-[#EEF2F6] text-slate-800 border-b border-slate-300">
              <th className="py-2.5 px-3 text-center border border-slate-300 font-bold whitespace-nowrap w-12">
                No
              </th>
              <th className="py-2.5 px-4 text-left border border-slate-300 font-bold whitespace-nowrap min-w-[200px]">
                NAMA
              </th>
              <th className="py-2.5 px-3 text-center border border-slate-300 font-bold whitespace-nowrap w-16">
                Kelas
              </th>
              {activeMapelFiltered.map((mp) => (
                <React.Fragment key={mp.id}>
                  <th className="py-2.5 px-3 text-center border border-slate-300 font-bold whitespace-nowrap bg-[#E6EFF8] text-slate-900 min-w-[90px]">
                    {mp.namaLatin}
                  </th>
                  <th className="py-2.5 px-3 text-center border border-slate-300 font-semibold whitespace-nowrap bg-[#EEF2F6] text-slate-600 text-[11px] min-w-[110px]">
                    {cleanMapelHeaderKey(mp.namaLatin)}
                  </th>
                </React.Fragment>
              ))}
              <th className="py-2.5 px-3 text-center border border-slate-300 font-bold whitespace-nowrap bg-[#E2E8F0] text-slate-900 min-w-[80px]">
                Jumlah
              </th>
              <th className="py-2.5 px-3 text-center border border-slate-300 font-bold whitespace-nowrap bg-[#E2E8F0] text-slate-900 min-w-[80px]">
                ratarata
              </th>
              <th className="py-2.5 px-3 text-center border border-slate-300 font-bold whitespace-nowrap bg-[#FEF3C7] text-amber-950 min-w-[70px]">
                perigkat
              </th>
            </tr>
          </thead>
          <tbody>
            {rekapRows.length === 0 ? (
              <tr>
                <td
                  colSpan={3 + activeMapelFiltered.length * 2 + 3}
                  className="py-10 text-center text-slate-400 text-xs border border-slate-300"
                >
                  Tidak ada data santri ditemukan.
                </td>
              </tr>
            ) : (
              rekapRows.map((row, idx) => (
                <tr key={row.santri.id} className="hover:bg-slate-50/70 transition-colors">
                  {/* No */}
                  <td className="py-2 px-3 text-center border border-slate-300 text-slate-600 font-medium bg-slate-50/30">
                    {idx + 1}
                  </td>

                  {/* NAMA (Uppercase, Bold, Left aligned) */}
                  <td className="py-2 px-4 border border-slate-300 font-bold text-slate-900 uppercase whitespace-nowrap">
                    {row.santri.namaLengkap}
                  </td>

                  {/* Kelas (Center aligned) */}
                  <td className="py-2 px-3 text-center border border-slate-300 font-semibold text-slate-700 whitespace-nowrap">
                    {row.namaKelas}
                  </td>

                  {/* MAPEL-MAPEL (NILAI + PREDIKAT DENGAN CONDITIONAL FORMATTING MERAH) */}
                  {activeMapelFiltered.map((mp) => {
                    const sc = row.mapelScores[mp.id];
                    const isRed = sc ? sc.isDhoif || sc.isKosong : true;
                    const valDisplay =
                      sc && sc.isFilled && sc.angkaNilai !== null
                        ? Number.isInteger(sc.angkaNilai)
                          ? sc.angkaNilai
                          : sc.angkaNilai.toFixed(2)
                        : '—';
                    const predDisplay =
                      sc && sc.isFilled ? sc.predikatLatin : 'Kosong';

                    return (
                      <React.Fragment key={mp.id}>
                        {/* Kolom Nilai Angka: MERAH JIKA DHOIF ATAU KOSONG (Persis Cell D3 di Excel) */}
                        <td
                          className={`py-2 px-2.5 text-center border font-mono font-bold whitespace-nowrap transition-colors ${isRed
                              ? 'bg-[#EF4444] text-white border-red-600'
                              : 'bg-white text-slate-800 border-slate-300'
                            }`}
                          title={
                            sc?.isKosong
                              ? `${mp.namaLatin}: Belum ada nilai (Kosong)`
                              : sc?.isDhoif
                                ? `${mp.namaLatin}: Nilai Dhoif (${valDisplay})`
                                : `${mp.namaLatin}: ${valDisplay}`
                          }
                        >
                          {valDisplay}
                        </td>

                        {/* Kolom Predikat Teks */}
                        <td
                          className={`py-2 px-2.5 text-center border whitespace-nowrap text-xs transition-colors ${sc?.isKosong
                              ? 'bg-red-50 text-red-600 border-slate-300 font-semibold italic'
                              : sc?.isDhoif
                                ? 'bg-red-50 text-red-700 border-slate-300 font-bold'
                                : 'bg-white text-slate-700 border-slate-300'
                            }`}
                        >
                          {predDisplay}
                        </td>
                      </React.Fragment>
                    );
                  })}

                  {/* Jumlah (2 desimal) */}
                  <td className="py-2 px-3 text-center border border-slate-300 font-mono font-bold text-slate-900 bg-slate-50/50 whitespace-nowrap">
                    {row.filledCount > 0 ? row.totalScore.toFixed(2) : '—'}
                  </td>

                  {/* ratarata (2 desimal, merah jika rata-rata Dhoif) */}
                  <td
                    className={`py-2 px-3 text-center border font-mono font-bold whitespace-nowrap ${row.filledCount > 0 && row.averageScore < 2.7
                        ? 'bg-red-100 text-red-800 border-red-300'
                        : 'bg-slate-50/50 text-emerald-900 border-slate-300'
                      }`}
                  >
                    {row.filledCount > 0 ? row.averageScore.toFixed(2) : '—'}
                  </td>

                  {/* perigkat (Ranking) */}
                  <td className="py-2 px-3 text-center border border-slate-300 font-bold text-slate-900 bg-amber-50/40 whitespace-nowrap">
                    {row.rank}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}