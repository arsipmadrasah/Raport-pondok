import React, { useState, useEffect } from 'react';
import { Save, Edit3 } from 'lucide-react';
import { SupabaseDB } from '../../services/supabase';
import { INITIAL_PREDIKAT } from '../../constants/initialData';

export function PredikatConfigView({
  predikatList,
  setPredikatList,
  showToast,
  addLog
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [draftRules, setDraftRules] = useState(predikatList);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setDraftRules(predikatList);
  }, [predikatList]);

  const handleFieldChange = (id, field, value) => {
    setDraftRules((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
            ...r,
            [field]:
              field === 'batasBawah' || field === 'batasAtas'
                ? Number(value)
                : value
          }
          : r
      )
    );
  };

  const handleSavePredikat = async () => {
    setIsSaving(true);
    try {
      setPredikatList(draftRules);

      await SupabaseDB.upsert(
        'predikat_config',
        draftRules.map((p) => ({
          id: p.id,
          batas_bawah: p.batasBawah,
          batas_atas: p.batasAtas,
          predikat_arab: p.predikatArab,
          predikat_latin: p.predikatLatin,
          keterangan: p.keterangan,
          urutan: p.urutan || 1
        }))
      );

      if (addLog) {
        addLog(
          'UPDATE_PREDIKAT',
          'Memperbarui rentang dan deskripsi predikat nilai pesantren'
        );
      }
      if (showToast) {
        showToast('Konfigurasi predikat nilai berhasil disimpan & diintegrasikan!');
      }
      setIsEditing(false);
    } catch (err) {
      if (showToast) {
        showToast(`Gagal menyimpan predikat ke Supabase: ${err.message}`, 'warning');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetDefault = () => {
    setDraftRules(INITIAL_PREDIKAT);
    if (showToast) {
      showToast('Form predikat dikembalikan ke standar awal (Mumtaz, Jayyid Jiddan, Jayyid, Maqbul, Dhaif). Klik Simpan untuk menerapkan.');
    }
  };

  return (
    <div className="bg-white rounded-xl border-2 border-slate-900 shadow-[4px_4px_0px_#0F172A] overflow-hidden">
      <div className="p-4 sm:p-5 border-b-2 border-slate-900 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="font-black text-sm text-slate-950">
            Skala &amp; Standar Predikat Nilai Pesantren (0.00 – 4.00)
          </h3>
          <p className="text-[11px] text-slate-600">
            Nilai di bawah 2.70 dikategorikan <b>Dhoif</b> dan otomatis ditandai merah pada rekap nilai &amp; lembar rapor.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <button
                type="button"
                onClick={handleResetDefault}
                className="px-3 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-800 border-2 border-slate-900 shadow-[2px_2px_0px_#0F172A] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none text-xs font-bold transition-all cursor-pointer"
              >
                Reset Default
              </button>
              <button
                type="button"
                onClick={() => {
                  setDraftRules(predikatList);
                  setIsEditing(false);
                }}
                className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border-2 border-slate-900 shadow-[2px_2px_0px_#0F172A] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none text-xs font-bold transition-all cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isSaving}
                onClick={handleSavePredikat}
                className="px-4 py-2 rounded-xl bg-[#064E3B] hover:bg-emerald-900 text-white border-2 border-slate-900 shadow-[2px_2px_0px_#0F172A] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'Menyimpan...' : 'Simpan Predikat'}</span>
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="px-3.5 py-2 rounded-xl bg-[#064E3B] hover:bg-emerald-900 text-white border-2 border-slate-900 shadow-[2px_2px_0px_#0F172A] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Edit3 className="w-4 h-4" />
              <span>Edit Rentang Predikat</span>
            </button>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead className="bg-[#FEF9C3] border-b-2 border-slate-900 text-slate-950">
            <tr>
              <th className="py-3 px-4 text-left font-bold min-w-[140px]">Rentang Nilai</th>
              <th className="py-3 px-4 text-left font-bold min-w-[130px]">Predikat Latin</th>
              <th className="py-3 px-4 text-left font-bold min-w-[160px]">Keterangan</th>
              <th className="py-3 px-4 text-right font-bold min-w-[140px]">Predikat Arab</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {draftRules.map((p) => {
              const isDhoif = p.batasBawah < 2.7;
              return (
                <tr key={p.id} className={isDhoif ? 'bg-red-50/40' : 'hover:bg-slate-50/60'}>
                  <td className="py-3 px-4 font-mono font-bold">
                    {isEditing ? (
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max="4"
                          value={p.batasBawah}
                          onChange={(e) => handleFieldChange(p.id, 'batasBawah', e.target.value)}
                          className="w-16 px-2 py-1 rounded border border-slate-300 font-mono text-center font-bold"
                        />
                        <span>–</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max="4"
                          value={p.batasAtas}
                          onChange={(e) => handleFieldChange(p.id, 'batasAtas', e.target.value)}
                          className="w-16 px-2 py-1 rounded border border-slate-300 font-mono text-center font-bold"
                        />
                      </div>
                    ) : (
                      <span className={isDhoif ? 'text-red-700' : 'text-slate-900'}>
                        {p.batasBawah.toFixed(2)} – {p.batasAtas.toFixed(2)}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 font-bold">
                    {isEditing ? (
                      <input
                        type="text"
                        value={p.predikatLatin}
                        onChange={(e) => handleFieldChange(p.id, 'predikatLatin', e.target.value)}
                        className="w-full px-2 py-1 rounded border border-slate-300 font-bold"
                      />
                    ) : (
                      <span
                        className={`inline-block px-2.5 py-1 rounded-md text-xs ${isDhoif
                            ? 'bg-red-100 text-red-800 border border-red-200 font-bold'
                            : 'bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold'
                          }`}
                      >
                        {p.predikatLatin}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-slate-700">
                    {isEditing ? (
                      <input
                        type="text"
                        value={p.keterangan}
                        onChange={(e) => handleFieldChange(p.id, 'keterangan', e.target.value)}
                        className="w-full px-2 py-1 rounded border border-slate-300"
                      />
                    ) : (
                      <span>{p.keterangan}</span>
                    )}
                  </td>
                  <td dir="rtl" className="py-3 px-4 text-right">
                    {isEditing ? (
                      <input
                        type="text"
                        dir="rtl"
                        value={p.predikatArab}
                        onChange={(e) => handleFieldChange(p.id, 'predikatArab', e.target.value)}
                        className="w-32 px-2 py-1 rounded border border-slate-300 font-arabic text-sm font-bold text-emerald-900 text-right"
                      />
                    ) : (
                      <span className="font-arabic text-base font-bold text-emerald-800">
                        {p.predikatArab}
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
  );
}