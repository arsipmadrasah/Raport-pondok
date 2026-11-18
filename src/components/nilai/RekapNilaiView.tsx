import React, { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { Search, Download, Printer, FileText, Loader2 } from 'lucide-react';
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

  // 5. Fungsi Download PDF A4 Landscape (Anti-Terpotong Samping & Sesuai Format Aplikasi)
  const handleDownloadPdf = async () => {
    if (rekapRows.length === 0) {
      if (showToast) showToast('Tidak ada data santri untuk diunduh sebagai PDF.', 'warning');
      return;
    }

    setIsGeneratingPdf(true);
    if (showToast) showToast('Menyiapkan PDF A4 Landscape Rekap Nilai...');

    let measureStage: HTMLElement | null = null;
    let stageContainer: HTMLElement | null = null;
    const prevScrollX = window.scrollX;
    const prevScrollY = window.scrollY;

    try {
      const html2pdfLib: any = await loadHtml2PdfScript();
      if (document.fonts && document.fonts.ready) {
        await document.fonts.ready;
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

      const sanitizeFilePart = (str: string) =>
        String(str || '')
          .replace(/[\\/:*?"<>|]/g, '-')
          .replace(/\s+/g, ' ')
          .trim();

      const safeKelas = sanitizeFilePart(kelasLabel);
      let safeMapel = sanitizeFilePart(mapelLabelRaw);
      if (safeMapel.length > 115) {
        safeMapel = safeMapel.slice(0, 112).trim() + '...';
      }
      const fileName = `Rekap Nilai ${safeKelas} - ${safeMapel}.pdf`;

      const taNama = tahunAjaran?.nama || '2026 – 2027';
      const semNama = semester?.nama || 'Ganjil';
      const waliInfo = currentKelas?.waliKelas ? ` • Wali Kelas: ${currentKelas.waliKelas}` : '';

      const buildHeaderHtml = (pageNum: number, totalPages: number) => `
        <div style="margin-bottom:10px;border-bottom:2px solid #064E3B;padding-bottom:8px;display:flex;justify-content:space-between;align-items:flex-end;gap:12px;">
          <div style="min-width:0;flex:1;">
            <div style="font-size:15px;font-weight:900;color:#064E3B;letter-spacing:0.3px;line-height:1.2;">
              REKAPITULASI NILAI SANTRI — ${escapeHtml(kelasLabel.toUpperCase())}
            </div>
            <div style="font-size:10px;color:#334155;margin-top:3px;font-weight:600;">
              Pondok Pesantren Bali Bina Insani • Periode: ${escapeHtml(taNama)} (${escapeHtml(semNama)})${escapeHtml(waliInfo)} • Total: ${totalSantriDiRekap} Santri
            </div>
            <div style="font-size:9.5px;color:#475569;margin-top:2px;line-height:1.3;">
              <strong>Mata Pelajaran:</strong> ${escapeHtml(mapelLabelRaw)}
            </div>
          </div>
          <div style="text-align:right;flex-shrink:0;">
            <div style="display:inline-flex;align-items:center;gap:5px;padding:3px 8px;border-radius:6px;background:#FEF2F2;border:1px solid #FECACA;color:#B91C1C;font-size:9px;font-weight:700;">
              <span style="display:inline-block;width:7px;height:7px;border-radius:999px;background:#DC2626;"></span>
              Merah = Dhoif (&lt; 2.70) / Kosong
            </div>
            <div style="font-size:9px;color:#64748B;margin-top:4px;font-weight:600;">
              Halaman ${pageNum} dari ${totalPages}
            </div>
          </div>
        </div>
      `;

      const buildTheadHtml = () => `
        <thead>
          <tr style="background:#EEF2F6;color:#1E293B;">
            <th style="padding:6px 6px;text-align:center;border:1px solid #CBD5E1;font-weight:800;white-space:nowrap;width:28px;">No</th>
            <th style="padding:6px 8px;text-align:left;border:1px solid #CBD5E1;font-weight:800;white-space:nowrap;min-width:155px;">NAMA</th>
            <th style="padding:6px 6px;text-align:center;border:1px solid #CBD5E1;font-weight:800;white-space:nowrap;width:44px;">Kelas</th>
            ${activeMapelFiltered
              .map(
                (mp) => `
              <th style="padding:6px 6px;text-align:center;border:1px solid #CBD5E1;font-weight:800;white-space:nowrap;background:#E6EFF8;color:#0F172A;">
                ${escapeHtml(mp.namaLatin)}${mp.masukRapor === false ? ' <span style="font-size:8px;color:#92400E;">(Rekap)</span>' : ''}
              </th>
              <th style="padding:6px 6px;text-align:center;border:1px solid #CBD5E1;font-weight:700;white-space:nowrap;background:#EEF2F6;color:#475569;font-size:8.5px;">
                ${escapeHtml(cleanMapelHeaderKey(mp.namaLatin))}
              </th>
            `
              )
              .join('')}
            <th style="padding:6px 6px;text-align:center;border:1px solid #CBD5E1;font-weight:800;white-space:nowrap;background:#E2E8F0;color:#0F172A;">Jumlah</th>
            <th style="padding:6px 6px;text-align:center;border:1px solid #CBD5E1;font-weight:800;white-space:nowrap;background:#E2E8F0;color:#0F172A;">ratarata</th>
            <th style="padding:6px 6px;text-align:center;border:1px solid #CBD5E1;font-weight:800;white-space:nowrap;background:#FEF3C7;color:#78350F;">perigkat</th>
          </tr>
        </thead>
      `;

      const buildRowHtml = (row: any, idx: number) => `
        <tr>
          <td style="padding:5px 6px;text-align:center;border:1px solid #CBD5E1;color:#475569;background:#F8FAFC;">${idx + 1}</td>
          <td style="padding:5px 8px;text-align:left;border:1px solid #CBD5E1;font-weight:800;color:#0F172A;text-transform:uppercase;white-space:nowrap;">${escapeHtml(row.santri.namaLengkap)}</td>
          <td style="padding:5px 6px;text-align:center;border:1px solid #CBD5E1;font-weight:700;color:#334155;white-space:nowrap;">${escapeHtml(row.namaKelas)}</td>
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
                ? 'background:#EF4444;color:#FFFFFF;border:1px solid #DC2626;'
                : 'background:#FFFFFF;color:#1E293B;border:1px solid #CBD5E1;';
              const predStyle = sc?.isKosong
                ? 'background:#FEF2F2;color:#DC2626;border:1px solid #CBD5E1;font-weight:600;font-style:italic;'
                : sc?.isDhoif
                  ? 'background:#FEF2F2;color:#B91C1C;border:1px solid #CBD5E1;font-weight:700;'
                  : 'background:#FFFFFF;color:#334155;border:1px solid #CBD5E1;';

              return `
              <td style="padding:5px 6px;text-align:center;font-family:monospace;font-weight:800;white-space:nowrap;${scoreStyle}">${escapeHtml(valDisplay)}</td>
              <td style="padding:5px 6px;text-align:center;white-space:nowrap;${predStyle}">${escapeHtml(predDisplay)}</td>
            `;
            })
            .join('')}
          <td style="padding:5px 6px;text-align:center;border:1px solid #CBD5E1;font-family:monospace;font-weight:800;color:#0F172A;background:#F8FAFC;white-space:nowrap;">
            ${row.filledCount > 0 ? row.totalScore.toFixed(2) : '—'}
          </td>
          <td style="padding:5px 6px;text-align:center;border:1px solid #CBD5E1;font-family:monospace;font-weight:800;white-space:nowrap;${
            row.filledCount > 0 && row.averageScore < 2.7
              ? 'background:#FEE2E2;color:#991B1B;border-color:#FCA5A5;'
              : 'background:#F8FAFC;color:#064E3B;'
          }">
            ${row.filledCount > 0 ? row.averageScore.toFixed(2) : '—'}
          </td>
          <td style="padding:5px 6px;text-align:center;border:1px solid #CBD5E1;font-weight:800;color:#0F172A;background:#FFFBEB;white-space:nowrap;">
            ${escapeHtml(row.rank)}
          </td>
        </tr>
      `;

      // Tahap 1: Ukur lebar tabel aktual & tinggi tiap baris agar pas A4 Landscape tanpa terpotong samping
      measureStage = document.createElement('div');
      measureStage.style.position = 'fixed';
      measureStage.style.top = '0px';
      measureStage.style.left = '0px';
      measureStage.style.visibility = 'hidden';
      measureStage.style.pointerEvents = 'none';
      measureStage.style.fontFamily = 'Inter, system-ui, -apple-system, sans-serif';
      measureStage.style.width = 'max-content';
      measureStage.innerHTML = `
        <div id="pdf-measure-header" style="width:1050px;">${buildHeaderHtml(1, 1)}</div>
        <table id="pdf-measure-table" style="border-collapse:collapse;font-size:9.5px;width:auto;">
          ${buildTheadHtml()}
          <tbody>
            ${rekapRows.map((row, idx) => buildRowHtml(row, idx)).join('')}
          </tbody>
        </table>
      `;
      document.body.appendChild(measureStage);

      const measureTable = measureStage.querySelector('#pdf-measure-table') as HTMLElement;
      const measureHeader = measureStage.querySelector('#pdf-measure-header') as HTMLElement;
      const naturalTableWidth = measureTable ? measureTable.scrollWidth : 1050;

      // Hitung stageWidth agar margin fisik di A4 Landscape (297x210mm) konsisten 8mm di semua sisi
      const stageWidth = Math.max(1123, Math.ceil((naturalTableWidth * 297) / 281));
      const padPx = Math.round(stageWidth * (8 / 297));
      const pageHeightPx = Math.round(stageWidth * (210 / 297));
      const innerWidth = stageWidth - padPx * 2;
      const innerMaxHeight = pageHeightPx - padPx * 2;

      if (measureHeader) {
        measureHeader.style.width = `${innerWidth}px`;
      }
      if (measureTable) {
        measureTable.style.width = '100%';
      }

      const headerH = measureHeader ? measureHeader.offsetHeight + 10 : 75;
      const theadEl = measureTable?.querySelector('thead') as HTMLElement | null;
      const theadH = theadEl ? theadEl.offsetHeight : 30;
      const footerH = 26;
      const rowEls = Array.from(measureTable?.querySelectorAll('tbody tr') || []) as HTMLElement[];

      // Kelompokkan baris per halaman agar tidak terpotong di batas bawah halaman
      const pages: Array<Array<{ row: any; idx: number }>> = [];
      let currentPageRows: Array<{ row: any; idx: number }> = [];
      let usedH = headerH + theadH + footerH;

      for (let i = 0; i < rekapRows.length; i++) {
        const rowH = rowEls[i] ? rowEls[i].offsetHeight : 25;
        if (currentPageRows.length > 0 && usedH + rowH > innerMaxHeight) {
          pages.push(currentPageRows);
          currentPageRows = [{ row: rekapRows[i], idx: i }];
          usedH = headerH + theadH + footerH + rowH;
        } else {
          currentPageRows.push({ row: rekapRows[i], idx: i });
          usedH += rowH;
        }
      }
      if (currentPageRows.length > 0) {
        pages.push(currentPageRows);
      }

      if (measureStage && measureStage.parentNode) {
        measureStage.parentNode.removeChild(measureStage);
        measureStage = null;
      }

      window.scrollTo(0, 0);

      // Tahap 2: Render setiap halaman ke stageContainer dengan rasio persis A4 Landscape (297:210)
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
            <table style="width:100%;border-collapse:collapse;font-size:9.5px;">
              ${buildTheadHtml()}
              <tbody>
                ${pages[p].map((item) => buildRowHtml(item.row, item.idx)).join('')}
              </tbody>
            </table>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;font-size:8.5px;color:#64748B;border-top:1px solid #E2E8F0;padding-top:6px;margin-top:8px;">
            <span>E-Rapor Pesantren • Pondok Pesantren Bali Bina Insani</span>
            <span>Format A4 Landscape • Halaman ${p + 1} dari ${pages.length}</span>
          </div>
        `;

        stageContainer.appendChild(pageEl);
        await new Promise((r) => setTimeout(r, 180));

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
              width: stageWidth,
              height: pageHeightPx,
              windowWidth: stageWidth,
              windowHeight: pageHeightPx
            },
            pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
            jsPDF: {
              unit: 'mm',
              format: 'a4',
              orientation: 'landscape'
            }
          })
          .from(pageEl);

        const canvas = await worker.toCanvas().get('canvas');
        const imgData = canvas.toDataURL('image/jpeg', 0.98);

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
        } else if (pdfInstance) {
          pdfInstance.addPage('a4', 'landscape');
          pdfInstance.setPage(pdfInstance.internal.getNumberOfPages());
          pdfInstance.addImage(imgData, 'JPEG', 0, 0, 297, 210);
        }
      }

      if (pdfInstance) {
        pdfInstance.save(fileName);
      }

      if (showToast) {
        showToast(`PDF A4 Landscape (${fileName}) berhasil diunduh!`, 'success');
      }
    } catch (err) {
      if (showToast) {
        showToast('Gagal membuat PDF Rekap Nilai. Pastikan koneksi internet tersedia.', 'warning');
      }
    } finally {
      if (measureStage && measureStage.parentNode) {
        measureStage.parentNode.removeChild(measureStage);
      }
      if (stageContainer && stageContainer.parentNode) {
        stageContainer.parentNode.removeChild(stageContainer);
      }
      window.scrollTo(prevScrollX, prevScrollY);
      setIsGeneratingPdf(false);
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
            className="px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
            title="Download Rekap Nilai format Excel (.xlsx)"
          >
            <Download className="w-4 h-4" />
            <span>Download Excel</span>
          </button>

          {/* TOMBOL DOWNLOAD PDF (A4 LANDSCAPE) */}
          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={isGeneratingPdf || rekapRows.length === 0}
            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition disabled:opacity-50 cursor-pointer"
            title="Download Rekap Nilai format PDF A4 Landscape"
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