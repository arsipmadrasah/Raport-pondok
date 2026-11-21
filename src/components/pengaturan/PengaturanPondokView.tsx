import React, { useState, useEffect } from 'react';
import { Loader2, Upload, Save } from 'lucide-react';
import { BaliBinaInsaniLogo } from '../common/BaliBinaInsaniLogo';
import { compressLogoImageToBase64 } from '../../services/supabase';
import {
  parseIndonesianMasehiDate,
  formatMasehiRaporString,
  convertMasehiToHijriyahString,
  toInputDateValue
} from '../../utils/academicHelpers';

export function PengaturanPondokView({
  pondok,
  setPondok,
  persistPondokProfileToSupabase,
  showToast,
  addLog,
  onOpenDbModal: _onOpenDbModal
}) {
  const [form, setForm] = useState({ ...pondok });
  const [isSavingLogo, setIsSavingLogo] = useState(false);

  useEffect(() => {
    setForm({ ...pondok });
  }, [pondok]);

  const handleLogoFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsSavingLogo(true);
    try {
      const compressedBase64 = await compressLogoImageToBase64(file, 320);
      const updated = { ...form, logoUrl: compressedBase64 };
      setForm(updated);
      setPondok(updated);

      await persistPondokProfileToSupabase(updated);
      addLog('UPLOAD_LOGO_DB', 'Mengunggah & menyimpan logo pondok ke Supabase PostgreSQL');
      showToast('Logo Pondok langsung tersimpan ke Supabase PostgreSQL!');
    } catch (err) {
      showToast(`Logo diterapkan, namun gagal simpan ke DB: ${err.message}`, 'warning');
    } finally {
      setIsSavingLogo(false);
    }
  };

  const handleResetDefaultLogo = async () => {
    const updated = { ...form, logoUrl: '' };
    setForm(updated);
    setPondok(updated);
    try {
      await persistPondokProfileToSupabase(updated);
      showToast('Logo dikembalikan ke vektor resmi Bali Bina Insani & disimpan ke DB.');
    } catch (_) { }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setPondok(form);
    try {
      await persistPondokProfileToSupabase(form);
      showToast('Identitas & Logo Pondok berhasil disimpan ke Supabase PostgreSQL.');
    } catch (err) {
      showToast(`Gagal menyimpan ke Supabase: ${err.message}`, 'warning');
    }
    addLog('UPDATE_PONDOK', 'Memperbarui identitas Pondok Pesantren');
  };

  return (
    <div className="w-full">
      <form
        onSubmit={handleSubmit}
        className="w-full bg-white p-5 sm:p-6 rounded-xl border-2 border-slate-900 shadow-[4px_4px_0px_#0F172A] space-y-4 text-xs"
      >
        <h3 className="font-bold text-sm text-slate-900">
          Identitas Pondok Pesantren & Parameter Cetak Rapor
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="font-semibold text-slate-700">Nama Pondok (Latin)</label>
            <input
              type="text"
              value={form.namaPondokLatin}
              onChange={(e) => setForm({ ...form, namaPondokLatin: e.target.value })}
              className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-300"
            />
          </div>
          <div>
            <label className="font-semibold text-slate-700">Nama Pondok (Arab - Kop Rapor)</label>
            <input
              type="text"
              dir="rtl"
              value={form.namaPondokArab}
              onChange={(e) => setForm({ ...form, namaPondokArab: e.target.value })}
              className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-300 font-arabic text-base"
            />
          </div>
          <div>
            <label className="font-semibold text-slate-700">Nama Direktur / Pimpinan</label>
            <input
              type="text"
              value={form.namaPimpinan}
              onChange={(e) => setForm({ ...form, namaPimpinan: e.target.value })}
              className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-300"
            />
          </div>
          <div>
            <label className="font-semibold text-slate-700">Kota / Tempat Cetak Rapor</label>
            <input
              type="text"
              value={form.kabupatenKota}
              onChange={(e) => setForm({ ...form, kabupatenKota: e.target.value })}
              className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-300"
            />
          </div>
          <div>
            <label className="font-semibold text-slate-700">Tanggal Rapor (Masehi)</label>
            <div className="mt-1 flex items-center gap-2">
              <input
                type="text"
                value={form.tanggalCetakMasehi}
                onChange={(e) => {
                  const val = e.target.value;
                  const parsed = parseIndonesianMasehiDate(val);
                  const autoHijri = parsed ? convertMasehiToHijriyahString(parsed) : '';
                  setForm({
                    ...form,
                    tanggalCetakMasehi: val,
                    ...(autoHijri ? { tanggalCetakHijriyah: autoHijri } : {})
                  });
                }}
                placeholder="Misal: 19 Desember 2026M"
                className="flex-1 min-w-0 px-3 py-2 rounded-xl border border-slate-300"
              />
              <input
                type="date"
                aria-label="Pilih tanggal rapor Masehi"
                title="Pilih dari kalender untuk konversi otomatis ke Hijriyah"
                value={(() => {
                  const parsed = parseIndonesianMasehiDate(form.tanggalCetakMasehi);
                  return parsed ? toInputDateValue(parsed) : '';
                })()}
                onChange={(e) => {
                  const parsed = parseIndonesianMasehiDate(e.target.value);
                  if (!parsed) return;
                  const formattedMasehi = formatMasehiRaporString(parsed);
                  const autoHijri = convertMasehiToHijriyahString(parsed);
                  setForm({
                    ...form,
                    tanggalCetakMasehi: formattedMasehi,
                    ...(autoHijri ? { tanggalCetakHijriyah: autoHijri } : {})
                  });
                }}
                className="w-10 sm:w-auto px-2 py-2 rounded-xl border border-slate-300 bg-slate-50 text-slate-700 cursor-pointer"
              />
            </div>
            <p className="text-[10px] text-slate-500 mt-1">
              Ketik tanggal (mis. 19 Desember 2026) atau pilih kalender; Hijriyah terisi otomatis.
            </p>
          </div>
          <div>
            <div className="flex items-center justify-between gap-2">
              <label className="font-semibold text-slate-700">Tanggal Rapor (Hijriyah)</label>
              <span className="text-[10px] font-semibold text-emerald-700">
                Otomatis dari Masehi (bisa diedit)
              </span>
            </div>
            <input
              type="text"
              value={form.tanggalCetakHijriyah}
              onChange={(e) => setForm({ ...form, tanggalCetakHijriyah: e.target.value })}
              placeholder="Misal: 10 Rajab 1448H"
              className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-300"
            />
          </div>
        </div>

        <div className="pt-2 flex flex-wrap items-center gap-4 p-3.5 rounded-xl bg-slate-50 border-2 border-slate-900">
          <BaliBinaInsaniLogo size={68} customLogoUrl={form.logoUrl} />
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <label className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold border-2 border-slate-900 shadow-[2px_2px_0px_#0F172A] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer inline-flex items-center gap-2">
                {isSavingLogo ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
                <span>
                  {isSavingLogo
                    ? 'Menyimpan ke Supabase...'
                    : 'Unggah & Simpan Logo ke Database (.PNG/.JPG)'}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoFileChange}
                  className="hidden"
                />
              </label>

              {form.logoUrl && (
                <button
                  type="button"
                  onClick={handleResetDefaultLogo}
                  className="px-3 py-2 rounded-xl bg-white border-2 border-slate-900 hover:bg-slate-100 text-slate-800 font-bold shadow-[2px_2px_0px_#0F172A] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer"
                >
                  Gunakan Logo Vektor Bawaan
                </button>
              )}
            </div>
            <p className="text-[11px] text-slate-500">
              Status Logo Database:{' '}
              <b className="text-emerald-800">
                {form.logoUrl
                  ? 'Menggunakan Gambar Kustom (Tersimpan di tabel pondok_profile.logo_url)'
                  : 'Menggunakan Logo Vektor Resmi Bali Bina Insani'}
              </b>
            </p>
          </div>
        </div>

        <button
          type="submit"
          className="px-5 py-2.5 rounded-xl bg-[#064E3B] hover:bg-emerald-900 text-white font-bold border-2 border-slate-900 shadow-[3px_3px_0px_#0F172A] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          <span>Simpan Seluruh Pengaturan ke Supabase</span>
        </button>
      </form>
    </div>
  );
}