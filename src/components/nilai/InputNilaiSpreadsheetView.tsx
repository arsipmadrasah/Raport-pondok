import React, { useState, useMemo, useEffect } from 'react';
import { Search, Save, CheckCircle2, FileSpreadsheet } from 'lucide-react';
import { isMapelForKelas, resolvePredikat, toArabicNumerals } from '../../utils/academicHelpers';
import { normalizeTingkat } from '../../constants/initialData';
import { SupabaseDB } from '../../services/supabase';

export function InputNilaiSpreadsheetView({
  santriList,
  kelasList,
  selectedKelasId,
  setSelectedKelasId,
  selectedSemesterId,
  activeMapels,
  nilaiList,
  setNilaiList,
  predikatList,
  showToast,
  addLog
}) {
  const [search, setSearch] = useState('');
  const [draftCells, setDraftCells] = useState({});
  const [hasUnsaved, setHasUnsaved] = useState(false);
  const [mobileInputMode, setMobileInputMode] = useState('cards');

  const santriInKelas = useMemo(
    () =>
      santriList.filter(
        (s) =>
          s.statusAktif &&
          s.kelasId === selectedKelasId &&
          (s.namaLengkap.toLowerCase().includes(search.toLowerCase()) ||
            s.nis.includes(search))
      ),
    [santriList, selectedKelasId, search]
  );

  const currentKelasObj = useMemo(
    () => kelasList.find((k) => k.id === selectedKelasId),
    [kelasList, selectedKelasId]
  );

  const classMapels = useMemo(
    () => activeMapels.filter((m) => isMapelForKelas(m, selectedKelasId)),
    [activeMapels, selectedKelasId]
  );

  useEffect(() => {
    const map = {};
    for (const item of nilaiList) {
      if (item.semesterId === selectedSemesterId) {
        map[`${item.santriId}__${item.mapelId}`] =
          item.angkaNilai !== null && item.angkaNilai !== undefined
            ? Number(item.angkaNilai).toFixed(2)
            : '';
      }
    }
    setDraftCells(map);
    setHasUnsaved(false);
  }, [nilaiList, selectedSemesterId, selectedKelasId]);

  const handleCellChange = (santriId, mapelId, val) => {
    const key = `${santriId}__${mapelId}`;
    setDraftCells((prev) => ({ ...prev, [key]: val }));
    setHasUnsaved(true);
  };

  const handleSaveSpreadsheet = async () => {
    const updatedNilai = [...nilaiList];
    const upsertBatch = [];
    const deletePromises = [];

    for (const [key, rawVal] of Object.entries(draftCells)) {
      const [santriId, mapelId] = key.split('__');
      const trimmed = String(rawVal).trim().replace(',', '.');

      const existingIdx = updatedNilai.findIndex(
        (n) =>
          n.santriId === santriId &&
          n.semesterId === selectedSemesterId &&
          n.mapelId === mapelId
      );

      if (trimmed === '') {
        if (existingIdx !== -1) {
          updatedNilai.splice(existingIdx, 1);
          deletePromises.push(
            SupabaseDB.deleteNilaiCell(santriId, selectedSemesterId, mapelId)
          );
        }
        continue;
      }

      const num = Number(trimmed);
      if (Number.isNaN(num) || num < 0 || num > 4) {
        showToast(`Nilai tidak valid (${rawVal}). Masukkan rentang 0.00 - 4.00`, 'warning');
        return;
      }

      const rounded = Math.round(num * 100) / 100;
      if (existingIdx !== -1) {
        updatedNilai[existingIdx] = { ...updatedNilai[existingIdx], angkaNilai: rounded };
      } else {
        updatedNilai.push({
          santriId,
          semesterId: selectedSemesterId,
          mapelId,
          angkaNilai: rounded
        });
      }

      upsertBatch.push({
        santri_id: santriId,
        semester_id: selectedSemesterId,
        mapel_id: mapelId,
        angka_nilai: rounded
      });
    }

    try {
      if (deletePromises.length > 0) await Promise.all(deletePromises);
      if (upsertBatch.length > 0) {
        await SupabaseDB.upsert('nilai', upsertBatch, 'santri_id,semester_id,mapel_id');
      }
    } catch (_) { }

    setNilaiList(updatedNilai);
    setHasUnsaved(false);
    addLog('SIMPAN_NILAI', `Menyimpan nilai Kelas ${selectedKelasId}`);
    showToast('Nilai berhasil disimpan & peringkat dihitung ulang!');
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden space-y-4">
      <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <select
            value={selectedKelasId}
            onChange={(e) => setSelectedKelasId(e.target.value)}
            className="px-3.5 py-2.5 sm:py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 bg-white"
          >
            {[...kelasList]
              .sort(
                (a, b) =>
                  normalizeTingkat(a.tingkat, a.namaKelas) -
                  normalizeTingkat(b.tingkat, b.namaKelas)
              )
              .map((k) => (
                <option key={k.id} value={k.id}>
                  Tingkat {normalizeTingkat(k.tingkat, k.namaKelas)} — Kelas {k.namaKelas} (Wali: {k.waliKelas})
                </option>
              ))}
          </select>

          {currentKelasObj && (
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-900">
              <span>Wali: {currentKelasObj.waliKelas}</span>
              <span className="text-emerald-400">•</span>
              <span>{santriInKelas.length} Santri</span>
            </div>
          )}

          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari santri..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs"
            />
          </div>

          <div className="flex md:hidden rounded-xl bg-slate-100 p-1 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setMobileInputMode('cards')}
              className={`flex-1 py-1.5 rounded-lg ${mobileInputMode === 'cards'
                ? 'bg-white text-emerald-900 shadow-xs font-bold'
                : 'text-slate-600'
                }`}
            >
              Mode Kartu HP
            </button>
            <button
              type="button"
              onClick={() => setMobileInputMode('table')}
              className={`flex-1 py-1.5 rounded-lg ${mobileInputMode === 'table'
                ? 'bg-white text-emerald-900 shadow-xs font-bold'
                : 'text-slate-600'
                }`}
            >
              Mode Tabel
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-2.5">
          {hasUnsaved && (
            <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2.5 py-1.5 rounded-lg border border-amber-200">
              Belum disimpan
            </span>
          )}
          <button
            onClick={handleSaveSpreadsheet}
            className="w-full sm:w-auto px-4 py-2.5 sm:py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm"
          >
            <Save className="w-4 h-4" />
            <span>Simpan Nilai (0.00 – 4.00)</span>
          </button>
        </div>
      </div>

      <div
        className={`${mobileInputMode === 'cards' ? 'block md:hidden' : 'hidden'
          } p-3.5 space-y-3 bg-slate-50/70`}
      >
        {santriInKelas.map((s, idx) => {
          let sum = 0;
          let count = 0;
          for (const mp of classMapels) {
            const k = `${s.id}__${mp.id}`;
            const v = draftCells[k] ?? '';
            const num = v !== '' ? Number(String(v).replace(',', '.')) : null;
            if (num !== null && !Number.isNaN(num)) {
              sum += num;
              count += 1;
            }
          }
          const cardTotal = count > 0 ? Math.round(sum * 100) / 100 : null;
          const cardAvg = count > 0 ? Math.round((sum / count) * 100) / 100 : null;
          const cardPred = cardAvg !== null ? resolvePredikat(cardAvg, predikatList) : null;

          return (
            <div
              key={s.id}
              className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <div>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800">
                    #{idx + 1} • NIS {s.nis}
                  </span>
                  <h4 className="font-bold text-xs text-slate-900 mt-1">{s.namaLengkap}</h4>
                </div>
                <div className="text-right">
                  <div className="text-[11px] font-bold text-slate-800">
                    Total: {cardTotal !== null ? cardTotal.toFixed(2) : '—'} • Rata: {cardAvg !== null ? cardAvg.toFixed(2) : '—'}
                  </div>
                  {cardPred && (
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border mt-0.5 ${cardPred.badgeColor}`}>
                      {cardPred.predikatLatin}
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2.5">
                {classMapels.map((mp) => {
                  const key = `${s.id}__${mp.id}`;
                  const val = draftCells[key] ?? '';
                  const numVal = val !== '' ? Number(String(val).replace(',', '.')) : null;
                  const pred =
                    numVal !== null && !Number.isNaN(numVal)
                      ? resolvePredikat(numVal, predikatList)
                      : null;

                  return (
                    <div
                      key={mp.id}
                      className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200/80"
                    >
                      <div className="min-w-0">
                        <div className="font-bold text-xs text-slate-800 truncate">
                          {mp.namaLatin}
                        </div>
                        <div dir="rtl" className="font-arabic text-xs text-emerald-700 text-left">
                          {mp.namaArab}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] font-semibold px-2 py-1 rounded bg-white border border-slate-200 text-slate-600">
                          {pred ? pred.predikatLatin : 'Kosong'}
                        </span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max="4"
                          inputMode="decimal"
                          value={val}
                          onChange={(e) => handleCellChange(s.id, mp.id, e.target.value)}
                          placeholder="0.00"
                          className="w-20 text-center font-mono font-bold text-xs py-2 px-2 rounded-xl bg-white border border-slate-300 focus:border-emerald-600 outline-none"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div
        className={`${mobileInputMode === 'table' ? 'block' : 'hidden md:block'
          } overflow-x-auto`}
      >
        <table className="w-full text-xs border-collapse">
          <thead className="bg-slate-50 text-slate-700 border-b border-slate-200">
            <tr>
              <th className="py-3 px-4 text-left border-r border-slate-200">No</th>
              <th className="py-3 px-4 text-left border-r border-slate-200 min-w-[200px]">
                Nama Santri
              </th>
              {classMapels.map((mp) => (
                <th
                  key={mp.id}
                  className="py-3 px-3 text-center border-r border-slate-200 min-w-[125px]"
                >
                  <div className="font-bold text-slate-900">{mp.namaLatin}</div>
                  <div dir="rtl" className="font-arabic text-sm text-emerald-800 font-normal">
                    {mp.namaArab}
                  </div>
                </th>
              ))}
              <th className="py-3 px-3 text-center border-r border-slate-200 min-w-[85px] bg-slate-100 font-bold text-slate-900">
                Total
              </th>
              <th className="py-3 px-3 text-center border-r border-slate-200 min-w-[85px] bg-slate-100 font-bold text-slate-900">
                Rata-rata
              </th>
              <th className="py-3 px-3 text-center min-w-[105px] bg-slate-100 font-bold text-slate-900">
                Predikat
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {santriInKelas.map((s, idx) => {
              let sum = 0;
              let count = 0;
              for (const mp of classMapels) {
                const k = `${s.id}__${mp.id}`;
                const v = draftCells[k] ?? '';
                const num = v !== '' ? Number(String(v).replace(',', '.')) : null;
                if (num !== null && !Number.isNaN(num)) {
                  sum += num;
                  count += 1;
                }
              }
              const rowTotal = count > 0 ? Math.round(sum * 100) / 100 : null;
              const rowAvg = count > 0 ? Math.round((sum / count) * 100) / 100 : null;
              const rowPred = rowAvg !== null ? resolvePredikat(rowAvg, predikatList) : null;

              return (
                <tr key={s.id} className="hover:bg-slate-50/80">
                  <td className="py-2.5 px-4 border-r border-slate-200 font-mono">{idx + 1}</td>
                  <td className="py-2.5 px-4 border-r border-slate-200 font-bold text-slate-900">
                    {s.namaLengkap}
                  </td>
                  {classMapels.map((mp) => {
                    const key = `${s.id}__${mp.id}`;
                    const val = draftCells[key] ?? '';
                    const numVal = val !== '' ? Number(String(val).replace(',', '.')) : null;
                    const pred =
                      numVal !== null && !Number.isNaN(numVal)
                        ? resolvePredikat(numVal, predikatList)
                        : null;

                    return (
                      <td
                        key={mp.id}
                        className="p-2 border-r border-slate-200 text-center align-middle"
                      >
                        <input
                          type="text"
                          inputMode="decimal"
                          value={val}
                          onChange={(e) => handleCellChange(s.id, mp.id, e.target.value)}
                          placeholder="—"
                          className="w-20 text-center font-mono font-bold py-1.5 px-2 rounded-lg border border-slate-300 focus:border-emerald-600 outline-none"
                        />
                        <div className="text-[10px] text-slate-500 mt-1 font-medium">
                          {pred ? pred.predikatLatin : 'Kosong'}
                        </div>
                      </td>
                    );
                  })}
                  <td className="py-2.5 px-3 border-r border-slate-200 text-center font-mono font-bold text-slate-900 bg-slate-50/70">
                    {rowTotal !== null ? rowTotal.toFixed(2) : '—'}
                  </td>
                  <td className="py-2.5 px-3 border-r border-slate-200 text-center font-mono font-bold text-emerald-800 bg-slate-50/70">
                    {rowAvg !== null ? rowAvg.toFixed(2) : '—'}
                  </td>
                  <td className="py-2.5 px-3 text-center bg-slate-50/70">
                    {rowPred ? (
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${rowPred.badgeColor}`}>
                        {rowPred.predikatLatin}
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400 font-semibold">—</span>
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