import React, { useState, useMemo, useEffect, useRef } from 'react';
import gsap from 'gsap';
import {
  User,
  BookOpen,
  Layers,
  AlertTriangle,
  ArrowRight,
  Search,
  Check,
  LogOut,
  Save,
  Sparkles,
  ChevronDown
} from 'lucide-react';
import { PainterKidScene } from './PainterKidScene';
import { runLiquidSplash } from '../../utils/liquidSplash';
import { normalizeTingkat, GuruItem } from '../../constants/initialData';
import { isMapelForKelas } from '../../utils/academicHelpers';
import { BaliBinaInsaniLogo } from '../common/BaliBinaInsaniLogo';

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

  // Animasi GSAP Karakter Santri Melempar Ember & Munculnya Kartu Login
  const stageRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const loginLayerRef = useRef<HTMLDivElement>(null);
  const cancelSplashRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (isLoggedIn) return;
    const stage = stageRef.current;
    const scene = sceneRef.current;
    const loginLayer = loginLayerRef.current;
    if (!stage || !scene || !loginLayer) return;

    const ctx = gsap.context(() => {
      const kidRoot = scene.querySelector('[data-part="kid-root"]');
      const kidBody = scene.querySelector('[data-part="kid-body-group"]');
      const kidShadow = scene.querySelector('[data-part="kid-shadow"]');
      const legFront = scene.querySelector('[data-part="leg-front"]');
      const legBack = scene.querySelector('[data-part="leg-back"]');
      const armFront = scene.querySelector('[data-part="arm-front"]');
      const armBack = scene.querySelector('[data-part="arm-back"]');
      const bucket = scene.querySelector('[data-part="bucket"]');
      const fluidCanvas = scene.querySelector('[data-part="fluid-canvas"]') as HTMLCanvasElement | null;
      const splashCore = scene.querySelector('[data-part="splash-core"]');
      const staggerItems = loginLayer.querySelectorAll('.gs-stagger');

      const exitDistance = Math.max(window.innerWidth + 280, 1320);

      // Initial states (Kartu login dan komponen tersembunyi dahulu)
      gsap.set(loginLayer, { opacity: 0, scale: 0.78, y: 18, pointerEvents: 'none' });
      gsap.set(staggerItems, { opacity: 0, y: 12 });
      gsap.set(splashCore, { scale: 0, opacity: 0, svgOrigin: '400 300' });

      gsap.set(kidRoot, { x: -380, opacity: 1 });
      gsap.set([legFront, legBack], { svgOrigin: '106 196' });
      gsap.set(legFront, { rotation: -20 });
      gsap.set(legBack, { rotation: 20 });
      gsap.set(armFront, { svgOrigin: '114 140', rotation: 0 });
      gsap.set(armBack, { svgOrigin: '126 144', rotation: 0 });
      gsap.set(bucket, { transformOrigin: '29px 10px', rotation: -7 });
      gsap.set(kidBody, { svgOrigin: '108 190', rotation: 0, y: 0 });
      gsap.set(kidShadow, { svgOrigin: '110 252', scaleX: 1 });

      const tl = gsap.timeline();

      // 1. Santri berjalan masuk dari kiri membawa ember (0s -> 2.16s, 8 langkah)
      tl.to(kidRoot, { x: 0, duration: 2.16, ease: 'none' }, 0)
        .to(kidBody, { y: -4, repeat: 7, yoyo: true, duration: 0.27, ease: 'sine.inOut' }, 0)
        .to(kidShadow, { scaleX: 0.92, repeat: 7, yoyo: true, duration: 0.27, ease: 'sine.inOut' }, 0)
        .to(legFront, { rotation: 20, repeat: 7, yoyo: true, duration: 0.27, ease: 'sine.inOut' }, 0)
        .to(legBack, { rotation: -20, repeat: 7, yoyo: true, duration: 0.27, ease: 'sine.inOut' }, 0)
        .to(armBack, { rotation: 10, repeat: 7, yoyo: true, duration: 0.27, ease: 'sine.inOut' }, 0)
        .to(bucket, { rotation: 8, repeat: 7, yoyo: true, duration: 0.27, ease: 'sine.inOut' }, 0);

      // 2. Berhenti sejenak, ayunkan tangan & lempar air dari ember ke tengah layar (2.16s -> 2.66s)
      tl.to([legFront, legBack, armBack, kidBody], { rotation: 0, y: 0, duration: 0.16, ease: 'power2.out' }, 2.16)
        .to(kidShadow, { scaleX: 1, duration: 0.16 }, 2.16)
        .to(kidBody, { rotation: -10, duration: 0.22, ease: 'power2.out' }, 2.22)
        .to(armFront, { rotation: -52, duration: 0.22, ease: 'power2.out' }, 2.22)
        .to(bucket, { rotation: -24, duration: 0.22, ease: 'power2.out' }, 2.22)
        // Dorongan lemparan air ke depan!
        .to(kidBody, { rotation: 12, duration: 0.2, ease: 'power3.in' }, 2.44)
        .to(armFront, { rotation: 60, duration: 0.2, ease: 'power3.in' }, 2.44)
        .to(bucket, { rotation: 52, duration: 0.2, ease: 'power3.in' }, 2.44);

      // 3. Simulasi percikan partikel air (Liquid Splash) dari ember ke tengah layar
      tl.call(() => {
        if (!fluidCanvas || !bucket) return;
        const bucketRect = bucket.getBoundingClientRect();
        const stageRect = stage.getBoundingClientRect();
        const origin = {
          x: bucketRect.left + bucketRect.width * 0.7 - stageRect.left,
          y: bucketRect.top + bucketRect.height * 0.35 - stageRect.top,
        };
        const target = {
          x: stageRect.width * 0.5,
          y: stageRect.height * 0.5,
        };
        cancelSplashRef.current?.();
        cancelSplashRef.current = runLiquidSplash(fluidCanvas, origin, target);
      }, undefined, 2.5);

      // Aksen splash organik membesar di latar belakang
      tl.to(splashCore, { scale: 1.15, opacity: 0.7, duration: 0.35, ease: 'back.out(1.7)' }, 2.86)
        .to(splashCore, { scale: 1.55, opacity: 0.2, duration: 0.65, ease: 'power2.out' }, 3.18);

      // 4. Kartu login muncul mulus dari cipratan air (3.02s -> 3.7s)
      tl.to(loginLayer, { opacity: 1, scale: 1, y: 0, pointerEvents: 'auto', duration: 0.65, ease: 'back.out(1.25)' }, 3.02)
        .to(staggerItems, { opacity: 1, y: 0, duration: 0.42, stagger: 0.055, ease: 'power3.out' }, 3.24);

      // 5. Karakter santri tersenyum dan berjalan santai keluar ke arah kanan (3.25s -> selesai)
      tl.to([kidBody, armFront, bucket], { rotation: 0, duration: 0.3, ease: 'power2.out' }, 2.95)
        .set(legFront, { rotation: -16 }, 3.25)
        .set(legBack, { rotation: 16 }, 3.25)
        .set(bucket, { rotation: -5 }, 3.25)
        .to(kidRoot, { x: exitDistance, duration: 7.6, ease: 'none' }, 3.25)
        .to(kidBody, { y: -3, repeat: 18, yoyo: true, duration: 0.4, ease: 'sine.inOut' }, 3.25)
        .to(kidShadow, { scaleX: 0.94, repeat: 18, yoyo: true, duration: 0.4, ease: 'sine.inOut' }, 3.25)
        .to(legFront, { rotation: 16, repeat: 18, yoyo: true, duration: 0.4, ease: 'sine.inOut' }, 3.25)
        .to(legBack, { rotation: -16, repeat: 18, yoyo: true, duration: 0.4, ease: 'sine.inOut' }, 3.25)
        .to(bucket, { rotation: 6, repeat: 18, yoyo: true, duration: 0.4, ease: 'sine.inOut' }, 3.25)
        .to(kidRoot, { opacity: 0, duration: 0.4, ease: 'power1.out' }, 10.45);
    }, stage);

    return () => {
      cancelSplashRef.current?.();
      cancelSplashRef.current = null;
      ctx.revert();
    };
  }, [isLoggedIn]);

  // Daftar Kitab / Mapel yang sah diajarkan pada kelas yang sedang dipilih (berdasarkan Pengaturan Kitab Admin)
  const mapelsInSelectedLoginClass = useMemo(() => {
    if (!loginSelectedKelasId) return [];
    return mapelList.filter(
      (m) => m.statusAktif && isMapelForKelas(m, loginSelectedKelasId)
    );
  }, [mapelList, loginSelectedKelasId]);

  const [loginSelectedMapelId, setLoginSelectedMapelId] = useState<string>('');

  // Saat kelas berganti di form login, otomatis arahkan ke kitab pertama yang diajarkan di kelas tersebut
  useEffect(() => {
    if (mapelsInSelectedLoginClass.length > 0) {
      if (!mapelsInSelectedLoginClass.some((m) => m.id === loginSelectedMapelId)) {
        setLoginSelectedMapelId(mapelsInSelectedLoginClass[0].id);
      }
    } else {
      setLoginSelectedMapelId('');
    }
  }, [mapelsInSelectedLoginClass]);

  const [selectedMapelId, setSelectedMapelId] = useState<string>('');

  const handleLoginSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const finalName = loginInputName.trim();
    if (!finalName) {
      showToast('Silakan pilih nama guru / ustadz penguji terlebih dahulu!', 'warning');
      return;
    }
    if (!loginSelectedKelasId) {
      showToast('Silakan pilih kelas / rombel yang akan diuji!', 'warning');
      return;
    }
    if (!loginSelectedMapelId) {
      showToast('Silakan pilih mata pelajaran / kitab yang diuji!', 'warning');
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
    } catch (_) { }
    setIsLoggedIn(true);
    showToast(`Ahlan wa Sahlan, ${finalName}. Selamat bertugas!`, 'success');
  };

  const handleBackToSelection = () => {
    // Kembali ke form pemilihan kelas & kitab tanpa menghapus nama guru
    setIsLoggedIn(false);
  };

  const handleLogout = () => {
    try {
      sessionStorage.removeItem('guru_session_active');
      sessionStorage.removeItem('guru_session_name');
      sessionStorage.removeItem('guru_session_mapel');
      sessionStorage.removeItem('guru_session_kelas');
      localStorage.removeItem('guru_logged_in_name');
    } catch (_) { }
    setLoginInputName('');
    setIsLoggedIn(false);
  };

  // Mapel / Kitab yang sah diajarkan di kelas terpilih (sesuai Pengaturan Kitab & Peruntukan Kelas)
  const availableMapels = useMemo(() => {
    return mapelList.filter(
      (m) => m.statusAktif && isMapelForKelas(m, selectedKelasId)
    );
  }, [mapelList, selectedKelasId]);

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
    } catch (_) { }
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
    } catch (_) { }

    // Tandai bahwa ada perubahan yang belum disimpan permanen ke database
    setUnsavedSantriIds((prev) => new Set(prev).add(santriId));
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
  // 1. HALAMAN LOGIN GURU PENILAI (ANIMASI SANTRI MEMBAWA EMBER & MELEMPAR AIR)
  // =========================================================================
  if (!isLoggedIn) {
    return (
      <main
        ref={stageRef}
        className="min-h-screen relative flex flex-col justify-center items-center p-4 sm:p-6 select-none font-sans overflow-hidden"
        style={{
          background:
            'radial-gradient(circle at 20% 20%, rgba(255, 252, 220, 0.5) 0%, transparent 45%), radial-gradient(circle at 80% 80%, rgba(234, 179, 8, 0.38) 0%, transparent 45%), linear-gradient(180deg, #F7CE15 0%, #F3BE00 100%)'
        }}
      >
        {/* Karakter Santri Beranimasi & Canvas Simulasi Percikan Air GSAP */}
        <PainterKidScene ref={sceneRef} />

        {/* CONTAINER KARTU UTAMA (MUNCUL MULUS KETIKA AIR DILEMPAR DARI EMBER) */}
        <section ref={loginLayerRef} className="relative z-10 w-full max-w-[420px] my-auto">
          {/* KARTU LOGIN KUNING LEMBUT (BUTTERY CARD WITH GLASSER SHADOW) */}
          <div className="relative w-full bg-[#FDF3A7]/96 sm:bg-[#FDECA6]/96 backdrop-blur-md rounded-3xl p-6 sm:p-8 shadow-2xl shadow-amber-950/20 border border-amber-300/80 space-y-5 text-slate-800">
            {/* Header Brand & Logo Berbentuk Lingkaran Penuh */}
            <div className="flex flex-col items-center text-center space-y-2.5 gs-stagger">
              <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-full bg-white shadow-sm border border-amber-300/60 flex items-center justify-center p-1.5 overflow-hidden">
                <BaliBinaInsaniLogo customLogoUrl={pondok?.logoUrl} size={68} />
              </div>

              <div className="space-y-1">
                <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-400/35 text-amber-950 text-[10px] font-extrabold tracking-wider uppercase">
                  <Sparkles className="w-3 h-3 text-amber-700" />
                  Portal Ujian Syafahi
                </span>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-tight">
                  Ahlan wa Sahlan
                </h1>
                <p className="text-xs text-amber-950/75 font-semibold">
                  {pondok?.namaPondokLatin || 'Pondok Pesantren Bali Bina Insani'}
                </p>
              </div>
            </div>

            {/* Garis Pemisah Halus */}
            <div className="w-full h-px bg-gradient-to-r from-transparent via-amber-300/80 to-transparent gs-stagger" />

            {/* Form Pilihan Guru, Kelas, dan Kitab */}
            <form onSubmit={handleLoginSubmit} className="space-y-3.5 pt-0.5">
              {/* 1. Pilih Nama Guru */}
              <div className="space-y-1.5 text-left gs-stagger">
                <label className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                  <span>Nama Guru / Penguji :</span>
                </label>
                <div className="relative">
                  <select
                    value={loginInputName}
                    onChange={(e) => setLoginInputName(e.target.value)}
                    className="w-full px-4 py-3 pr-10 rounded-xl bg-white border border-amber-200/90 text-xs sm:text-sm font-semibold text-slate-900 cursor-pointer shadow-xs focus:ring-3 focus:ring-amber-500/25 focus:border-amber-500 focus:outline-none transition appearance-none"
                  >
                    <option value="">-- Pilih Nama Guru --</option>
                    {teacherListFromAdmin.map((guru) => (
                      <option key={guru} value={guru}>
                        {guru}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-amber-700 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-70" />
                </div>
              </div>

              {/* 2. Pilih Kelas yang Diuji */}
              <div className="space-y-1.5 text-left gs-stagger">
                <label className="text-xs font-bold text-amber-950 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                    <span>Pilih Kelas yang Diuji :</span>
                  </span>
                  <span className="text-[10px] text-amber-800 font-bold">
                    {activeKelasList.length} Rombel Aktif
                  </span>
                </label>
                <div className="relative">
                  <select
                    value={loginSelectedKelasId}
                    onChange={(e) => setLoginSelectedKelasId(e.target.value)}
                    className="w-full px-4 py-3 pr-10 rounded-xl bg-white border border-amber-200/90 text-xs sm:text-sm font-semibold text-slate-900 cursor-pointer shadow-xs focus:ring-3 focus:ring-amber-500/25 focus:border-amber-500 focus:outline-none transition appearance-none"
                  >
                    {activeKelasList.map((k) => (
                      <option key={k.id} value={k.id}>
                        Kelas {k.namaKelas} (Tingkat {normalizeTingkat(k.tingkat, k.namaKelas)})
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-amber-700 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-70" />
                </div>
              </div>

              {/* 3. Pilih Mata Pelajaran / Kitab */}
              <div className="space-y-1.5 text-left gs-stagger">
                <label className="text-xs font-bold text-amber-950 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                    <span>Pilih Mata Pelajaran / Kitab :</span>
                  </span>
                  {mapelsInSelectedLoginClass.length > 0 && (
                    <span className="text-[10px] text-amber-900 font-extrabold bg-amber-200/70 px-2 py-0.5 rounded border border-amber-300">
                      ✓ {mapelsInSelectedLoginClass.length} Kitab
                    </span>
                  )}
                </label>
                <div className="relative">
                  <select
                    value={loginSelectedMapelId}
                    onChange={(e) => setLoginSelectedMapelId(e.target.value)}
                    disabled={mapelsInSelectedLoginClass.length === 0}
                    className="w-full px-4 py-3 pr-10 rounded-xl bg-white border border-amber-200/90 text-xs sm:text-sm font-semibold text-slate-900 cursor-pointer shadow-xs focus:ring-3 focus:ring-amber-500/25 focus:border-amber-500 focus:outline-none transition disabled:opacity-50 appearance-none"
                  >
                    {mapelsInSelectedLoginClass.length === 0 ? (
                      <option value="">(Belum ada kitab yang diatur)</option>
                    ) : (
                      mapelsInSelectedLoginClass.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.namaLatin} {m.namaArab ? `(${m.namaArab})` : ''}
                        </option>
                      ))
                    )}
                  </select>
                  <ChevronDown className="w-4 h-4 text-amber-700 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-70" />
                </div>
              </div>

              {/* Tombol Masuk Utama (Gradien Emas Cerah) */}
              <button
                type="submit"
                className="w-full py-3.5 sm:py-4 rounded-xl bg-gradient-to-b from-[#ffd426] to-[#f5b800] hover:from-[#facc15] hover:to-[#eab308] active:scale-[0.99] text-slate-950 font-extrabold text-xs sm:text-sm shadow-md shadow-amber-600/20 border border-amber-400/80 transition flex items-center justify-center gap-2 cursor-pointer mt-4 gs-stagger"
              >
                <span>Buka Tabel Lembar Ujian</span>
                <ArrowRight className="w-4 h-4 text-slate-950" />
              </button>
            </form>
          </div>
        </section>
      </main>
    );
  }

  // =========================================================================
  // 2. SETELAH LOGIN: RESPONSIF CERDAS (OTOMATIS DETEKSI LAPTOP VS SMARTPHONE)
  //    - Di Laptop / Layar Lebar: Tabel Kertas Resmi Pesantren Utuh
  //    - Di HP / Smartphone: Mode Kartu Ramah Jempol (Tanpa Geser Kanan-Kiri)
  // =========================================================================
  const namaKelasFormatted = selectedKelasObj?.namaKelas
    ? selectedKelasObj.namaKelas.toLowerCase().startsWith('kelas')
      ? selectedKelasObj.namaKelas
      : `Kelas ${selectedKelasObj.namaKelas}`
    : '';

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 flex flex-col font-sans">
      {/* HEADER UTAMA GURU PENILAI (RESPONSIF LAPTOP & HP) */}
      <header className="bg-gradient-to-r from-[#043324] via-[#064E3B] to-[#043324] text-white px-3 sm:px-6 py-2.5 sm:py-3 shadow-md sticky top-0 z-40 border-b border-emerald-600/40">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          {/* Baris 1: Judul Ringkas & Tombol Aksi di Mobile */}
          <div className="flex items-center justify-between sm:justify-start gap-2">
            <h1 className="text-sm sm:text-base font-black leading-tight tracking-wide text-emerald-50">
              Lembar Ujian Syafahi
            </h1>

            {/* Tombol Aksi Khusus Mobile (Header Baris 1) */}
            <div className="flex items-center gap-1.5 sm:hidden">
              <button
                type="button"
                onClick={handleSaveAllChanges}
                disabled={isSaving}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer shadow-xs ${unsavedSantriIds.size > 0
                  ? 'bg-amber-400 text-slate-950 ring-2 ring-amber-300 animate-pulse'
                  : 'bg-emerald-600 text-white border border-emerald-400/50'
                  }`}
                title="Simpan nilai ke database"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSaving ? '...' : unsavedSantriIds.size > 0 ? `Simpan (${unsavedSantriIds.size})` : 'Simpan'}</span>
              </button>

              <button
                type="button"
                onClick={handleBackToSelection}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-900/90 border border-emerald-600/60 text-emerald-100 text-xs font-semibold"
                title="Ganti Kelas / Kitab"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Ganti</span>
              </button>

              <button
                type="button"
                onClick={handleLogout}
                className="p-1.5 rounded-xl bg-emerald-950/90 border border-emerald-700/60 text-emerald-200 hover:text-white"
                title="Keluar"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Baris 2: Pita Info Sesi (Kelas, Mapel, Penguji) */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 text-xs">
            <span className="px-2.5 py-0.5 rounded-lg bg-emerald-900/90 text-amber-300 text-[11px] sm:text-xs font-bold border border-emerald-600/60 shrink-0 shadow-2xs">
              {namaKelasFormatted}
            </span>
            <span className="px-2.5 py-0.5 rounded-lg bg-emerald-900/90 text-white text-[11px] sm:text-xs font-semibold border border-emerald-600/60 shrink-0 truncate max-w-[180px] sm:max-w-none shadow-2xs">
              {selectedMapelObj?.namaLatin || ''} {selectedMapelObj?.namaArab ? `(${selectedMapelObj.namaArab})` : ''}
            </span>
            <span className="px-2.5 py-0.5 rounded-lg bg-emerald-950/90 text-emerald-200 text-[11px] sm:text-xs font-medium border border-emerald-700/60 shrink-0 truncate max-w-[170px] sm:max-w-none shadow-2xs">
              Penguji: <strong className="text-white font-bold">{currentUstadz}</strong>
            </span>
          </div>

          {/* Tombol Aksi di Layar Komputer / Laptop (Hidden on Mobile) */}
          <div className="hidden sm:flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleSaveAllChanges}
              disabled={isSaving}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer shadow-sm ${unsavedSantriIds.size > 0
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

            <button
              type="button"
              onClick={handleBackToSelection}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-900/80 hover:bg-emerald-800 border border-emerald-600/60 text-emerald-100 hover:text-white text-xs font-semibold transition cursor-pointer"
              title="Ganti kelas atau mata pelajaran yang dinilai"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Ganti Kelas / Sesi</span>
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700/60 text-emerald-200 hover:text-white text-xs font-semibold transition cursor-pointer"
              title="Keluar dan ganti nama guru penguji"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Keluar</span>
            </button>
          </div>
        </div>
      </header>

      {/* KONTEN UTAMA */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 space-y-3.5">
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
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:ring-2 focus:ring-emerald-600 focus:outline-none"
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
        {/* 1. TAMPILAN KHUSUS SMARTPHONE / HP (OTOMATIS DI LAYAR HP)     */}
        {/*    Mode Kartu Ramah Jempol: Tanpa Geser Kanan-Kiri             */}
        {/* ============================================================== */}
        <div className="block md:hidden space-y-3 pb-24">
          <div className="bg-sky-50/70 border border-sky-200 p-2.5 rounded-xl text-[11px] text-slate-600 flex items-center justify-between">
            <span>Standar Lulus: <strong>Minimal 2,7</strong> (Skala 0 s/d 4)</span>
            <span className="font-bold text-slate-800">{filteredSantri.length} Santri</span>
          </div>

          {filteredSantri.length === 0 ? (
            <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-400 font-semibold text-xs">
              Tidak ada santri yang sesuai kriteria filter / pencarian.
            </div>
          ) : (
            filteredSantri.map((santri, idx) => {
              const scores = examItems[santri.id] || ['', '', '', '', ''];
              const calc = calculateScore(scores);
              const isUnsaved = unsavedSantriIds.has(santri.id);
              const isRemedial = calc.count > 0 && !calc.isLulus;

              return (
                <div
                  key={santri.id}
                  className={`p-3.5 rounded-2xl border transition shadow-xs ${isUnsaved
                    ? 'border-amber-400 bg-amber-50/50 ring-1 ring-amber-300'
                    : isRemedial
                      ? 'border-rose-200 bg-rose-50/30'
                      : calc.isLulus
                        ? 'border-emerald-200 bg-emerald-50/20'
                        : 'border-slate-200 bg-white'
                    }`}
                >
                  {/* Baris Atas: Nomor, Nama Santri, & Status Kelulusan */}
                  <div className="flex items-start justify-between gap-2.5 border-b border-slate-100 pb-2.5">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-900 text-xs font-black flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                        {idx + 1}
                      </span>
                      <div className="min-w-0">
                        <h4 className="text-xs sm:text-sm font-black text-slate-900 leading-snug uppercase">
                          {santri.namaLengkap}
                        </h4>
                        <span className="text-[10px] text-slate-400 font-semibold tracking-wide">
                          NIS: {santri.nis}
                        </span>
                      </div>
                    </div>

                    {/* Badge Rata-Rata & Status */}
                    <div className="text-right shrink-0">
                      {calc.avg !== null ? (
                        <div className="flex items-center gap-1.5">
                          <div className="text-right">
                            <span className="text-[10px] text-slate-500 font-bold">Rata: </span>
                            <span
                              className={`text-xs font-black ${calc.isLulus ? 'text-emerald-700' : 'text-rose-600'
                                }`}
                            >
                              {calc.avg.toFixed(2)}
                            </span>
                          </div>
                          {calc.isLulus ? (
                            <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-900 text-[10px] font-black border border-emerald-300 flex items-center gap-0.5">
                              <Check className="w-3 h-3 text-emerald-700" />
                              <span>LULUS</span>
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-900 text-[10px] font-black border border-rose-300">
                              REMEDIAL
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-500 font-bold bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md">
                          Belum Dinilai
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 5 Kotak Input Nilai Soal (P1 - P5) Bersih, Luas & Ramah Sentuhan */}
                  <div className="mt-3 grid grid-cols-5 gap-2">
                    {[0, 1, 2, 3, 4].map((qIdx) => {
                      const val = scores[qIdx];
                      return (
                        <div key={qIdx} className="flex flex-col items-center">
                          <span className="text-[11px] font-extrabold text-slate-500 mb-1">
                            P{qIdx + 1}
                          </span>
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
                                  const clamped = Math.min(4, Math.max(0, num));
                                  handleScoreChange(santri.id, qIdx, clamped);
                                }
                              }
                            }}
                            className={`w-full text-center py-2.5 rounded-xl border-2 text-base font-black transition shadow-2xs focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-600 focus:bg-white ${val === ''
                              ? 'border-slate-200 bg-slate-50 text-slate-700 placeholder:text-slate-300'
                              : Number(val) >= 2.7
                                ? 'border-emerald-500 bg-emerald-50/80 text-emerald-950 font-black'
                                : 'border-rose-400 bg-rose-50/80 text-rose-900 font-black'
                              }`}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* ============================================================== */}
        {/* 2. TAMPILAN KHUSUS LAPTOP / KOMPUTER (OTOMATIS DI LAYAR BESAR) */}
        {/*    Format Tabel Kertas Fisik Asli Pesantren                    */}
        {/* ============================================================== */}
        <div className="hidden md:block bg-white rounded-2xl border-2 border-slate-300 shadow-sm overflow-hidden space-y-0">
          {/* Header Lembar Ujian Gaya Kertas Cetak */}
          <div className="p-3.5 sm:p-4 border-b border-slate-300 bg-sky-50/50 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-xs sm:text-sm font-black text-slate-900 tracking-wide uppercase">
                LEMBAR PENILAIAN UJIAN SYAFAHI
              </h3>
              <p className="text-[11px] text-slate-600 font-medium">
                Mata Pelajaran: <strong>{selectedMapelObj?.namaLatin} ({selectedMapelObj?.namaArab})</strong> • Kelas: <strong>{namaKelasFormatted}</strong> • Penguji: <strong>{currentUstadz}</strong>
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
                    const rowSolidBg = isUnsaved ? 'bg-amber-50' : isRemedial ? 'bg-rose-50' : 'bg-white';

                    return (
                      <tr
                        key={santri.id}
                        className={`transition hover:bg-sky-50/40 ${rowSolidBg}`}
                      >
                        {/* No Urut (Sticky Left dengan background solid bebas ghosting) */}
                        <td className={`py-2 px-2 text-center font-bold border-r border-slate-200 text-slate-600 sticky left-0 z-10 ${rowSolidBg}`}>
                          {idx + 1}
                        </td>

                        {/* Nama Santri & NIS (Sticky Left dengan background solid bebas ghosting) */}
                        <td className={`py-2 px-3 font-bold text-slate-900 border-r border-slate-200 sticky left-12 z-10 shadow-xs ${rowSolidBg}`}>
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
                                        const clamped = Math.min(4, Math.max(0, num));
                                        handleScoreChange(santri.id, qIdx, clamped);
                                      }
                                    }
                                  }}
                                  className={`w-14 text-center py-1.5 rounded-lg border-2 font-black text-sm transition focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white shadow-2xs ${val === ''
                                    ? 'border-slate-300 bg-slate-50/70 text-slate-700 placeholder:text-slate-300'
                                    : Number(val) >= 2.7
                                      ? 'border-emerald-500 bg-emerald-50/70 text-emerald-950'
                                      : 'border-rose-400 bg-rose-50/70 text-rose-900'
                                    }`}
                                />
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
                          className={`py-2 px-2 text-center font-black border-r border-slate-200 bg-slate-50/90 text-sm ${calc.avg === null
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
              Menampilkan <strong>{filteredSantri.length}</strong> dari <strong>{santriInKelas.length}</strong> santri {namaKelasFormatted}
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

        {/* TOMBOL SIMPAN MELAYANG KHUSUS HP (FLOATING ACTION BAR DI HP) */}
        {unsavedSantriIds.size > 0 && (
          <div className="md:hidden fixed bottom-3 left-3 right-3 z-50 animate-in slide-in-from-bottom duration-200">
            <button
              type="button"
              onClick={handleSaveAllChanges}
              disabled={isSaving}
              className="w-full py-3.5 px-4 rounded-2xl bg-amber-500 hover:bg-amber-400 active:scale-98 text-slate-950 font-black text-xs sm:text-sm shadow-xl flex items-center justify-center gap-2 border-2 border-amber-300 ring-4 ring-black/10 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Menyimpan ke Database...' : `Simpan ${unsavedSantriIds.size} Nilai Baru ke Database`}</span>
            </button>
          </div>
        )}

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
