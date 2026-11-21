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

  const sanitizeFilePart = (str: string) =>
    String(str || '')
      .replace(/[\\/:*?"<>|]/g, '-')
      .replace(/\s+/g, ' ')
      .trim();

  // Ambil constructor jsPDF langsung dari bundle tanpa html2canvas (instan & 100% vektor tajam)
  const getJsPdfInstance = async (): Promise<any> => {
    await loadHtml2PdfScript();
    const win = window as any;
    const JsPDFCtor = win.jspdf?.jsPDF || win.jsPDF;
    if (typeof JsPDFCtor === 'function') {
      return new JsPDFCtor({
        unit: 'mm',
        format: [330, 215],
        orientation: 'landscape',
        compress: true
      });
    }
    const html2pdfLib = win.html2pdf;
    const tempEl = document.createElement('div');
    return await html2pdfLib()
      .set({ jsPDF: { unit: 'mm', format: [330, 215], orientation: 'landscape' } })
      .from(tempEl)
      .toPdf()
      .get('pdf');
  };

  type RGB = [number, number, number];

  const fitSingleLineText = (doc: any, text: string, maxW: number): string => {
    const raw = String(text ?? '');
    if (maxW <= 2) return '';
    if (doc.getTextWidth(raw) <= maxW) return raw;
    let end = raw.length;
    while (end > 1 && doc.getTextWidth(raw.slice(0, end) + '...') > maxW) {
      end -= 1;
    }
    return raw.slice(0, Math.max(1, end)) + '...';
  };

  const drawPdfCell = (
    doc: any,
    {
      x,
      y,
      w,
      h,
      text,
      align = 'center',
      fillRgb,
      textRgb = [0, 0, 0],
      borderRgb = [148, 163, 184],
      fontStyle = 'normal',
      fontSize = 8,
      padX = 1.5,
      wrap = false,
      maxLines = 2
    }: {
      x: number;
      y: number;
      w: number;
      h: number;
      text: string;
      align?: 'left' | 'center' | 'right';
      fillRgb?: RGB;
      textRgb?: RGB;
      borderRgb?: RGB;
      fontStyle?: 'normal' | 'bold' | 'italic';
      fontSize?: number;
      padX?: number;
      wrap?: boolean;
      maxLines?: number;
    }
  ) => {
    if (fillRgb) {
      doc.setFillColor(fillRgb[0], fillRgb[1], fillRgb[2]);
      doc.rect(x, y, w, h, 'F');
    }
    if (borderRgb) {
      doc.setDrawColor(borderRgb[0], borderRgb[1], borderRgb[2]);
      doc.setLineWidth(0.2);
      doc.rect(x, y, w, h, 'S');
    }

    doc.setFont('helvetica', fontStyle);
    doc.setFontSize(fontSize);
    doc.setTextColor(textRgb[0], textRgb[1], textRgb[2]);

    const usableW = Math.max(w - padX * 2, 2);
    let lines: string[];
    if (wrap) {
      const split: string[] = doc.splitTextToSize(String(text ?? ''), usableW);
      lines = maxLines > 0 ? split.slice(0, maxLines) : split;
    } else {
      lines = [fitSingleLineText(doc, String(text ?? ''), usableW)];
    }

    const lineHeightMm = fontSize * 0.42;
    const totalTextH = lines.length * lineHeightMm;
    const firstLineY = y + (h - totalTextH) / 2 + fontSize * 0.31;
    const textX = align === 'left' ? x + padX : align === 'right' ? x + w - padX : x + w / 2;

    for (let i = 0; i < lines.length; i++) {
      doc.text(lines[i], textX, firstLineY + i * lineHeightMm, { align });
    }
  };

  const drawF4Footer = (doc: any, leftLabel: string, pageNum: number, totalPages: number) => {
    const pageW = 330;
    const marginX = 7;
    const lineY = 204.5;
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.25);
    doc.line(marginX, lineY, pageW - marginX, lineY);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(leftLabel, marginX, 208.5, { align: 'left' });
    doc.text(
      `Format F4 Landscape (330 x 215 mm) • Halaman ${pageNum} dari ${totalPages}`,
      pageW - marginX,
      208.5,
      { align: 'right' }
    );
  };

  const finalizeAndSaveF4Pdf = (doc: any, fileName: string, successToast: string) => {
    const pageW = Math.round(doc.internal.pageSize.getWidth());
    const pageH = Math.round(doc.internal.pageSize.getHeight());
    if (pageW !== 330 || pageH !== 215) {
      console.warn(`Ukuran halaman PDF terdeteksi ${pageW}x${pageH}mm, diharapkan 330x215mm`);
    }
    doc.save(fileName);
    if (showToast) {
      showToast(successToast, 'success');
    }
  };

  // 4. FITUR DOWNLOAD PDF REKAP SANTRI DHOIF & KOSONG BERDASARKAN KELAS TERPILIH (VEKTOR INSTAN)
  const handleDownloadDhoifKosongPdf = async () => {
    if (dhoifKosongRows.length === 0) {
      if (showToast) {
        showToast('Alhamdulillah, tidak ada santri dengan nilai Dhoif atau Kosong di kelas ini!', 'success');
      }
      return;
    }

    setIsGeneratingDhoifPdf(true);
    const kelasLabel =
      selectedKelasId === 'ALL'
        ? 'Semua Kelas'
        : currentKelas
          ? `Kelas ${currentKelas.namaKelas}`
          : 'Kelas';
    const safeKelas = sanitizeFilePart(kelasLabel);
    const fileName = `Rekap Dhoif & Kosong ${safeKelas}.pdf`;

    if (showToast) showToast(`Membuat PDF Rekap Dhoif & Kosong (${kelasLabel})...`);

    try {
      const doc = await getJsPdfInstance();
      const taNama = tahunAjaran?.nama || '2026 – 2027';
      const semNama = semester?.nama || 'Ganjil';
      const waliInfo = currentKelas?.waliKelas ? ` • Wali Kelas: ${currentKelas.waliKelas}` : '';

      const marginX = 7;
      const startY = 7;
      const bottomSafeY = 202; // menyisakan ruang aman di atas footer (204.5mm)

      // Total lebar tepat 316 mm (330 - 14)
      const wNo = 9;
      const wNama = 56;
      const wKelas = 15;
      const wJmlDhoif = 17;
      const wJmlKosong = 19;
      const wDhoifList = 100;
      const wKosongList = 100;

      const rowData = dhoifKosongRows.map((row, idx) => {
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
        const dhoifText = dhoifMapels.length > 0 ? dhoifMapels.join(', ') : '—';
        const kosongText = kosongMapels.length > 0 ? kosongMapels.join(', ') : '—';

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        const dhoifLines: string[] = doc.splitTextToSize(dhoifText, wDhoifList - 3);
        const kosongLines: string[] = doc.splitTextToSize(kosongText, wKosongList - 3);
        const maxLines = Math.max(dhoifLines.length, kosongLines.length, 1);
        const rowH = Math.max(6.2, maxLines * 3.3 + 2.4);

        return { idx, row, dhoifText, kosongText, hasDhoif: dhoifMapels.length > 0, hasKosong: kosongMapels.length > 0, maxLines, rowH };
      });

      const headerBlockH = 15;
      const theadH = 8;
      const tableStartY = startY + headerBlockH;

      // Hitung paginasi sebelum menggambar agar total halaman akurat
      const pages: typeof rowData[] = [];
      let curPage: typeof rowData = [];
      let curY = tableStartY + theadH;
      for (const item of rowData) {
        if (curPage.length > 0 && curY + item.rowH > bottomSafeY) {
          pages.push(curPage);
          curPage = [item];
          curY = tableStartY + theadH + item.rowH;
        } else {
          curPage.push(item);
          curY += item.rowH;
        }
      }
      if (curPage.length > 0) pages.push(curPage);

      const drawDhoifPageHeader = (pageNum: number, totalPages: number) => {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12.5);
        doc.setTextColor(153, 27, 27);
        doc.text(
          `REKAP SANTRI NILAI DHOIF & KOSONG — ${kelasLabel.toUpperCase()}`,
          marginX,
          startY + 4.5
        );

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(15, 23, 42);
        doc.text(
          `Pondok Pesantren Bali Bina Insani • Periode: ${taNama} (${semNama})${waliInfo} • Santri Bermasalah: ${dhoifKosongRows.length} dari ${totalSantriDiRekap} Santri`,
          marginX,
          startY + 9.5
        );

        // Badge kanan
        const badgeText = `Dhoif (< 2.70): ${totalDhoif}  •  Kosong: ${totalKosong}`;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        const badgeW = doc.getTextWidth(badgeText) + 6;
        const badgeX = 330 - marginX - badgeW;
        doc.setFillColor(254, 226, 226);
        doc.setDrawColor(239, 68, 68);
        doc.setLineWidth(0.25);
        doc.roundedRect(badgeX, startY + 0.5, badgeW, 5.5, 1, 1, 'FD');
        doc.setTextColor(153, 27, 27);
        doc.text(badgeText, badgeX + badgeW / 2, startY + 4.2, { align: 'center' });

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(51, 65, 85);
        doc.text(`Halaman ${pageNum} dari ${totalPages}`, 330 - marginX, startY + 9.5, { align: 'right' });

        doc.setDrawColor(153, 27, 27);
        doc.setLineWidth(0.5);
        doc.line(marginX, startY + 12, 330 - marginX, startY + 12);

        // Table header
        let cx = marginX;
        const hy = tableStartY;
        const cols: Array<{ w: number; t: string; align: 'left' | 'center'; fill: RGB; txt: RGB }> = [
          { w: wNo, t: 'No', align: 'center', fill: [226, 232, 240], txt: [15, 23, 42] },
          { w: wNama, t: 'Nama Santri', align: 'left', fill: [226, 232, 240], txt: [15, 23, 42] },
          { w: wKelas, t: 'Kelas', align: 'center', fill: [226, 232, 240], txt: [15, 23, 42] },
          { w: wJmlDhoif, t: 'Jml Dhoif', align: 'center', fill: [254, 202, 202], txt: [127, 29, 29] },
          { w: wJmlKosong, t: 'Jml Kosong', align: 'center', fill: [253, 230, 138], txt: [120, 53, 15] },
          { w: wDhoifList, t: 'Daftar Mapel Nilai Dhoif (< 2.70)', align: 'left', fill: [254, 226, 226], txt: [127, 29, 29] },
          { w: wKosongList, t: 'Daftar Mapel Nilai Kosong (Belum Dinilai)', align: 'left', fill: [254, 243, 199], txt: [120, 53, 15] }
        ];
        for (const c of cols) {
          drawPdfCell(doc, {
            x: cx,
            y: hy,
            w: c.w,
            h: theadH,
            text: c.t,
            align: c.align,
            fillRgb: c.fill,
            textRgb: c.txt,
            fontStyle: 'bold',
            fontSize: 8
          });
          cx += c.w;
        }
      };

      for (let p = 0; p < pages.length; p++) {
        if (p > 0) doc.addPage([330, 215], 'landscape');
        drawDhoifPageHeader(p + 1, pages.length);

        let ry = tableStartY + theadH;
        for (const item of pages[p]) {
          let cx = marginX;
          drawPdfCell(doc, {
            x: cx, y: ry, w: wNo, h: item.rowH,
            text: String(item.idx + 1), align: 'center',
            fillRgb: [241, 245, 249], textRgb: [15, 23, 42], fontStyle: 'bold', fontSize: 7.5
          });
          cx += wNo;

          drawPdfCell(doc, {
            x: cx, y: ry, w: wNama, h: item.rowH,
            text: String(item.row.santri.namaLengkap || '').toUpperCase(), align: 'left',
            fillRgb: [255, 255, 255], textRgb: [0, 0, 0], fontStyle: 'bold', fontSize: 7.5
          });
          cx += wNama;

          drawPdfCell(doc, {
            x: cx, y: ry, w: wKelas, h: item.rowH,
            text: item.row.namaKelas, align: 'center',
            fillRgb: [255, 255, 255], textRgb: [15, 23, 42], fontStyle: 'bold', fontSize: 7.5
          });
          cx += wKelas;

          drawPdfCell(doc, {
            x: cx, y: ry, w: wJmlDhoif, h: item.rowH,
            text: String(item.row.dhoifCount), align: 'center',
            fillRgb: item.row.dhoifCount > 0 ? [220, 38, 38] : [255, 255, 255],
            textRgb: item.row.dhoifCount > 0 ? [255, 255, 255] : [100, 116, 139],
            fontStyle: 'bold', fontSize: 8
          });
          cx += wJmlDhoif;

          drawPdfCell(doc, {
            x: cx, y: ry, w: wJmlKosong, h: item.rowH,
            text: String(item.row.kosongCount), align: 'center',
            fillRgb: item.row.kosongCount > 0 ? [253, 230, 138] : [255, 255, 255],
            textRgb: item.row.kosongCount > 0 ? [120, 53, 15] : [100, 116, 139],
            fontStyle: 'bold', fontSize: 8
          });
          cx += wJmlKosong;

          drawPdfCell(doc, {
            x: cx, y: ry, w: wDhoifList, h: item.rowH,
            text: item.dhoifText, align: 'left',
            fillRgb: item.hasDhoif ? [254, 226, 226] : [255, 255, 255],
            textRgb: item.hasDhoif ? [127, 29, 29] : [100, 116, 139],
            fontStyle: item.hasDhoif ? 'bold' : 'normal',
            fontSize: 7.5, wrap: true, maxLines: item.maxLines
          });
          cx += wDhoifList;

          drawPdfCell(doc, {
            x: cx, y: ry, w: wKosongList, h: item.rowH,
            text: item.kosongText, align: 'left',
            fillRgb: item.hasKosong ? [254, 243, 199] : [255, 255, 255],
            textRgb: item.hasKosong ? [120, 53, 15] : [100, 116, 139],
            fontStyle: item.hasKosong ? 'bold' : 'normal',
            fontSize: 7.5, wrap: true, maxLines: item.maxLines
          });

          ry += item.rowH;
        }

        drawF4Footer(doc, 'E-Rapor Pesantren • Rekap Santri Nilai Dhoif & Kosong', p + 1, pages.length);
      }

      finalizeAndSaveF4Pdf(doc, fileName, `PDF Rekap Dhoif & Kosong (${fileName}) berhasil diunduh!`);
    } catch (err) {
      if (showToast) {
        showToast('Gagal membuat PDF Rekap Dhoif & Kosong. Pastikan koneksi internet tersedia.', 'warning');
      }
    } finally {
      setIsGeneratingDhoifPdf(false);
    }
  };

  // 5. Fungsi Download PDF F4 Landscape (330 x 215 mm, Vektor Instan, Tanpa Jumlah/Rata-rata/Peringkat)
  const handleDownloadPdf = async () => {
    if (rekapRows.length === 0) {
      if (showToast) showToast('Tidak ada data santri untuk diunduh sebagai PDF.', 'warning');
      return;
    }

    setIsGeneratingPdf(true);
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

    if (showToast) showToast('Membuat PDF F4 Landscape Rekap Nilai...');

    try {
      const doc = await getJsPdfInstance();
      const taNama = tahunAjaran?.nama || '2026 – 2027';
      const semNama = semester?.nama || 'Ganjil';
      const waliInfo = currentKelas?.waliKelas ? ` • Wali Kelas: ${currentKelas.waliKelas}` : '';

      const marginX = 7;
      const startY = 7;
      const innerW = 316; // 330 - 14
      const bottomSafeY = 202; // menyisakan ruang aman di atas footer (204.5mm)

      const mapelCount = Math.max(activeMapelFiltered.length, 1);
      const wNo = 7.5;
      const baseNamaW = 51.5;
      const wKelas = 10;
      const fixedW = wNo + baseNamaW + wKelas; // 69mm
      const availMapelW = innerW - fixedW; // 247mm
      const perMapelW = Number((availMapelW / mapelCount).toFixed(2));
      const usedMapelW = perMapelW * mapelCount;
      const wNama = Number((baseNamaW + (availMapelW - usedMapelW)).toFixed(2));
      const wScore = Number((perMapelW * 0.42).toFixed(2));
      const wPred = Number((perMapelW - wScore).toFixed(2));

      const mapelHeaderFont = mapelCount <= 6 ? 7.5 : mapelCount <= 8 ? 6.8 : 6.0;
      const bodyFont = mapelCount <= 6 ? 7.5 : mapelCount <= 8 ? 7.0 : 6.4;
      const rowH = mapelCount <= 6 ? 6.0 : 5.6;

      // Hitung baris mapel header di atas agar tinggi header pas
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      const mapelBannerLines: string[] = doc.splitTextToSize(
        `Mata Pelajaran (${activeMapelFiltered.length}): ${mapelLabelRaw}`,
        255
      ).slice(0, 2);
      const headerBlockH = mapelBannerLines.length > 1 ? 18.5 : 15.5;
      const theadRow1H = 8.0;
      const theadRow2H = 5.0;
      const theadTotalH = theadRow1H + theadRow2H;
      const tableStartY = startY + headerBlockH;

      const availableRowsH = bottomSafeY - (tableStartY + theadTotalH);
      const rowsPerPage = Math.max(1, Math.floor(availableRowsH / rowH));
      const pages: number[][] = [];
      for (let i = 0; i < rekapRows.length; i += rowsPerPage) {
        pages.push(
          Array.from({ length: Math.min(rowsPerPage, rekapRows.length - i) }, (_, k) => i + k)
        );
      }

      const drawRekapPageHeader = (pageNum: number, totalPages: number) => {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12.5);
        doc.setTextColor(6, 95, 70);
        doc.text(
          `REKAPITULASI NILAI SANTRI — ${kelasLabel.toUpperCase()}`,
          marginX,
          startY + 4.5
        );

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(15, 23, 42);
        doc.text(
          `Pondok Pesantren Bali Bina Insani • Periode: ${taNama} (${semNama})${waliInfo} • Total: ${totalSantriDiRekap} Santri`,
          marginX,
          startY + 9.2
        );

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(30, 41, 59);
        for (let l = 0; l < mapelBannerLines.length; l++) {
          doc.text(mapelBannerLines[l], marginX, startY + 13.0 + l * 3.2);
        }

        // Badge legenda merah
        const badgeText = 'Merah = Dhoif (< 2.70) / Kosong';
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        const badgeW = doc.getTextWidth(badgeText) + 6;
        const badgeX = 330 - marginX - badgeW;
        doc.setFillColor(254, 226, 226);
        doc.setDrawColor(239, 68, 68);
        doc.setLineWidth(0.25);
        doc.roundedRect(badgeX, startY + 0.5, badgeW, 5.5, 1, 1, 'FD');
        doc.setTextColor(153, 27, 27);
        doc.text(badgeText, badgeX + badgeW / 2, startY + 4.2, { align: 'center' });

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(51, 65, 85);
        doc.text(`Halaman ${pageNum} dari ${totalPages}`, 330 - marginX, startY + 9.2, { align: 'right' });

        const dividerY = startY + headerBlockH - 2.2;
        doc.setDrawColor(6, 95, 70);
        doc.setLineWidth(0.5);
        doc.line(marginX, dividerY, 330 - marginX, dividerY);

        // Table Header 2 Baris (No, NAMA, Kelas digambar penuh tanpa rowspan bug)
        let cx = marginX;
        const hy = tableStartY;

        drawPdfCell(doc, {
          x: cx, y: hy, w: wNo, h: theadTotalH,
          text: 'No', align: 'center', fillRgb: [226, 232, 240], textRgb: [15, 23, 42],
          fontStyle: 'bold', fontSize: 7.5
        });
        cx += wNo;

        drawPdfCell(doc, {
          x: cx, y: hy, w: wNama, h: theadTotalH,
          text: 'NAMA', align: 'left', fillRgb: [226, 232, 240], textRgb: [15, 23, 42],
          fontStyle: 'bold', fontSize: 7.5
        });
        cx += wNama;

        drawPdfCell(doc, {
          x: cx, y: hy, w: wKelas, h: theadTotalH,
          text: 'Kelas', align: 'center', fillRgb: [226, 232, 240], textRgb: [15, 23, 42],
          fontStyle: 'bold', fontSize: 7.5
        });
        cx += wKelas;

        for (const mp of activeMapelFiltered) {
          const mapelTitle = `${String(mp.namaLatin || '').replace(/\//g, ' / ')}${mp.masukRapor === false ? ' (Rekap)' : ''}`;
          drawPdfCell(doc, {
            x: cx, y: hy, w: wScore + wPred, h: theadRow1H,
            text: mapelTitle, align: 'center', fillRgb: [219, 234, 254], textRgb: [15, 23, 42],
            fontStyle: 'bold', fontSize: mapelHeaderFont, wrap: true, maxLines: 2, padX: 1
          });
          drawPdfCell(doc, {
            x: cx, y: hy + theadRow1H, w: wScore, h: theadRow2H,
            text: 'Nilai', align: 'center', fillRgb: [239, 246, 255], textRgb: [30, 58, 138],
            fontStyle: 'bold', fontSize: 6.8, padX: 0.8
          });
          drawPdfCell(doc, {
            x: cx + wScore, y: hy + theadRow1H, w: wPred, h: theadRow2H,
            text: 'Predikat', align: 'center', fillRgb: [226, 232, 240], textRgb: [30, 41, 59],
            fontStyle: 'bold', fontSize: 6.8, padX: 0.8
          });
          cx += wScore + wPred;
        }
      };

      for (let p = 0; p < pages.length; p++) {
        if (p > 0) doc.addPage([330, 215], 'landscape');
        drawRekapPageHeader(p + 1, pages.length);

        let ry = tableStartY + theadTotalH;
        for (const idx of pages[p]) {
          const row = rekapRows[idx];
          let cx = marginX;

          drawPdfCell(doc, {
            x: cx, y: ry, w: wNo, h: rowH,
            text: String(idx + 1), align: 'center',
            fillRgb: [241, 245, 249], textRgb: [15, 23, 42], fontStyle: 'bold', fontSize: bodyFont, padX: 0.8
          });
          cx += wNo;

          drawPdfCell(doc, {
            x: cx, y: ry, w: wNama, h: rowH,
            text: String(row.santri.namaLengkap || '').toUpperCase(), align: 'left',
            fillRgb: [255, 255, 255], textRgb: [0, 0, 0], fontStyle: 'bold', fontSize: bodyFont, padX: 1.5
          });
          cx += wNama;

          drawPdfCell(doc, {
            x: cx, y: ry, w: wKelas, h: rowH,
            text: row.namaKelas, align: 'center',
            fillRgb: [255, 255, 255], textRgb: [15, 23, 42], fontStyle: 'bold', fontSize: bodyFont, padX: 0.8
          });
          cx += wKelas;

          for (const mp of activeMapelFiltered) {
            const sc = row.mapelScores[mp.id];
            const isRed = sc ? sc.isDhoif || sc.isKosong : true;
            const valDisplay =
              sc && sc.isFilled && sc.angkaNilai !== null
                ? Number.isInteger(sc.angkaNilai)
                  ? String(sc.angkaNilai)
                  : sc.angkaNilai.toFixed(2)
                : '—';
            const predDisplay = sc && sc.isFilled ? sc.predikatLatin : 'Kosong';

            drawPdfCell(doc, {
              x: cx, y: ry, w: wScore, h: rowH,
              text: valDisplay, align: 'center',
              fillRgb: isRed ? [220, 38, 38] : [255, 255, 255],
              textRgb: isRed ? [255, 255, 255] : [0, 0, 0],
              borderRgb: isRed ? [153, 27, 27] : [148, 163, 184],
              fontStyle: 'bold', fontSize: bodyFont, padX: 0.5
            });

            drawPdfCell(doc, {
              x: cx + wScore, y: ry, w: wPred, h: rowH,
              text: predDisplay, align: 'center',
              fillRgb: sc?.isKosong || sc?.isDhoif ? [254, 226, 226] : [255, 255, 255],
              textRgb: sc?.isKosong || sc?.isDhoif ? [153, 27, 27] : [15, 23, 42],
              fontStyle: sc?.isKosong ? 'italic' : sc?.isDhoif ? 'bold' : 'normal',
              fontSize: Math.max(bodyFont - 0.5, 6), padX: 0.5
            });

            cx += wScore + wPred;
          }

          ry += rowH;
        }

        drawF4Footer(doc, 'E-Rapor Pesantren • Pondok Pesantren Bali Bina Insani', p + 1, pages.length);
      }

      finalizeAndSaveF4Pdf(doc, fileName, `PDF F4 Landscape (${fileName}) berhasil diunduh!`);
    } catch (err) {
      if (showToast) {
        showToast('Gagal membuat PDF Rekap Nilai. Pastikan koneksi internet tersedia.', 'warning');
      }
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border-2 border-slate-900 shadow-[4px_4px_0px_#0F172A] overflow-hidden">
      {/* TOOLBAR ATAS: SELECTOR KELAS, SEARCH, INDIKATOR MERAH, TOMBOL AKSI */}
      <div className="p-4 sm:p-5 border-b-2 border-slate-900 flex flex-wrap items-center justify-between gap-3 bg-slate-50/70">
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
            className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold border-2 border-slate-900 shadow-[2px_2px_0px_#0F172A] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none flex items-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
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
            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold border-2 border-slate-900 shadow-[2px_2px_0px_#0F172A] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none flex items-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
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
            className="px-3 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-900 border-2 border-slate-900 shadow-[2px_2px_0px_#0F172A] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none text-xs font-bold transition-all cursor-pointer"
          >
            Edit Nilai
          </button>

          <button
            type="button"
            onClick={onJumpToPrint}
            className="px-3.5 py-2 rounded-xl bg-[#064E3B] hover:bg-emerald-900 text-white border-2 border-slate-900 shadow-[2px_2px_0px_#0F172A] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
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