import React, { useState, useId, useRef } from 'react';
import * as XLSX from 'xlsx';
import {
  FileSpreadsheet,
  Download,
  Upload,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  X,
  FileUp,
  Sparkles,
  Loader2,
  AlertTriangle
} from 'lucide-react';
import { normalizeTingkat } from '../../constants/initialData';
import { SupabaseDB } from '../../services/supabase';

export function downloadSantriExcelTemplate(kelasList = []) {
  const headers = ['No', 'Nama Lengkap', 'Kelas'];

  const firstKelasNama = kelasList[0]?.namaKelas || 'VII C';
  const secondKelasNama = kelasList[1]?.namaKelas || 'VII A';
  const thirdKelasNama = kelasList[2]?.namaKelas || 'VIII A';

  const sampleRows = [
    headers,
    [1, 'MUHAMMAD FAIZ ABDULLAH', firstKelasNama],
    [2, 'AISYAH NURUL JANNAH', firstKelasNama],
    [3, 'RAYHAN AKBAR PRATAMA', secondKelasNama],
    [4, 'AHMAD DANI SAPUTRA', thirdKelasNama]
  ];

  const ws = XLSX.utils.aoa_to_sheet(sampleRows);
  ws['!cols'] = [
    { wch: 8 },  // No
    { wch: 38 }, // Nama Lengkap
    { wch: 18 }  // Kelas
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Data Santri');

  // Sheet Petunjuk Pengisian
  const guideRows = [
    ['PANDUAN PENGISIAN TEMPLATE IMPORT DATA SANTRI (IDENTITAS RAPOR)'],
    [''],
    ['1. Kolom yang dibutuhkan HANYA "Nama Lengkap" dan "Kelas".'],
    ['2. Kolom "Nama Lengkap" WAJIB diisi sesuai nama santri yang akan dicetak di rapor.'],
    ['3. Kolom "Kelas" dapat diisi nama kelas yang tersedia di sistem:'],
    ...kelasList.map((k) => [`   - ${k.namaKelas}`]),
    ['4. Jika kolom "Kelas" dikosongkan pada Excel, santri otomatis dimasukkan ke kelas target default yang Anda pilih pada modal aplikasi.'],
    ['5. NIS dan data teknis database lainnya akan di-generate otomatis secara unik oleh sistem.']
  ];
  const wsGuide = XLSX.utils.aoa_to_sheet(guideRows);
  wsGuide['!cols'] = [{ wch: 75 }];
  XLSX.utils.book_append_sheet(wb, wsGuide, 'Petunjuk');

  XLSX.writeFile(wb, 'Format_Import_Santri_Nama_dan_Kelas.xlsx');
}

// ============================================================================
// MODAL: IMPORT DATA SANTRI DARI EXCEL (.xlsx, .xls, .csv)
// ============================================================================

export function ImportSantriExcelModal({
  isOpen,
  onClose,
  kelasList,
  santriList,
  setSantriList,
  selectedKelasId,
  showToast,
  addLog
}) {
  if (!isOpen) return null;

  const fileInputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState(0);
  const [defaultKelasId, setDefaultKelasId] = useState(
    selectedKelasId && selectedKelasId !== 'ALL' ? selectedKelasId : kelasList[0]?.id || ''
  );
  const [updateIfExists, setUpdateIfExists] = useState(true);
  const [parsedRows, setParsedRows] = useState([]);
  const [isReading, setIsReading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [parseError, setParseError] = useState('');

  const matchKelas = (rawKelas, fallbackId) => {
    if (!rawKelas) return fallbackId;
    const clean = String(rawKelas).trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!clean) return fallbackId;

    const exact = kelasList.find(
      (k) => k.namaKelas.toLowerCase().replace(/[^a-z0-9]/g, '') === clean
    );
    if (exact) return exact.id;

    const byId = kelasList.find(
      (k) => k.id.toLowerCase().replace(/[^a-z0-9]/g, '') === clean
    );
    if (byId) return byId.id;

    const partial = kelasList.find((k) => {
      const kClean = k.namaKelas.toLowerCase().replace(/[^a-z0-9]/g, '');
      return kClean.includes(clean) || clean.includes(kClean);
    });
    if (partial) return partial.id;

    return fallbackId;
  };

  const handleProcessFile = (file) => {
    if (!file) return;
    setIsReading(true);
    setParseError('');
    setFileName(file.name);
    setFileSize(Math.round(file.size / 1024));

    const reader = new FileReader();
    reader.onerror = () => {
      setIsReading(false);
      setParseError('Gagal membaca file dari perangkat.');
    };
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: 'array', cellDates: true });
        if (!wb.SheetNames || wb.SheetNames.length === 0) {
          throw new Error('Tidak ada worksheet dalam file Excel ini.');
        }

        const ws = wb.Sheets[wb.SheetNames[0]];
        const rawRows = XLSX.utils.sheet_to_json(ws, { defval: '', raw: false });

        if (!rawRows || rawRows.length === 0) {
          throw new Error('Sheet pertama Excel kosong atau tidak memiliki baris data.');
        }

        const normalized = rawRows.map((row, idx) => {
          const getVal = (patterns) => {
            const foundKey = Object.keys(row).find((k) =>
              patterns.some((p) => k.trim().toLowerCase().includes(p.toLowerCase()))
            );
            return foundKey ? String(row[foundKey] || '').trim() : '';
          };

          const rawNama = getVal(['nama lengkap', 'nama santri', 'nama_santri', 'nama']);
          const rawKelas = getVal(['kelas', 'nama kelas', 'tingkat', 'kls']);
          const rawNis = getVal(['nis', 'no_induk', 'nomor induk', 'induk']);

          const cleanNama = String(rawNama).trim().toUpperCase();
          const cleanNis = String(rawNis).trim().replace(/[^0-9a-zA-Z\-_]/g, '');
          const targetKelasId = matchKelas(rawKelas, defaultKelasId);

          const isExisting = santriList.some(
            (s) =>
              (cleanNis && s.nis === cleanNis) ||
              s.namaLengkap.toLowerCase() === cleanNama.toLowerCase()
          );

          const isValid = Boolean(cleanNama);

          return {
            _tempId: `row-${idx}-${Date.now()}`,
            namaLengkap: cleanNama,
            nis: cleanNis,
            kelasId: targetKelasId,
            rawKelasInput: rawKelas,
            isValid,
            isExisting
          };
        });

        setParsedRows(normalized);
      } catch (err) {
        setParseError(`Format file tidak sesuai atau error: ${err.message}`);
        setParsedRows([]);
      } finally {
        setIsReading(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleProcessFile(e.dataTransfer.files[0]);
    }
  };

  const handleDefaultKelasChange = (newKelasId) => {
    setDefaultKelasId(newKelasId);
    setParsedRows((prev) =>
      prev.map((r) => ({
        ...r,
        kelasId: r.rawKelasInput ? matchKelas(r.rawKelasInput, newKelasId) : newKelasId
      }))
    );
  };

  const handleExecuteImport = async () => {
    const validRows = parsedRows.filter((r) => r.isValid);
    if (validRows.length === 0) {
      showToast('Tidak ada baris data nama santri yang valid untuk diimpor!', 'warning');
      return;
    }

    setIsSaving(true);
    try {
      const updatedList = [...santriList];
      const supabasePayload = [];
      let newCount = 0;
      let updatedCount = 0;

      const currentYear = new Date().getFullYear();
      const existingNisNums = updatedList
        .map((s) => parseInt(s.nis))
        .filter((n) => !isNaN(n) && n > 200000000);
      let nextNisCounter =
        existingNisNums.length > 0
          ? Math.max(...existingNisNums) + 1
          : parseInt(`${currentYear}07001`);

      for (const row of validRows) {
        const existingIdx = updatedList.findIndex(
          (s) =>
            (row.nis && s.nis === row.nis) ||
            s.namaLengkap.toLowerCase() === row.namaLengkap.toLowerCase()
        );

        const resolvedKelasId = row.kelasId || defaultKelasId;

        if (existingIdx >= 0) {
          if (updateIfExists) {
            const currentSantri = updatedList[existingIdx];
            const updatedRecord = {
              ...currentSantri,
              namaLengkap: row.namaLengkap,
              kelasId: resolvedKelasId
            };
            updatedList[existingIdx] = updatedRecord;
            updatedCount++;

            supabasePayload.push({
              id: currentSantri.id,
              nis: currentSantri.nis,
              nisn: currentSantri.nisn || '',
              nama_lengkap: updatedRecord.namaLengkap,
              nama_arab: currentSantri.namaArab || '',
              jenis_kelamin: currentSantri.jenisKelamin || 'L',
              tempat_lahir: currentSantri.tempatLahir || 'Bali',
              tanggal_lahir: currentSantri.tanggalLahir || '2011-01-01',
              nama_wali: currentSantri.namaWali || '',
              alamat: currentSantri.alamat || '',
              tahun_masuk: currentSantri.tahunMasuk || currentYear,
              status_aktif: true,
              kelas_id: updatedRecord.kelasId
            });
          }
        } else {
          const assignedNis = row.nis || String(nextNisCounter++);
          const newRecord = {
            id: `snt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            nis: assignedNis,
            nisn: '',
            namaLengkap: row.namaLengkap,
            namaArab: '',
            jenisKelamin: 'L',
            tempatLahir: 'Bali',
            tanggalLahir: '2011-01-01',
            namaWali: '',
            alamat: '',
            tahunMasuk: currentYear,
            statusAktif: true,
            kelasId: resolvedKelasId
          };

          updatedList.push(newRecord);
          newCount++;

          supabasePayload.push({
            id: newRecord.id,
            nis: newRecord.nis,
            nisn: newRecord.nisn,
            nama_lengkap: newRecord.namaLengkap,
            nama_arab: newRecord.namaArab,
            jenis_kelamin: newRecord.jenisKelamin,
            tempat_lahir: newRecord.tempatLahir,
            tanggal_lahir: newRecord.tanggalLahir,
            nama_wali: newRecord.namaWali,
            alamat: newRecord.alamat,
            tahun_masuk: newRecord.tahunMasuk,
            status_aktif: true,
            kelas_id: newRecord.kelasId
          });
        }
      }

      setSantriList(updatedList);

      if (supabasePayload.length > 0) {
        try {
          await SupabaseDB.upsert('santri', supabasePayload);
        } catch (dbErr) {
          console.warn('Gagal upsert langsung ke Supabase:', dbErr);
        }
      }

      addLog(
        'IMPORT_EXCEL_SANTRI',
        `Import Excel (${fileName}): ${newCount} santri baru, ${updatedCount} santri diperbarui`
      );

      showToast(
        `Sukses! ${newCount} santri baru ditambahkan, ${updatedCount} santri diperbarui ke database!`
      );
      onClose();
    } catch (err) {
      showToast(`Gagal mengimpor: ${err.message}`, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const validCount = parsedRows.filter((r) => r.isValid).length;
  const newCount = parsedRows.filter((r) => r.isValid && !r.isExisting).length;
  const existingCount = parsedRows.filter((r) => r.isValid && r.isExisting).length;
  const invalidCount = parsedRows.filter((r) => !r.isValid).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* HEADER MODAL */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20 text-emerald-300">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold">Import Data Santri via Excel</h2>
              <p className="text-xs text-emerald-200/90">
                Format sederhana: Hanya butuh kolom <b>Nama Lengkap</b> dan <b>Kelas</b>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* BODY MODAL */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs">
          {/* BANNER TEMPLATE DOWNLOAD */}
          <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2 font-bold text-emerald-950 text-xs sm:text-sm">
                <Sparkles className="w-4 h-4 text-emerald-700" />
                <span>Format Khusus Identitas Rapor</span>
              </div>
              <p className="text-[11px] text-emerald-800 leading-relaxed">
                Template praktis hanya dengan 2 kolom: <b>Nama Lengkap</b> dan <b>Kelas</b> (tanpa Nama Arab, NIS, dll).
              </p>
            </div>
            <button
              type="button"
              onClick={() => downloadSantriExcelTemplate(kelasList)}
              className="px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold flex items-center justify-center gap-2 shrink-0 shadow-xs transition cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Unduh Template (Nama & Kelas)</span>
            </button>
          </div>

          {/* DROPZONE / FILE UPLOADER */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2.5 ${dragActive
              ? 'border-emerald-500 bg-emerald-50/50 scale-[0.99]'
              : fileName
                ? 'border-emerald-400 bg-slate-50'
                : 'border-slate-300 hover:border-emerald-600 hover:bg-slate-50'
              }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx, .xls, .csv"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleProcessFile(e.target.files[0]);
                }
              }}
              className="hidden"
            />

            {isReading ? (
              <div className="py-4 flex flex-col items-center gap-2 text-emerald-700">
                <Loader2 className="w-8 h-8 animate-spin" />
                <span className="font-semibold text-xs">Membaca dan memproses spreadsheet Excel...</span>
              </div>
            ) : fileName ? (
              <div className="py-1 flex flex-col items-center gap-1.5">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <div className="font-bold text-slate-800 text-sm">{fileName}</div>
                <div className="text-[11px] text-slate-500">
                  Ukuran: {fileSize} KB • Klik untuk mengganti file
                </div>
              </div>
            ) : (
              <div className="py-2 flex flex-col items-center gap-1.5">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-600 flex items-center justify-center">
                  <Upload className="w-6 h-6" />
                </div>
                <div className="font-bold text-slate-800 text-sm">
                  Tarik & Lepas File Excel Disini, atau <span className="text-emerald-700 underline">Pilih File</span>
                </div>
                <div className="text-[11px] text-slate-400">
                  Mendukung file Microsoft Excel (.xlsx, .xls) atau CSV (Kolom: Nama Lengkap & Kelas)
                </div>
              </div>
            )}
          </div>

          {parseError && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-300 text-rose-800 flex items-start gap-2.5 text-xs">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <div>
                <p className="font-bold">Terjadi Kesalahan Pembacaan File:</p>
                <p className="text-[11px]">{parseError}</p>
              </div>
            </div>
          )}

          {/* OPSI PENGATURAN KELAS TARGET & DUPLIKASI */}
          <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-2xl grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Target Kelas Default (Jika Kolom Kelas Kosong):
              </label>
              <select
                value={defaultKelasId}
                onChange={(e) => handleDefaultKelasChange(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-semibold text-slate-800"
              >
                {kelasList.map((k) => (
                  <option key={k.id} value={k.id}>
                    Tingkat {normalizeTingkat(k.tingkat, k.namaKelas)} — {k.namaKelas}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2.5 sm:mt-4">
              <input
                id="update-existing-checkbox"
                type="checkbox"
                checked={updateIfExists}
                onChange={(e) => setUpdateIfExists(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-700 accent-emerald-700 cursor-pointer"
              />
              <label htmlFor="update-existing-checkbox" className="text-slate-700 cursor-pointer select-none">
                <span className="font-bold">Perbarui Santri Jika Nama Sudah Ada</span>
                <p className="text-[11px] text-slate-500">
                  Data santri yang sudah ada akan dipindahkan ke kelas tujuan jika dicentang
                </p>
              </label>
            </div>
          </div>

          {/* PREVIEW HASIL PARSING EXCEL (HANYA NAMA LENGKAP & KELAS) */}
          {parsedRows.length > 0 && (
            <div className="space-y-2.5 pt-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-800 text-sm">Pratinjau Data Santri:</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-800 font-bold text-[11px]">
                    Total {parsedRows.length} baris
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                  <span className="px-2 py-0.5 rounded-lg bg-emerald-100 text-emerald-800 font-bold">
                    ✓ {newCount} Baru
                  </span>
                  {existingCount > 0 && (
                    <span className="px-2 py-0.5 rounded-lg bg-amber-100 text-amber-800 font-bold">
                      ⟳ {existingCount} Sudah Ada
                    </span>
                  )}
                  {invalidCount > 0 && (
                    <span className="px-2 py-0.5 rounded-lg bg-rose-100 text-rose-800 font-bold">
                      ⚠ {invalidCount} Tidak Valid
                    </span>
                  )}
                </div>
              </div>

              <div className="border border-slate-200 rounded-2xl overflow-hidden max-h-60 overflow-y-auto bg-white shadow-xs">
                <table className="w-full text-left border-collapse text-[11px]">
                  <thead className="bg-slate-100 text-slate-700 sticky top-0 z-10 border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3 font-bold w-12 text-center">No</th>
                      <th className="py-2.5 px-4 font-bold">Nama Lengkap Santri</th>
                      <th className="py-2.5 px-4 font-bold">Kelas Tujuan</th>
                      <th className="py-2.5 px-4 font-bold text-center w-28">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parsedRows.map((r, idx) => {
                      const targetKelasObj = kelasList.find((k) => k.id === r.kelasId);
                      return (
                        <tr
                          key={r._tempId}
                          className={
                            !r.isValid
                              ? 'bg-rose-50/70 text-rose-900'
                              : r.isExisting
                                ? 'bg-amber-50/50'
                                : 'hover:bg-slate-50'
                          }
                        >
                          <td className="py-2 px-3 text-center text-slate-400 font-mono">{idx + 1}</td>
                          <td className="py-2 px-4 font-bold text-slate-900">
                            {r.namaLengkap || <span className="text-rose-500 italic">Nama Kosong</span>}
                          </td>
                          <td className="py-2 px-4">
                            <span className="font-bold text-emerald-900 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
                              {targetKelasObj ? targetKelasObj.namaKelas : 'Default'}
                            </span>
                            {r.rawKelasInput && (
                              <span className="text-[10px] text-slate-400 block mt-0.5">
                                (Teks Excel: {r.rawKelasInput})
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-4 text-center">
                            {!r.isValid ? (
                              <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 font-bold text-[10px]">
                                Nama Kosong
                              </span>
                            ) : r.isExisting ? (
                              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px]">
                                Santri Lama
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                                Santri Baru
                              </span>
                            )}
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

        {/* FOOTER MODAL */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2.5 shrink-0">
          <div className="text-[11px] text-slate-500">
            {parsedRows.length > 0 ? (
              <span>
                Siap mengimpor <b className="text-emerald-800">{validCount}</b> santri ke rapor.
              </span>
            ) : (
              <span>Unggah file Excel berisi Nama Lengkap dan Kelas santri.</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs transition cursor-pointer"
            >
              Batal
            </button>

            <button
              type="button"
              onClick={handleExecuteImport}
              disabled={parsedRows.length === 0 || validCount === 0 || isSaving}
              className={`px-5 py-2.5 rounded-xl text-white font-bold text-xs flex items-center gap-2 shadow-xs transition ${parsedRows.length === 0 || validCount === 0 || isSaving
                ? 'bg-slate-300 cursor-not-allowed text-slate-500'
                : 'bg-emerald-700 hover:bg-emerald-800 cursor-pointer'
                }`}
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Menyimpan ke Database...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                  <span>Simpan & Import ({validCount} Santri)</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}