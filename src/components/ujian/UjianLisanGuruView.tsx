import React, { useState, useMemo, useEffect } from 'react';
import {
  User,
  Users,
  BookOpen,
  Layers,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  Search,
  Check,
  RefreshCw,
  Award,
  LogIn,
  LogOut,
  Save,
  RotateCcw,
  Sparkles,
  HelpCircle,
  Clock
} from 'lucide-react';
import { normalizeTingkat, GuruItem } from '../../constants/initialData';
import { isMapelForKelas } from '../../utils/academicHelpers';
import { BaliBinaInsaniLogo } from '../common/BaliBinaInsaniLogo';
import {
  BatikKawungPattern,
  BatikGoldBorder,
  HeaderIslamicPattern,
  MihrabArchMotif
} from '../layout/IslamicDecorations';

export const DUMMY_USTADZ_LIST = [
  'Ust. Ahmad Zaki, S.Pd.I',
  'Ust. Muhammad Al-Fatih, Lc.',
  'Ust. H. Abdul Karim, Lc.',
  'Ustzh. Siti Aisyah, S.Pd.I',
  'Ustzh. Fitriani, S.Pd',
  'Ust. Achmad Yasir, S.Pd',
  'Ustzh. Nusi Sopiawati, S.Pd',
  'Ustzh. Nining Nadhifah, SS',
  'Ustzh. Siti Mas\'amah, S.Pd',
  'Ust. M. Zainuddin, S.Pd',
  'Ust. Fathul Ulum, S.Pd'
];

interface UjianLisanGuruViewProps {
  currentUstadz: string;
  onSelectUstadz: (name: string) => void;
  onExitGuruMode?: () => void;
  kelasList: any[];
  santriList: any[];
  mapelList: any[];
  nilaiList: any[];
  selectedSemesterId: string;
  onSaveNilai: (santriId: string, mapelId: string, angkaNilai: number | null) => Promise<void>;
  onSaveMultipleNilai?: (records: Array<{ santriId: string; mapelId: string; angkaNilai: number | null }>) => Promise<void>;
  showToast: (msg: string, type?: 'success' | 'warning' | 'error') => void;
  pondok?: any;
  guruList?: GuruItem[];
}

