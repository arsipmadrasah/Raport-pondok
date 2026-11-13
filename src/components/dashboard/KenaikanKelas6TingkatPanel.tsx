import React, { useState, useMemo } from 'react';
import { GraduationCap, Save, Edit3, Download, Trash2, ArrowUpRight } from 'lucide-react';
import { normalizeTingkat } from '../../constants/initialData';
import { exportSantriAndGradesToCSV } from '../../utils/academicHelpers';

export function KenaikanKelas6TingkatPanel({
  kelasList,
  updateKelasData,
  santriList,
  activeMapels,
  nilaiList,
  selectedSemesterId,
  predikatList,
  moveSantriToKelas,
  deleteMultipleSantri,
  guruList = [],
  showToast
}) {
  const [targetMap, setTargetMap] = useState({});
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  // State Edit Nama Kelas langsung di dalam Panel Kenaikan Kelas
  const [editingRowId, setEditingRowId] = useState(null);
  const [draftNamaKelas, setDraftNamaKelas] = useState('');
  const [draftTingkat, setDraftTingkat] = useState(1);
  const [draftWali, setDraftWali] = useState('');

  const sortedKelasDesc = useMemo(() => {
    return [...kelasList]
      .filter((k) => k.isActive)
      .sort(
        (a, b) =>
          normalizeTingkat(b.tingkat, b.namaKelas) -
          normalizeTingkat(a.tingkat, a.namaKelas)
      );
  }, [kelasList]);

  const startInlineEdit = (kls) => {
    setEditingRowId(kls.id);
    setDraftNamaKelas(kls.namaKelas);
    setDraftTingkat(normalizeTingkat(kls.tingkat, kls.namaKelas));
    setDraftWali(kls.waliKelas || '');
  };

  const saveInlineEdit = async (kls) => {
    const ok = await updateKelasData(kls.id, {
      namaKelas: draftNamaKelas,
      tingkat: draftTingkat,
      waliKelas: draftWali
    });
    if (ok) {
      setEditingRowId(null);
    }
  };

  const handleChangeTingkatInline = async (kls, newLevel) => {
    await updateKelasData(kls.id, {
      namaKelas: kls.namaKelas,
      tingkat: Number(newLevel),
      waliKelas: kls.waliKelas
    });
  };

  const handleDownloadAndClearKelas6 = (kls, mode) => {
    const santriInKls = santriList.filter((s) => s.statusAktif && s.kelasId === kls.id);
    if (santriInKls.length === 0) {
      showToast(`Kelas ${kls.namaKelas} sudah kosong.`, 'warning');
      return;
    }

    if (mode === 'download') {
      exportSantriAndGradesToCSV({
        santriToExport: santriInKls,
        kelasList,
        activeMapels,
        nilaiList,
        selectedSemesterId,
        predikatList,
        filenameLabel: `Kelas6_${kls.namaKelas.replace(/\s+/g, '_')}`
      });
      showToast(`Data ${kls.namaKelas} berhasil diunduh (.CSV). Silakan hapus santrinya.`);
    } else if (mode === 'delete') {
      deleteMultipleSantri(
        santriInKls.map((s) => s.id),
        `Kelas 6 Akhir (${kls.namaKelas})`
      );
      setConfirmDeleteId(null);
    }
  };

  const handleNaikKelas = async (sourceKelas, defaultTargetId) => {
    const targetId = targetMap[sourceKelas.id] || defaultTargetId;
    if (!targetId) {
      showToast('Pilih kelas tujuan terlebih dahulu!', 'warning');
      return;
    }
    const santriInKls = santriList.filter(
      (s) => s.statusAktif && s.kelasId === sourceKelas.id
    );
    if (santriInKls.length === 0) {
      showToast(`Kelas ${sourceKelas.namaKelas} kosong.`, 'warning');
      return;
    }
    const targetKls = kelasList.find((k) => k.id === targetId);
    await moveSantriToKelas(
      santriInKls.map((s) => s.id),
      targetId,
      `Kenaikan Kelas: ${santriInKls.length} santri dari ${sourceKelas.namaKelas} naik ke ${targetKls?.namaKelas}`
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      <div className="px-4 py-3 bg-emerald-950 text-white flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <GraduationCap className="w-4 h-4 text-amber-400" />
          <h3 className="font-bold text-xs sm:text-sm">
            Panel Kenaikan Kelas (Urut dari Kelas 6 Akhir {'->'} Kelas 1)
          </h3>
        </div>
        <span className="text-[11px] text-emerald-200">
          Klik tombol <b>Edit Nama</b> pada baris kelas untuk mengganti nama kelas
        </span>
      </div>

      <div className="divide-y divide-slate-200 text-xs">
        {sortedKelasDesc.map((kls) => {
          const lv = normalizeTingkat(kls.tingkat, kls.namaKelas);
          const isKelas6 = lv === 6;
          const isEditingThis = editingRowId === kls.id;
          const santriInKls = santriList.filter(
            (s) => s.statusAktif && s.kelasId === kls.id
          );

          const nextLevelClasses = kelasList.filter(
            (k) =>
              k.isActive &&
              normalizeTingkat(k.tingkat, k.namaKelas) === lv + 1
          );
          const availableTargets =
            nextLevelClasses.length > 0
              ? nextLevelClasses
              : kelasList.filter((k) => k.isActive && k.id !== kls.id);

          const defaultTargetId = availableTargets[0]?.id || '';
          const selectedTargetId = targetMap[kls.id] || defaultTargetId;

          return (
            <div
              key={kls.id}
              className={`p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${isKelas6 ? 'bg-amber-50/70' : 'hover:bg-slate-50'
                }`}
            >
              {isEditingThis ? (
                <div className="flex flex-wrap items-center gap-2 w-full bg-slate-100 p-2.5 rounded-xl border border-slate-300">
                  <select
                    value={draftTingkat}
                    onChange={(e) => setDraftTingkat(Number(e.target.value))}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-bold text-emerald-950"
                  >
                    {[6, 5, 4, 3, 2, 1].map((tNum) => (
                      <option key={tNum} value={tNum}>
                        {tNum === 6 ? 'Tingkat 6 (Akhir)' : `Tingkat ${tNum}`}
                      </option>
                    ))}
                  </select>

                  <input
                    type="text"
                    value={draftNamaKelas}
                    onChange={(e) => setDraftNamaKelas(e.target.value)}
                    placeholder="Nama Kelas (Misal: VII A / Kelas 6)"
                    className="px-3 py-1.5 rounded-lg border border-emerald-600 bg-white font-bold text-slate-900 min-w-[160px] flex-1"
                    autoFocus
                  />

                  <select
                    value={draftWali}
                    onChange={(e) => setDraftWali(e.target.value)}
                    className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-800 min-w-[150px] flex-1 font-medium"
                  >
                    <option value="">-- Pilih Wali Kelas (dari Data Guru) --</option>
                    {guruList
                      .filter((g) => g.statusAktif)
                      .map((g) => (
                        <option key={g.id} value={g.nama}>
                          {g.nama}
                        </option>
                      ))}
                  </select>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => saveInlineEdit(kls)}
                      className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Simpan</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingRowId(null)}
                      className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 font-semibold cursor-pointer"
                    >
                      Batal
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      value={lv}
                      onChange={(e) => handleChangeTingkatInline(kls, e.target.value)}
                      title="Ubah Tingkat Kelas"
                      className={`px-2.5 py-1 rounded-lg font-extrabold text-[11px] shrink-0 cursor-pointer border ${isKelas6
                        ? 'bg-amber-500 text-emerald-950 border-amber-600'
                        : 'bg-emerald-900 text-white border-emerald-950'
                        }`}
                    >
                      {[6, 5, 4, 3, 2, 1].map((tNum) => (
                        <option key={tNum} value={tNum} className="bg-white text-slate-900">
                          {tNum === 6 ? 'Tingkat 6 (Akhir)' : `Tingkat ${tNum}`}
                        </option>
                      ))}
                    </select>

                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900">
                        Kelas {kls.namaKelas}
                      </span>
                      <button
                        type="button"
                        onClick={() => startInlineEdit(kls)}
                        className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-emerald-100 text-slate-700 hover:text-emerald-900 font-semibold flex items-center gap-1 text-[11px] border border-slate-200 cursor-pointer transition"
                        title="Edit Nama Kelas & Wali Kelas"
                      >
                        <Edit3 className="w-3 h-3 text-emerald-700" />
                        <span>Edit Nama</span>
                      </button>
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold text-[11px]">
                        {santriInKls.length} Santri
                      </span>
                    </div>
                  </div>

                  {isKelas6 ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        disabled={santriInKls.length === 0}
                        onClick={() => handleDownloadAndClearKelas6(kls, 'download')}
                        className="px-3 py-1.5 rounded-xl bg-sky-700 hover:bg-sky-800 text-white font-bold flex items-center gap-1.5 disabled:opacity-40 cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>1. Unduh CSV ({santriInKls.length})</span>
                      </button>

                      {confirmDeleteId === kls.id ? (
                        <div className="flex items-center gap-1.5 bg-rose-100 px-2.5 py-1 rounded-xl border border-rose-300">
                          <span className="text-[11px] font-bold text-rose-900">
                            Hapus {santriInKls.length} santri?
                          </span>
                          <button
                            type="button"
                            onClick={() => handleDownloadAndClearKelas6(kls, 'delete')}
                            className="px-2.5 py-1 rounded-lg bg-rose-700 text-white font-bold"
                          >
                            Ya, Hapus
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(null)}
                            className="px-2 py-1 rounded-lg bg-white text-slate-700"
                          >
                            Batal
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          disabled={santriInKls.length === 0}
                          onClick={() => setConfirmDeleteId(kls.id)}
                          className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold flex items-center gap-1.5 disabled:opacity-40 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>2. Hapus Santri Kelas 6</span>
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <select
                        value={selectedTargetId}
                        onChange={(e) =>
                          setTargetMap((prev) => ({ ...prev, [kls.id]: e.target.value }))
                        }
                        className="px-3 py-1.5 rounded-xl border border-slate-300 bg-white font-bold text-slate-800"
                      >
                        {availableTargets.map((tk) => {
                          const cnt = santriList.filter(
                            (s) => s.statusAktif && s.kelasId === tk.id
                          ).length;
                          return (
                            <option key={tk.id} value={tk.id}>
                              Naik ke {tk.namaKelas} (Tingkat {normalizeTingkat(tk.tingkat, tk.namaKelas)} • Isi: {cnt})
                            </option>
                          );
                        })}
                      </select>

                      <button
                        type="button"
                        disabled={santriInKls.length === 0 || !selectedTargetId}
                        onClick={() => handleNaikKelas(kls, defaultTargetId)}
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold flex items-center gap-1 disabled:opacity-40 cursor-pointer shrink-0"
                      >
                        <span>Naikkan</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}