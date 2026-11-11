import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Loader2,
  Printer,
  CheckSquare,
  Square,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  FileText
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

  const [selectedSantriIds, setSelectedSantriIds] = useState([]);
  const [showRankOnRapor, setShowRankOnRapor] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  useEffect(() => {
    if (evaluations.length > 0) {
      setSelectedSantriIds([evaluations[0].santri.id]);
    } else {
      setSelectedSantriIds([]);
    }
  }, [selectedKelasId, evaluations.length]);

  const selectedEvaluations = evaluations.filter((e) =>
    selectedSantriIds.includes(e.santri.id)
  );

  const handleToggleSantri = (id) => {
    setSelectedSantriIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllKelas = () => {
    setSelectedSantriIds(evaluations.map((e) => e.santri.id));
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
      <div className="no-print bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <select
              value={selectedKelasId}
              onChange={(e) => setSelectedKelasId(e.target.value)}
              className="px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-bold"
            >
              {[...kelasList]
                .sort(
                  (a, b) =>
                    normalizeTingkat(a.tingkat, a.namaKelas) -
                    normalizeTingkat(b.tingkat, b.namaKelas)
                )
                .map((k) => (
                  <option key={k.id} value={k.id}>
                    Tingkat {normalizeTingkat(k.tingkat, k.namaKelas)} — Kelas {k.namaKelas} ({k.waliKelas})
                  </option>
                ))}
            </select>

            <button
              type="button"
              onClick={handleSelectAllKelas}
              className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold"
            >
              Pilih Semua ({evaluations.length})
            </button>

            <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
              <input
                type="checkbox"
                checked={showRankOnRapor}
                onChange={(e) => setShowRankOnRapor(e.target.checked)}
                className="rounded text-emerald-700"
              />
              <span>Tampilkan Peringkat</span>
            </label>
          </div>

          <button
            type="button"
            onClick={triggerPrint}
            disabled={selectedEvaluations.length === 0 || isGeneratingPdf}
            className="w-full sm:w-auto px-5 py-3 sm:py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 active:scale-[0.99] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 cursor-pointer transition"
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

        <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
          {evaluations.map((ev) => {
            const selected = selectedSantriIds.includes(ev.santri.id);
            return (
              <button
                key={ev.santri.id}
                onClick={() => handleToggleSantri(ev.santri.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 border transition ${selected
                  ? 'bg-emerald-900 text-white border-emerald-900'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
              >
                {selected ? (
                  <CheckSquare className="w-3.5 h-3.5 text-amber-400" />
                ) : (
                  <Square className="w-3.5 h-3.5 text-slate-400" />
                )}
                <span className="truncate max-w-[180px]">{ev.santri.namaLengkap}</span>
                {!ev.isComplete && (
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                )}
              </button>
            );
          })}
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