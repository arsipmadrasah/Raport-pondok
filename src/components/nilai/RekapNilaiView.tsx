import React, { useState, useMemo } from 'react';
import { Search, Printer, FileText, Loader2, AlertTriangle } from 'lucide-react';
import { isMapelForKelas, resolvePredikat } from '../../utils/academicHelpers';
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
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isGeneratingDhoifPdf, setIsGeneratingDhoifPdf] = useState(false);

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
  const dhoifKosongRows = useMemo(
    () => rekapRows.filter((r) => r.dhoifCount > 0 || r.kosongCount > 0),
    [rekapRows]
  );

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

  const escapeHtml = (str: any) =>
    String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

  const sanitizeFilePart = (str: string) =>
    String(str || '')
      .replace(/[\\/:*?"<>|]/g, '-')
      .replace(/\s+/g, ' ')
      .trim();

  // Helper bersama untuk render PDF F4 Landscape (330 x 215 mm) dengan paginasi anti-tumpang-tindih
  const renderF4LandscapePdf = async ({
    fileName,
    rowsCount,
    buildHeaderHtml,
    buildFooterHtml,
    buildColgroupHtml,
    buildTheadHtml,
    buildRowHtml,
    setLoading,
    startToast,
    successToast
  }: {
    fileName: string;
    rowsCount: number;
    buildHeaderHtml: (pageNum: number, totalPages: number) => string;
    buildFooterHtml: (pageNum: number, totalPages: number) => string;
    buildColgroupHtml: () => string;
    buildTheadHtml: () => string;
    buildRowHtml: (idx: number) => string;
    setLoading: (val: boolean) => void;
    startToast: string;
    successToast: string;
  }) => {
    setLoading(true);
    if (showToast) showToast(startToast);

    let measureStage: HTMLElement | null = null;
    let stageContainer: HTMLElement | null = null;
    const prevScrollX = window.scrollX;
    const prevScrollY = window.scrollY;

    // Ukuran pas F4 Landscape (330mm x 215mm pada 96dpi) dengan margin 26px di semua sisi
    const stageWidth = 1247;
    const pageHeightPx = 813;
    const padPx = 26;
    const innerWidth = stageWidth - padPx * 2; // 1195px
    const innerMaxHeight = pageHeightPx - padPx * 2; // 761px

    try {
      const html2pdfLib: any = await loadHtml2PdfScript();
      if (document.fonts && document.fonts.ready) {
        await document.fonts.ready;
      }

      // Tahap 1: Ukur tinggi header, thead, footer, dan tiap baris pada lebar 1195px
      measureStage = document.createElement('div');
      measureStage.style.position = 'fixed';
      measureStage.style.top = '0px';
      measureStage.style.left = '0px';
      measureStage.style.width = `${innerWidth}px`;
      measureStage.style.visibility = 'hidden';
      measureStage.style.pointerEvents = 'none';
      measureStage.style.fontFamily = 'Inter, system-ui, -apple-system, sans-serif';
      measureStage.innerHTML = `
        <div id="pdf-measure-header" style="width:${innerWidth}px;">${buildHeaderHtml(1, 1)}</div>
        <table id="pdf-measure-table" style="border-collapse:collapse;table-layout:fixed;width:${innerWidth}px;">
          ${buildColgroupHtml()}
          ${buildTheadHtml()}
          <tbody>
            ${Array.from({ length: rowsCount }, (_, idx) => buildRowHtml(idx)).join('')}
          </tbody>
        </table>
        <div id="pdf-measure-footer" style="width:${innerWidth}px;">${buildFooterHtml(1, 1)}</div>
      `;
      document.body.appendChild(measureStage);

      const measureTable = measureStage.querySelector('#pdf-measure-table') as HTMLElement;
      const measureHeader = measureStage.querySelector('#pdf-measure-header') as HTMLElement;
      const measureFooter = measureStage.querySelector('#pdf-measure-footer') as HTMLElement;

      const headerH = measureHeader ? measureHeader.offsetHeight + 8 : 72;
      const theadEl = measureTable?.querySelector('thead') as HTMLElement | null;
      const theadH = theadEl ? theadEl.offsetHeight : 44;
      const footerH = measureFooter ? measureFooter.offsetHeight + 6 : 26;
      const safeBottomMargin = 6;
      const maxContentHeight = innerMaxHeight - safeBottomMargin; // 755px
      const rowEls = Array.from(measureTable?.querySelectorAll('tbody tr') || []) as HTMLElement[];

      const pages: number[][] = [];
      let currentPageIndices: number[] = [];
      let usedH = headerH + theadH + footerH;

      for (let i = 0; i < rowsCount; i++) {
        const rowH = rowEls[i] ? rowEls[i].offsetHeight : 24;
        if (currentPageIndices.length > 0 && usedH + rowH > maxContentHeight) {
          pages.push(currentPageIndices);
          currentPageIndices = [i];
          usedH = headerH + theadH + footerH + rowH;
        } else {
          currentPageIndices.push(i);
          usedH += rowH;
        }
      }
      if (currentPageIndices.length > 0) {
        pages.push(currentPageIndices);
      }

      if (measureStage && measureStage.parentNode) {
        measureStage.parentNode.removeChild(measureStage);
        measureStage = null;
      }

      window.scrollTo(0, 0);

      // Tahap 2: Render setiap halaman ke stageContainer 1247x813px (rasio persis F4 Landscape 330:215)
      stageContainer = document.createElement('div');
      stageContainer.setAttribute('dir', 'ltr');
      stageContainer.style.position = 'fixed';
      stageContainer.style.top = '0px';
      stageContainer.style.left = '0px';
      stageContainer.style.width = `${stageWidth}px`;
      stageContainer.style.height = `${pageHeightPx}px`;
      stageContainer.style.backgroundColor = '#ffffff';
      stageContainer.style.zIndex = '999999';
      stageContainer.style.overflow = 'hidden';
      stageContainer.style.margin = '0';
      stageContainer.style.padding = '0';
      stageContainer.style.fontFamily = 'Inter, system-ui, -apple-system, sans-serif';
      document.body.appendChild(stageContainer);

      let pdfInstance: any = null;

      for (let p = 0; p < pages.length; p++) {
        stageContainer.innerHTML = '';

        const pageEl = document.createElement('div');
        pageEl.style.width = `${stageWidth}px`;
        pageEl.style.height = `${pageHeightPx}px`;
        pageEl.style.padding = `${padPx}px`;
        pageEl.style.boxSizing = 'border-box';
        pageEl.style.backgroundColor = '#ffffff';
        pageEl.style.color = '#000000';
        pageEl.style.display = 'flex';
        pageEl.style.flexDirection = 'column';
        pageEl.style.justifyContent = 'space-between';

        pageEl.innerHTML = `
          <div>
            ${buildHeaderHtml(p + 1, pages.length)}
            <table style="width:${innerWidth}px;table-layout:fixed;border-collapse:collapse;">
              ${buildColgroupHtml()}
              ${buildTheadHtml()}
              <tbody>
                ${pages[p].map((idx) => buildRowHtml(idx)).join('')}
              </tbody>
            </table>
          </div>
          ${buildFooterHtml(p + 1, pages.length)}
        `;

        stageContainer.appendChild(pageEl);
        await new Promise((r) => setTimeout(r, 180));

        const worker = (html2pdfLib as any)()
          .set({
            margin: 0,
            filename: fileName,
            image: { type: 'png', quality: 1 },
            html2canvas: {
              scale: 3,
              useCORS: true,
              allowTaint: true,
              backgroundColor: '#ffffff',
              x: 0,
              y: 0,
              scrollX: 0,
              scrollY: 0,
              width: stageWidth,
              height: pageHeightPx,
              windowWidth: stageWidth,
              windowHeight: pageHeightPx
            },
            pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
            jsPDF: {
              unit: 'mm',
              format: [330, 215],
              orientation: 'landscape'
            }
          })
          .from(pageEl);

        const canvas = await worker.toCanvas().get('canvas');
        const imgData = canvas.toDataURL('image/png');

        if (p === 0) {
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
          if (pdfInstance) {
            pdfInstance.addPage([330, 215], 'landscape');
            pdfInstance.deletePage(1);
            pdfInstance.setPage(1);
            pdfInstance.addImage(imgData, 'PNG', 0, 0, 330, 215, undefined, 'FAST');
          }
        } else if (pdfInstance) {
          pdfInstance.addPage([330, 215], 'landscape');
          pdfInstance.setPage(pdfInstance.internal.getNumberOfPages());
          pdfInstance.addImage(imgData, 'PNG', 0, 0, 330, 215, undefined, 'FAST');
        }
      }

      if (pdfInstance) {
        const pageW = Math.round(pdfInstance.internal.pageSize.getWidth());
        const pageH = Math.round(pdfInstance.internal.pageSize.getHeight());
        if (pageW !== 330 || pageH !== 215) {
          console.warn(`Ukuran halaman PDF terdeteksi ${pageW}x${pageH}mm, diharapkan 330x215mm`);
        }
        pdfInstance.save(fileName);
      }

      if (showToast) {
        showToast(successToast, 'success');
      }
    } catch (err) {
      if (showToast) {
        showToast('Gagal membuat PDF. Pastikan koneksi internet tersedia.', 'warning');
      }
    } finally {
      if (measureStage && measureStage.parentNode) {
        measureStage.parentNode.removeChild(measureStage);
      }
      if (stageContainer && stageContainer.parentNode) {
        stageContainer.parentNode.removeChild(stageContainer);
      }
      window.scrollTo(prevScrollX, prevScrollY);
      setLoading(false);
    }
  };

  // 4. FITUR DOWNLOAD PDF REKAP SANTRI DHOIF & KOSONG BERDASARKAN KELAS TERPILIH
  const handleDownloadDhoifKosongPdf = async () => {
    if (dhoifKosongRows.length === 0) {
      if (showToast) {
        showToast('Alhamdulillah, tidak ada santri dengan nilai Dhoif atau Kosong di kelas ini!', 'success');
      }
      return;
    }

    const kelasLabel =
      selectedKelasId === 'ALL'
        ? 'Semua Kelas'
        : currentKelas
          ? `Kelas ${currentKelas.namaKelas}`
          : 'Kelas';
    const safeKelas = sanitizeFilePart(kelasLabel);
    const fileName = `Rekap Dhoif & Kosong ${safeKelas}.pdf`;

    const taNama = tahunAjaran?.nama || '2026 – 2027';
    const semNama = semester?.nama || 'Ganjil';
    const waliInfo = currentKelas?.waliKelas ? ` • Wali Kelas: ${currentKelas.waliKelas}` : '';

    const colNo = 34;
    const colNama = 210;
    const colKelas = 56;
    const colJmlDhoif = 65;
    const colJmlKosong = 70;
    const colDhoifList = 380;
    const colKosongList = 380; // Total: 1195px

    await renderF4LandscapePdf({
      fileName,
      rowsCount: dhoifKosongRows.length,
      setLoading: setIsGeneratingDhoifPdf,
      startToast: `Menyiapkan PDF Rekap Dhoif & Kosong (${kelasLabel})...`,
      successToast: `PDF Rekap Dhoif & Kosong (${fileName}) berhasil diunduh!`,
      buildColgroupHtml: () => `
        <colgroup>
          <col style="width:${colNo}px;" />
          <col style="width:${colNama}px;" />
          <col style="width:${colKelas}px;" />
          <col style="width:${colJmlDhoif}px;" />
          <col style="width:${colJmlKosong}px;" />
          <col style="width:${colDhoifList}px;" />
          <col style="width:${colKosongList}px;" />
        </colgroup>
      `,
      buildHeaderHtml: (pageNum, totalPages) => `
        <div style="margin-bottom:8px;border-bottom:2px solid #991B1B;padding-bottom:6px;display:flex;justify-content:space-between;align-items:flex-end;gap:12px;">
          <div style="min-width:0;flex:1;">
            <div style="font-size:15px;font-weight:900;color:#991B1B;letter-spacing:0.2px;line-height:1.2;">
              REKAP SANTRI NILAI DHOIF &amp; KOSONG — ${escapeHtml(kelasLabel.toUpperCase())}
            </div>
            <div style="font-size:10px;color:#0F172A;margin-top:2px;font-weight:600;">
              Pondok Pesantren Bali Bina Insani • Periode: ${escapeHtml(taNama)} (${escapeHtml(semNama)})${escapeHtml(waliInfo)} • Santri Bermasalah: ${dhoifKosongRows.length} dari ${totalSantriDiRekap} Santri
            </div>
          </div>
          <div style="text-align:right;flex-shrink:0;">
            <div style="display:inline-flex;align-items:center;gap:8px;padding:3px 9px;border-radius:6px;background:#FEE2E2;border:1px solid #EF4444;color:#991B1B;font-size:9px;font-weight:800;">
              <span>Dhoif (&lt; 2.70): ${totalDhoif}</span>
              <span>•</span>
              <span>Kosong: ${totalKosong}</span>
            </div>
            <div style="font-size:9px;color:#334155;margin-top:3px;font-weight:700;">
              Halaman ${pageNum} dari ${totalPages}
            </div>
          </div>
        </div>
      `,
      buildTheadHtml: () => `
        <thead>
          <tr style="background:#E2E8F0;color:#0F172A;font-size:9.5px;">
            <th style="padding:6px 5px;text-align:center;border:1px solid #94A3B8;font-weight:800;">No</th>
            <th style="padding:6px 8px;text-align:left;border:1px solid #94A3B8;font-weight:800;">Nama Santri</th>
            <th style="padding:6px 5px;text-align:center;border:1px solid #94A3B8;font-weight:800;">Kelas</th>
            <th style="padding:6px 5px;text-align:center;border:1px solid #94A3B8;font-weight:800;background:#FECACA;color:#7F1D1D;">Jml Dhoif</th>
            <th style="padding:6px 5px;text-align:center;border:1px solid #94A3B8;font-weight:800;background:#FDE68A;color:#78350F;">Jml Kosong</th>
            <th style="padding:6px 8px;text-align:left;border:1px solid #94A3B8;font-weight:800;background:#FEE2E2;color:#7F1D1D;">Daftar Mapel Nilai Dhoif (&lt; 2.70)</th>
            <th style="padding:6px 8px;text-align:left;border:1px solid #94A3B8;font-weight:800;background:#FEF3C7;color:#78350F;">Daftar Mapel Nilai Kosong (Belum Dinilai)</th>
          </tr>
        </thead>
      `,
      buildRowHtml: (idx) => {
        const row = dhoifKosongRows[idx];
        const dhoifMapels: string[] = [];
        const kosongMapels: string[] = [];

        activeMapelFiltered.forEach((mp) => {
          const sc = row.mapelScores[mp.id];
          if (!sc || sc.isKosong) {
            kosongMapels.push(mp.namaLatin);
          } else if (sc.isDhoif) {
            const valStr = sc.angkaNilai !== null ? Number(sc.angkaNilai).toFixed(2) : '—';
            dhoifMapels.push(`${mp.namaLatin} (${valStr})`);
          }
        });

        return `
          <tr style="font-size:9.5px;">
            <td style="padding:5px;text-align:center;border:1px solid #94A3B8;color:#0F172A;background:#F1F5F9;font-weight:600;white-space:nowrap;">${idx + 1}</td>
            <td style="padding:5px 8px;text-align:left;border:1px solid #94A3B8;font-weight:800;color:#000000;text-transform:uppercase;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(row.santri.namaLengkap)}</td>
            <td style="padding:5px;text-align:center;border:1px solid #94A3B8;font-weight:700;color:#0F172A;white-space:nowrap;">${escapeHtml(row.namaKelas)}</td>
            <td style="padding:5px;text-align:center;border:1px solid #94A3B8;font-weight:800;white-space:nowrap;${
              row.dhoifCount > 0 ? 'background:#DC2626;color:#FFFFFF;' : 'background:#FFFFFF;color:#64748B;'
            }">${row.dhoifCount}</td>
            <td style="padding:5px;text-align:center;border:1px solid #94A3B8;font-weight:800;white-space:nowrap;${
              row.kosongCount > 0 ? 'background:#FDE68A;color:#78350F;' : 'background:#FFFFFF;color:#64748B;'
            }">${row.kosongCount}</td>
            <td style="padding:5px 8px;text-align:left;border:1px solid #94A3B8;color:#7F1D1D;line-height:1.3;word-break:break-word;${
              dhoifMapels.length > 0 ? 'background:#FEE2E2;font-weight:700;' : 'background:#FFFFFF;color:#64748B;'
            }">${dhoifMapels.length > 0 ? escapeHtml(dhoifMapels.join(', ')) : '—'}</td>
            <td style="padding:5px 8px;text-align:left;border:1px solid #94A3B8;color:#78350F;line-height:1.3;word-break:break-word;${
              kosongMapels.length > 0 ? 'background:#FEF3C7;font-weight:700;' : 'background:#FFFFFF;color:#64748B;'
            }">${kosongMapels.length > 0 ? escapeHtml(kosongMapels.join(', ')) : '—'}</td>
          </tr>
        `;
      },
      buildFooterHtml: (pageNum, totalPages) => `
        <div style="display:flex;justify-content:space-between;align-items:center;font-size:8.5px;color:#64748B;border-top:1px solid #E2E8F0;padding-top:5px;margin-top:6px;">
          <span>E-Rapor Pesantren • Rekap Santri Nilai Dhoif &amp; Kosong</span>
          <span>Format F4 Landscape (330 × 215 mm) • Halaman ${pageNum} dari ${totalPages}</span>
        </div>
      `
    });
  };

  // 5. Fungsi Download PDF F4 Landscape (330 x 215 mm, Anti-Terpotong Samping & Tanpa Tumpang Tindih)
  const handleDownloadPdf = async () => {
    if (rekapRows.length === 0) {
      if (showToast) showToast('Tidak ada data santri untuk diunduh sebagai PDF.', 'warning');
      return;
    }

    const kelasLabel =
      selectedKelasId === 'ALL'
        ? 'Semua Kelas'
        : currentKelas
          ? `Kelas ${currentKelas.namaKelas}`
          : 'Kelas';
    const mapelNamesList = activeMapelFiltered.map((m) => m.namaLatin);
    const mapelLabelRaw =
      mapelNamesList.length > 0 ? mapelNamesList.join(', ') : 'Semua Mapel';

    const safeKelas = sanitizeFilePart(kelasLabel);
    let safeMapel = sanitizeFilePart(mapelLabelRaw);
    if (safeMapel.length > 115) {
      safeMapel = safeMapel.slice(0, 112).trim() + '...';
    }
    const fileName = `Rekap Nilai ${safeKelas} - ${safeMapel}.pdf`;

    const taNama = tahunAjaran?.nama || '2026 – 2027';
    const semNama = semester?.nama || 'Ganjil';
    const waliInfo = currentKelas?.waliKelas ? ` • Wali Kelas: ${currentKelas.waliKelas}` : '';

    const innerWidth = 1195;
    const mapelCount = Math.max(activeMapelFiltered.length, 1);
    const baseFontSize = mapelCount <= 5 ? 10 : mapelCount <= 7 ? 9.5 : 8.5;
    const headerFontSize = mapelCount <= 5 ? 9.5 : mapelCount <= 7 ? 8.5 : 7.5;
    const cellPad = mapelCount <= 5 ? '5px 5px' : mapelCount <= 7 ? '4.5px 4px' : '3.5px 3px';

    const noW = 28;
    const baseNamaW = 195;
    const kelasW = 38;
    const baseFixedW = noW + baseNamaW + kelasW; // 261px
    const availableMapelTotalW = innerWidth - baseFixedW; // 934px
    const perMapelW = Math.floor(availableMapelTotalW / mapelCount);
    const roundingRemainder = availableMapelTotalW - perMapelW * mapelCount;
    const namaW = baseNamaW + roundingRemainder;
    const scoreColW = Math.floor(perMapelW * 0.42);
    const predColW = perMapelW - scoreColW;

    await renderF4LandscapePdf({
      fileName,
      rowsCount: rekapRows.length,
      setLoading: setIsGeneratingPdf,
      startToast: 'Menyiapkan PDF F4 Landscape Rekap Nilai...',
      successToast: `PDF F4 Landscape (${fileName}) berhasil diunduh!`,
      buildColgroupHtml: () => `
        <colgroup>
          <col style="width:${noW}px;" />
          <col style="width:${namaW}px;" />
          <col style="width:${kelasW}px;" />
          ${activeMapelFiltered
          .map(
            () =>
              `<col style="width:${scoreColW}px;" /><col style="width:${predColW}px;" />`
          )
          .join('')}
        </colgroup>
      `,
      buildHeaderHtml: (pageNum, totalPages) => `
        <div style="margin-bottom:8px;border-bottom:2px solid #065F46;padding-bottom:6px;display:flex;justify-content:space-between;align-items:flex-end;gap:12px;">
          <div style="min-width:0;flex:1;">
            <div style="font-size:15px;font-weight:900;color:#065F46;letter-spacing:0.2px;line-height:1.2;">
              REKAPITULASI NILAI SANTRI — ${escapeHtml(kelasLabel.toUpperCase())}
            </div>
            <div style="font-size:10px;color:#0F172A;margin-top:2px;font-weight:600;">
              Pondok Pesantren Bali Bina Insani • Periode: ${escapeHtml(taNama)} (${escapeHtml(semNama)})${escapeHtml(waliInfo)} • Total: ${totalSantriDiRekap} Santri
            </div>
            <div style="font-size:9px;color:#1E293B;margin-top:2px;line-height:1.25;">
              <strong>Mata Pelajaran (${activeMapelFiltered.length}):</strong> ${escapeHtml(mapelLabelRaw)}
            </div>
          </div>
          <div style="text-align:right;flex-shrink:0;">
            <div style="display:inline-flex;align-items:center;gap:5px;padding:3px 8px;border-radius:6px;background:#FEE2E2;border:1px solid #EF4444;color:#991B1B;font-size:9px;font-weight:800;">
              <span style="display:inline-block;width:7px;height:7px;border-radius:999px;background:#DC2626;"></span>
              Merah = Dhoif (&lt; 2.70) / Kosong
            </div>
            <div style="font-size:9px;color:#334155;margin-top:3px;font-weight:700;">
              Halaman ${pageNum} dari ${totalPages}
            </div>
          </div>
        </div>
      `,
      buildTheadHtml: () => `
        <thead>
          <tr style="background:#E2E8F0;color:#0F172A;font-size:${headerFontSize}px;">
            <th style="padding:5px 4px 2px 4px;text-align:center;border-top:1px solid #94A3B8;border-left:1px solid #94A3B8;border-right:1px solid #94A3B8;border-bottom:none;background:#E2E8F0;font-weight:800;vertical-align:bottom;">No</th>
            <th style="padding:5px 6px 2px 6px;text-align:left;border-top:1px solid #94A3B8;border-left:1px solid #94A3B8;border-right:1px solid #94A3B8;border-bottom:none;background:#E2E8F0;font-weight:800;vertical-align:bottom;">NAMA</th>
            <th style="padding:5px 4px 2px 4px;text-align:center;border-top:1px solid #94A3B8;border-left:1px solid #94A3B8;border-right:1px solid #94A3B8;border-bottom:none;background:#E2E8F0;font-weight:800;vertical-align:bottom;">Kelas</th>
            ${activeMapelFiltered
          .map(
            (mp) => `
              <th colspan="2" style="padding:4px 4px;text-align:center;border:1px solid #94A3B8;font-weight:800;background:#DBEAFE;color:#0F172A;line-height:1.2;vertical-align:middle;font-size:${mapelCount >= 8 ? 7.2 : headerFontSize}px;overflow:hidden;">
                <div style="display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;word-break:break-word;">
                  ${escapeHtml(String(mp.namaLatin || '').replace(/\//g, ' / '))}${mp.masukRapor === false ? ' <span style="font-size:7px;color:#92400E;">(Rekap)</span>' : ''}
                </div>
              </th>
            `
          )
          .join('')}
          </tr>
          <tr style="background:#F1F5F9;color:#1E293B;font-size:${Math.max(headerFontSize - 0.5, 7)}px;">
            <th style="padding:0 4px 4px 4px;border-top:none;border-left:1px solid #94A3B8;border-right:1px solid #94A3B8;border-bottom:1px solid #94A3B8;background:#E2E8F0;">&nbsp;</th>
            <th style="padding:0 6px 4px 6px;border-top:none;border-left:1px solid #94A3B8;border-right:1px solid #94A3B8;border-bottom:1px solid #94A3B8;background:#E2E8F0;">&nbsp;</th>
            <th style="padding:0 4px 4px 4px;border-top:none;border-left:1px solid #94A3B8;border-right:1px solid #94A3B8;border-bottom:1px solid #94A3B8;background:#E2E8F0;">&nbsp;</th>
            ${activeMapelFiltered
          .map(
            () => `
              <th style="padding:3px 2px;text-align:center;border:1px solid #94A3B8;font-weight:700;background:#EFF6FF;color:#1E3A8A;">Nilai</th>
              <th style="padding:3px 2px;text-align:center;border:1px solid #94A3B8;font-weight:700;background:#E2E8F0;color:#1E293B;">Predikat</th>
            `
          )
          .join('')}
          </tr>
        </thead>
      `,
      buildRowHtml: (idx) => {
        const row = rekapRows[idx];
        return `
          <tr style="font-size:${baseFontSize}px;">
            <td style="padding:${cellPad};text-align:center;border:1px solid #94A3B8;color:#0F172A;background:#F1F5F9;font-weight:600;white-space:nowrap;">${idx + 1}</td>
            <td style="padding:${cellPad};text-align:left;border:1px solid #94A3B8;font-weight:800;color:#000000;text-transform:uppercase;line-height:1.25;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(row.santri.namaLengkap)}</td>
            <td style="padding:${cellPad};text-align:center;border:1px solid #94A3B8;font-weight:700;color:#0F172A;white-space:nowrap;">${escapeHtml(row.namaKelas)}</td>
            ${activeMapelFiltered
            .map((mp) => {
              const sc = row.mapelScores[mp.id];
              const isRed = sc ? sc.isDhoif || sc.isKosong : true;
              const valDisplay =
                sc && sc.isFilled && sc.angkaNilai !== null
                  ? Number.isInteger(sc.angkaNilai)
                    ? sc.angkaNilai
                    : sc.angkaNilai.toFixed(2)
                  : '—';
              const predDisplay = sc && sc.isFilled ? sc.predikatLatin : 'Kosong';

              const scoreStyle = isRed
                ? 'background:#DC2626;color:#FFFFFF;border:1px solid #991B1B;'
                : 'background:#FFFFFF;color:#000000;border:1px solid #94A3B8;';
              const predStyle = sc?.isKosong
                ? 'background:#FEE2E2;color:#991B1B;border:1px solid #94A3B8;font-weight:700;font-style:italic;'
                : sc?.isDhoif
                  ? 'background:#FEE2E2;color:#991B1B;border:1px solid #94A3B8;font-weight:800;'
                  : 'background:#FFFFFF;color:#0F172A;border:1px solid #94A3B8;';

              return `
                <td style="padding:${cellPad};text-align:center;font-family:monospace;font-weight:800;white-space:nowrap;${scoreStyle}">${escapeHtml(valDisplay)}</td>
                <td style="padding:${cellPad};text-align:center;line-height:1.15;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;${predStyle}">${escapeHtml(predDisplay)}</td>
              `;
            })
            .join('')}
          </tr>
        `;
      },
      buildFooterHtml: (pageNum, totalPages) => `
        <div style="display:flex;justify-content:space-between;align-items:center;font-size:8.5px;color:#64748B;border-top:1px solid #E2E8F0;padding-top:5px;margin-top:6px;">
          <span>E-Rapor Pesantren • Pondok Pesantren Bali Bina Insani</span>
          <span>Format F4 Landscape (330 × 215 mm) • Halaman ${pageNum} dari ${totalPages}</span>
        </div>
      `
    });
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

          {/* TOMBOL DOWNLOAD PDF REKAP SANTRI DHOIF / KOSONG */}
          <button
            type="button"
            onClick={handleDownloadDhoifKosongPdf}
            disabled={isGeneratingDhoifPdf || rekapRows.length === 0}
            className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition disabled:opacity-50 cursor-pointer"
            title="Download PDF daftar santri yang masih memiliki nilai Dhoif (< 2.70) atau Kosong pada kelas terpilih"
          >
            {isGeneratingDhoifPdf ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Membuat PDF...</span>
              </>
            ) : (
              <>
                <AlertTriangle className="w-4 h-4" />
                <span>Rekap Dhoif / Kosong ({dhoifKosongRows.length})</span>
              </>
            )}
          </button>

          {/* TOMBOL DOWNLOAD PDF (F4 LANDSCAPE) */}
          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={isGeneratingPdf || rekapRows.length === 0}
            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition disabled:opacity-50 cursor-pointer"
            title="Download Rekap Nilai format PDF F4 Landscape"
          >
            {isGeneratingPdf ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Membuat PDF...</span>
              </>
            ) : (
              <>
                <FileText className="w-4 h-4" />
                <span>Download PDF</span>
              </>
            )}
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
                    <div>{mp.namaLatin}</div>
                    {mp.masukRapor === false && (
                      <span className="inline-block text-[10px] px-1.5 py-0.2 font-medium bg-amber-100 text-amber-800 rounded border border-amber-300 mt-0.5">
                        Hanya Rekap
                      </span>
                    )}
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