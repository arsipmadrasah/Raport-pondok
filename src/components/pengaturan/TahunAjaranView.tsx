import React, { useState } from 'react';
import { Plus, Save, Edit3, Trash2, CheckCircle2 } from 'lucide-react';
import { SupabaseDB } from '../../services/supabase';
import { toArabicNumerals } from '../../utils/academicHelpers';

export function TahunAjaranView({
  tahunAjaranList,
  setTahunAjaranList,
  semesterList,
  setSemesterList,
  selectedTahunAjaranId,
  setSelectedTahunAjaranId,
  selectedSemesterId,
  setSelectedSemesterId,
  showToast,
  addLog
}) {
  const [newNama, setNewNama] = useState('');
  const [newNamaArab, setNewNamaArab] = useState('');

  const [editingTaId, setEditingTaId] = useState(null);
  const [editNama, setEditNama] = useState('');
  const [editNamaArab, setEditNamaArab] = useState('');

  const handleNewNamaChange = (val) => {
    setNewNama(val);
    setNewNamaArab(toArabicNumerals(val));
  };

  const handleEditNamaChange = (val) => {
    setEditNama(val);
    setEditNamaArab(toArabicNumerals(val));
  };

  const handleAddTahunAjaran = async (e) => {
    e.preventDefault();
    const trimmed = newNama.trim();
    if (!trimmed) return;

    const arabVal = newNamaArab.trim() || toArabicNumerals(trimmed);
    const newId = `ta-${Date.now()}`;
    const newTa = {
      id: newId,
      nama: trimmed,
      namaArab: arabVal,
      isActive: false
    };

    const semGanjil = {
      id: `sem-${newId}-1`,
      tahunAjaranId: newId,
      nama: 'Ganjil',
      namaArab: 'الأول',
      angka: 1,
      isActive: false
    };

    const semGenap = {
      id: `sem-${newId}-2`,
      tahunAjaranId: newId,
      nama: 'Genap',
      namaArab: 'الثاني',
      angka: 2,
      isActive: false
    };

    setTahunAjaranList((prev) => [...prev, newTa]);
    setSemesterList((prev) => [...prev, semGanjil, semGenap]);
    setNewNama('');
    setNewNamaArab('');

    let syncedToDb = false;
    let dbErrMsg = '';
    try {
      await SupabaseDB.upsert('tahun_ajaran', {
        id: newTa.id,
        nama: newTa.nama,
        nama_arab: newTa.namaArab,
        is_active: false
      });
      await SupabaseDB.upsert('semester', [
        {
          id: semGanjil.id,
          tahun_ajaran_id: newTa.id,
          nama: semGanjil.nama,
          nama_arab: semGanjil.namaArab,
          angka: 1,
          is_active: false
        },
        {
          id: semGenap.id,
          tahun_ajaran_id: newTa.id,
          nama: semGenap.nama,
          nama_arab: semGenap.namaArab,
          angka: 2,
          is_active: false
        }
      ]);
      syncedToDb = true;
    } catch (err: any) {
      dbErrMsg = err?.message || 'Koneksi terputus';
    }

    addLog('TAMBAH_TAHUN_AJARAN', `Menambahkan Tahun Pelajaran ${newTa.nama}`);
    showToast(
      syncedToDb
        ? `Tahun Pelajaran ${newTa.nama} (${newTa.namaArab}) berhasil ditambahkan ke Supabase!`
        : `Tahun Pelajaran ${newTa.nama} ditambahkan lokal, namun gagal simpan ke Supabase (${dbErrMsg}).`,
      syncedToDb ? 'success' : 'warning'
    );
  };

  const startEditTa = (ta) => {
    setEditingTaId(ta.id);
    setEditNama(ta.nama);
    setEditNamaArab(ta.namaArab);
  };

  const handleSaveEditTa = async (ta) => {
    const trimmed = editNama.trim();
    if (!trimmed) return;
    const arabVal = editNamaArab.trim() || toArabicNumerals(trimmed);

    setTahunAjaranList((prev) =>
      prev.map((item) =>
        item.id === ta.id ? { ...item, nama: trimmed, namaArab: arabVal } : item
      )
    );
    setEditingTaId(null);

    let syncedToDb = false;
    let dbErrMsg = '';
    try {
      await SupabaseDB.updateById('tahun_ajaran', ta.id, {
        nama: trimmed,
        nama_arab: arabVal
      });
      syncedToDb = true;
    } catch (_) {
      try {
        await SupabaseDB.upsert('tahun_ajaran', {
          id: ta.id,
          nama: trimmed,
          nama_arab: arabVal,
          is_active: ta.isActive
        });
        syncedToDb = true;
      } catch (err: any) {
        dbErrMsg = err?.message || 'Koneksi terputus';
      }
    }

    addLog('EDIT_TAHUN_AJARAN', `Mengubah Tahun Pelajaran menjadi ${trimmed} (${arabVal})`);
    showToast(
      syncedToDb
        ? `Tahun Pelajaran berhasil diubah menjadi ${trimmed} (Supabase)!`
        : `Tahun Pelajaran diubah lokal, namun gagal simpan ke Supabase (${dbErrMsg}).`,
      syncedToDb ? 'success' : 'warning'
    );
  };

  const handleActivatePeriode = async (taId, semId) => {
    setSelectedTahunAjaranId(taId);
    setSelectedSemesterId(semId);

    const updatedTaList = tahunAjaranList.map((t) => ({
      ...t,
      isActive: t.id === taId
    }));
    const updatedSemList = semesterList.map((s) => ({
      ...s,
      isActive: s.id === semId
    }));

    setTahunAjaranList(updatedTaList);
    setSemesterList(updatedSemList);

    let syncedToDb = false;
    let dbErrMsg = '';
    try {
      await SupabaseDB.upsert(
        'tahun_ajaran',
        updatedTaList.map((t) => ({
          id: t.id,
          nama: t.nama,
          nama_arab: t.namaArab,
          is_active: t.isActive
        }))
      );
      await SupabaseDB.upsert(
        'semester',
        updatedSemList.map((s) => ({
          id: s.id,
          tahun_ajaran_id: s.tahunAjaranId,
          nama: s.nama,
          nama_arab: s.namaArab,
          angka: s.angka,
          is_active: s.isActive
        }))
      );
      syncedToDb = true;
    } catch (err: any) {
      dbErrMsg = err?.message || 'Koneksi terputus';
    }

    const targetTa = tahunAjaranList.find((t) => t.id === taId);
    const targetSem = semesterList.find((s) => s.id === semId);
    addLog(
      'AKTIFKAN_PERIODE',
      `Mengaktifkan Tahun Pelajaran ${targetTa?.nama} - Semester ${targetSem?.nama}`
    );
    showToast(
      syncedToDb
        ? `Periode aktif diganti ke ${targetTa?.nama} — Semester ${targetSem?.nama} (Supabase)!`
        : `Periode aktif diganti lokal, namun gagal simpan ke Supabase (${dbErrMsg}).`,
      syncedToDb ? 'success' : 'warning'
    );
  };

  const handleDeleteTa = async (ta) => {
    if (tahunAjaranList.length <= 1) {
      showToast('Minimal harus ada 1 Tahun Pelajaran aktif!', 'warning');
      return;
    }
    const remainingTa = tahunAjaranList.filter((t) => t.id !== ta.id);
    const remainingSem = semesterList.filter((s) => s.tahunAjaranId !== ta.id);
    setTahunAjaranList(remainingTa);
    setSemesterList(remainingSem);

    if (selectedTahunAjaranId === ta.id && remainingTa.length > 0) {
      const nextTa = remainingTa[0];
      setSelectedTahunAjaranId(nextTa.id);
      const nextSem = remainingSem.find((s) => s.tahunAjaranId === nextTa.id);
      if (nextSem) setSelectedSemesterId(nextSem.id);
    }

    let syncedToDb = false;
    let dbErrMsg = '';
    try {
      await SupabaseDB.deleteById('tahun_ajaran', ta.id);
      syncedToDb = true;
    } catch (err: any) {
      dbErrMsg = err?.message || 'Koneksi terputus';
    }

    addLog('HAPUS_TAHUN_AJARAN', `Menghapus Tahun Pelajaran ${ta.nama}`);
    showToast(
      syncedToDb
        ? `Tahun Pelajaran ${ta.nama} berhasil dihapus dari Supabase.`
        : `Tahun Pelajaran ${ta.nama} dihapus lokal, namun gagal hapus di Supabase (${dbErrMsg}).`,
      syncedToDb ? 'success' : 'warning'
    );
  };

  return (
    <div className="space-y-4">
      <form
        onSubmit={handleAddTahunAjaran}
        className="bg-white p-4 sm:p-5 rounded-xl border-2 border-slate-900 shadow-[4px_4px_0px_#0F172A] space-y-3 text-xs"
      >
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-900">
            Tambah Tahun Pelajaran Baru
          </h3>
          <span className="text-[11px] text-emerald-700 font-medium">
            Angka Arab terisi otomatis
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Tahun Pelajaran (Latin)
            </label>
            <input
              type="text"
              value={newNama}
              onChange={(e) => handleNewNamaChange(e.target.value)}
              placeholder="Contoh: 2025 - 2026"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-900"
              required
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Tahun Pelajaran (Arab - Kop Rapor)
            </label>
            <input
              type="text"
              dir="rtl"
              value={newNamaArab}
              onChange={(e) => setNewNamaArab(e.target.value)}
              placeholder="Contoh: ٢٠٢٥ - ٢٠٢٦"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-arabic text-base font-bold text-emerald-800"
              required
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-xl bg-[#064E3B] hover:bg-emerald-900 text-white font-bold border-2 border-slate-900 shadow-[2px_2px_0px_#0F172A] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Tahun Pelajaran</span>
            </button>
          </div>
        </div>
      </form>

      <div className="bg-white p-4 sm:p-5 rounded-xl border-2 border-slate-900 shadow-[4px_4px_0px_#0F172A] space-y-4 text-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <div>
            <h3 className="font-bold text-sm text-slate-900">
              Daftar Tahun Ajaran & Semester
            </h3>
            <p className="text-[11px] text-slate-500">
              Klik tombol <b>Edit</b> untuk mengganti tahun pelajaran, atau klik tombol <b>Semester</b> untuk mengaktifkan periode rapor.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {tahunAjaranList.map((ta) => {
            const isEditing = editingTaId === ta.id;
            const isSelectedTa = selectedTahunAjaranId === ta.id;
            const sems = semesterList.filter((s) => s.tahunAjaranId === ta.id);

            return (
              <div
                key={ta.id}
                className={`p-4 rounded-xl border-2 transition space-y-3 ${isSelectedTa
                  ? 'border-slate-900 bg-emerald-50/50 shadow-[3px_3px_0px_#0F172A]'
                  : 'border-slate-900 bg-white'
                  }`}
              >
                {isEditing ? (
                  <div className="space-y-2.5 bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <div className="text-[11px] font-bold text-emerald-900">
                      Edit Tahun Pelajaran:
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-semibold text-slate-500">
                          Tahun (Latin)
                        </label>
                        <input
                          type="text"
                          value={editNama}
                          onChange={(e) => handleEditNamaChange(e.target.value)}
                          className="w-full mt-0.5 px-3 py-2 rounded-lg border border-slate-300 font-bold text-slate-900 bg-white"
                          placeholder="2025 - 2026"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-slate-500">
                          Tahun (Arab di Rapor)
                        </label>
                        <input
                          type="text"
                          dir="rtl"
                          value={editNamaArab}
                          onChange={(e) => setEditNamaArab(e.target.value)}
                          className="w-full mt-0.5 px-3 py-1.5 rounded-lg border border-slate-300 font-arabic text-base font-bold text-emerald-800 bg-white"
                          placeholder="٢٠٢٥ - ٢٠٢٦"
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setEditingTaId(null)}
                        className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 font-semibold"
                      >
                        Batal
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSaveEditTa(ta)}
                        className="px-3.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold flex items-center gap-1"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>Simpan Perubahan</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-base text-slate-900">
                          {ta.nama}
                        </span>
                        {isSelectedTa && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                            Aktif Digunakan
                          </span>
                        )}
                      </div>
                      <div
                        dir="rtl"
                        className="font-arabic text-lg font-bold text-emerald-800 mt-0.5 text-left"
                      >
                        {ta.namaArab}
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => startEditTa(ta)}
                        className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-900 border-2 border-slate-900 font-bold flex items-center gap-1 text-[11px] cursor-pointer"
                        title="Edit Tahun Pelajaran"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Edit</span>
                      </button>
                      {tahunAjaranList.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleDeleteTa(ta)}
                          className="p-1.5 rounded-xl text-rose-600 hover:bg-rose-50 border-2 border-transparent hover:border-slate-900 cursor-pointer"
                          title="Hapus Tahun Pelajaran"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 pt-1">
                  {sems.map((sem) => {
                    const isSemSelected =
                      selectedTahunAjaranId === ta.id && selectedSemesterId === sem.id;
                    return (
                      <button
                        key={sem.id}
                        type="button"
                        onClick={() => handleActivatePeriode(ta.id, sem.id)}
                        className={`p-2.5 rounded-xl text-left border-2 transition-all flex items-center justify-between cursor-pointer ${isSemSelected
                          ? 'bg-[#064E3B] text-white border-slate-900 font-bold shadow-[2px_2px_0px_#0F172A]'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-900/20 hover:border-slate-900 font-semibold'
                          }`}
                      >
                        <div>
                          <div className="text-xs">Semester {sem.nama}</div>
                          <div
                            className={`text-[11px] ${isSemSelected ? 'text-amber-300' : 'text-slate-500'
                              }`}
                          >
                            ({sem.namaArab})
                          </div>
                        </div>
                        {isSemSelected && (
                          <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}