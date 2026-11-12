import React, { useState, useMemo } from 'react';
import {
  GraduationCap,
  Plus,
  Edit3,
  Trash2,
  Search,
  BookOpen,
  X,
  Save,
  UserCheck,
  RefreshCw,
  User
} from 'lucide-react';
import { GuruItem } from '../../constants/initialData';
import { SupabaseDB } from '../../services/supabase';

interface GuruMasterViewProps {
  guruList: GuruItem[];
  setGuruList: React.Dispatch<React.SetStateAction<GuruItem[]>>;
  mapelList?: any[];
  kelasList?: any[];
  showToast: (msg: string, type?: 'success' | 'warning' | 'error') => void;
  addLog?: (aksi: string, deskripsi: string) => void;
}

export function GuruMasterView({
  guruList,
  setGuruList,
  showToast,
  addLog
}: GuruMasterViewProps) {
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGuru, setEditingGuru] = useState<GuruItem | null>(null);

  // Form State (Hanya Nama dan Status Aktif)
  const [formNama, setFormNama] = useState('');
  const [formStatusAktif, setFormStatusAktif] = useState(true);

  // Filtered guru list berdasarkan nama
  const filteredGuru = useMemo(() => {
    return guruList.filter((g) => {
      const q = search.toLowerCase().trim();
      if (!q) return true;
      return g.nama.toLowerCase().includes(q);
    });
  }, [guruList, search]);

  // Statistik Guru
  const stats = useMemo(() => {
    const total = guruList.length;
    const active = guruList.filter((g) => g.statusAktif).length;
    return { total, active };
  }, [guruList]);

  // Buka modal tambah guru
  const handleOpenAddModal = () => {
    setEditingGuru(null);
    setFormNama('');
    setFormStatusAktif(true);
    setIsModalOpen(true);
  };

  // Buka modal edit guru
  const handleOpenEditModal = (guru: GuruItem) => {
    setEditingGuru(guru);
    setFormNama(guru.nama);
    setFormStatusAktif(guru.statusAktif);
    setIsModalOpen(true);
  };

  // Simpan guru (Tambah / Edit)
  const handleSaveGuru = async (e: React.FormEvent) => {
    e.preventDefault();
    const namaTrim = formNama.trim();
    if (!namaTrim) {
      showToast('Nama guru / ustadz penguji wajib diisi!', 'warning');
      return;
    }

    let targetGuru: GuruItem;
    let updated: GuruItem[];

    if (editingGuru) {
      // Edit guru yang sudah ada
      targetGuru = {
        ...editingGuru,
        nama: namaTrim,
        statusAktif: formStatusAktif
      };
      updated = guruList.map((g) => (g.id === editingGuru.id ? targetGuru : g));
      setGuruList(updated);
      try {
        localStorage.setItem('rapor_guru_list', JSON.stringify(updated));
      } catch (_) {}
      showToast(`Data guru ${namaTrim} berhasil diperbarui!`, 'success');
      if (addLog) addLog('EDIT_GURU', `Memperbarui nama guru ${namaTrim}`);
    } else {
      // Tambah guru baru
      targetGuru = {
        id: `guru-${Date.now()}`,
        nama: namaTrim,
        mapelIds: [],
        kelasIds: [],
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

    setIsModalOpen(false);

    // Simpan permanen ke Supabase database
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
  };

  // Hapus guru
  const handleDeleteGuru = async (guru: GuruItem) => {
    if (
      !window.confirm(
        `Apakah Anda yakin ingin menghapus data penguji "${guru.nama}"?`
      )
    ) {
      return;
    }

    const updated = guruList.filter((g) => g.id !== guru.id);
    setGuruList(updated);
    try {
      localStorage.setItem('rapor_guru_list', JSON.stringify(updated));
    } catch (_) {}

    // Hapus langsung dari Supabase
    try {
      const ok = await SupabaseDB.deleteById('guru', guru.id);
      if (ok) {
        showToast(`Guru "${guru.nama}" berhasil dihapus permanen dari Supabase!`, 'success');
      } else {
        showToast(`Guru "${guru.nama}" dihapus dari sesi lokal.`, 'warning');
      }
    } catch (err: any) {
      showToast(`Gagal menghapus dari Supabase: ${err.message}`, 'error');
    }

    if (addLog) addLog('HAPUS_GURU', `Menghapus guru ${guru.nama}`);
  };

  // Sinkronisasi seluruh daftar guru ke Supabase
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
              Guru Aktif Menguji
            </span>
            <div className="text-2xl font-black text-emerald-800 mt-0.5">
              {stats.active}
            </div>
            <p className="text-[11px] text-emerald-700 font-medium">Siap bertugas saat ujian</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-100/70 text-emerald-800 flex items-center justify-center font-bold">
            <UserCheck className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Kurikulum & Kelas
            </span>
            <div className="text-sm font-black text-slate-800 mt-1">
              Diatur per Kitab
            </div>
            <p className="text-[11px] text-slate-500">
              Pada menu Pengaturan Kitab
            </p>
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
            placeholder="Cari nama guru / ustadz penguji..."
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

      {/* TABEL DATA GURU / PENGUJI (BERSIH & RINGKAS: CUKUP NAMA & STATUS) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 text-slate-700 font-bold border-b border-slate-200">
                <th className="py-3 px-3 w-14 text-center">No</th>
                <th className="py-3 px-4 min-w-[260px]">Nama Guru / Ustadz Penguji</th>
                <th className="py-3 px-4 w-36 text-center">Status Menguji</th>
                <th className="py-3 px-3 w-28 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredGuru.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-slate-400 font-medium">
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
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center shrink-0">
                            {guru.nama.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 text-xs sm:text-sm block">
                              {guru.nama}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              Penguji Ujian Syafahi
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-center">
                        {guru.statusAktif ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-bold">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                            <span>Aktif</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200 text-[11px] font-semibold">
                            <span>Nonaktif</span>
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(guru)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-emerald-100 text-slate-600 hover:text-emerald-800 transition cursor-pointer"
                            title="Edit Nama Guru"
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

      {/* MODAL TAMBAH / EDIT GURU (RINGKAS: CUKUP NAMA & STATUS) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            {/* Modal Header */}
            <div className="px-5 py-4 bg-gradient-to-r from-emerald-900 to-[#064E3B] text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-amber-300 font-bold">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base leading-tight">
                    {editingGuru ? 'Edit Nama Guru / Penguji' : 'Tambah Guru / Penguji Baru'}
                  </h3>
                  <p className="text-[11px] text-emerald-200">
                    Untuk penilaian ujian syafahi santri
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
            <form onSubmit={handleSaveGuru} className="p-5 sm:p-6 space-y-4 text-xs">
              {/* Nama Guru */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-800 block text-xs">
                  Nama Lengkap Guru / Ustadz <span className="text-rose-500">*</span>:
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Ust. Ahmad Fauzan, M.Pd"
                  value={formNama}
                  onChange={(e) => setFormNama(e.target.value)}
                  className="w-full px-3.5 py-3 rounded-xl border border-slate-300 text-xs sm:text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  autoFocus
                />
                <p className="text-[11px] text-slate-400">
                  Nama ini akan muncul pada pilihan penguji ujian di HP.
                </p>
              </div>

              {/* Status Aktif */}
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200">
                <input
                  type="checkbox"
                  id="statusAktif"
                  checked={formStatusAktif}
                  onChange={(e) => setFormStatusAktif(e.target.checked)}
                  className="rounded text-emerald-700 focus:ring-emerald-600 w-4 h-4 cursor-pointer"
                />
                <label htmlFor="statusAktif" className="font-bold text-slate-800 cursor-pointer text-xs">
                  Status Guru Aktif Menguji
                </label>
              </div>

              {/* Tombol Simpan & Batal */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
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
