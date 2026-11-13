import React, { useState, useMemo } from 'react';
import { GraduationCap, Plus, Save, Edit3, Trash2, Printer } from 'lucide-react';
import { normalizeTingkat, inferTingkatFromNama, TINGKAT_LABELS } from '../../constants/initialData';
import { SupabaseDB } from '../../services/supabase';
import { KenaikanKelas6TingkatPanel } from '../dashboard/KenaikanKelas6TingkatPanel';

export function KelasMasterView({
  kelasList,
  setKelasList,
  updateKelasData,
  santriList,
  setSantriList,
  selectedKelasId,
  setSelectedKelasId,
  activeMapels,
  nilaiList,
  selectedSemesterId,
  predikatList,
  moveSantriToKelas,
  deleteMultipleSantri,
  onNavigateToMenu,
  showToast,
  addLog,
  guruList = []
}) {
  const [namaKelas, setNamaKelas] = useState('');
  const [tingkat, setTingkat] = useState(1);
  const [waliKelas, setWaliKelas] = useState('');

  const [editingKelasId, setEditingKelasId] = useState(null);
  const [editNamaKelas, setEditNamaKelas] = useState('');
  const [editTingkat, setEditTingkat] = useState(1);
  const [editWaliKelas, setEditWaliKelas] = useState('');

  const [quickNis, setQuickNis] = useState('');
  const [quickNama, setQuickNama] = useState('');
  const [showKenaikanPanel, setShowKenaikanPanel] = useState(false);

  const sortedKelas = useMemo(
    () =>
      [...kelasList].sort(
        (a, b) =>
          normalizeTingkat(a.tingkat, a.namaKelas) -
          normalizeTingkat(b.tingkat, b.namaKelas)
      ),
    [kelasList]
  );

  const activeKelasObj =
    kelasList.find((k) => k.id === selectedKelasId) || sortedKelas[0];

  const santriInSelectedKelas = useMemo(() => {
    if (!activeKelasObj) return [];
    return santriList.filter(
      (s) => s.statusAktif && s.kelasId === activeKelasObj.id
    );
  }, [santriList, activeKelasObj]);

  const handleNamaKelasInput = (val) => {
    setNamaKelas(val);
    const guessed = inferTingkatFromNama(val, tingkat);
    if (guessed !== tingkat) setTingkat(guessed);
  };

  const handleAddKelas = async (e) => {
    e.preventDefault();
    if (!namaKelas.trim() || !waliKelas.trim()) return;
    const lv = normalizeTingkat(tingkat, namaKelas.trim());
    const newKls = {
      id: `kls-${Date.now()}`,
      namaKelas: namaKelas.trim(),
      namaArab: '',
      tingkat: lv,
      waliKelas: waliKelas.trim(),
      nipWali: `Wali Kelas Tingkat ${lv}`,
      kapasitas: 30,
      isActive: true
    };
    setKelasList((prev) => [...prev, newKls]);
    setSelectedKelasId(newKls.id);
    setNamaKelas('');
    setWaliKelas('');
    try {
      await SupabaseDB.upsert('kelas', {
        id: newKls.id,
        nama_kelas: newKls.namaKelas,
        tingkat: lv,
        wali_kelas: newKls.waliKelas,
        kapasitas: 30,
        is_active: true
      });
    } catch (_) { }
    addLog('TAMBAH_KELAS', `Menambahkan Kelas ${newKls.namaKelas} (Tingkat ${lv})`);
    showToast(`Kelas ${newKls.namaKelas} (Tingkat ${lv}) berhasil ditambahkan!`);
  };

  const handleQuickAddSantriToKelas = async (e) => {
    e.preventDefault();
    if (!activeKelasObj || !quickNis.trim() || !quickNama.trim()) return;
    const newSantri = {
      id: `snt-${Date.now()}`,
      nis: quickNis.trim(),
      nisn: '',
      namaLengkap: quickNama.trim().toUpperCase(),
      namaArab: '',
      jenisKelamin: 'L',
      tempatLahir: 'Bali',
      tanggalLahir: '2011-01-01',
      namaWali: '',
      alamat: '',
      tahunMasuk: new Date().getFullYear(),
      statusAktif: true,
      kelasId: activeKelasObj.id
    };
    setSantriList((prev) => [...prev, newSantri]);
    setQuickNis('');
    setQuickNama('');
    try {
      await SupabaseDB.upsert('santri', {
        id: newSantri.id,
        nis: newSantri.nis,
        nama_lengkap: newSantri.namaLengkap,
        jenis_kelamin: 'L',
        tahun_masuk: newSantri.tahunMasuk,
        status_aktif: true,
        kelas_id: activeKelasObj.id
      });
    } catch (_) { }
    addLog(
      'TAMBAH_SANTRI',
      `Menambahkan ${newSantri.namaLengkap} ke Kelas ${activeKelasObj.namaKelas}`
    );
    showToast(
      `${newSantri.namaLengkap} ditambahkan ke Kelas ${activeKelasObj.namaKelas}!`
    );
  };

  const startEditKelas = (k) => {
    setEditingKelasId(k.id);
    setEditNamaKelas(k.namaKelas);
    setEditTingkat(normalizeTingkat(k.tingkat, k.namaKelas));
    setEditWaliKelas(k.waliKelas);
  };

  const handleSaveEditKelas = async (k) => {
    const ok = await updateKelasData(k.id, {
      namaKelas: editNamaKelas,
      tingkat: editTingkat,
      waliKelas: editWaliKelas
    });
    if (ok) {
      setEditingKelasId(null);
    }
  };

  const handleDeleteKelas = async (k) => {
    const count = santriList.filter((s) => s.statusAktif && s.kelasId === k.id).length;
    if (count > 0) {
      showToast(
        `Kelas ${k.namaKelas} masih berisi ${count} santri! Pindahkan atau hapus santrinya terlebih dahulu.`,
        'warning'
      );
      return;
    }
    const remaining = kelasList.filter((item) => item.id !== k.id);
    setKelasList(remaining);
    if (selectedKelasId === k.id && remaining.length > 0) {
      setSelectedKelasId(remaining[0].id);
    }
    try {
      await SupabaseDB.deleteById('kelas', k.id);
    } catch (_) { }
    showToast(`Kelas ${k.namaKelas} berhasil dihapus.`);
  };

  return (
    <div className="space-y-4">
      <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="font-bold text-sm text-slate-900">
              Manajemen Kelas (6 Tingkat) & Edit Nama Kelas
            </h3>
            <p className="text-[11px] text-slate-500">
              Klik tombol <b>Edit Nama Kelas</b> pada kartu kelas mana pun untuk mengubah nama kelas, tingkat, atau wali kelas.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowKenaikanPanel((prev) => !prev)}
            className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-emerald-950 font-extrabold text-xs flex items-center gap-1.5 cursor-pointer"
          >
            <GraduationCap className="w-4 h-4" />
            <span>
              {showKenaikanPanel ? 'Tutup Panel Kenaikan Kelas' : 'Panel Kenaikan Kelas (6 -> 1)'}
            </span>
          </button>
        </div>

        <form
          onSubmit={handleAddKelas}
          className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 text-xs pt-1"
        >
          <input
            type="text"
            value={namaKelas}
            onChange={(e) => handleNamaKelasInput(e.target.value)}
            placeholder="Nama Kelas Baru (Misal: Kelas 6 / XII B)"
            className="px-3 py-2 rounded-xl border border-slate-300 font-bold"
            required
          />
          <select
            value={tingkat}
            onChange={(e) => setTingkat(Number(e.target.value))}
            className="px-3 py-2 rounded-xl border border-slate-300 font-bold text-emerald-950"
          >
            {[1, 2, 3, 4, 5, 6].map((lv) => (
              <option key={lv} value={lv}>
                {TINGKAT_LABELS[lv]}
              </option>
            ))}
          </select>
          <select
            value={waliKelas}
            onChange={(e) => setWaliKelas(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-300 font-medium text-slate-800 bg-white"
            required
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
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Kelas</span>
          </button>
        </form>
      </div>

      {showKenaikanPanel && (
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
          guruList={guruList}
          showToast={showToast}
        />
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {sortedKelas.map((k) => {
          const count = santriList.filter(
            (s) => s.statusAktif && s.kelasId === k.id
          ).length;
          const lv = normalizeTingkat(k.tingkat, k.namaKelas);
          const isEditing = editingKelasId === k.id;
          const isSelected = activeKelasObj?.id === k.id;

          return (
            <div
              key={k.id}
              onClick={() => !isEditing && setSelectedKelasId(k.id)}
              className={`p-4 rounded-2xl border transition cursor-pointer space-y-2.5 ${isSelected
                ? 'bg-emerald-50/70 border-2 border-emerald-700 shadow-xs'
                : 'bg-white border-slate-200 hover:border-emerald-400'
                }`}
            >
              {isEditing ? (
                <div className="space-y-2.5 text-xs bg-white p-3 rounded-xl border border-emerald-500" onClick={(e) => e.stopPropagation()}>
                  <div className="font-bold text-emerald-900">Edit Nama Kelas & Tingkat:</div>
                  <div>
                    <label className="text-[10px] font-semibold text-slate-500">Nama Kelas</label>
                    <input
                      type="text"
                      value={editNamaKelas}
                      onChange={(e) => setEditNamaKelas(e.target.value)}
                      placeholder="Contoh: VII A / Kelas 6"
                      className="w-full mt-0.5 px-3 py-1.5 rounded-lg border border-slate-300 font-bold bg-white text-slate-900"
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-slate-500">Tingkat (1 - 6)</label>
                    <select
                      value={editTingkat}
                      onChange={(e) => setEditTingkat(Number(e.target.value))}
                      className="w-full mt-0.5 px-3 py-1.5 rounded-lg border border-slate-300 font-bold bg-white text-slate-900"
                    >
                      {[1, 2, 3, 4, 5, 6].map((n) => (
                        <option key={n} value={n}>
                          {TINGKAT_LABELS[n]}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-slate-500">Wali Kelas (dari Data Guru)</label>
                    <select
                      value={editWaliKelas}
                      onChange={(e) => setEditWaliKelas(e.target.value)}
                      className="w-full mt-0.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-900 font-medium"
                    >
                      <option value="">-- Pilih Wali Kelas --</option>
                      {guruList
                        .filter((g) => g.statusAktif)
                        .map((g) => (
                          <option key={g.id} value={g.nama}>
                            {g.nama}
                          </option>
                        ))}
                    </select>
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setEditingKelasId(null)}
                      className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 font-semibold cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSaveEditKelas(k)}
                      className="px-3.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Simpan Kelas</span>
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span
                        className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded ${lv === 6
                          ? 'bg-amber-500 text-emerald-950'
                          : 'bg-emerald-950 text-amber-300'
                          }`}
                      >
                        {lv === 6 ? 'Tingkat 6 (Akhir)' : `Tingkat ${lv}`}
                      </span>
                      <div className="font-extrabold text-base text-slate-900 mt-1">
                        Kelas {k.namaKelas}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => startEditKelas(k)}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-emerald-100 text-slate-800 hover:text-emerald-900 font-bold text-[11px] flex items-center gap-1 border border-slate-200 cursor-pointer"
                        title="Edit Nama Kelas"
                      >
                        <Edit3 className="w-3 h-3 text-emerald-700" />
                        <span>Edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteKelas(k)}
                        className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 cursor-pointer"
                        title="Hapus Kelas"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-600 pt-1">
                    <span className="truncate">
                      Wali: <b>{k.waliKelas}</b>
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-white text-emerald-800 font-bold border border-emerald-200 shrink-0">
                      {count} Santri
                    </span>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {activeKelasObj && (
        <div className="bg-white rounded-2xl border-2 border-emerald-700/40 overflow-hidden shadow-xs">
          <div className="p-4 bg-emerald-950 text-white flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-amber-500 text-emerald-950">
                  Tingkat {normalizeTingkat(activeKelasObj.tingkat, activeKelasObj.namaKelas)} Aktif Dipilih
                </span>
                <button
                  type="button"
                  onClick={() => startEditKelas(activeKelasObj)}
                  className="px-2.5 py-0.5 rounded bg-white/15 hover:bg-white/25 text-white text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Edit3 className="w-3 h-3 text-amber-300" />
                  <span>Edit Nama Kelas Ini</span>
                </button>
              </div>
              <h4 className="font-extrabold text-sm sm:text-base mt-1">
                Kelas {activeKelasObj.namaKelas} — Wali: {activeKelasObj.waliKelas} ({santriInSelectedKelas.length} Santri)
              </h4>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              <button
                type="button"
                onClick={() => onNavigateToMenu('santri', activeKelasObj.id)}
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold"
              >
                Buka di Data Santri
              </button>
              <button
                type="button"
                onClick={() => onNavigateToMenu('input-nilai', activeKelasObj.id)}
                className="px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold"
              >
                Input Nilai Kelas Ini
              </button>
              <button
                type="button"
                onClick={() => onNavigateToMenu('rekap-nilai', activeKelasObj.id)}
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold"
              >
                Rekap Nilai
              </button>
              <button
                type="button"
                onClick={() => onNavigateToMenu('cetak-rapor', activeKelasObj.id)}
                className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-emerald-950 font-extrabold flex items-center gap-1"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak Rapor</span>
              </button>
            </div>
          </div>

          <form
            onSubmit={handleQuickAddSantriToKelas}
            className="p-3.5 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 text-xs"
          >
            <span className="font-bold text-slate-700 shrink-0">
              + Tambah Santri ke Kelas {activeKelasObj.namaKelas}:
            </span>
            <input
              type="text"
              value={quickNis}
              onChange={(e) => setQuickNis(e.target.value)}
              placeholder="NIS Santri"
              className="px-3 py-1.5 rounded-xl border border-slate-300 bg-white w-full sm:w-40"
              required
            />
            <input
              type="text"
              value={quickNama}
              onChange={(e) => setQuickNama(e.target.value)}
              placeholder="Nama Lengkap Santri"
              className="px-3 py-1.5 rounded-xl border border-slate-300 bg-white flex-1"
              required
            />
            <button
              type="submit"
              className="px-4 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold shrink-0"
            >
              Simpan ke {activeKelasObj.namaKelas}
            </button>
          </form>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                <tr>
                  <th className="py-2.5 px-4 text-left w-12">No</th>
                  <th className="py-2.5 px-4 text-left">NIS</th>
                  <th className="py-2.5 px-4 text-left">Nama Santri</th>
                  <th className="py-2.5 px-4 text-left">Pindahkan ke Kelas Lain</th>
                  <th className="py-2.5 px-4 text-right">Hapus</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {santriInSelectedKelas.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-400">
                      Kelas {activeKelasObj.namaKelas} saat ini kosong.
                    </td>
                  </tr>
                ) : (
                  santriInSelectedKelas.map((s, idx) => (
                    <tr key={s.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-4 font-mono">{idx + 1}</td>
                      <td className="py-2.5 px-4 font-mono">{s.nis}</td>
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
                              `Memindahkan ${s.namaLengkap} dari Kelas ${activeKelasObj.namaKelas}`
                            )
                          }
                          className="px-3 py-1 rounded-xl border border-slate-300 bg-white font-bold text-slate-800 cursor-pointer"
                        >
                          {sortedKelas.map((tk) => (
                            <option key={tk.id} value={tk.id}>
                              Tingkat {normalizeTingkat(tk.tingkat, tk.namaKelas)} — Kelas {tk.namaKelas}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() =>
                            deleteMultipleSantri([s.id], s.namaLengkap)
                          }
                          className="text-rose-600 hover:text-rose-800 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}