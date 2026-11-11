import React, { useState, useMemo } from 'react';
import {
  GraduationCap,
  Plus,
  Edit3,
  Trash2,
  Search,
  BookOpen,
  CheckCircle2,
  X,
  Save,
  Check,
  UserCheck,
  Layers,
  RefreshCw
} from 'lucide-react';
import { GuruItem } from '../../constants/initialData';
import { SupabaseDB } from '../../services/supabase';

interface GuruMasterViewProps {
  guruList: GuruItem[];
  setGuruList: React.Dispatch<React.SetStateAction<GuruItem[]>>;
  mapelList: any[];
  kelasList?: any[];
  showToast: (msg: string, type?: 'success' | 'warning' | 'error') => void;
  addLog?: (aksi: string, deskripsi: string) => void;
}

export function GuruMasterView({
  guruList,
  setGuruList,
  mapelList,
  kelasList = [],
  showToast,
  addLog
}: GuruMasterViewProps) {
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGuru, setEditingGuru] = useState<GuruItem | null>(null);

  // Form State
  const [formNama, setFormNama] = useState('');
  const [formMapelIds, setFormMapelIds] = useState<string[]>([]);
  const [formKelasIds, setFormKelasIds] = useState<string[]>([]);
  const [formStatusAktif, setFormStatusAktif] = useState(true);

  // Map mapel by id for quick lookup
  const mapelMap = useMemo(() => {
    const map = new Map<string, any>();
    mapelList.forEach((m) => map.set(m.id, m));
    return map;
  }, [mapelList]);

  // Map kelas by id for quick lookup
  const kelasMap = useMemo(() => {
    const map = new Map<string, any>();
    kelasList.forEach((k) => map.set(k.id, k));
    return map;
  }, [kelasList]);

  // Active mapels available for teaching
  const activeMapelList = useMemo(() => {
    return mapelList.filter((m) => m.statusAktif);
  }, [mapelList]);

  // Active kelas available for teaching
  const activeKelasList = useMemo(() => {
    return kelasList.filter((k) => k.isActive);
  }, [kelasList]);

  // Filtered guru list
  const filteredGuru = useMemo(() => {
    return guruList.filter((g) => {
      const q = search.toLowerCase().trim();
      if (!q) return true;
      const matchName = g.nama.toLowerCase().includes(q);
      const matchMapel = g.mapelIds.some((mId) => {
        const m = mapelMap.get(mId);
        return m ? m.namaLatin.toLowerCase().includes(q) || m.namaArab.includes(q) : false;
      });
      const matchKelas = (g.kelasIds || []).some((kId) => {
        const k = kelasMap.get(kId);
        return k ? k.namaKelas.toLowerCase().includes(q) : false;
      });
      return matchName || matchMapel || matchKelas;
    });
  }, [guruList, search, mapelMap, kelasMap]);

  // Statistics
  const stats = useMemo(() => {
    const total = guruList.length;
    const active = guruList.filter((g) => g.statusAktif).length;
    const totalMapelAssigned = new Set(guruList.flatMap((g) => g.mapelIds)).size;
    return { total, active, totalMapelAssigned };
  }, [guruList]);

  // Open modal for add
  const handleOpenAddModal = () => {
    setEditingGuru(null);
    setFormNama('');
    setFormMapelIds([]);
    setFormKelasIds([]);
    setFormStatusAktif(true);
    setIsModalOpen(true);
  };

  // Open modal for edit
  const handleOpenEditModal = (guru: GuruItem) => {
    setEditingGuru(guru);
    setFormNama(guru.nama);
    setFormMapelIds([...guru.mapelIds]);
    setFormKelasIds([...(guru.kelasIds || [])]);
    setFormStatusAktif(guru.statusAktif);
    setIsModalOpen(true);
  };

  // Toggle mapel checkbox in form
  const handleToggleMapel = (mapelId: string) => {
    setFormMapelIds((prev) =>
      prev.includes(mapelId)
        ? prev.filter((id) => id !== mapelId)
        : [...prev, mapelId]
    );
  };

  // Toggle kelas checkbox in form
  const handleToggleKelas = (kelasId: string) => {
    setFormKelasIds((prev) =>
      prev.includes(kelasId)
        ? prev.filter((id) => id !== kelasId)
        : [...prev, kelasId]
    );
  };

  // Save guru
  const handleSaveGuru = async (e: React.FormEvent) => {
    e.preventDefault();
    const namaTrim = formNama.trim();
    if (!namaTrim) {
      showToast('Nama guru/ustadz wajib diisi!', 'warning');
      return;
    }

    let targetGuru: GuruItem;
    let updated: GuruItem[];

    if (editingGuru) {
      // Edit existing
      targetGuru = {
        ...editingGuru,
        nama: namaTrim,
        mapelIds: formMapelIds,
        kelasIds: formKelasIds,
        statusAktif: formStatusAktif
      };
      updated = guruList.map((g) => (g.id === editingGuru.id ? targetGuru : g));
      setGuruList(updated);
      try {
        localStorage.setItem('rapor_guru_list', JSON.stringify(updated));
      } catch (_) {}
      showToast(`Data guru ${namaTrim} berhasil diperbarui!`, 'success');
      if (addLog) addLog('EDIT_GURU', `Memperbarui data guru ${namaTrim}`);
    } else {
      // Add new
      targetGuru = {
        id: `guru-${Date.now()}`,
        nama: namaTrim,
        mapelIds: formMapelIds,
        kelasIds: formKelasIds,
        statusAktif: formStatusAktif
      };
      updated = [...guruList, targetGuru];
      setGuruList(updated);
      try {
        localStorage.setItem('rapor_guru_list', JSON.stringify(updated));
      } catch (_) {}
      showToast(`Guru ${namaTrim} berhasil ditambahkan!`, 'success');
      if (addLog) addLog('TAMBAH_GURU', `Menambahkan guru baru ${namaTrim}`);
    }

    // Persist to Supabase
    try {
      await SupabaseDB.upsert('guru', {
        id: targetGuru.id,
        nama: targetGuru.nama,
        mapel_ids: targetGuru.mapelIds || [],
        kelas_ids: targetGuru.kelasIds || [],
        status_aktif: targetGuru.statusAktif ?? true
      });
    } catch (err: any) {
      console.warn('Gagal menyimpan ke tabel guru di Supabase:', err);
    }

    setIsModalOpen(false);
  };

  // Delete guru (Permanen dari Supabase & Local)
  const handleDeleteGuru = async (guru: GuruItem) => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus data guru "${guru.nama}" secara permanen?`)) {
      return;
    }

    // 1. Optimistic update local state & storage
    const updated = guruList.filter((g) => g.id !== guru.id);
    setGuruList(updated);
    try {
      localStorage.setItem('rapor_guru_list', JSON.stringify(updated));
    } catch (_) {}

    // 2. Persist deletion to Supabase
    try {
      await SupabaseDB.deleteById('guru', guru.id);
      showToast(`Data guru ${guru.nama} berhasil dihapus permanen dari Supabase!`, 'success');
    } catch (err: any) {
      console.warn('Gagal menghapus dari Supabase:', err);
      showToast(`Data ${guru.nama} dihapus dari sesi lokal (Catatan: Tabel 'guru' belum dibuat di Supabase).`, 'warning');
    }

    if (addLog) addLog('HAPUS_GURU', `Menghapus data guru ${guru.nama}`);
  };

  // Sync / Push all current guru to Supabase
  const handleSyncAllToSupabase = async () => {
    try {
      const payload = guruList.map((g) => ({
        id: g.id,
        nama: g.nama,
        mapel_ids: g.mapelIds || [],
        kelas_ids: g.kelasIds || [],
        status_aktif: g.statusAktif ?? true
      }));
      await SupabaseDB.upsert('guru', payload);
      showToast(`Berhasil menyinkronkan ${guruList.length} data guru ke database Supabase!`, 'success');
    } catch (err: any) {
      showToast(`Gagal menyinkronkan ke Supabase: ${err.message || 'Tabel belum ada'}`, 'error');
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* HEADER STATISTIK GURU */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Total Guru / Penguji
            </span>
            <div className="text-2xl font-black text-slate-900 mt-0.5">
              {stats.total}
            </div>
            <p className="text-[11px] text-slate-500">Ustadz & Ustadzah terdaftar</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
            <GraduationCap className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Guru Aktif Mengajar
            </span>
            <div className="text-2xl font-black text-emerald-800 mt-0.5">
              {stats.active}
            </div>
            <p className="text-[11px] text-emerald-700 font-medium">Siap menguji & menilai</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-100/70 text-emerald-800 flex items-center justify-center font-bold">
            <UserCheck className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Mapel Terdistribusi
            </span>
            <div className="text-2xl font-black text-amber-700 mt-0.5">
              {stats.totalMapelAssigned}
            </div>
            <p className="text-[11px] text-slate-500">Kitab yang memiliki pengajar</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
            <BookOpen className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* BILAH AKSI & PENCARIAN */}
      <div className="bg-white rounded-2xl border border-slate-200 p-3.5 sm:p-4 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nama guru atau mata pelajaran..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-8 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm font-medium focus:ring-2 focus:ring-emerald-600 focus:outline-none"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
            >
              ✕
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSyncAllToSupabase}
            className="px-3 py-2.5 rounded-xl border border-emerald-200 bg-emerald-50/70 hover:bg-emerald-100 active:scale-98 text-emerald-900 font-bold text-xs flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
            title="Simpan & sinkronkan seluruh daftar guru saat ini ke database Supabase"
          >
            <RefreshCw className="w-3.5 h-3.5 text-emerald-700" />
            <span className="hidden sm:inline">Sinkron ke Supabase</span>
          </button>

          <button
            type="button"
            onClick={handleOpenAddModal}
            className="px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 active:scale-98 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Guru Baru</span>
          </button>
        </div>
      </div>

      {/* TABEL DATA GURU & MAPEL YANG DIAJARKAN */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 text-slate-700 font-bold border-b border-slate-200">
                <th className="py-3 px-3 w-12 text-center">No</th>
                <th className="py-3 px-4 min-w-[200px]">Nama Guru / Ustadz</th>
                <th className="py-3 px-4 min-w-[280px]">Mata Pelajaran (Kitab) yang Diajarkan</th>
                <th className="py-3 px-4 min-w-[220px]">Kelas / Rombel yang Diampu</th>
                <th className="py-3 px-3 w-24 text-center">Status</th>
                <th className="py-3 px-3 w-28 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredGuru.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 font-medium">
                    {search ? 'Tidak ada guru yang cocok dengan pencarian.' : 'Belum ada data guru terdaftar.'}
                  </td>
                </tr>
              ) : (
                filteredGuru.map((guru, index) => {
                  return (
                    <tr
                      key={guru.id}
                      className="hover:bg-slate-50/60 transition group"
                    >
                      <td className="py-3 px-3 text-center font-bold text-slate-400">
                        {index + 1}
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-900 text-xs sm:text-sm">
                          {guru.nama}
                        </span>
                      </td>

                      {/* BADGE MAPEL YANG DIAJARKAN */}
                      <td className="py-3 px-4">
                        {guru.mapelIds && guru.mapelIds.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {guru.mapelIds.map((mapelId) => {
                              const mapel = mapelMap.get(mapelId);
                              if (!mapel) return null;
                              return (
                                <span
                                  key={mapelId}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-900 border border-emerald-200 text-[11px] font-semibold"
                                >
                                  <span>{mapel.namaLatin}</span>
                                  {mapel.namaArab && (
                                    <span className="text-emerald-700/80 font-arabic text-xs">
                                      ({mapel.namaArab})
                                    </span>
                                  )}
                                </span>
                              );
                            })}
                          </div>
                        ) : (
                          <span className="text-rose-600 font-medium text-[11px] bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                            Belum ditentukan mapel
                          </span>
                        )}
                      </td>

                      {/* BADGE KELAS YANG DIAMPU */}
                      <td className="py-3 px-4">
                        {guru.kelasIds && guru.kelasIds.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {guru.kelasIds.map((kelasId) => {
                              const kls = kelasMap.get(kelasId);
                              if (!kls) return null;
                              return (
                                <span
                                  key={kelasId}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-sky-50 text-sky-900 border border-sky-200 text-[11px] font-semibold"
                                >
                                  <span>Kelas {kls.namaKelas}</span>
                                </span>
                              );
                            })}
                          </div>
                        ) : (
                          <span className="text-slate-400 font-medium text-[11px] italic">
                            Semua Kelas Aktif
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-center">
                        {guru.statusAktif ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                            Aktif
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-600 font-bold text-[10px]">
                            Nonaktif
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(guru)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-emerald-100 text-slate-600 hover:text-emerald-800 transition cursor-pointer"
                            title="Edit Guru & Mapel"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteGuru(guru)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-100 text-slate-600 hover:text-rose-700 transition cursor-pointer"
                            title="Hapus Data Guru"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL TAMBAH / EDIT GURU */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            {/* Modal Header */}
            <div className="px-5 py-4 bg-gradient-to-r from-emerald-900 to-[#064E3B] text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-amber-300 font-bold">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base leading-tight">
                    {editingGuru ? 'Edit Data Guru & Mapel' : 'Tambah Guru Baru'}
                  </h3>
                  <p className="text-[11px] text-emerald-200">
                    Tetapkan mata pelajaran (kitab) yang diajarkan oleh guru
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form Content */}
            <form onSubmit={handleSaveGuru} className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs">
              {/* Nama Guru */}
              <div className="space-y-1">
                <label className="font-bold text-slate-800 block">
                  Nama Lengkap Guru / Ustadz <span className="text-rose-500">*</span>:
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Ust. Ahmad Zaki, S.Pd.I"
                  value={formNama}
                  onChange={(e) => setFormNama(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  autoFocus
                />
              </div>

              {/* Pilihan Mata Pelajaran yang Diajarkan */}
              <div className="space-y-2 pt-2 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-900 flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-emerald-700" />
                    <span>Mata Pelajaran (Kitab) yang Diajarkan :</span>
                  </label>
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                    {formMapelIds.length} Dipilih
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Pilih satu atau lebih kitab yang diuji oleh ustadz ini saat ujian syafahi.
                </p>

                {/* List Mapel Checkboxes */}
                <div className="max-h-56 overflow-y-auto space-y-1.5 p-2 rounded-xl bg-slate-50 border border-slate-200">
                  {activeMapelList.map((mapel) => {
                    const isChecked = formMapelIds.includes(mapel.id);
                    return (
                      <label
                        key={mapel.id}
                        className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition ${
                          isChecked
                            ? 'bg-emerald-50/90 border-emerald-300 text-emerald-950 font-bold'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100/70 font-medium'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleMapel(mapel.id)}
                            className="rounded text-emerald-700 focus:ring-emerald-600 w-4 h-4 cursor-pointer"
                          />
                          <div>
                            <span className="text-xs">{mapel.namaLatin}</span>
                            {mapel.namaArab && (
                              <span className="text-[11px] text-slate-500 font-arabic ml-1.5">
                                ({mapel.namaArab})
                              </span>
                            )}
                          </div>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {mapel.kodeMapel}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Pilihan Kelas / Rombel yang Diampu */}
              <div className="space-y-2 pt-2 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-900 flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-sky-700" />
                    <span>Kelas / Rombel yang Diampu :</span>
                  </label>
                  <span className="text-[11px] font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md">
                    {formKelasIds.length} Dipilih
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Pilih kelas tempat guru ini mengajar agar saat login hanya kelas ini yang muncul.
                </p>

                {/* List Kelas Checkboxes */}
                <div className="max-h-44 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-1.5 p-2 rounded-xl bg-slate-50 border border-slate-200">
                  {activeKelasList.map((kls) => {
                    const isChecked = formKelasIds.includes(kls.id);
                    return (
                      <label
                        key={kls.id}
                        className={`flex items-center justify-between p-2 rounded-xl border cursor-pointer transition ${
                          isChecked
                            ? 'bg-sky-50 border-sky-300 text-sky-950 font-bold'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100/70 font-medium'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleKelas(kls.id)}
                            className="rounded text-sky-700 focus:ring-sky-600 w-4 h-4 cursor-pointer"
                          />
                          <span className="text-xs">Kelas {kls.namaKelas}</span>
                        </div>
                        <span className="text-[10px] text-slate-400">
                          Tingkat {kls.tingkat}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Status Aktif */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="statusAktif"
                  checked={formStatusAktif}
                  onChange={(e) => setFormStatusAktif(e.target.checked)}
                  className="rounded text-emerald-700 focus:ring-emerald-600 w-4 h-4 cursor-pointer"
                />
                <label htmlFor="statusAktif" className="font-bold text-slate-800 cursor-pointer">
                  Status Guru Aktif Mengajar
                </label>
              </div>

              {/* Tombol Simpan & Batal */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>{editingGuru ? 'Simpan Perubahan' : 'Tambahkan Guru'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

