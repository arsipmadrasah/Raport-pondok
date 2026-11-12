import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Loader2,
  Printer,
  ChevronDown,
  Search,
  Users,
  Info,
  GraduationCap
} from 'lucide-react';
import { calculateClassAcademicReport, toArabicNumerals, isMapelForKelas } from '../../utils/academicHelpers';
import { normalizeTingkat } from '../../constants/initialData';
import { RaporA4Sheet } from './RaporA4Sheet';

export function CetakRaporView({
  pondok,
  setPondok,
  persistPondokProfileToSupabase,
  tahunAjaran,
  semester,
  kelas,
  kelasList,
  selectedKelasId,
  setSelectedKelasId,
  santriList,
  kelompokMapelList,
  activeMapels,
  nilaiList,
  selectedSemesterId,
  predikatList,
  showToast,
  addLog
}) {
  const santriInKelas = useMemo(
    () => santriList.filter((s) => s.statusAktif && s.kelasId === selectedKelasId),
    [santriList, selectedKelasId]
  );

  const classMapels = useMemo(
    () => activeMapels.filter((m) => isMapelForKelas(m, selectedKelasId)),
    [activeMapels, selectedKelasId]
  );

  const evaluations = useMemo(
    () =>
      calculateClassAcademicReport({
        santriInKelas,
        activeMapelList: classMapels,
        nilaiList,
        semesterId: selectedSemesterId,
        predikatRules: predikatList
      }),
    [santriInKelas, classMapels, nilaiList, selectedSemesterId, predikatList]
  );

  const [selectedSantriIds, setSelectedSantriIds] = useState<string[]>([]);
  const [showRankOnRapor, setShowRankOnRapor] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (evaluations.length > 0) {
      setSelectedSantriIds([evaluations[0].santri.id]);
    } else {
      setSelectedSantriIds([]);
    }
  }, [selectedKelasId, evaluations.length]);

  // Santri yang terfilter oleh pencarian nama atau NIS
  const filteredEvaluations = useMemo(() => {
    if (!searchQuery.trim()) return evaluations;
    const q = searchQuery.toLowerCase().trim();
    return evaluations.filter(
      (e) =>
        e.santri.namaLengkap.toLowerCase().includes(q) ||
        (e.santri.nis && e.santri.nis.toLowerCase().includes(q))
    );
  }, [evaluations, searchQuery]);

  // Status Pilih Semua
  const isAllSelected = useMemo(() => {
    if (filteredEvaluations.length === 0) return false;
    return filteredEvaluations.every((e) => selectedSantriIds.includes(e.santri.id));
  }, [filteredEvaluations, selectedSantriIds]);

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      const filteredIds = new Set(filteredEvaluations.map((e) => e.santri.id));
      setSelectedSantriIds((prev) => prev.filter((id) => !filteredIds.has(id)));
    } else {
      const newSelected = new Set(selectedSantriIds);
      filteredEvaluations.forEach((e) => newSelected.add(e.santri.id));
      setSelectedSantriIds(Array.from(newSelected));
    }
  };

  // Split ke 2 Kolom Simetris (Kiri dan Kanan)
  const { leftColumnEvaluations, rightColumnEvaluations } = useMemo(() => {
    const total = filteredEvaluations.length;
    const half = Math.ceil(total / 2);
    return {
      leftColumnEvaluations: filteredEvaluations.slice(0, half),
      rightColumnEvaluations: filteredEvaluations.slice(half)
    };
  }, [filteredEvaluations]);

  const selectedEvaluations = evaluations.filter((e) =>
    selectedSantriIds.includes(e.santri.id)
  );

  const handleToggleSantri = (id: string) => {
    setSelectedSantriIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const loadHtml2PdfScript = () =>
    new Promise((resolve, reject) => {
      if (typeof window !== 'undefined' && (window as any).html2pdf) {
        resolve((window as any).html2pdf);
        return;
      }
      const existing = document.getElementById('html2pdf-cdn-script');
      if (existing) {
        existing.addEventListener('load', () => resolve((window as any).html2pdf));
        existing.addEventListener('error', reject);
        return;
      }
      const script = document.createElement('script');
      script.id = 'html2pdf-cdn-script';
      script.src =
        'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
      script.onload = () => resolve((window as any).html2pdf);
      script.onerror = () => reject(new Error('Gagal memuat modul generator PDF'));
      document.head.appendChild(script);
    });

  const triggerPrint = async () => {
    if (selectedEvaluations.length === 0) {
      showToast('Pilih minimal 1 santri terlebih dahulu!', 'warning');
      return;
    }

    const incomplete = selectedEvaluations.filter((e) => !e.isComplete);
    if (incomplete.length > 0) {
      showToast(
        `Perhatian: ${incomplete.length} rapor masih memiliki nilai kosong, tetap membuat PDF...`,
        'warning'
      );
    }

    setIsGeneratingPdf(true);
    showToast(`Menyiapkan PDF A4 Portrait (${selectedEvaluations.length} Rapor)...`);

    let stageContainer = null;
    const prevScrollX = window.scrollX;
    const prevScrollY = window.scrollY;

    try {
      const html2pdfLib: any = await loadHtml2PdfScript();

      if (document.fonts && document.fonts.ready) {
        await document.fonts.ready;
      }

      const sourceArea = document.getElementById('printable-rapor-area');
      if (!sourceArea) throw new Error('Area rapor tidak ditemukan');

      const sheets = Array.from(sourceArea.querySelectorAll('.rapor-page-break'));
      if (!sheets.length) throw new Error('Lembar rapor tidak ditemukan');

      window.scrollTo(0, 0);

      const A4_WIDTH_PX = 794;
      const A4_HEIGHT_PX = 1123;

      stageContainer = document.createElement('div');
      stageContainer.setAttribute('dir', 'ltr');
      stageContainer.style.position = 'fixed';
      stageContainer.style.top = '0px';
      stageContainer.style.left = '0px';
      stageContainer.style.width = `${A4_WIDTH_PX}px`;
      stageContainer.style.height = `${A4_HEIGHT_PX}px`;
      stageContainer.style.backgroundColor = '#ffffff';
      stageContainer.style.zIndex = '999999';
      stageContainer.style.overflow = 'hidden';
      stageContainer.style.margin = '0';
      stageContainer.style.padding = '0';
      document.body.appendChild(stageContainer);

      const fileName =
        selectedEvaluations.length === 1
          ? `Rapor_${selectedEvaluations[0].santri.namaLengkap.replace(/\s+/g, '_')}_Kelas_${kelas?.namaKelas || 'VII'
          }.pdf`
          : `Rapor_Kelas_${(kelas?.namaKelas || 'VII').replace(/\s+/g, '_')}_${selectedEvaluations.length
          }_Santri.pdf`;

      let pdfInstance = null;

      for (let i = 0; i < sheets.length; i++) {
        stageContainer.innerHTML = '';

        const clone = sheets[i].cloneNode(true) as HTMLElement;
        clone.setAttribute('dir', 'ltr');
        clone.style.transform = 'none';
        clone.style.webkitTransform = 'none';
        clone.style.position = 'relative';
        clone.style.left = '0px';
        clone.style.top = '0px';
        clone.style.margin = '0px';
        clone.style.width = `${A4_WIDTH_PX}px`;
        clone.style.minWidth = `${A4_WIDTH_PX}px`;
        clone.style.maxWidth = `${A4_WIDTH_PX}px`;
        clone.style.height = `${A4_HEIGHT_PX}px`;
        clone.style.minHeight = `${A4_HEIGHT_PX}px`;
        clone.style.maxHeight = `${A4_HEIGHT_PX}px`;
        clone.style.overflow = 'hidden';
        clone.style.padding = (sheets[i] as HTMLElement).style.padding || '40px 46px 24px 46px';
        clone.style.boxSizing = 'border-box';
        clone.style.backgroundColor = '#ffffff';
        clone.style.color = '#000000';
        clone.style.boxShadow = 'none';
        clone.style.border = 'none';

        stageContainer.appendChild(clone);

        await new Promise((r) => setTimeout(r, 220));

        const worker = (html2pdfLib as any)()
          .set({
            margin: 0,
            filename: fileName,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: {
              scale: 2,
              useCORS: true,
              allowTaint: true,
              backgroundColor: '#ffffff',
              x: 0,
              y: 0,
              scrollX: 0,
              scrollY: 0,
              width: A4_WIDTH_PX,
              height: A4_HEIGHT_PX,
              windowWidth: A4_WIDTH_PX,
              windowHeight: A4_HEIGHT_PX
            },
            pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
            jsPDF: {
              unit: 'mm',
              format: 'a4',
              orientation: 'portrait'
            }
          })
          .from(clone);

        const canvas = await worker.toCanvas().get('canvas');
        const imgData = canvas.toDataURL('image/jpeg', 0.98);

        if (i === 0) {
          await worker.toPdf();
          pdfInstance = await worker.get('pdf');
          while (
            pdfInstance &&
            pdfInstance.internal &&
            pdfInstance.internal.getNumberOfPages &&
            pdfInstance.internal.getNumberOfPages() > 1
          ) {
            pdfInstance.deletePage(pdfInstance.internal.getNumberOfPages());
          }
        } else if (pdfInstance) {
          pdfInstance.addPage('a4', 'portrait');
          pdfInstance.setPage(pdfInstance.internal.getNumberOfPages());
          pdfInstance.addImage(imgData, 'JPEG', 0, 0, 210, 297);
        }
      }

      if (pdfInstance) {
        pdfInstance.save(fileName);
      }

      addLog(
        'UNDUH_PDF',
        `Mengunduh PDF A4 Portrait (${selectedEvaluations.length} rapor) Kelas ${kelas?.namaKelas}`
      );
      showToast(`File PDF A4 Portrait (${fileName}) berhasil diunduh utuh!`);
    } catch (err) {
      try {
        window.print();
      } catch (_) { }
      showToast('Membuka dialog cetak A4 Portrait perangkat...');
    } finally {
      if (stageContainer && stageContainer.parentNode) {
        stageContainer.parentNode.removeChild(stageContainer);
      }
      window.scrollTo(prevScrollX, prevScrollY);
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* KARTU UTAMA CETAK RAPOR SANTRI */}
      <div className="no-print bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
        {/* HEADER KARTU */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
            <Printer className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
              Cetak Rapor Santri
            </h3>
            <p className="text-xs text-slate-500">
              Pilih kelas dan santri, lalu cetak atau simpan rapor dalam format PDF (A4).
            </p>
          </div>
        </div>

        {/* BARIS KONTROL & FILTER (HORIZONTAL 1 BARIS RAPI) */}
        <div className="flex flex-wrap items-end gap-3 sm:gap-4 pt-1">
          {/* Pilihan Kelas */}
          <div className="flex-1 min-w-[220px] max-w-xs">
            <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5 mb-1">
              <GraduationCap className="w-3.5 h-3.5 text-emerald-700" />
              <span>Kelas</span>
            </label>
            <div className="relative">
              <select
                value={selectedKelasId}
                onChange={(e) => setSelectedKelasId(e.target.value)}
                className="w-full pl-3.5 pr-8 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold text-slate-800 bg-white hover:border-slate-300 focus:ring-2 focus:ring-emerald-600 focus:outline-none appearance-none cursor-pointer shadow-2xs transition"
              >
                {[...kelasList]
                  .sort(
                    (a, b) =>
                      normalizeTingkat(a.tingkat, a.namaKelas) -
                      normalizeTingkat(b.tingkat, b.namaKelas)
                  )
                  .map((k) => (
                    <option key={k.id} value={k.id}>
                      Kelas {k.namaKelas} ({k.waliKelas || 'Wali Kelas'})
                    </option>
                  ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Checkbox Tampilkan Peringkat */}
          <label className="flex items-center gap-2 cursor-pointer select-none py-2 px-1">
            <input
              type="checkbox"
              checked={showRankOnRapor}
              onChange={(e) => setShowRankOnRapor(e.target.checked)}
              className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 cursor-pointer accent-emerald-600"
            />
            <span className="text-xs font-semibold text-slate-800">Tampilkan Peringkat</span>
          </label>

          {/* Checkbox Pilih Semua */}
          <label className="flex items-center gap-2 cursor-pointer select-none py-2 px-1">
            <input
              type="checkbox"
              checked={isAllSelected}
              onChange={handleToggleSelectAll}
              className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 cursor-pointer accent-emerald-600"
            />
            <span className="text-xs font-semibold text-slate-800">Pilih Semua</span>
          </label>

          {/* Bilah Pencarian Santri (Sisi Kanan) */}
          <div className="relative flex-1 min-w-[200px] max-w-xs ml-auto">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari nama santri..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-7 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-600 focus:outline-none bg-white transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* TABEL DAFTAR SANTRI MODEL 2 KOLOM SEJAJAR (SPLIT-COLUMN GRID) */}
        <div className="rounded-2xl border border-slate-200 overflow-hidden bg-white shadow-2xs">
          {/* Header Bar Tabel Hijau Pastel */}
          <div className="bg-emerald-50/70 border-b border-emerald-100/90 px-4 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2 text-emerald-950 font-bold text-xs sm:text-sm">
              <Users className="w-4 h-4 text-emerald-700" />
              <span>Daftar Santri ({evaluations.length} Santri)</span>
            </div>
            <div className="text-[11px] font-bold text-emerald-800 bg-emerald-100/90 border border-emerald-300/80 px-2.5 py-0.5 rounded-full shadow-2xs">
              Dipilih: {selectedSantriIds.length} santri
            </div>
          </div>

          {/* Body Tabel 2 Kolom */}
          {filteredEvaluations.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 font-semibold">
              Tidak ada santri yang cocok dengan pencarian "{searchQuery}".
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 md:divide-x divide-slate-200">
              {/* Kolom Kiri */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-600 font-bold text-[11px] bg-slate-50/60">
                      <th className="py-2 px-3 w-12 text-center">No</th>
                      <th className="py-2 px-2 w-10 text-center"></th>
                      <th className="py-2 px-3">Nama Santri</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {leftColumnEvaluations.map((ev, idx) => {
                      const isSelected = selectedSantriIds.includes(ev.santri.id);
                      const realIndex = idx + 1;
                      return (
                        <tr
                          key={ev.santri.id}
                          onClick={() => handleToggleSantri(ev.santri.id)}
                          className={`transition cursor-pointer select-none ${
                            isSelected
                              ? 'bg-emerald-50/90 text-emerald-950 font-bold'
                              : 'hover:bg-slate-50 text-slate-700 font-normal'
                          }`}
                        >
                          <td className="py-2 px-3 text-center text-slate-500 font-semibold w-12 text-[11px]">
                            {realIndex}
                          </td>
                          <td className="py-2 px-2 text-center w-10">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}} // dikontrol oleh onClick baris
                              className="w-4 h-4 rounded text-emerald-600 border-slate-300 cursor-pointer accent-emerald-600"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <div className="flex items-center justify-between gap-2">
                              <span className="truncate">{ev.santri.namaLengkap}</span>
                              {!ev.isComplete && (
                                <span
                                  title="Nilai santri belum lengkap"
                                  className="text-amber-500 shrink-0 text-xs"
                                >
                                  ⚠️
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Kolom Kanan */}
              <div className="overflow-x-auto border-t md:border-t-0 border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-600 font-bold text-[11px] bg-slate-50/60">
                      <th className="py-2 px-3 w-12 text-center">No</th>
                      <th className="py-2 px-2 w-10 text-center"></th>
                      <th className="py-2 px-3">Nama Santri</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {rightColumnEvaluations.map((ev, idx) => {
                      const isSelected = selectedSantriIds.includes(ev.santri.id);
                      const realIndex = leftColumnEvaluations.length + idx + 1;
                      return (
                        <tr
                          key={ev.santri.id}
                          onClick={() => handleToggleSantri(ev.santri.id)}
                          className={`transition cursor-pointer select-none ${
                            isSelected
                              ? 'bg-emerald-50/90 text-emerald-950 font-bold'
                              : 'hover:bg-slate-50 text-slate-700 font-normal'
                          }`}
                        >
                          <td className="py-2 px-3 text-center text-slate-500 font-semibold w-12 text-[11px]">
                            {realIndex}
                          </td>
                          <td className="py-2 px-2 text-center w-10">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}}
                              className="w-4 h-4 rounded text-emerald-600 border-slate-300 cursor-pointer accent-emerald-600"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <div className="flex items-center justify-between gap-2">
                              <span className="truncate">{ev.santri.namaLengkap}</span>
                              {!ev.isComplete && (
                                <span
                                  title="Nilai santri belum lengkap"
                                  className="text-amber-500 shrink-0 text-xs"
                                >
                                  ⚠️
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* FOOTER BAR DENGAN TOMBOL BIRU ROYAL */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
            <Info className="w-4 h-4 text-sky-600 shrink-0" />
            <span>
              <strong>{selectedSantriIds.length} santri</strong> dipilih dari {evaluations.length} santri
            </span>
          </div>

          <button
            type="button"
            onClick={triggerPrint}
            disabled={selectedEvaluations.length === 0 || isGeneratingPdf}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-98 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 cursor-pointer transition"
          >
            {isGeneratingPdf ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Membuat PDF A4 ({selectedEvaluations.length} Rapor)...</span>
              </>
            ) : (
              <>
                <Printer className="w-4 h-4" />
                <span>Cetak / Simpan PDF A4 ({selectedEvaluations.length} Rapor)</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div
        id="printable-rapor-area"
        dir="ltr"
        className="space-y-6 flex flex-col items-center w-full overflow-x-auto pb-8"
      >
        {selectedEvaluations.map((evaluation) => (
          <div
            key={evaluation.santri.id}
            className="rapor-scale-wrapper origin-top scale-[0.42] sm:scale-[0.75] md:scale-[0.9] lg:scale-100 transition-transform"
          >
            <RaporA4Sheet
              pondok={pondok}
              tahunAjaran={tahunAjaran}
              semester={semester}
              kelas={kelas}
              kelasList={kelasList}
              evaluation={evaluation}
              kelompokMapelList={kelompokMapelList}
              activeMapels={activeMapels}
              showRankOnRapor={showRankOnRapor}
            />
          </div>
        ))}
      </div>
    </div>
  );
}