export function UjianLisanGuruView({
  currentUstadz,
  onSelectUstadz,
  onExitGuruMode,
  kelasList,
  santriList,
  mapelList,
  nilaiList,
  selectedSemesterId,
  onSaveNilai,
  onSaveMultipleNilai,
  showToast,
  pondok,
  guruList
}: UjianLisanGuruViewProps) {
  // Ambil daftar nama guru resmi dari database Admin (guruList atau kelasList)
  const teacherListFromAdmin = useMemo(() => {
    if (guruList && guruList.length > 0) {
      return guruList
        .filter((g) => g.statusAktif)
        .map((g) => g.nama)
        .sort((a, b) => a.localeCompare(b));
    }
    const set = new Set<string>();
    kelasList.forEach((k) => {
      if (k.waliKelas && k.waliKelas.trim() !== '' && k.waliKelas !== '—') {
        set.add(k.waliKelas.trim());
      }
    });
    DUMMY_USTADZ_LIST.forEach((u) => set.add(u));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [guruList, kelasList]);

  // Pilihan Rombel Kelas Aktif
  const activeKelasList = useMemo(
    () =>
      [...kelasList]
        .filter((k) => k.isActive)
        .sort(
          (a, b) =>
            normalizeTingkat(a.tingkat, a.namaKelas) -
            normalizeTingkat(b.tingkat, b.namaKelas)
        ),
    [kelasList]
  );

  const [selectedKelasId, setSelectedKelasId] = useState<string>(
    activeKelasList[0]?.id || ''
  );

  // Status Login Guru Penilai (gunakan sessionStorage agar selalu membuka login saat tab baru)
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const active = sessionStorage.getItem('guru_session_active');
      return active === 'true';
    }
    return false;
  });

  const [loginInputName, setLoginInputName] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem('guru_session_name');
      if (stored) return stored;
    }
    return '';
  });

  const [loginSelectedKelasId, setLoginSelectedKelasId] = useState<string>(
    activeKelasList[0]?.id || ''
  );

  // Objek Guru yang sedang dipilih saat login
  const selectedGuruObj = useMemo(() => {
    if (!guruList || guruList.length === 0 || !loginInputName) return null;
    return guruList.find((g) => g.nama === loginInputName);
  }, [guruList, loginInputName]);

  // Daftar Mapel yang diajarkan oleh guru yang dipilih (berdasarkan setelan Admin Data Guru)
  const mapelsTaughtByGuru = useMemo(() => {
    if (!loginInputName) return [];
    if (selectedGuruObj && selectedGuruObj.mapelIds && selectedGuruObj.mapelIds.length > 0) {
      const filtered = mapelList.filter(
        (m) => m.statusAktif && selectedGuruObj.mapelIds.includes(m.id)
      );
      if (filtered.length > 0) return filtered;
    }
    // Jika belum ditentukan mapelnya di Data Guru, tampilkan seluruh mapel aktif
    return mapelList.filter((m) => m.statusAktif);
  }, [loginInputName, selectedGuruObj, mapelList]);

  // Daftar Kelas yang diajar oleh guru yang dipilih (berdasarkan setelan Admin Data Guru)
  const classesTaughtByGuru = useMemo(() => {
    if (!loginInputName) return activeKelasList;
    if (selectedGuruObj && selectedGuruObj.kelasIds && selectedGuruObj.kelasIds.length > 0) {
      const filtered = activeKelasList.filter((k) =>
        selectedGuruObj.kelasIds!.includes(k.id)
      );
      if (filtered.length > 0) return filtered;
    }
    // Jika belum diatur kelasnya di Data Guru, tampilkan semua kelas aktif
    return activeKelasList;
  }, [loginInputName, selectedGuruObj, activeKelasList]);

  const [loginSelectedMapelId, setLoginSelectedMapelId] = useState<string>('');

  // Saat guru berganti di form login, otomatis arahkan ke mapel pertama yang diajarkan
  useEffect(() => {
    if (mapelsTaughtByGuru.length > 0) {
      if (!mapelsTaughtByGuru.some((m) => m.id === loginSelectedMapelId)) {
        setLoginSelectedMapelId(mapelsTaughtByGuru[0].id);
      }
    } else {
      setLoginSelectedMapelId('');
    }
  }, [mapelsTaughtByGuru]);

  // Saat guru berganti, arahkan ke kelas pertama yang diajarkan guru tersebut
  useEffect(() => {
    if (classesTaughtByGuru.length > 0) {
      if (!classesTaughtByGuru.some((k) => k.id === loginSelectedKelasId)) {
        setLoginSelectedKelasId(classesTaughtByGuru[0].id);
      }
    } else {
      setLoginSelectedKelasId('');
    }
  }, [classesTaughtByGuru]);

  const [selectedMapelId, setSelectedMapelId] = useState<string>('');

  const handleLoginSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const finalName = loginInputName.trim();
    if (!finalName) {
      showToast('Silakan pilih nama guru / ustadz penguji terlebih dahulu!', 'warning');
      return;
    }
    if (!loginSelectedMapelId) {
      showToast('Silakan pilih mata pelajaran / kitab yang diajarkan!', 'warning');
      return;
    }
    if (!loginSelectedKelasId) {
      showToast('Silakan pilih kelas / rombel yang akan dinilai!', 'warning');
      return;
    }
    setSelectedKelasId(loginSelectedKelasId);
    setSelectedMapelId(loginSelectedMapelId);
    onSelectUstadz(finalName);
    try {
      sessionStorage.setItem('guru_session_active', 'true');
      sessionStorage.setItem('guru_session_name', finalName);
      sessionStorage.setItem('guru_session_mapel', loginSelectedMapelId);
      sessionStorage.setItem('guru_session_kelas', loginSelectedKelasId);
      localStorage.removeItem('guru_logged_in_name'); // bersihkan cache lama
    } catch (_) {}
    setIsLoggedIn(true);
    showToast(`Ahlan wa Sahlan, ${finalName}. Selamat bertugas!`, 'success');
  };

  const handleBackToSelection = () => {
    // Kembali ke form login/pemilihan kelas & kitab tanpa menghapus nama guru
    setIsLoggedIn(false);
  };

  const handleLogout = () => {
    try {
      sessionStorage.removeItem('guru_session_active');
      sessionStorage.removeItem('guru_session_name');
      sessionStorage.removeItem('guru_session_mapel');
      sessionStorage.removeItem('guru_session_kelas');
      localStorage.removeItem('guru_logged_in_name');
    } catch (_) {}
    setLoginInputName('');
    setIsLoggedIn(false);
  };

  // Mapel / Kitab yang berlaku untuk kelas terpilih (difilter berdasarkan mapel guru jika ada)
  const availableMapels = useMemo(() => {
    const classMapels = mapelList.filter(
      (m) => m.statusAktif && isMapelForKelas(m, selectedKelasId)
    );
    // Jika guru punya mapel khusus, prioritaskan atau filter
    if (selectedGuruObj && selectedGuruObj.mapelIds && selectedGuruObj.mapelIds.length > 0) {
      const guruClassMapels = classMapels.filter((m) =>
        selectedGuruObj.mapelIds.includes(m.id)
      );
      if (guruClassMapels.length > 0) return guruClassMapels;
    }
    return classMapels;
  }, [mapelList, selectedKelasId, selectedGuruObj]);

  useEffect(() => {
    if (availableMapels.length > 0) {
      if (!availableMapels.some((m) => m.id === selectedMapelId)) {
        setSelectedMapelId(availableMapels[0].id);
      }
    } else {
      setSelectedMapelId('');
    }
  }, [availableMapels, selectedKelasId]);

  // Santri di kelas terpilih
  const santriInKelas = useMemo(() => {
    return santriList
      .filter((s) => s.statusAktif && s.kelasId === selectedKelasId)
      .sort((a, b) => a.namaLengkap.localeCompare(b.namaLengkap));
  }, [santriList, selectedKelasId]);

  // Kunci penyimpanan skor butir soal 1-5 di memori lokal per sesi ujian
  const storageKey = `ujian_syafahi_scores_${selectedSemesterId}_${selectedKelasId}_${selectedMapelId}`;
  const [examItems, setExamItems] = useState<{ [santriId: string]: (number | '')[] }>({});
  const [unsavedSantriIds, setUnsavedSantriIds] = useState<Set<string>>(new Set());
  const [isSaving, setIsSaving] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');

  // Muat data saat kelas/mapel berganti (dari localStorage atau database rapor)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        setExamItems(JSON.parse(raw));
      } else {
        const initial: { [santriId: string]: (number | '')[] } = {};
        santriInKelas.forEach((s) => {
          const matchNilai = nilaiList.find(
            (n) =>
              n.santriId === s.id &&
              n.mapelId === selectedMapelId &&
              n.semesterId === selectedSemesterId
          );
          if (matchNilai && matchNilai.angkaNilai !== null) {
            // Jika sudah ada nilai di database tapi belum ada butir soal, isi 3 soal sama dengan rata-rata
            initial[s.id] = [matchNilai.angkaNilai, matchNilai.angkaNilai, matchNilai.angkaNilai, '', ''];
          } else {
            initial[s.id] = ['', '', '', '', ''];
          }
        });
        setExamItems(initial);
      }
    } catch (_) {}
    setUnsavedSantriIds(new Set());
  }, [storageKey, selectedKelasId, selectedMapelId, selectedSemesterId]);

  // Kalkulasi Jumlah & Rata-Rata santri (Standar Lulus Minimal 2,7)
  const calculateScore = (scores: (number | '')[] | undefined) => {
    if (!scores) return { count: 0, sum: 0, avg: null, isLulus: false };
    const validScores = scores
      .map((v) => (v === '' ? null : Number(v)))
      .filter((v): v is number => v !== null && !isNaN(v));

    if (validScores.length === 0) {
      return { count: 0, sum: 0, avg: null, isLulus: false };
    }

    const sum = validScores.reduce((acc, curr) => acc + curr, 0);
    const avg = Number((sum / validScores.length).toFixed(2));
    const isLulus = avg >= 2.7;

    return {
      count: validScores.length,
      sum: Number(sum.toFixed(2)),
      avg,
      isLulus
    };
  };

  // Mengubah butir soal (1 s.d 5) saat ujian berlangsung atau perbaikan nilai remedial
  const handleScoreChange = (
    santriId: string,
    questionIndex: number,
    value: number | ''
  ) => {
    const current = examItems[santriId] || ['', '', '', '', ''];
    const updatedScores = [...current];
    updatedScores[questionIndex] = value;

    const updatedMap = {
      ...examItems,
      [santriId]: updatedScores
    };

    setExamItems(updatedMap);
    try {
      localStorage.setItem(storageKey, JSON.stringify(updatedMap));
    } catch (_) {}

    // Tandai bahwa ada perubahan yang belum disimpan permanen ke database
    setUnsavedSantriIds((prev) => new Set(prev).add(santriId));
  };

  // Quick preset button click (0, 1, 2, 2.5, 3, 3.5, 4)
  const setQuickScore = (santriId: string, qIdx: number, val: number) => {
    handleScoreChange(santriId, qIdx, val);
  };

  // Simpan nilai ujian & remedial ke database Supabase
  const handleSaveAllChanges = async () => {
    setIsSaving(true);
    try {
      const recordsToSave: Array<{ santriId: string; mapelId: string; angkaNilai: number | null }> = [];

      // Proses semua santri di kelas ini yang memiliki nilai
      santriInKelas.forEach((s) => {
        const scores = examItems[s.id];
        const { avg } = calculateScore(scores);
        recordsToSave.push({
          santriId: s.id,
          mapelId: selectedMapelId,
          angkaNilai: avg
        });
      });

      if (onSaveMultipleNilai) {
        await onSaveMultipleNilai(recordsToSave);
      } else {
        for (const rec of recordsToSave) {
          await onSaveNilai(rec.santriId, rec.mapelId, rec.angkaNilai);
        }
      }

      setUnsavedSantriIds(new Set());
      showToast(
        `Alhamdulillah, nilai ujian & hasil remedial ${selectedMapelObj?.namaLatin || ''} berhasil disimpan ke database!`,
        'success'
      );
    } catch (err) {
      console.error(err);
      showToast('Terjadi kendala saat menyimpan ke database. Data tersimpan di memori lokal.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const selectedKelasObj = activeKelasList.find((k) => k.id === selectedKelasId);
  const selectedMapelObj = availableMapels.find((m) => m.id === selectedMapelId);

  // Filter santri berdasarkan pencarian nama atau NIS
  const filteredSantri = useMemo(() => {
    return santriInKelas.filter((s) => {
      if (searchKeyword.trim() !== '') {
        const q = searchKeyword.toLowerCase();
        const matchName = s.namaLengkap.toLowerCase().includes(q);
        const matchNis = s.nis.toLowerCase().includes(q);
        if (!matchName && !matchNis) return false;
      }
      return true;
    });
  }, [santriInKelas, searchKeyword]);

  // =========================================================================
  // 1. HALAMAN LOGIN GURU PENILAI (DENGAN LOGO RESMI, ELEMEN BATIK & ISLAMI)
  // =========================================================================
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen relative bg-gradient-to-br from-[#043324] via-[#064E3B] to-[#022218] flex flex-col justify-center items-center p-4 select-none font-sans overflow-hidden">
        {/* Ornamen Motif Batik Kawung Nusantara di Latar Belakang */}
        <BatikKawungPattern opacity={0.12} />

        {/* Ornamen Lengkungan Mihrab di Sudut Atas */}
        <div className="absolute top-0 right-0 w-80 h-80 opacity-15 pointer-events-none text-emerald-300">
          <MihrabArchMotif />
        </div>
        <div className="absolute bottom-0 left-0 w-80 h-80 opacity-15 pointer-events-none text-emerald-300 rotate-180">
          <MihrabArchMotif />
        </div>

        {/* KARTU LOGIN DENGAN BINGKAI ISLAMI & AKSEN EMAS */}
        <div className="relative z-10 w-full max-w-md bg-white rounded-3xl shadow-2xl border-2 border-amber-400/30 p-6 sm:p-8 space-y-5 animate-in fade-in zoom-in-95 duration-200 backdrop-blur-xs">
          {/* Logo Resmi Pondok Pesantren Bali Bina Insani (Tanpa Bingkai) */}
          <div className="flex flex-col items-center text-center space-y-2">
            <BaliBinaInsaniLogo customLogoUrl={pondok?.logoUrl} size={88} />

            <div className="space-y-0.5">
              <h1 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                {pondok?.namaPondokLatin || 'Pondok Pesantren Bali Bina Insani'}
              </h1>
              <p className="text-xs text-emerald-800 font-semibold">
                Sistem Penilaian Ujian Lisan (Syafahi)
              </p>
            </div>
          </div>

          {/* Pita Pembatas Batik Emas */}
          <BatikGoldBorder />

          {/* Form Login Guru & Mapel */}
          <form onSubmit={handleLoginSubmit} className="space-y-4 pt-1">
            {/* 1. Pilih Nama Guru */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <User className="w-4 h-4 text-emerald-700" />
                <span>Pilih Nama Guru / Penguji :</span>
              </label>
              <select
                value={loginInputName}
                onChange={(e) => setLoginInputName(e.target.value)}
                className="w-full px-3.5 py-3 rounded-xl bg-slate-50 border border-slate-300 text-xs sm:text-sm font-semibold text-slate-900 cursor-pointer focus:ring-2 focus:ring-emerald-600 focus:outline-none"
              >
                <option value="">-- Pilih Nama Guru --</option>
                {teacherListFromAdmin.map((guru) => (
                  <option key={guru} value={guru}>
                    {guru}
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Pilih Mata Pelajaran (Kitab) yang Diajarkan */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-emerald-700" />
                  <span>Pilih Mata Pelajaran / Kitab :</span>
                </span>
                {loginInputName && mapelsTaughtByGuru.length > 0 && (
                  <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded">
                    ✓ {mapelsTaughtByGuru.length} Kitab
                  </span>
                )}
              </label>
              <select
                value={loginSelectedMapelId}
                onChange={(e) => setLoginSelectedMapelId(e.target.value)}
                disabled={!loginInputName || mapelsTaughtByGuru.length === 0}
                className="w-full px-3.5 py-3 rounded-xl bg-slate-50 border border-slate-300 text-xs sm:text-sm font-semibold text-slate-900 cursor-pointer focus:ring-2 focus:ring-emerald-600 focus:outline-none disabled:opacity-50"
              >
                {!loginInputName ? (
                  <option value="">(Pilih guru terlebih dahulu)</option>
                ) : mapelsTaughtByGuru.length === 0 ? (
                  <option value="">(Guru ini belum memiliki mapel terdaftar)</option>
                ) : (
                  mapelsTaughtByGuru.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.namaLatin} ({m.namaArab})
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* 3. Pilih Kelas / Rombel */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-emerald-700" />
                  <span>Pilih Kelas / Rombel :</span>
                </span>
                {loginInputName && classesTaughtByGuru.length > 0 && (
                  <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded">
                    ✓ {classesTaughtByGuru.length} Kelas
                  </span>
                )}
              </label>
              <select
                value={loginSelectedKelasId}
                onChange={(e) => setLoginSelectedKelasId(e.target.value)}
                disabled={!loginInputName || classesTaughtByGuru.length === 0}
                className="w-full px-3.5 py-3 rounded-xl bg-slate-50 border border-slate-300 text-xs sm:text-sm font-semibold text-slate-900 cursor-pointer focus:ring-2 focus:ring-emerald-600 focus:outline-none disabled:opacity-50"
              >
                {!loginInputName ? (
                  <option value="">(Pilih guru terlebih dahulu)</option>
                ) : classesTaughtByGuru.length === 0 ? (
                  <option value="">(Guru ini belum memiliki kelas terdaftar)</option>
                ) : (
                  classesTaughtByGuru.map((k) => (
                    <option key={k.id} value={k.id}>
                      Kelas {k.namaKelas} (Tingkat {normalizeTingkat(k.tingkat, k.namaKelas)})
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* Tombol Masuk */}
            <button
              type="submit"
              className="w-full py-3.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 active:scale-[0.99] text-white font-bold text-xs sm:text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer border border-emerald-600 mt-2"
            >
              <LogIn className="w-4 h-4 text-amber-300" />
              <span>Buka Tabel Lembar Ujian</span>
            </button>
          </form>
        </div>

        {/* Footer Keterangan Islami */}
        <div className="relative z-10 text-center mt-5 space-y-1">
          <p className="text-[11px] text-emerald-200/80 font-medium">
            Tahun Ajaran Aktif • Lembar Penilaian Standar Minimal Kelulusan 2,7
          </p>
          <p className="text-[10px] text-emerald-300/60">
            Akses langsung portal guru: <code className="bg-emerald-950/60 px-1.5 py-0.5 rounded text-amber-300 font-mono">/guru</code>
          </p>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 2. SETELAH LOGIN: SATU TAMPILAN RESMI (TABEL KERTAS LEMBAR UJIAN & REMEDIAL)
  //    (Mode kartu HP telah dihapus sesuai instruksi user)
  // =========================================================================
  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 flex flex-col font-sans">
      {/* HEADER UTAMA GURU PENILAI (BERSIH DARI DROPDOWN, SESI TERKUNCI DARI LOGIN) */}
      <header className="bg-gradient-to-r from-[#043324] via-[#064E3B] to-[#043324] text-white px-3 sm:px-6 py-3 shadow-md flex items-center justify-between gap-3 sticky top-0 z-40 border-b border-emerald-600/40">
        <div className="min-w-0 space-y-0.5">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-sm sm:text-base font-black leading-tight tracking-wide">
              Lembar Ujian Santri
            </h1>
            <span className="px-2.5 py-0.5 rounded-lg bg-emerald-900/90 text-amber-300 text-xs font-bold border border-emerald-600/60 shadow-2xs">
              Kelas {selectedKelasObj?.namaKelas || ''}
            </span>
            <span className="px-2.5 py-0.5 rounded-lg bg-emerald-900/90 text-white text-xs font-semibold border border-emerald-600/60 shadow-2xs">
              {selectedMapelObj?.namaLatin || ''} {selectedMapelObj?.namaArab ? `(${selectedMapelObj.namaArab})` : ''}
            </span>
          </div>
          <p className="text-[11px] sm:text-xs text-emerald-200 flex items-center gap-1.5">
            <span>Penguji:</span>
            <strong className="text-white font-bold">{currentUstadz}</strong>
          </p>
        </div>

        {/* KONTROL KANAN: TOMBOL SIMPAN & GANTI KELAS/GURU */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Tombol Simpan Nilai ke Database */}
          <button
            type="button"
            onClick={handleSaveAllChanges}
            disabled={isSaving}
            className={`flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer shadow-sm ${
              unsavedSantriIds.size > 0
                ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 ring-2 ring-amber-300 animate-pulse'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-400/50'
            }`}
            title="Simpan nilai ke database"
          >
            <Save className="w-4 h-4" />
            <span>
              {isSaving
                ? 'Menyimpan...'
                : unsavedSantriIds.size > 0
                ? `Simpan (${unsavedSantriIds.size})`
                : 'Simpan'}
            </span>
          </button>

          {/* Tombol Ganti Sesi / Kelas */}
          <button
            type="button"
            onClick={handleBackToSelection}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-900/80 hover:bg-emerald-800 border border-emerald-600/60 text-emerald-100 hover:text-white text-xs font-semibold transition cursor-pointer"
            title="Ganti kelas atau mata pelajaran yang dinilai"
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Ganti Kelas / Sesi</span>
            <span className="sm:hidden">Ganti</span>
          </button>

          {/* Tombol Logout / Ganti Guru */}
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700/60 text-emerald-200 hover:text-white text-xs font-semibold transition cursor-pointer"
            title="Keluar dan ganti nama guru penguji"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Keluar</span>
          </button>
        </div>
      </header>

      {/* KONTEN UTAMA: TABEL KERTAS PERSIS FOTO DOKUMEN FISIK PESANTREN */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 space-y-4">
        {/* BILAH PENCARIAN & STATUS PENYIMPANAN */}
        <div className="bg-white rounded-2xl border border-slate-200 p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-2 w-full sm:w-auto flex-1 max-w-md">
            <div className="relative w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari nama santri atau NIS..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-none"
              />
              {searchKeyword && (
                <button
                  onClick={() => setSearchKeyword('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            {unsavedSantriIds.size > 0 ? (
              <span className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-900 font-bold text-[11px] border border-amber-300">
                ⚠️ {unsavedSantriIds.size} nilai belum disimpan
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 font-bold text-[11px] border border-emerald-200 flex items-center gap-1">
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>Semua nilai tersimpan di database</span>
              </span>
            )}
          </div>
        </div>

        {/* ============================================================== */}
        {/* UTAMA: TABEL KERTAS LEMBAR NILAI (PERSIS FOTO ASLI PESANTREN)  */}
        {/* ============================================================== */}
        <div className="bg-white rounded-2xl border-2 border-slate-300 shadow-sm overflow-hidden space-y-0">
          {/* Header Lembar Ujian Gaya Kertas Cetak */}
          <div className="p-3.5 sm:p-4 border-b border-slate-300 bg-sky-50/50 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-xs sm:text-sm font-black text-slate-900 tracking-wide uppercase">
                LEMBAR PENILAIAN UJIAN SYAFAHI
              </h3>
              <p className="text-[11px] text-slate-600 font-medium">
                Mata Pelajaran: <strong>{selectedMapelObj?.namaLatin} ({selectedMapelObj?.namaArab})</strong> • Kelas: <strong>{selectedKelasObj?.namaKelas}</strong> • Penguji: <strong>{currentUstadz}</strong>
              </p>
            </div>
            <div className="text-[11px] text-slate-500 italic">
              * Skala Nilai: 0 s.d 4 (Boleh desimal, contoh: 2.5, 3.7) • Batas Minimal Lulus: 2,7
            </div>
          </div>

          {/* TABEL SESUAI FORMAT FOTO CETAK */}
          <div className="overflow-x-auto relative">
            <table className="w-full text-left border-collapse text-xs select-none">
              <thead>
                {/* Baris Judul Kolom Utama (Warna Biru Langit Persis Format Cetak) */}
                <tr className="bg-[#b9e6fe] text-slate-900 font-black border-b border-slate-300 text-center">
                  <th className="py-2.5 px-2 border-r border-slate-300 w-12 sticky left-0 bg-[#b9e6fe] z-20">
                    No
                  </th>
                  <th className="py-2.5 px-3 border-r border-slate-300 text-left min-w-[200px] sticky left-12 bg-[#b9e6fe] z-20 shadow-xs">
                    NAMA SANTRI
                  </th>
                  <th colSpan={5} className="py-1 px-2 border-r border-slate-300 text-center bg-[#93d5fd]">
                    <div className="text-[11px] font-black uppercase tracking-wider">
                      Nilai Pertanyaan (Skala 0 – 4)
                    </div>
                    <div className="grid grid-cols-5 text-[11px] font-black mt-0.5 text-slate-800">
                      <span className="border-r border-sky-300 py-0.5">1</span>
                      <span className="border-r border-sky-300 py-0.5">2</span>
                      <span className="border-r border-sky-300 py-0.5">3</span>
                      <span className="border-r border-sky-300 py-0.5">4</span>
                      <span className="py-0.5">5</span>
                    </div>
                  </th>
                  <th className="py-2.5 px-2 border-r border-slate-300 w-16 bg-[#b9e6fe]">
                    Jumlah
                  </th>
                  <th className="py-2.5 px-2 border-r border-slate-300 w-20 bg-[#b9e6fe]">
                    Rata-Rata
                  </th>
                  <th className="py-2.5 px-2 w-28 bg-[#b9e6fe]">
                    Status / Remedial
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredSantri.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-8 text-center text-slate-400 font-semibold">
                      Tidak ada santri yang sesuai kriteria filter / pencarian.
                    </td>
                  </tr>
                ) : (
                  filteredSantri.map((santri, idx) => {
                    const scores = examItems[santri.id] || ['', '', '', '', ''];
                    const calc = calculateScore(scores);
                    const isUnsaved = unsavedSantriIds.has(santri.id);
                    const isRemedial = calc.count > 0 && !calc.isLulus;

                    return (
                      <tr
                        key={santri.id}
                        className={`transition hover:bg-sky-50/40 ${
                          isUnsaved
                            ? 'bg-amber-50/50'
                            : isRemedial
                            ? 'bg-rose-50/30'
                            : ''
                        }`}
                      >
                        {/* No Urut (Sticky Left) */}
                        <td className="py-2 px-2 text-center font-bold border-r border-slate-200 text-slate-600 sticky left-0 bg-inherit z-10">
                          {idx + 1}
                        </td>

                        {/* Nama Santri & NIS (Sticky Left) */}
                        <td className="py-2 px-3 font-bold text-slate-900 border-r border-slate-200 sticky left-12 bg-inherit z-10 shadow-xs">
                          <div className="uppercase leading-tight flex items-center justify-between gap-1">
                            <span>{santri.namaLengkap}</span>
                            {isUnsaved && (
                              <span
                                className="w-2 h-2 rounded-full bg-amber-500 animate-ping shrink-0"
                                title="Nilai diubah, belum disimpan ke DB"
                              />
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400 font-normal">
                            NIS: {santri.nis}
                          </div>
                        </td>

                        {/* 5 Kolom Input Nilai Pertanyaan */}
                        {[0, 1, 2, 3, 4].map((qIdx) => {
                          const val = scores[qIdx];
                          return (
                            <td
                              key={qIdx}
                              className="p-1 border-r border-slate-200 text-center w-14"
                            >
                              <div className="flex flex-col items-center gap-0.5">
                                <input
                                  type="number"
                                  min="0"
                                  max="4"
                                  step="0.1"
                                  inputMode="decimal"
                                  placeholder="—"
                                  value={val}
                                  onChange={(e) => {
                                    const rawVal = e.target.value;
                                    if (rawVal === '') {
                                      handleScoreChange(santri.id, qIdx, '');
                                    } else {
                                      const num = parseFloat(rawVal);
                                      if (!isNaN(num)) {
                                        // Batasi antara 0 dan 4
                                        const clamped = Math.min(4, Math.max(0, num));
                                        handleScoreChange(santri.id, qIdx, clamped);
                                      }
                                    }
                                  }}
                                  className={`w-12 text-center py-1.5 rounded-lg border font-black text-xs transition focus:outline-none focus:ring-2 focus:ring-emerald-600 ${
                                    val === ''
                                      ? 'border-slate-300 bg-white text-slate-400'
                                      : Number(val) >= 2.7
                                      ? 'border-emerald-400 bg-emerald-50 text-emerald-950'
                                      : 'border-rose-300 bg-rose-50 text-rose-900'
                                  }`}
                                />
                                {/* Tombol Cepat Nilai Populer (Jika kosong atau ingin cepat ganti saat remedial) */}
                                <div className="flex items-center gap-0.5 text-[9px] font-bold text-slate-400 opacity-60 hover:opacity-100">
                                  <button
                                    type="button"
                                    onClick={() => setQuickScore(santri.id, qIdx, 4)}
                                    className="px-1 hover:text-emerald-700 hover:bg-slate-200 rounded"
                                    title="Nilai 4 (Sempurna)"
                                  >
                                    4
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setQuickScore(santri.id, qIdx, 3)}
                                    className="px-1 hover:text-emerald-700 hover:bg-slate-200 rounded"
                                    title="Nilai 3 (75%)"
                                  >
                                    3
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setQuickScore(santri.id, qIdx, 2)}
                                    className="px-1 hover:text-emerald-700 hover:bg-slate-200 rounded"
                                    title="Nilai 2 (50%)"
                                  >
                                    2
                                  </button>
                                </div>
                              </div>
                            </td>
                          );
                        })}

                        {/* Jumlah Nilai */}
                        <td className="py-2 px-2 text-center font-bold border-r border-slate-200 bg-slate-50/70 text-slate-700">
                          {calc.count > 0 ? calc.sum.toFixed(1) : '—'}
                        </td>

                        {/* Rata-Rata */}
                        <td
                          className={`py-2 px-2 text-center font-black border-r border-slate-200 bg-slate-50/90 text-sm ${
                            calc.avg === null
                              ? 'text-slate-300'
                              : calc.isLulus
                              ? 'text-emerald-700'
                              : 'text-rose-600'
                          }`}
                        >
                          {calc.avg !== null ? calc.avg.toFixed(2) : '—'}
                        </td>

                        {/* Status Kelulusan / Remedial */}
                        <td className="py-2 px-2 text-center font-bold">
                          {calc.avg === null ? (
                            <span className="text-slate-300 font-normal text-[11px]">—</span>
                          ) : calc.isLulus ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-900 text-[10px] font-black border border-emerald-300">
                              <Check className="w-3 h-3 text-emerald-700" />
                              <span>LULUS</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-rose-100 text-rose-900 text-[10px] font-black border border-rose-300 animate-pulse">
                              <AlertTriangle className="w-3 h-3 text-rose-600" />
                              <span>REMEDIAL</span>
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Footer Tabel dengan Tombol Simpan Cepat Bawah */}
          <div className="p-3.5 bg-slate-50 border-t border-slate-300 flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs text-slate-600 font-semibold">
              Menampilkan <strong>{filteredSantri.length}</strong> dari <strong>{santriInKelas.length}</strong> santri kelas {selectedKelasObj?.namaKelas}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSaveAllChanges}
                disabled={isSaving}
                className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 active:scale-98 text-white font-black text-xs flex items-center gap-2 shadow-sm cursor-pointer disabled:opacity-50"
              >
                <Save className="w-4 h-4 text-amber-300" />
                <span>
                  {isSaving
                    ? 'Menyimpan...'
                    : unsavedSantriIds.size > 0
                    ? `Simpan (${unsavedSantriIds.size})`
                    : 'Simpan'}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* KARTU CATATAN PENSKORAN RESMI (PERSIS DOKUMEN CETAK DI FOTO)   */}
        {/* ============================================================== */}
        <div className="bg-sky-50/80 border-2 border-sky-300 rounded-2xl p-4 sm:p-5 text-xs text-sky-950 space-y-2.5 shadow-2xs">
          <div className="font-black flex items-center gap-2 text-sky-900">
            <span className="px-3 py-1 rounded-full bg-sky-200 text-sky-900 font-black text-xs uppercase tracking-wide border border-sky-300">
              Catatan Penilaian :
            </span>
          </div>
          <ol className="list-decimal pl-5 space-y-1.5 text-slate-700 font-medium leading-relaxed">
            <li>
              Guru memberikan <strong>3 – 5 pertanyaan</strong> untuk setiap santri.
            </li>
            <li>
              Guru memberikan nilai dari angka <strong>0 – 4</strong> dan boleh menggunakan nilai pecahan / desimal.
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mt-2 font-bold text-[11px] text-slate-900">
                <div className="bg-white p-2 rounded-xl border border-sky-200 shadow-2xs">
                  <div className="text-emerald-700 text-base font-black">4</div>
                  <div className="text-[10px] text-slate-600">Menjawab sempurna</div>
                </div>
                <div className="bg-white p-2 rounded-xl border border-sky-200 shadow-2xs">
                  <div className="text-emerald-700 text-base font-black">3</div>
                  <div className="text-[10px] text-slate-600">Menjawab 75%</div>
                </div>
                <div className="bg-white p-2 rounded-xl border border-sky-200 shadow-2xs">
                  <div className="text-amber-700 text-base font-black">2</div>
                  <div className="text-[10px] text-slate-600">Menjawab 50%</div>
                </div>
                <div className="bg-white p-2 rounded-xl border border-sky-200 shadow-2xs">
                  <div className="text-rose-700 text-base font-black">1</div>
                  <div className="text-[10px] text-slate-600">Menjawab salah</div>
                </div>
                <div className="bg-white p-2 rounded-xl border border-sky-200 shadow-2xs">
                  <div className="text-slate-400 text-base font-black">0</div>
                  <div className="text-[10px] text-slate-600">Tidak menjawab sama sekali</div>
                </div>
              </div>
            </li>
            <li className="pt-1">
              <span className="inline-block px-3 py-1 rounded-lg bg-amber-100 text-amber-950 font-black border border-amber-300">
                Santri dinyatakan LULUS jika memperoleh rata-rata minimal 2,7.
              </span>
            </li>
            <li>
              <span className="text-slate-600 font-normal">
                Bagi santri dengan status <strong className="text-rose-600">REMEDIAL</strong> (&lt; 2.7), guru dapat langsung memperbarui nilai pertanyaan pada kolom di atas saat ujian susulan / remedial berlangsung, lalu klik tombol <strong className="text-emerald-700">"Simpan"</strong>.
              </span>
            </li>
          </ol>
        </div>
      </main>
    </div>
  );
}
