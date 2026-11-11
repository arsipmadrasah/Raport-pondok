import React, { useState, useMemo, useEffect } from 'react';
import {
  GraduationCap,
  ArrowUpRight,
  Users,
  Download,
  FileSpreadsheet,
  Plus,
  CheckSquare,
  Square,
  Trash2,
  Search,
  Edit3
} from 'lucide-react';
import { normalizeTingkat } from '../../constants/initialData';
import { toRomanClass, getTingkatBadgeStyle, exportSantriAndGradesToCSV } from '../../utils/academicHelpers';
import { SupabaseDB } from '../../services/supabase';
import { KenaikanKelas6TingkatPanel } from '../dashboard/KenaikanKelas6TingkatPanel';
import { ImportSantriExcelModal, downloadSantriExcelTemplate } from './ImportSantriExcelModal';

export function SantriMasterView({
  santriList,
  setSantriList,
  kelasList,
  setKelasList,
  updateKelasData,
  selectedKelasId,
  setSelectedKelasId,
  activeMapels,
  nilaiList,
  selectedSemesterId,
  predikatList,
  moveSantriToKelas,
  deleteMultipleSantri,
  showToast,
  addLog
}) {
  const [search, setSearch] = useState('');
  const [filterKelasId, setFilterKelasId] = useState(selectedKelasId || 'ALL');
  const [showPromotionWizard, setShowPromotionWizard] = useState(true);
  const [showImportModal, setShowImportModal] = useState(false);

  useEffect(() => {
    if (selectedKelasId) {
      setFilterKelasId(selectedKelasId);
      setKelasId(selectedKelasId);
    }
  }, [selectedKelasId]);

  const [namaLengkap, setNamaLengkap] = useState('');
  const [nis, setNis] = useState('');
  const [namaArab, setNamaArab] = useState('');
  const [kelasId, setKelasId] = useState(selectedKelasId || kelasList[0]?.id || 'kls-7a');

  const [checkedSantriIds, setCheckedSantriIds] = useState([]);
  const [bulkTargetKelasId, setBulkTargetKelasId] = useState(kelasList[0]?.id || 'kls-8a');

  const sortedKelasList = useMemo(
    () =>
      [...kelasList].sort(
        (a, b) =>
          normalizeTingkat(a.tingkat, a.namaKelas) -
          normalizeTingkat(b.tingkat, b.namaKelas)
      ),
    [kelasList]
  );

  const filtered = useMemo(() => {
    return santriList.filter((s) => {
      if (!s.statusAktif) return false;
      const matchKelas = filterKelasId === 'ALL' || s.kelasId === filterKelasId;
      const matchSearch =
        s.namaLengkap.toLowerCase().includes(search.toLowerCase()) ||
        s.nis.includes(search);
      return matchKelas && matchSearch;
    });
  }, [santriList, filterKelasId, search]);

  const handleToggleCheckSantri = (id) => {
    setCheckedSantriIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllFiltered = () => {
    if (checkedSantriIds.length === filtered.length && filtered.length > 0) {
      setCheckedSantriIds([]);
    } else {
      setCheckedSantriIds(filtered.map((s) => s.id));
    }
  };

  const handleBulkMoveSantri = async () => {
    if (checkedSantriIds.length === 0) {
      showToast('Centang minimal 1 santri yang ingin dipindahkan!', 'warning');
      return;
    }
    await moveSantriToKelas(checkedSantriIds, bulkTargetKelasId);
    setCheckedSantriIds([]);
  };

  const handleAddSantri = async (e) => {
    e.preventDefault();
    if (!namaLengkap.trim()) return;

    const currentYear = new Date().getFullYear();
    const existingNisNums = santriList
      .map((s) => parseInt(s.nis))
      .filter((n) => !isNaN(n) && n > 200000000);
    const assignedNis =
      nis.trim() ||
      (existingNisNums.length > 0
        ? String(Math.max(...existingNisNums) + 1)
        : `${currentYear}07${String(santriList.length + 1).padStart(3, '0')}`);

    const newSantri = {
      id: `snt-${Date.now()}`,
      nis: assignedNis,
      nisn: '',
      namaLengkap: namaLengkap.trim().toUpperCase(),
      namaArab: '',
      jenisKelamin: 'L',
      tempatLahir: 'Bali',
      tanggalLahir: '2011-01-01',
      namaWali: '',
      alamat: '',
      tahunMasuk: currentYear,
      statusAktif: true,
      kelasId
    };

    setSantriList((prev) => [...prev, newSantri]);
    setNamaLengkap('');
    setNis('');
    setNamaArab('');

    try {
      await SupabaseDB.upsert('santri', {
        id: newSantri.id,
        nis: newSantri.nis,
        nama_lengkap: newSantri.namaLengkap,
        nama_arab: '',
        jenis_kelamin: newSantri.jenisKelamin,
        tahun_masuk: newSantri.tahunMasuk,
        status_aktif: true,
        kelas_id: newSantri.kelasId
      });
    } catch (_) { }

    addLog('TAMBAH_SANTRI', `Menambahkan santri ${newSantri.namaLengkap}`);
    showToast(`Santri ${newSantri.namaLengkap} berhasil ditambahkan!`);
  };

  const handleDelete = async (id, nama) => {
    setSantriList((prev) => prev.filter((s) => s.id !== id));
    setCheckedSantriIds((prev) => prev.filter((item) => item !== id));
    try {
      await SupabaseDB.deleteById('santri', id);
    } catch (_) { }
    addLog('HAPUS_SANTRI', `Menghapus santri ${nama}`);
    showToast(`Santri ${nama} dihapus.`);
  };

  const currentFilteredKelasObj = kelasList.find((k) => k.id === filterKelasId);

  return (
    <div className="space-y-4">
      <div className="bg-emerald-950 text-white p-3.5 rounded-2xl flex flex-wrap items-center justify-between gap-2 shadow-xs">
        <div className="flex items-center gap-2.5">
          <GraduationCap className="w-5 h-5 text-amber-400 shrink-0" />
          <span className="font-bold text-xs sm:text-sm">
            Kenaikan Kelas, Edit Nama Kelas & Pindah Kelas Santri
          </span>
        </div>

        <button
          type="button"
          onClick={() => setShowPromotionWizard((prev) => !prev)}
          className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-emerald-950 font-extrabold text-xs flex items-center gap-1.5 cursor-pointer"
        >
          <ArrowUpRight className="w-4 h-4" />
          <span>
            {showPromotionWizard ? 'Tutup Panel Kenaikan Kelas' : 'Panel Kenaikan Kelas'}
          </span>
        </button>
      </div>

      {showPromotionWizard && (
        <KenaikanKelas6TingkatPanel
          kelasList={kelasList}
          updateKelasData={updateKelasData}
          santriList={santriList}
          activeMapels={activeMapels}
          nilaiList={nilaiList}
          selectedSemesterId={selectedSemesterId}
          predikatList={predikatList}
          moveSantriToKelas={moveSantriToKelas}
          deleteMultipleSantri={deleteMultipleSantri}
          showToast={showToast}
        />
      )}

      {/* TOOLBAR IMPORT & AKSI DATA SANTRI */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-2.5 text-xs shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold shrink-0">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-xs sm:text-sm">Manajemen & Input Santri</h3>
            <p className="text-[11px] text-slate-500">
              Input manual atau import massal seluruh data santri via file spreadsheet Excel (.xlsx / .xls)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => downloadSantriExcelTemplate(kelasList)}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
            title="Download template Excel untuk format data santri"
          >
            <Download className="w-4 h-4 text-emerald-700" />
            <span>Format Excel</span>
          </button>

          <button
            type="button"
            onClick={() => setShowImportModal(true)}
            className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center gap-2 shadow-xs transition cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
            <span>Import Data Santri (Excel)</span>
          </button>
        </div>
      </div>

      {/* FORM TAMBAH SANTRI BARU */}
      <form
        onSubmit={handleAddSantri}
        className="bg-white p-4 rounded-2xl border border-slate-200 grid grid-cols-1 sm:grid-cols-12 gap-2.5 text-xs items-center"
      >
        <input
          type="text"
          value={namaLengkap}
          onChange={(e) => setNamaLengkap(e.target.value)}
          placeholder="Nama Lengkap Santri..."
          className="px-3.5 py-2.5 rounded-xl border border-slate-300 sm:col-span-5 font-semibold text-slate-800"
          required
        />
        <input
          type="text"
          value={nis}
          onChange={(e) => setNis(e.target.value)}
          placeholder="NIS (Opsional / Otomatis)"
          className="px-3.5 py-2.5 rounded-xl border border-slate-300 sm:col-span-3 font-mono text-slate-700"
        />
        <select
          value={kelasId}
          onChange={(e) => setKelasId(e.target.value)}
          className="px-3.5 py-2.5 rounded-xl border border-slate-300 font-semibold sm:col-span-2 text-slate-800"
        >
          {sortedKelasList.map((k) => (
            <option key={k.id} value={k.id}>
              Tingkat {normalizeTingkat(k.tingkat, k.namaKelas)} — {k.namaKelas}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold flex items-center justify-center gap-1.5 sm:col-span-2 cursor-pointer shadow-xs transition"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Santri</span>
        </button>
      </form>

      {/* FILTER PER KELAS */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 flex items-center gap-2 overflow-x-auto text-xs">
        <button
          type="button"
          onClick={() => {
            setFilterKelasId('ALL');
            setCheckedSantriIds([]);
          }}
          className={`px-3 py-1.5 rounded-xl font-bold shrink-0 transition ${filterKelasId === 'ALL'
            ? 'bg-emerald-900 text-white'
            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
        >
          Semua ({santriList.filter((s) => s.statusAktif).length})
        </button>
        {sortedKelasList.map((k) => {
          const count = santriList.filter(
            (s) => s.statusAktif && s.kelasId === k.id
          ).length;
          const active = filterKelasId === k.id;
          return (
            <button
              key={k.id}
              type="button"
              onClick={() => {
                setFilterKelasId(k.id);
                setSelectedKelasId(k.id);
                setKelasId(k.id);
                setCheckedSantriIds([]);
              }}
              className={`px-3 py-1.5 rounded-xl font-bold shrink-0 transition flex items-center gap-1.5 ${active
                ? 'bg-emerald-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
            >
              <span>{k.namaKelas}</span>
              <span className="opacity-75">({count})</span>
            </button>
          );
        })}
      </div>

      {/* BARIS PINDAH KELAS MASSAL SAAT SANTRI DICENTANG */}
      {checkedSantriIds.length > 0 && (
        <div className="bg-amber-50 border border-amber-400 p-3 rounded-2xl flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="font-bold text-amber-950">
            {checkedSantriIds.length} Santri Dipilih:
          </span>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={bulkTargetKelasId}
              onChange={(e) => setBulkTargetKelasId(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-amber-400 bg-white font-bold text-slate-900"
            >
              {sortedKelasList.map((k) => (
                <option key={k.id} value={k.id}>
                  Ke Kelas {k.namaKelas} (Tingkat {normalizeTingkat(k.tingkat, k.namaKelas)})
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={handleBulkMoveSantri}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold cursor-pointer"
            >
              Pindahkan Kelas
            </button>

            <button
              type="button"
              onClick={() => {
                deleteMultipleSantri(checkedSantriIds, 'Santri Terpilih');
                setCheckedSantriIds([]);
              }}
              className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold cursor-pointer"
            >
              Hapus ({checkedSantriIds.length})
            </button>
          </div>
        </div>
      )}

      {/* TABEL DAFTAR SANTRI */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-bold text-sm">
            {currentFilteredKelasObj
              ? `Santri Kelas ${currentFilteredKelasObj.namaKelas} (${filtered.length})`
              : `Semua Santri (${filtered.length})`}
          </h3>

          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama/NIS..."
            className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs w-48 sm:w-60"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
              <tr>
                <th className="py-3 px-3 text-center w-10">
                  <button
                    type="button"
                    onClick={handleSelectAllFiltered}
                    className="p-1 rounded hover:bg-slate-200"
                  >
                    {checkedSantriIds.length === filtered.length &&
                      filtered.length > 0 ? (
                      <CheckSquare className="w-4 h-4 text-emerald-700" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400" />
                    )}
                  </button>
                </th>
                <th className="py-3 px-3 text-left">NIS</th>
                <th className="py-3 px-4 text-left">Nama Lengkap Santri</th>
                <th className="py-3 px-4 text-left">Kelas Saat Ini / Pindah Kelas</th>
                <th className="py-3 px-4 text-right">Hapus</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    Belum ada santri di kelas ini.
                  </td>
                </tr>
              ) : (
                filtered.map((s) => {
                  const kls = kelasList.find((k) => k.id === s.kelasId);
                  const isChecked = checkedSantriIds.includes(s.id);

                  return (
                    <tr
                      key={s.id}
                      className={`hover:bg-slate-50 ${isChecked ? 'bg-amber-50/50' : ''
                        }`}
                    >
                      <td className="py-2.5 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleCheckSantri(s.id)}
                          className="p-1"
                        >
                          {isChecked ? (
                            <CheckSquare className="w-4 h-4 text-emerald-700" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-400" />
                          )}
                        </button>
                      </td>
                      <td className="py-2.5 px-3 font-mono">{s.nis}</td>
                      <td className="py-2.5 px-4 font-bold text-slate-900">
                        {s.namaLengkap}
                      </td>
                      <td className="py-2.5 px-4">
                        <select
                          value={s.kelasId}
                          onChange={(e) =>
                            moveSantriToKelas(
                              [s.id],
                              e.target.value,
                              `Memindahkan ${s.namaLengkap} dari ${kls?.namaKelas}`
                            )
                          }
                          className="px-3 py-1.5 rounded-xl border border-slate-300 bg-white font-bold text-slate-800 cursor-pointer"
                        >
                          {sortedKelasList.map((targetK) => (
                            <option key={targetK.id} value={targetK.id}>
                              Tingkat {normalizeTingkat(targetK.tingkat, targetK.namaKelas)} — Kelas{' '}
                              {targetK.namaKelas}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <button
                          onClick={() => handleDelete(s.id, s.namaLengkap)}
                          className="text-rose-600 hover:text-rose-800 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL IMPORT DATA SANTRI DARI EXCEL */}
      <ImportSantriExcelModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        kelasList={kelasList}
        santriList={santriList}
        setSantriList={setSantriList}
        selectedKelasId={filterKelasId !== 'ALL' ? filterKelasId : selectedKelasId}
        showToast={showToast}
        addLog={addLog}
      />
    </div>
  );
}