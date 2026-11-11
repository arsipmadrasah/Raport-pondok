import React, { useState, useEffect, useMemo } from 'react';
import {
  LayoutDashboard,
  Users,
  Layers,
  FileSpreadsheet,
  TableProperties,
  Printer,
  Settings,
  Calendar,
  BookOpen,
  Award,
  ChevronDown,
  X,
  User,
  Menu,
  Database,
  RefreshCw,
  Sparkles,
  Copy,
  AlertTriangle,
  CheckCircle2,
  GraduationCap
} from 'lucide-react';

import {
  INITIAL_PONDOK,
  INITIAL_TAHUN_AJARAN,
  INITIAL_SEMESTERS,
  INITIAL_KELAS,
  INITIAL_KELOMPOK_MAPEL,
  INITIAL_MAPEL,
  INITIAL_PREDIKAT,
  INITIAL_SANTRI,
  INITIAL_NILAI,
  INITIAL_LOGS,
  INITIAL_GURU,
  GuruItem,
  normalizeTingkat
} from './constants/initialData';

import {
  isMapelForKelas,
  calculateClassAcademicReport,
  getWitaTimeString
} from './utils/academicHelpers';

import {
  SupabaseDB,
  SUPABASE_CONFIG,
  SUPABASE_SQL_MIGRATION
} from './services/supabase';

import { BaliBinaInsaniLogo } from './components/common/BaliBinaInsaniLogo';
import {
  SidebarMosqueSilhouette,
  HeaderIslamicPattern,
  MihrabArchMotif,
  MushafWatermark
} from './components/layout/IslamicDecorations';

import { DashboardView } from './components/dashboard/DashboardView';
import { SantriMasterView } from './components/santri/SantriMasterView';
import { GuruMasterView } from './components/guru/GuruMasterView';
import { KelasMasterView } from './components/kelas/KelasMasterView';
import { InputNilaiSpreadsheetView } from './components/nilai/InputNilaiSpreadsheetView';
import { RekapNilaiView } from './components/nilai/RekapNilaiView';
import { CetakRaporView } from './components/rapor/CetakRaporView';
import { TahunAjaranView } from './components/pengaturan/TahunAjaranView';
import { MapelMasterView } from './components/pengaturan/MapelMasterView';
import { PredikatConfigView } from './components/pengaturan/PredikatConfigView';
import { PengaturanPondokView } from './components/pengaturan/PengaturanPondokView';
import { UjianLisanGuruView, DUMMY_USTADZ_LIST } from './components/ujian/UjianLisanGuruView';

// STRUKTUR MENU UTAMA TERBARU
const MAIN_NAV_ITEMS = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    subMenus: []
  },
  {
    id: 'santri',
    label: 'Data Santri',
    icon: Users,
    subMenus: []
  },
  {
    id: 'guru',
    label: 'Data Guru',
    icon: GraduationCap,
    subMenus: []
  },
  {
    id: 'kelas',
    label: 'Pengaturan Kelas',
    icon: Layers,
    subMenus: []
  },
  {
    id: 'nilai-rapor',
    label: 'Nilai & Rapor',
    icon: FileSpreadsheet,
    subMenus: [
      { id: 'input-nilai', label: 'Input Nilai', icon: FileSpreadsheet },
      { id: 'rekap-nilai', label: 'Rekap Nilai', icon: TableProperties },
      { id: 'cetak-rapor', label: 'Cetak Rapor', icon: Printer }
    ]
  },
  {
    id: 'pengaturan',
    label: 'Pengaturan',
    icon: Settings,
    subMenus: [
      { id: 'tahun-ajaran', label: 'Tahun Ajaran', icon: Calendar },
      { id: 'mapel', label: 'Mata Pelajaran / Kitab', icon: BookOpen },
      { id: 'predikat', label: 'Pengaturan Predikat', icon: Award },
      { id: 'pengaturan-pondok', label: 'Pengaturan Pondok', icon: Settings }
    ]
  }
];

const MENU_ITEMS = MAIN_NAV_ITEMS;

const isPathGuru = () => {
  if (typeof window === 'undefined') return false;
  const path = window.location.pathname.toLowerCase();
  const hash = window.location.hash.toLowerCase();
  return (
    path === '/guru' ||
    path.startsWith('/guru/') ||
    hash === '#/guru' ||
    hash.startsWith('#/guru')
  );
};

export default function App() {
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [activeSubMenu, setActiveSubMenu] = useState('input-nilai');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [showYearPicker, setShowYearPicker] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isGuruMode, setIsGuruMode] = useState(isPathGuru);
  const [currentUstadz, setCurrentUstadz] = useState(DUMMY_USTADZ_LIST[0]);

  const [pondok, setPondok] = useState(INITIAL_PONDOK);
  const [tahunAjaranList, setTahunAjaranList] = useState(INITIAL_TAHUN_AJARAN);
  const [semesterList, setSemesterList] = useState(INITIAL_SEMESTERS);
  const [kelasList, setKelasList] = useState(INITIAL_KELAS);
  const [kelompokMapelList, setKelompokMapelList] = useState(INITIAL_KELOMPOK_MAPEL);
  const [mapelList, setMapelList] = useState(() => {
    let savedKitabKelasMap = {};
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('rapor_kitab_kelas_map');
        if (raw) savedKitabKelasMap = JSON.parse(raw);
      } catch (_) { }
    }
    return INITIAL_MAPEL.map((m) => ({
      ...m,
      targetKelasIds: savedKitabKelasMap[m.id] || m.targetKelasIds || ['ALL']
    }));
  });
  const [predikatList, setPredikatList] = useState(INITIAL_PREDIKAT);
  const [santriList, setSantriList] = useState(INITIAL_SANTRI);
  const [guruList, setGuruList] = useState<GuruItem[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('rapor_guru_list');
        if (raw) {
          const parsed: GuruItem[] = JSON.parse(raw);
          return parsed.map((g) => {
            const match = INITIAL_GURU.find((ig) => ig.id === g.id || ig.nama === g.nama);
            return {
              ...g,
              kelasIds: g.kelasIds && g.kelasIds.length > 0 ? g.kelasIds : (match?.kelasIds || [])
            };
          });
        }
      } catch (_) {}
    }
    return INITIAL_GURU;
  });
  const [nilaiList, setNilaiList] = useState(INITIAL_NILAI);
  const [logs, setLogs] = useState(INITIAL_LOGS);

  const [dbStatus, setDbStatus] = useState({
    state: 'checking',
    message: 'Menyinkronkan data latar belakang...',
    lastSync: null
  });
  const [showDbModal, setShowDbModal] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);

  const activeTA = useMemo(
    () => tahunAjaranList.find((t) => t.isActive) || tahunAjaranList[0],
    [tahunAjaranList]
  );
  const activeSemester = useMemo(
    () => semesterList.find((s) => s.isActive) || semesterList[0],
    [semesterList]
  );

  const [selectedTahunAjaranId, setSelectedTahunAjaranId] = useState(activeTA?.id || 'ta-2026');
  const [selectedSemesterId, setSelectedSemesterId] = useState(activeSemester?.id || 'sem-2026-1');
  const [selectedKelasId, setSelectedKelasId] = useState('kls-7a');

  const currentSelectedTA = useMemo(
    () => tahunAjaranList.find((t) => t.id === selectedTahunAjaranId) || activeTA,
    [tahunAjaranList, selectedTahunAjaranId, activeTA]
  );
  const currentSelectedSemester = useMemo(
    () => semesterList.find((s) => s.id === selectedSemesterId) || activeSemester,
    [semesterList, selectedSemesterId, activeSemester]
  );

  const enterGuruMode = () => {
    setIsGuruMode(true);
    if (typeof window !== 'undefined' && window.location.pathname !== '/guru') {
      window.history.pushState(null, '', '/guru');
    }
  };

  const exitGuruMode = () => {
    setIsGuruMode(false);
    if (
      typeof window !== 'undefined' &&
      (window.location.pathname === '/guru' || window.location.pathname.startsWith('/guru'))
    ) {
      window.history.pushState(null, '', '/');
    }
  };

  // Sinkronisasi tombol Back/Forward browser dengan URL /guru
  useEffect(() => {
    const handlePopState = () => {
      setIsGuruMode(isPathGuru());
    };
    window.addEventListener('popstate', handlePopState);
    window.addEventListener('hashchange', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('hashchange', handlePopState);
    };
  }, []);

  const handleNavigate = (menuId, subMenuId = null, kelasId = null) => {
    if (menuId === 'ujian-guru' || subMenuId === 'ujian-guru') {
      enterGuruMode();
      return;
    }

    if (kelasId) setSelectedKelasId(kelasId);

    if (menuId === 'input-nilai' || menuId === 'rekap-nilai' || menuId === 'cetak-rapor') {
      setActiveMenu('nilai-rapor');
      setActiveSubMenu(menuId);
    } else if (
      menuId === 'tahun-ajaran' ||
      menuId === 'mapel' ||
      menuId === 'predikat' ||
      menuId === 'pengaturan-pondok'
    ) {
      setActiveMenu('pengaturan');
      setActiveSubMenu(menuId);
    } else if (menuId === 'nilai-rapor') {
      setActiveMenu('nilai-rapor');
      if (subMenuId) setActiveSubMenu(subMenuId);
      else if (!['input-nilai', 'rekap-nilai', 'cetak-rapor'].includes(activeSubMenu)) {
        setActiveSubMenu('input-nilai');
      }
    } else if (menuId === 'pengaturan') {
      setActiveMenu('pengaturan');
      if (subMenuId) setActiveSubMenu(subMenuId);
      else if (
        !['tahun-ajaran', 'mapel', 'predikat', 'pengaturan-pondok'].includes(activeSubMenu)
      ) {
        setActiveSubMenu('tahun-ajaran');
      }
    } else {
      setActiveMenu(menuId);
      if (subMenuId) setActiveSubMenu(subMenuId);
    }
    setIsMobileSidebarOpen(false);
  };

  // Redirect legacy menu IDs seamlessly if set from any internal callbacks
  useEffect(() => {
    if (['input-nilai', 'rekap-nilai', 'cetak-rapor'].includes(activeMenu)) {
      setActiveSubMenu(activeMenu);
      setActiveMenu('nilai-rapor');
    } else if (['tahun-ajaran', 'mapel', 'predikat', 'pengaturan-pondok'].includes(activeMenu)) {
      setActiveSubMenu(activeMenu);
      setActiveMenu('pengaturan');
    }
  }, [activeMenu]);

  const headerMeta = useMemo(() => {
    switch (activeMenu) {
      case 'dashboard':
        return {
          title: 'Dashboard',
          subtitle: 'Ringkasan data akademik dan rapor santri'
        };
      case 'santri':
        return {
          title: 'Data Santri',
          subtitle: 'Manajemen data santri, NIS, kelas, dan status keaktifan'
        };
      case 'guru':
        return {
          title: 'Data Guru',
          subtitle: 'Manajemen data guru/ustadz penguji dan penetapan mata pelajaran (kitab) yang diajarkan'
        };
      case 'kelas':
        return {
          title: 'Pengaturan Kelas',
          subtitle: 'Pengaturan rombel, tingkat (1-6), wali kelas, dan kenaikan kelas'
        };
      case 'nilai-rapor':
        return {
          title: 'Nilai & Rapor',
          subtitle: 'Pengolahan nilai komprehensif, rekapitulasi, dan pencetakan lembar rapor'
        };
      case 'pengaturan':
        return {
          title: 'Pengaturan',
          subtitle: 'Tahun ajaran, kurikulum mata pelajaran/kitab, predikat, dan profil pondok'
        };
      default:
        return {
          title: 'E-Rapor Pesantren',
          subtitle: 'Pondok Pesantren Bali Bina Insani'
        };
    }
  }, [activeMenu]);

  const [toast, setToast] = useState(null);
  const showToast = (message, type = 'success') => {
    setToast({ message, type, id: Date.now() });
    setTimeout(() => {
      setToast((prev) => (prev && prev.message === message ? null : prev));
    }, 3400);
  };

  // Fungsi Terpusat untuk Update Kelas (Nama Kelas, Tingkat, Wali Kelas) ke State & Supabase
  const updateKelasData = async (kelasId, { namaKelas, tingkat, waliKelas }) => {
    const target = kelasList.find((k) => k.id === kelasId);
    if (!target) return false;

    const cleanNama = String(namaKelas ?? target.namaKelas).trim();
    if (!cleanNama) {
      showToast('Nama kelas tidak boleh kosong!', 'warning');
      return false;
    }

    const duplicate = kelasList.find(
      (k) => k.id !== kelasId && k.namaKelas.toLowerCase() === cleanNama.toLowerCase()
    );
    if (duplicate) {
      showToast(`Nama kelas "${cleanNama}" sudah dipakai kelas lain!`, 'warning');
      return false;
    }

    const cleanTingkat = Number(tingkat ?? target.tingkat ?? 1);
    const cleanWali = String(waliKelas ?? target.waliKelas ?? '').trim() || target.waliKelas;

    const updatedObj = {
      ...target,
      namaKelas: cleanNama,
      tingkat: cleanTingkat,
      waliKelas: cleanWali
    };

    setKelasList((prev) => prev.map((k) => (k.id === kelasId ? updatedObj : k)));

    try {
      await SupabaseDB.updateById('kelas', kelasId, {
        nama_kelas: cleanNama,
        tingkat: cleanTingkat,
        wali_kelas: cleanWali
      });
    } catch (_) {
      try {
        await SupabaseDB.upsert('kelas', {
          id: updatedObj.id,
          nama_kelas: cleanNama,
          nama_arab: updatedObj.namaArab || '',
          tingkat: cleanTingkat,
          wali_kelas: cleanWali,
          nip_wali: updatedObj.nipWali || '',
          kapasitas: updatedObj.kapasitas || 30,
          is_active: true
        });
      } catch (_) { }
    }

    addLog(
      'EDIT_KELAS',
      `Mengubah kelas menjadi "${cleanNama}" (Tingkat ${cleanTingkat} • Wali: ${cleanWali})`
    );
    showToast(`Kelas berhasil diperbarui menjadi "${cleanNama}" (Tingkat ${cleanTingkat})!`);
    return true;
  };

  const persistPondokProfileToSupabase = async (updatedPondok) => {
    await SupabaseDB.upsert('pondok_profile', {
      id: 'main-profile',
      nama_pondok_latin: updatedPondok.namaPondokLatin,
      nama_pondok_arab: updatedPondok.namaPondokArab,
      alamat: updatedPondok.alamat || '',
      kabupaten_kota: updatedPondok.kabupatenKota || 'Kerambitan',
      telepon: updatedPondok.telepon || '',
      email: updatedPondok.email || '',
      website: updatedPondok.website || '',
      logo_url: updatedPondok.logoUrl || '',
      nama_pimpinan: updatedPondok.namaPimpinan,
      nip_pimpinan: updatedPondok.nipPimpinan || 'Direktur',
      tanggal_cetak_masehi: updatedPondok.tanggalCetakMasehi || '20 Juni 2024M',
      tanggal_cetak_hijriyah: updatedPondok.tanggalCetakHijriyah || '13 Dzulhijjah 1445H',
      tanggal_cetak_default:
        updatedPondok.tanggalCetakDefault || '20 Juni 2024M / 13 Dzulhijjah 1445H'
    });
  };

  const moveSantriToKelas = async (santriIds, targetKelasId, customReason = '') => {
    if (!santriIds || santriIds.length === 0 || !targetKelasId) return;
    const targetKelas = kelasList.find((k) => k.id === targetKelasId);
    if (!targetKelas) return;

    const updatedSantriAll = santriList.map((s) =>
      santriIds.includes(s.id) ? { ...s, kelasId: targetKelasId } : s
    );
    const affectedRows = updatedSantriAll.filter((s) => santriIds.includes(s.id));

    setSantriList(updatedSantriAll);

    try {
      await SupabaseDB.upsert(
        'santri',
        affectedRows.map((s) => ({
          id: s.id,
          nis: s.nis,
          nisn: s.nisn || '',
          nama_lengkap: s.namaLengkap,
          nama_arab: s.namaArab || '',
          jenis_kelamin: s.jenisKelamin || 'L',
          tempat_lahir: s.tempatLahir || '',
          tanggal_lahir: s.tanggalLahir || null,
          nama_wali: s.namaWali || '',
          alamat: s.alamat || '',
          tahun_masuk: s.tahunMasuk || 2023,
          status_aktif: s.statusAktif,
          kelas_id: targetKelasId
        }))
      );
    } catch (_) { }

    const logDesc =
      customReason ||
      `Memindahkan ${affectedRows.length} santri ke Kelas ${targetKelas.namaKelas} (Tingkat ${normalizeTingkat(
        targetKelas.tingkat,
        targetKelas.namaKelas
      )})`;
    addLog('MUTASI_NAIK_KELAS', logDesc);
    showToast(
      `Berhasil memindahkan ${affectedRows.length} santri ke Kelas ${targetKelas.namaKelas}!`
    );
  };

  const deleteMultipleSantri = async (santriIds, reasonLabel = 'Kelas 6 Akhir') => {
    if (!santriIds || santriIds.length === 0) return;

    setSantriList((prev) => prev.filter((s) => !santriIds.includes(s.id)));
    setNilaiList((prev) => prev.filter((n) => !santriIds.includes(n.santriId)));

    try {
      await SupabaseDB.deleteByIds('santri', santriIds);
    } catch (_) { }

    addLog(
      'HAPUS_ALUMNI_TINGKAT_6',
      `Menghapus ${santriIds.length} data santri (${reasonLabel}) setelah pengunduhan arsip`
    );
    showToast(
      `${santriIds.length} data santri (${reasonLabel}) telah dihapus. Kelas kini kosong & siap diisi kenaikan kelas!`
    );
  };

  const syncMissing6LevelsToSupabase = async (currentKelasRows = []) => {
    const existingLevels = new Set(
      currentKelasRows.map((k) => normalizeTingkat(k.tingkat, k.namaKelas || k.nama_kelas))
    );
    const existingNames = new Set(
      currentKelasRows.map((k) => String(k.namaKelas || k.nama_kelas || '').toLowerCase())
    );
    const missingDefaults = INITIAL_KELAS.filter(
      (defKls) =>
        !existingLevels.has(normalizeTingkat(defKls.tingkat, defKls.namaKelas)) &&
        !existingNames.has(defKls.namaKelas.toLowerCase())
    );

    if (missingDefaults.length === 0) return null;

    try {
      await SupabaseDB.upsert(
        'kelas',
        missingDefaults.map((k) => ({
          id: k.id,
          nama_kelas: k.namaKelas,
          nama_arab: k.namaArab,
          tingkat: normalizeTingkat(k.tingkat, k.namaKelas),
          wali_kelas: k.waliKelas,
          nip_wali: k.nipWali || '',
          kapasitas: k.kapasitas,
          is_active: true
        }))
      );
    } catch (_) { }

    return missingDefaults;
  };

  const seedInitialDataToSupabase = async (silent = false) => {
    setIsSeeding(true);
    try {
      await persistPondokProfileToSupabase(pondok);

      await SupabaseDB.upsert(
        'tahun_ajaran',
        INITIAL_TAHUN_AJARAN.map((t) => ({
          id: t.id,
          nama: t.nama,
          nama_arab: t.namaArab,
          is_active: t.isActive
        }))
      );

      await SupabaseDB.upsert(
        'semester',
        INITIAL_SEMESTERS.map((s) => ({
          id: s.id,
          tahun_ajaran_id: s.tahunAjaranId,
          nama: s.nama,
          nama_arab: s.namaArab,
          angka: s.angka,
          is_active: s.isActive
        }))
      );

      await SupabaseDB.upsert(
        'kelas',
        INITIAL_KELAS.map((k) => ({
          id: k.id,
          nama_kelas: k.namaKelas,
          nama_arab: k.namaArab,
          tingkat: normalizeTingkat(k.tingkat, k.namaKelas),
          wali_kelas: k.waliKelas,
          nip_wali: k.nipWali || '',
          kapasitas: k.kapasitas,
          is_active: k.isActive
        }))
      );

      await SupabaseDB.upsert(
        'kelompok_mapel',
        INITIAL_KELOMPOK_MAPEL.map((g) => ({
          id: g.id,
          kode: g.kode,
          nama_kelompok: g.namaKelompok,
          nama_arab: g.namaArab,
          urutan: g.urutan
        }))
      );

      await SupabaseDB.upsert(
        'mata_pelajaran',
        INITIAL_MAPEL.map((m) => ({
          id: m.id,
          kode_mapel: m.kodeMapel,
          nama_latin: m.namaLatin,
          nama_arab: m.namaArab,
          kelompok_id: m.kelompokId,
          urutan_tampil: m.urutanTampil,
          status_aktif: m.statusAktif,
          status_wajib: m.statusWajib
        }))
      );

      await SupabaseDB.upsert(
        'predikat_config',
        INITIAL_PREDIKAT.map((p) => ({
          id: p.id,
          batas_bawah: p.batasBawah,
          batas_atas: p.batasAtas,
          predikat_arab: p.predikatArab,
          predikat_latin: p.predikatLatin,
          keterangan: p.keterangan,
          urutan: p.urutan
        }))
      );

      await SupabaseDB.upsert(
        'santri',
        INITIAL_SANTRI.map((s) => ({
          id: s.id,
          nis: s.nis,
          nisn: s.nisn || '',
          nama_lengkap: s.namaLengkap,
          nama_arab: s.namaArab || '',
          jenis_kelamin: s.jenisKelamin || 'L',
          tempat_lahir: s.tempatLahir || '',
          tanggal_lahir: s.tanggalLahir || null,
          nama_wali: s.namaWali || '',
          alamat: s.alamat || '',
          tahun_masuk: s.tahunMasuk || 2023,
          status_aktif: s.statusAktif,
          kelas_id: s.kelasId
        }))
      );

      await SupabaseDB.upsert(
        'nilai',
        INITIAL_NILAI.map((n) => ({
          santri_id: n.santriId,
          semester_id: n.semesterId,
          mapel_id: n.mapelId,
          angka_nilai: n.angkaNilai
        })),
        'santri_id,semester_id,mapel_id'
      );

      try {
        await SupabaseDB.upsert(
          'guru',
          INITIAL_GURU.map((g) => ({
            id: g.id,
            nama: g.nama,
            mapel_ids: g.mapelIds || [],
            kelas_ids: g.kelasIds || [],
            status_aktif: g.statusAktif ?? true
          }))
        );
      } catch (_) {}

      if (!silent) {
        showToast('Data awal 6 Tingkat Kelas berhasil di-seed ke Supabase PostgreSQL!');
      }
      await checkAndLoadFromSupabase();
    } catch (err) {
      if (!silent) {
        showToast(`Gagal seed data: ${err.message}`, 'warning');
      }
    } finally {
      setIsSeeding(false);
    }
  };

  const checkAndLoadFromSupabase = async () => {
    setDbStatus((prev) => ({
      ...prev,
      state: 'checking',
      message: 'Menghubungkan ke Supabase PostgreSQL...'
    }));

    try {
      const pondokRows = await SupabaseDB.selectAll('pondok_profile');

      const [
        taRows,
        semRows,
        kelasRows,
        kelompokRows,
        mapelRows,
        predikatRows,
        santriRows,
        nilaiRows,
        logRows
      ] = await Promise.all([
        SupabaseDB.selectAll('tahun_ajaran', 'nama', true),
        SupabaseDB.selectAll('semester', 'angka', true),
        SupabaseDB.selectAll('kelas', 'tingkat', true),
        SupabaseDB.selectAll('kelompok_mapel', 'urutan', true),
        SupabaseDB.selectAll('mata_pelajaran', 'urutan_tampil', true),
        SupabaseDB.selectAll('predikat_config', 'urutan', true),
        SupabaseDB.selectAll('santri', 'nis', true),
        SupabaseDB.selectAll('nilai'),
        SupabaseDB.selectAll('log_aktivitas', 'created_at', false)
      ]);

      if (taRows.length === 0 && kelasRows.length === 0 && santriRows.length === 0) {
        await seedInitialDataToSupabase(true);
        return;
      }

      if (pondokRows.length > 0) {
        const p = pondokRows[0];
        setPondok({
          namaPondokLatin: p.nama_pondok_latin,
          namaPondokArab: p.nama_pondok_arab,
          alamat: p.alamat || '',
          kabupatenKota: p.kabupaten_kota || 'Kerambitan',
          telepon: p.telepon || '',
          email: p.email || '',
          website: p.website || '',
          logoUrl: p.logo_url || '',
          namaPimpinan: p.nama_pimpinan,
          nipPimpinan: p.nip_pimpinan || 'Direktur',
          tanggalCetakMasehi: p.tanggal_cetak_masehi || '20 Juni 2024M',
          tanggalCetakHijriyah: p.tanggal_cetak_hijriyah || '13 Dzulhijjah 1445H',
          tanggalCetakDefault: p.tanggal_cetak_default || '20 Juni 2024M / 13 Dzulhijjah 1445H'
        });
      }

      if (taRows.length > 0) {
        const loadedTas = taRows.map((t) => ({
          id: t.id,
          nama: t.nama,
          namaArab: t.nama_arab,
          isActive: Boolean(t.is_active)
        }));
        setTahunAjaranList(loadedTas);
        const activeTaFromDb = loadedTas.find((t) => t.isActive) || loadedTas[0];
        if (activeTaFromDb) {
          setSelectedTahunAjaranId(activeTaFromDb.id);
        }
      }

      if (semRows.length > 0) {
        const loadedSems = semRows.map((s) => ({
          id: s.id,
          tahunAjaranId: s.tahun_ajaran_id,
          nama: s.nama,
          namaArab: s.nama_arab,
          angka: Number(s.angka),
          isActive: Boolean(s.is_active)
        }));
        setSemesterList(loadedSems);
        const activeSemFromDb = loadedSems.find((s) => s.isActive) || loadedSems[0];
        if (activeSemFromDb) {
          setSelectedSemesterId(activeSemFromDb.id);
        }
      }

      if (kelasRows.length > 0) {
        const mappedExisting = kelasRows.map((k) => {
          const detectedLevel = normalizeTingkat(k.tingkat, k.nama_kelas);
          let matchedWali = k.wali_kelas;
          if (matchedWali && guruList.length > 0) {
            const matchGuru = guruList.find((g) => {
              const gClean = g.nama.toLowerCase().replace(/^(ust\.|ustzh\.|kh\.)\s*/i, '').trim();
              const wClean = matchedWali.toLowerCase().replace(/^(ust\.|ustzh\.|kh\.)\s*/i, '').trim();
              return gClean === wClean || g.nama.toLowerCase() === matchedWali.toLowerCase();
            });
            if (matchGuru) matchedWali = matchGuru.nama;
          }
          return {
            id: k.id,
            namaKelas: k.nama_kelas,
            namaArab: k.nama_arab || '',
            tingkat: detectedLevel,
            waliKelas: matchedWali,
            nipWali: k.nip_wali || '',
            kapasitas: Number(k.kapasitas || 30),
            isActive: Boolean(k.is_active)
          };
        });

        const addedMissing = await syncMissing6LevelsToSupabase(mappedExisting);
        const combinedKelas = addedMissing
          ? [...mappedExisting, ...addedMissing]
          : mappedExisting;

        setKelasList(combinedKelas);
        if (!combinedKelas.some((k) => k.id === selectedKelasId)) {
          setSelectedKelasId(combinedKelas[0]?.id || 'kls-7a');
        }
      }

      if (kelompokRows.length > 0) {
        let loadedKelompoks = kelompokRows.map((g) => ({
          id: g.id,
          kode: g.kode,
          namaKelompok: g.nama_kelompok,
          namaArab: g.nama_arab,
          urutan: Number(g.urutan || 1)
        }));

        const hasAqidah = loadedKelompoks.some(
          (k) => k.namaKelompok.toLowerCase() === 'aqidah' || k.kode === 'AQIDAH'
        );
        if (!hasAqidah) {
          const aqidahGrp = {
            id: 'grp-aqidah',
            kode: 'AQIDAH',
            namaKelompok: 'Aqidah',
            namaArab: 'العقيدة',
            urutan: 2
          };
          loadedKelompoks.push(aqidahGrp);
          SupabaseDB.upsert('kelompok_mapel', {
            id: aqidahGrp.id,
            kode: aqidahGrp.kode,
            nama_kelompok: aqidahGrp.namaKelompok,
            nama_arab: aqidahGrp.namaArab,
            urutan: aqidahGrp.urutan
          }).catch(() => { });
        }

        setKelompokMapelList(
          loadedKelompoks.sort((a, b) => (a.urutan || 1) - (b.urutan || 1))
        );
      }

      if (mapelRows.length > 0) {
        let savedKitabKelasMap = {};
        try {
          const raw = localStorage.getItem('rapor_kitab_kelas_map');
          if (raw) savedKitabKelasMap = JSON.parse(raw);
        } catch (_) { }

        setMapelList(
          mapelRows.map((m) => {
            const initialMatch = INITIAL_MAPEL.find((im) => im.id === m.id);
            const targetKelasIds =
              savedKitabKelasMap[m.id] ||
              initialMatch?.targetKelasIds ||
              ['ALL'];
            return {
              id: m.id,
              kodeMapel: m.kode_mapel,
              namaLatin: m.nama_latin,
              namaArab: m.nama_arab,
              kelompokId: m.kelompok_id,
              urutanTampil: Number(m.urutan_tampil || 1),
              statusAktif: Boolean(m.status_aktif),
              statusWajib: Boolean(m.status_wajib),
              targetKelasIds
            };
          })
        );
      }

      if (predikatRows.length > 0) {
        setPredikatList(
          predikatRows.map((pr) => ({
            id: pr.id,
            batasBawah: Number(pr.batas_bawah),
            batasAtas: Number(pr.batas_atas),
            predikatArab: pr.predikat_arab,
            predikatLatin: pr.predikat_latin,
            keterangan: pr.keterangan,
            urutan: Number(pr.urutan || 1)
          }))
        );
      }

      if (santriRows.length > 0) {
        setSantriList(
          santriRows.map((s) => ({
            id: s.id,
            nis: s.nis,
            nisn: s.nisn || '',
            namaLengkap: s.nama_lengkap,
            namaArab: s.nama_arab || '',
            jenisKelamin: s.jenis_kelamin || 'L',
            tempatLahir: s.tempat_lahir || '',
            tanggalLahir: s.tanggal_lahir || '',
            namaWali: s.nama_wali || '',
            alamat: s.alamat || '',
            tahunMasuk: Number(s.tahun_masuk || 2023),
            statusAktif: Boolean(s.status_aktif),
            kelasId: s.kelas_id
          }))
        );
      }

      if (nilaiRows.length > 0) {
        setNilaiList(
          nilaiRows.map((n) => ({
            santriId: n.santri_id,
            semesterId: n.semester_id,
            mapelId: n.mapel_id,
            angkaNilai: n.angka_nilai !== null ? Number(n.angka_nilai) : null
          }))
        );
      }

      if (logRows.length > 0) {
        setLogs(
          logRows.map((l) => ({
            id: l.id,
            aksi: l.aksi,
            deskripsi: l.deskripsi,
            waktu: l.waktu || 'Tersimpan di DB'
          }))
        );
      }

      // Sync Data Guru langsung dari Supabase
      try {
        const guruRows = await SupabaseDB.selectAll('guru', 'nama', true);
        if (guruRows && guruRows.length > 0) {
          const loadedGuru: GuruItem[] = guruRows.map((g: any) => ({
            id: g.id,
            nama: g.nama,
            mapelIds: Array.isArray(g.mapel_ids) ? g.mapel_ids : [],
            kelasIds: Array.isArray(g.kelas_ids) ? g.kelas_ids : [],
            statusAktif: g.status_aktif !== undefined ? Boolean(g.status_aktif) : true
          }));
          setGuruList(loadedGuru);
          try {
            localStorage.setItem('rapor_guru_list', JSON.stringify(loadedGuru));
          } catch (_) {}
        }
      } catch (errGuru) {
        console.warn('Tabel guru di Supabase belum ada atau gagal dibaca:', errGuru);
      }

      setDbStatus({
        state: 'connected',
        message: 'Terhubung ke Supabase PostgreSQL (gpjnbtgyzptxjxdnsctn)',
        lastSync: `${getWitaTimeString(true)} WITA`
      });
    } catch (err) {
      const msg = String(err?.message || err || '');
      const isMissingTable =
        msg.includes('relation') ||
        msg.includes('does not exist') ||
        msg.includes('42P01') ||
        msg.includes('schema cache') ||
        msg.includes('Could not find the table') ||
        msg.includes('HTTP 404');

      setDbStatus({
        state: isMissingTable ? 'schema_missing' : 'error',
        message: isMissingTable
          ? 'Koneksi ke Supabase berhasil, namun tabel belum dibuat. Klik "Setup DB" untuk menyalin SQL Migration.'
          : `Mode Cepat Aktif (Supabase: ${msg})`,
        lastSync: null
      });
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      checkAndLoadFromSupabase();
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  const addLog = async (aksi, deskripsi) => {
    const newLog = {
      id: `log-${Date.now()}`,
      aksi,
      deskripsi,
      waktu: getWitaTimeString(false)
    };
    setLogs((prev) => [newLog, ...prev.slice(0, 19)]);
    if (dbStatus.state === 'connected') {
      try {
        await SupabaseDB.upsert('log_aktivitas', {
          id: newLog.id,
          aksi: newLog.aksi,
          deskripsi: newLog.deskripsi,
          waktu: newLog.waktu
        });
      } catch (_) { }
    }
  };

  const handleSelectTahunAjaran = (taId) => {
    setSelectedTahunAjaranId(taId);
    const firstSem = semesterList.find((s) => s.tahunAjaranId === taId);
    if (firstSem) setSelectedSemesterId(firstSem.id);
  };

  const activeMapels = useMemo(
    () =>
      [...mapelList]
        .filter((m) => m.statusAktif)
        .sort((a, b) => a.urutanTampil - b.urutanTampil),
    [mapelList]
  );

  const globalMonitoring = useMemo(() => {
    const activeSantri = santriList.filter((s) => s.statusAktif);
    let totalComplete = 0;
    let totalIncomplete = 0;

    const perKelasStats = [...kelasList]
      .filter((k) => k.isActive)
      .sort(
        (a, b) =>
          normalizeTingkat(a.tingkat, a.namaKelas) -
          normalizeTingkat(b.tingkat, b.namaKelas)
      )
      .map((kls) => {
        const santriInKls = activeSantri.filter((s) => s.kelasId === kls.id);
        const mapelsForThisKls = activeMapels.filter((m) => isMapelForKelas(m, kls.id));
        const evals = calculateClassAcademicReport({
          santriInKelas: santriInKls,
          activeMapelList: mapelsForThisKls,
          nilaiList,
          semesterId: selectedSemesterId,
          predikatRules: predikatList
        });

        const completeCount = evals.filter((e) => e.isComplete).length;
        const incompleteCount = evals.length - completeCount;
        totalComplete += completeCount;
        totalIncomplete += incompleteCount;

        const avgCompletion =
          evals.length > 0
            ? Math.round(
              evals.reduce((acc, curr) => acc + curr.completionPercent, 0) / evals.length
            )
            : 100;

        return {
          kelas: kls,
          totalSantri: evals.length,
          completeCount,
          incompleteCount,
          avgCompletion,
          evaluations: evals
        };
      });

    const totalSantriCount = activeSantri.length;
    const overallPercent =
      totalSantriCount > 0 ? Math.round((totalComplete / totalSantriCount) * 100) : 0;

    return {
      totalSantriCount,
      totalKelasCount: kelasList.filter((k) => k.isActive).length,
      totalComplete,
      totalIncomplete,
      overallPercent,
      perKelasStats
    };
  }, [santriList, kelasList, activeMapels, nilaiList, selectedSemesterId, predikatList]);

  const handleSaveSingleNilai = async (
    santriId: string,
    mapelId: string,
    angkaNilai: number | null
  ) => {
    setNilaiList((prev) => {
      const idx = prev.findIndex(
        (n) =>
          n.santriId === santriId &&
          n.mapelId === mapelId &&
          n.semesterId === selectedSemesterId
      );
      if (angkaNilai === null) {
        if (idx !== -1) {
          const next = [...prev];
          next.splice(idx, 1);
          return next;
        }
        return prev;
      }
      if (idx !== -1) {
        const next = [...prev];
        next[idx] = { ...next[idx], angkaNilai };
        return next;
      }
      return [
        ...prev,
        {
          santriId,
          semesterId: selectedSemesterId,
          mapelId,
          angkaNilai
        }
      ];
    });

    if (dbStatus.state === 'connected') {
      try {
        if (angkaNilai === null) {
          await SupabaseDB.deleteNilaiCell(santriId, selectedSemesterId, mapelId);
        } else {
          await SupabaseDB.upsert(
            'nilai',
            {
              santri_id: santriId,
              semester_id: selectedSemesterId,
              mapel_id: mapelId,
              angka_nilai: angkaNilai
            },
            'santri_id,semester_id,mapel_id'
          );
        }
      } catch (_) {}
    }
  };

  const handleSaveMultipleNilai = async (
    records: Array<{ santriId: string; mapelId: string; angkaNilai: number | null }>
  ) => {
    setNilaiList((prev) => {
      const next = [...prev];
      records.forEach((rec) => {
        const idx = next.findIndex(
          (n) =>
            n.santriId === rec.santriId &&
            n.mapelId === rec.mapelId &&
            n.semesterId === selectedSemesterId
        );
        if (rec.angkaNilai === null) {
          if (idx !== -1) next.splice(idx, 1);
        } else {
          if (idx !== -1) {
            next[idx] = { ...next[idx], angkaNilai: rec.angkaNilai };
          } else {
            next.push({
              santriId: rec.santriId,
              semesterId: selectedSemesterId,
              mapelId: rec.mapelId,
              angkaNilai: rec.angkaNilai
            });
          }
        }
      });
      return next;
    });

    if (dbStatus.state === 'connected') {
      try {
        const upsertBatch = records
          .filter((r) => r.angkaNilai !== null)
          .map((r) => ({
            santri_id: r.santriId,
            semester_id: selectedSemesterId,
            mapel_id: r.mapelId,
            angka_nilai: r.angkaNilai
          }));
        if (upsertBatch.length > 0) {
          await SupabaseDB.upsert('nilai', upsertBatch, 'santri_id,semester_id,mapel_id');
        }
        const deleteBatch = records.filter((r) => r.angkaNilai === null);
        if (deleteBatch.length > 0) {
          await Promise.all(
            deleteBatch.map((r) =>
              SupabaseDB.deleteNilaiCell(r.santriId, selectedSemesterId, r.mapelId)
            )
          );
        }
      } catch (err) {
        console.error('Supabase batch save error:', err);
      }
    }
  };

  if (isGuruMode) {
    return (
      <UjianLisanGuruView
        currentUstadz={currentUstadz}
        onSelectUstadz={setCurrentUstadz}
        onExitGuruMode={exitGuruMode}
        kelasList={kelasList}
        santriList={santriList}
        mapelList={mapelList}
        nilaiList={nilaiList}
        selectedSemesterId={selectedSemesterId}
        onSaveNilai={handleSaveSingleNilai}
        onSaveMultipleNilai={handleSaveMultipleNilai}
        showToast={showToast}
        pondok={pondok}
        guruList={guruList}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 flex flex-col lg:flex-row font-sans pb-16 lg:pb-0">
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&display=swap"
      />
      <style>{`
        .font-arabic {
          font-family: 'Amiri', 'Traditional Arabic', serif;
        }
        
        .font-rapor-latin {
          font-family: 'Times New Roman', Times, serif;
        }

        @page {
          size: A4 portrait;
          margin: 0;
        }

        @media print {
          html, body {
            width: 210mm;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
          }
          body * {
            visibility: hidden;
          }
          #printable-rapor-area, #printable-rapor-area * {
            visibility: visible;
          }
          #printable-rapor-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 210mm !important;
            background: white !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .rapor-scale-wrapper {
            transform: none !important;
            width: 210mm !important;
            height: auto !important;
            margin: 0 !important;
          }
          .rapor-page-break {
            width: 210mm !important;
            min-height: 297mm !important;
            page-break-after: always;
            break-after: page;
            box-shadow: none !important;
            border: none !important;
            margin: 0 !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {isMobileSidebarOpen && (
        <div
          onClick={() => setIsMobileSidebarOpen(false)}
          className="no-print fixed inset-0 bg-black/60 z-40 lg:hidden"
        />
      )}

      {/* BACKDROP FOR DROPDOWNS */}
      {(showYearPicker || showProfileMenu) && (
        <div
          className="no-print fixed inset-0 z-40 bg-black/5"
          onClick={() => {
            setShowYearPicker(false);
            setShowProfileMenu(false);
          }}
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`no-print fixed lg:static inset-y-0 left-0 z-50 w-72 lg:w-68 bg-[#064E3B] text-emerald-50 flex flex-col border-r border-[#043d2e] shrink-0 select-none transform transition-transform duration-200 ease-in-out ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          }`}
      >
        {/* SIDEBAR HEADER / BRANDING */}
        <div className="p-4 lg:p-5 border-b border-emerald-900/60 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-11 h-11 rounded-xl bg-white flex items-center justify-center shadow-md shrink-0 overflow-hidden p-1">
              <BaliBinaInsaniLogo size={38} customLogoUrl={pondok.logoUrl} />
            </div>
            <div className="overflow-hidden">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#244234] text-emerald-300 border border-emerald-700/50 inline-block mb-0.5">
                ADMIN MODE
              </span>
              <h1 className="font-extrabold text-sm text-white truncate leading-tight">E-Rapor Pesantren</h1>
              <p className="text-[11px] text-emerald-300 font-arabic truncate" dir="rtl">
                {pondok.namaPondokArab || 'معهد بالي بينا إنساني الإسلامي'}
              </p>
              <p className="text-[10px] text-emerald-200/70 truncate">
                Pondok Pesantren Bali Bina Insani
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsMobileSidebarOpen(false)}
            className="lg:hidden p-2 rounded-xl text-emerald-200 hover:text-white hover:bg-emerald-900"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 5 MAIN MENUS IN SIDEBAR */}
        <nav className="flex-1 p-3.5 space-y-1.5 overflow-y-auto">
          {MAIN_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isParentActive = activeMenu === item.id;
            const hasSub = item.subMenus && item.subMenus.length > 0;

            return (
              <div key={item.id} className="space-y-1">
                <button
                  type="button"
                  onClick={() => {
                    if (hasSub) {
                      if (activeMenu === item.id) {
                        // Already in this section, toggle
                      } else {
                        handleNavigate(item.id, item.subMenus[0].id);
                      }
                    } else {
                      handleNavigate(item.id);
                    }
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-left text-xs transition-all ${isParentActive
                      ? 'bg-[#E6F4EA] text-[#064E3B] font-bold shadow-xs'
                      : 'text-white/90 hover:bg-emerald-900/50 hover:text-white font-medium'
                    }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon
                      className={`w-4 h-4 shrink-0 ${isParentActive ? 'text-[#064E3B]' : 'text-emerald-300'
                        }`}
                    />
                    <span className="truncate">{item.label}</span>
                  </div>

                  {hasSub && (
                    <ChevronDown
                      className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 ${isParentActive ? 'transform rotate-180 text-[#064E3B]' : 'text-emerald-300/70'
                        }`}
                    />
                  )}
                </button>

                {/* EXPANDABLE SUBMENU (Hanya tampil jika menu aktif agar tidak ramai) */}
                {hasSub && isParentActive && (
                  <div className="pl-4 pr-1 py-1 space-y-1 border-l-2 border-emerald-800/80 ml-3">
                    {item.subMenus.map((sub) => {
                      const SubIcon = sub.icon;
                      const isSubActive = activeSubMenu === sub.id;
                      return (
                        <button
                          key={sub.id}
                          type="button"
                          onClick={() => handleNavigate(item.id, sub.id)}
                          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-all text-left ${isSubActive
                              ? 'bg-emerald-800 text-white font-bold shadow-xs'
                              : 'text-emerald-200/80 hover:text-white hover:bg-emerald-900/40 font-medium'
                            }`}
                        >
                          <SubIcon
                            className={`w-3.5 h-3.5 shrink-0 ${isSubActive ? 'text-amber-300' : 'text-emerald-400/80'
                              }`}
                          />
                          <span className="truncate">{sub.label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* SILUET MASJID ISLAMI DI BAGIAN BAWAH SIDEBAR */}
        <SidebarMosqueSilhouette />

        {/* FOOTER STATUS ADMIN & SUPABASE */}
        <div className="p-3.5 border-t border-emerald-900/80 bg-emerald-950/95 text-xs text-emerald-300/80 space-y-1.5 relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-amber-300 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Single-Role Admin</span>
            </div>
            <button
              onClick={() => {
                setIsMobileSidebarOpen(false);
                setShowDbModal(true);
              }}
              className="text-[11px] underline text-emerald-300 hover:text-white"
            >
              Detail DB
            </button>
          </div>
          <div className="flex items-center gap-1.5 text-[11px]">
            <Database className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="truncate">
              {dbStatus.state === 'connected'
                ? 'Supabase PostgreSQL Aktif'
                : dbStatus.state === 'schema_missing'
                  ? 'Menunggu Migrasi Tabel SQL'
                  : 'Mode Cepat Aktif'}
            </span>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#F8FAFC]">
        {/* HEADER DASHBOARD */}
        <header className="no-print bg-white border-b border-slate-200/90 px-4 sm:px-6 py-3.5 flex items-center justify-between sticky top-0 z-30 shadow-xs relative overflow-hidden">
          <HeaderIslamicPattern />

          <div className="flex items-center gap-3 min-w-0 relative z-10">
            <button
              type="button"
              onClick={() => setIsMobileSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl bg-emerald-950 text-white hover:bg-emerald-900 shrink-0"
              aria-label="Buka Menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="min-w-0">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight truncate leading-tight">
                {headerMeta.title}
              </h2>
              <p className="text-xs text-slate-500 truncate hidden sm:block">
                {headerMeta.subtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3.5 relative z-10 shrink-0">
            {/* TOMBOL BUKA MODE UJIAN GURU */}
            <button
              type="button"
              onClick={enterGuruMode}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-900 font-bold text-xs shadow-2xs transition cursor-pointer"
              title="Buka Lembar Ujian Santri untuk Guru Penilai (/guru)"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Mode Ujian Guru</span>
              <span className="sm:hidden">Ujian</span>
            </button>

            {/* PEMILIHAN TAHUN AJARAN & SEMESTER */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setShowYearPicker(!showYearPicker);
                  setShowProfileMenu(false);
                }}
                className="flex items-center gap-2 px-3 sm:px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-800 transition shadow-2xs"
              >
                <Calendar className="w-4 h-4 text-emerald-700 shrink-0" />
                <span className="truncate max-w-[140px] sm:max-w-none">
                  {currentSelectedTA?.nama || '2026 – 2027'} • {currentSelectedSemester?.nama || 'Ganjil'}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              </button>

              {/* DROPDOWN PEMILIHAN TAHUN AJARAN & SEMESTER */}
              {showYearPicker && (
                <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white rounded-2xl shadow-xl border border-slate-200 p-4 z-50 text-xs space-y-3.5 animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                    <h4 className="font-bold text-slate-900 text-sm">Pilih Periode Rapor</h4>
                    <button
                      onClick={() => setShowYearPicker(false)}
                      className="text-slate-400 hover:text-slate-600 p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                      Tahun Ajaran
                    </label>
                    <div className="space-y-1 max-h-36 overflow-y-auto">
                      {tahunAjaranList.map((t) => (
                        <button
                          key={t.id}
                          onClick={() => setSelectedTahunAjaranId(t.id)}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition ${selectedTahunAjaranId === t.id
                              ? 'bg-emerald-50 text-emerald-900 font-bold border border-emerald-200'
                              : 'hover:bg-slate-50 text-slate-700'
                            }`}
                        >
                          <span>{t.nama}</span>
                          {selectedTahunAjaranId === t.id && (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                      Semester
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {semesterList
                        .filter((s) => s.tahunAjaranId === selectedTahunAjaranId)
                        .map((s) => (
                          <button
                            key={s.id}
                            onClick={() => {
                              setSelectedSemesterId(s.id);
                              setShowYearPicker(false);
                            }}
                            className={`px-3 py-2 rounded-lg text-center transition font-semibold ${selectedSemesterId === s.id
                                ? 'bg-emerald-700 text-white shadow-xs'
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                              }`}
                          >
                            Semester {s.nama}
                          </button>
                        ))}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100">
                    <button
                      onClick={() => {
                        setShowYearPicker(false);
                        handleNavigate('pengaturan', 'tahun-ajaran');
                      }}
                      className="w-full py-1.5 text-center text-emerald-700 hover:text-emerald-900 font-semibold text-xs"
                    >
                      Kelola Tahun Ajaran & Semester →
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* PROFIL ADMIN */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setShowProfileMenu(!showProfileMenu);
                  setShowYearPicker(false);
                }}
                className="flex items-center gap-2 sm:gap-2.5 px-3 sm:px-3.5 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 transition shadow-2xs"
              >
                <div className="w-7 h-7 rounded-full bg-emerald-700 text-white flex items-center justify-center shrink-0 font-bold text-xs">
                  <User className="w-4 h-4" />
                </div>
                <div className="text-left hidden sm:block">
                  <div className="text-xs font-bold text-slate-900 leading-tight">Admin</div>
                  <div className="text-[10px] text-slate-500 leading-tight">Operator Pesantren</div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              </button>

              {/* DROPDOWN PROFIL ADMIN */}
              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 p-4 z-50 text-xs space-y-3 animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                    <div className="w-10 h-10 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold text-sm">
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">Admin Pesantren</h4>
                      <p className="text-[11px] text-slate-500">Operator Sistem E-Rapor</p>
                    </div>
                  </div>

                  <div className="space-y-1 text-slate-600">
                    <div className="flex items-center justify-between py-1">
                      <span className="text-slate-500">Peran:</span>
                      <span className="font-semibold text-emerald-800">Single-Role Admin</span>
                    </div>
                    <div className="flex items-center justify-between py-1">
                      <span className="text-slate-500">Database:</span>
                      <span className="font-semibold text-slate-800">
                        {dbStatus.state === 'connected' ? 'PostgreSQL' : 'Lokal Aktif'}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 space-y-1">
                    <button
                      onClick={() => {
                        setShowProfileMenu(false);
                        setShowDbModal(true);
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-50 text-slate-700 font-medium"
                    >
                      Detail Database Supabase
                    </button>
                    <button
                      onClick={() => {
                        setShowProfileMenu(false);
                        handleNavigate('pengaturan', 'pengaturan-pondok');
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-50 text-emerald-700 font-medium"
                    >
                      Pengaturan Profil Pondok →
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* TOAST NOTIFICATION */}
        {toast && (
          <div className="no-print fixed bottom-20 lg:bottom-5 right-4 left-4 sm:left-auto z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg border bg-emerald-950 text-white border-emerald-700 text-xs font-medium">
            {toast.type === 'warning' ? (
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            )}
            <span>{toast.message}</span>
          </div>
        )}

        {/* PAGE CONTENT */}
        <main className="flex-1 overflow-y-auto p-3.5 sm:p-6 lg:p-7 relative">
          {/* ORNAMEN SUDUT MIHRAB ISLAMI (Tampil di Dashboard) */}
          {activeMenu === 'dashboard' && <MihrabArchMotif />}

          {/* 1. DASHBOARD */}
          {activeMenu === 'dashboard' && (
            <DashboardView
              monitoring={globalMonitoring}
              activeTA={currentSelectedTA}
              activeSemester={currentSelectedSemester}
              logs={logs}
              kelasList={kelasList}
              santriList={santriList}
              onNavigate={(menuId, kelasId) => handleNavigate(menuId, null, kelasId)}
            />
          )}

          {/* 2. DATA SANTRI */}
          {activeMenu === 'santri' && (
            <SantriMasterView
              santriList={santriList}
              setSantriList={setSantriList}
              kelasList={kelasList}
              setKelasList={setKelasList}
              updateKelasData={updateKelasData}
              selectedKelasId={selectedKelasId}
              setSelectedKelasId={setSelectedKelasId}
              activeMapels={activeMapels}
              nilaiList={nilaiList}
              selectedSemesterId={selectedSemesterId}
              predikatList={predikatList}
              moveSantriToKelas={moveSantriToKelas}
              deleteMultipleSantri={deleteMultipleSantri}
              showToast={showToast}
              addLog={addLog}
            />
          )}

          {/* 3. DATA GURU & MAPEL */}
          {activeMenu === 'guru' && (
            <GuruMasterView
              guruList={guruList}
              setGuruList={setGuruList}
              mapelList={mapelList}
              kelasList={kelasList}
              showToast={showToast}
              addLog={addLog}
            />
          )}

          {/* 4. PENGATURAN KELAS */}
          {activeMenu === 'kelas' && (
            <KelasMasterView
              kelasList={kelasList}
              setKelasList={setKelasList}
              updateKelasData={updateKelasData}
              santriList={santriList}
              setSantriList={setSantriList}
              selectedKelasId={selectedKelasId}
              setSelectedKelasId={setSelectedKelasId}
              activeMapels={activeMapels}
              nilaiList={nilaiList}
              selectedSemesterId={selectedSemesterId}
              predikatList={predikatList}
              moveSantriToKelas={moveSantriToKelas}
              deleteMultipleSantri={deleteMultipleSantri}
              onNavigateToMenu={(menuId, klsId) => handleNavigate(menuId, null, klsId)}
              guruList={guruList}
              showToast={showToast}
              addLog={addLog}
            />
          )}

          {/* 5. NILAI & RAPOR (Input Nilai, Rekap Nilai, Cetak Rapor) */}
          {(activeMenu === 'nilai-rapor' ||
            activeMenu === 'input-nilai' ||
            activeMenu === 'rekap-nilai' ||
            activeMenu === 'cetak-rapor') && (
              <div className="space-y-4">
                {/* SUB-NAVIGATION TAB BAR */}
                <div className="no-print bg-white rounded-2xl border border-slate-200/90 p-1.5 shadow-xs flex items-center gap-1.5 overflow-x-auto">
                  {[
                    { id: 'input-nilai', label: 'Input Nilai', icon: FileSpreadsheet },
                    { id: 'rekap-nilai', label: 'Rekap Nilai', icon: TableProperties },
                    { id: 'cetak-rapor', label: 'Cetak Rapor', icon: Printer }
                  ].map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeSubMenu === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => handleNavigate('nilai-rapor', tab.id)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${isActive
                            ? 'bg-[#064E3B] text-white shadow-xs'
                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                          }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </div>

                {activeSubMenu === 'input-nilai' && (
                  <InputNilaiSpreadsheetView
                    santriList={santriList}
                    kelasList={kelasList}
                    selectedKelasId={selectedKelasId}
                    setSelectedKelasId={setSelectedKelasId}
                    selectedSemesterId={selectedSemesterId}
                    activeMapels={activeMapels}
                    nilaiList={nilaiList}
                    setNilaiList={setNilaiList}
                    predikatList={predikatList}
                    showToast={showToast}
                    addLog={addLog}
                  />
                )}

                {activeSubMenu === 'rekap-nilai' && (
                  <RekapNilaiView
                    santriList={santriList}
                    kelasList={kelasList}
                    selectedKelasId={selectedKelasId}
                    setSelectedKelasId={setSelectedKelasId}
                    selectedSemesterId={selectedSemesterId}
                    activeMapels={activeMapels}
                    nilaiList={nilaiList}
                    predikatList={predikatList}
                    tahunAjaran={tahunAjaranList.find((t) => t.id === selectedTahunAjaranId)}
                    semester={semesterList.find((s) => s.id === selectedSemesterId)}
                    showToast={showToast}
                    onJumpToInput={() => handleNavigate('nilai-rapor', 'input-nilai')}
                    onJumpToPrint={() => handleNavigate('nilai-rapor', 'cetak-rapor')}
                  />
                )}

                {activeSubMenu === 'cetak-rapor' && (
                  <CetakRaporView
                    pondok={pondok}
                    setPondok={setPondok}
                    persistPondokProfileToSupabase={persistPondokProfileToSupabase}
                    tahunAjaran={tahunAjaranList.find((t) => t.id === selectedTahunAjaranId)}
                    semester={semesterList.find((s) => s.id === selectedSemesterId)}
                    kelas={kelasList.find((k) => k.id === selectedKelasId)}
                    kelasList={kelasList}
                    selectedKelasId={selectedKelasId}
                    setSelectedKelasId={setSelectedKelasId}
                    santriList={santriList}
                    kelompokMapelList={kelompokMapelList}
                    activeMapels={activeMapels}
                    nilaiList={nilaiList}
                    selectedSemesterId={selectedSemesterId}
                    predikatList={predikatList}
                    showToast={showToast}
                    addLog={addLog}
                  />
                )}
              </div>
            )}

          {/* 5. PENGATURAN (Tahun Ajaran, Mapel, Predikat, Pengaturan Pondok) */}
          {(activeMenu === 'pengaturan' ||
            activeMenu === 'tahun-ajaran' ||
            activeMenu === 'mapel' ||
            activeMenu === 'predikat' ||
            activeMenu === 'pengaturan-pondok') && (
              <div className="space-y-4">
                {/* SUB-NAVIGATION TAB BAR */}
                <div className="no-print bg-white rounded-2xl border border-slate-200/90 p-1.5 shadow-xs flex items-center gap-1.5 overflow-x-auto">
                  {[
                    { id: 'tahun-ajaran', label: 'Tahun Ajaran', icon: Calendar },
                    { id: 'mapel', label: 'Mata Pelajaran / Kitab', icon: BookOpen },
                    { id: 'predikat', label: 'Pengaturan Predikat', icon: Award },
                    { id: 'pengaturan-pondok', label: 'Pengaturan Pondok', icon: Settings }
                  ].map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeSubMenu === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => handleNavigate('pengaturan', tab.id)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${isActive
                            ? 'bg-[#064E3B] text-white shadow-xs'
                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                          }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </div>

                {activeSubMenu === 'tahun-ajaran' && (
                  <TahunAjaranView
                    tahunAjaranList={tahunAjaranList}
                    setTahunAjaranList={setTahunAjaranList}
                    semesterList={semesterList}
                    setSemesterList={setSemesterList}
                    selectedTahunAjaranId={selectedTahunAjaranId}
                    setSelectedTahunAjaranId={setSelectedTahunAjaranId}
                    selectedSemesterId={selectedSemesterId}
                    setSelectedSemesterId={setSelectedSemesterId}
                    showToast={showToast}
                    addLog={addLog}
                  />
                )}

                {activeSubMenu === 'mapel' && (
                  <MapelMasterView
                    mapelList={mapelList}
                    setMapelList={setMapelList}
                    kelompokMapelList={kelompokMapelList}
                    setKelompokMapelList={setKelompokMapelList}
                    kelasList={kelasList}
                    showToast={showToast}
                    addLog={addLog}
                  />
                )}

                {activeSubMenu === 'predikat' && (
                  <PredikatConfigView
                    predikatList={predikatList}
                    setPredikatList={setPredikatList}
                    showToast={showToast}
                    addLog={addLog}
                  />
                )}

                {activeSubMenu === 'pengaturan-pondok' && (
                  <PengaturanPondokView
                    pondok={pondok}
                    setPondok={setPondok}
                    persistPondokProfileToSupabase={persistPondokProfileToSupabase}
                    showToast={showToast}
                    addLog={addLog}
                    onOpenDbModal={() => setShowDbModal(true)}
                  />
                )}
              </div>
            )}

          {/* ORNAMEN MUSHAF AL-QUR'AN TRANSPARAN DI BAGIAN BAWAH KONTEN */}
          <MushafWatermark />
        </main>

        {/* BOTTOM NAVIGATION BAR KHUSUS MOBILE */}
        <nav className="no-print lg:hidden fixed bottom-0 inset-x-0 z-30 bg-white border-t border-slate-200 grid grid-cols-6 py-1 px-0.5 shadow-lg text-[9px]">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
            { id: 'santri', label: 'Santri', icon: Users },
            { id: 'guru', label: 'Guru', icon: GraduationCap },
            { id: 'kelas', label: 'Kelas', icon: Layers },
            { id: 'nilai-rapor', label: 'Nilai', icon: FileSpreadsheet },
            { id: 'pengaturan', label: 'Setting', icon: Settings }
          ].map((tab) => {
            const Icon = tab.icon;
            const isTabActive = activeMenu === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleNavigate(tab.id)}
                className={`flex flex-col items-center justify-center py-1 rounded-xl transition ${isTabActive
                    ? 'text-[#064E3B] font-bold'
                    : 'text-slate-500 hover:text-slate-800 font-medium'
                  }`}
              >
                <div
                  className={`p-1 rounded-lg ${isTabActive ? 'bg-[#E6F4EA] text-[#064E3B]' : ''
                    }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-[10px] mt-0.5 truncate">{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* MODAL DIAGNOSTIK KONEKSI & SQL MIGRATION SUPABASE */}
        {showDbModal && (
          <div className="no-print fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-3 sm:p-4">
            <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
              <div className="px-4 sm:px-6 py-4 bg-emerald-950 text-white flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Database className="w-5 h-5 text-amber-400 shrink-0" />
                  <div>
                    <h3 className="font-bold text-sm sm:text-base">
                      Database Supabase PostgreSQL
                    </h3>
                    <p className="text-[11px] text-emerald-300 truncate">
                      {SUPABASE_CONFIG.url}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowDbModal(false)}
                  className="text-emerald-200 hover:text-white p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800">Status:</span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full font-bold ${dbStatus.state === 'connected'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                          }`}
                      >
                        {dbStatus.state === 'connected'
                          ? 'TERHUBUNG'
                          : 'PERLU MIGRASI TABEL SQL'}
                      </span>
                    </div>
                    <p className="text-slate-600">{dbStatus.message}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={checkAndLoadFromSupabase}
                      className="px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold flex items-center gap-1.5"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Tes Koneksi</span>
                    </button>
                    <button
                      disabled={isSeeding}
                      onClick={() => seedInitialDataToSupabase(false)}
                      className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-emerald-950 font-bold flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{isSeeding ? 'Menyimpan...' : 'Seed Data Awal'}</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">
                      Skrip SQL Migration (Jalankan di Supabase SQL Editor):
                    </span>
                    <button
                      onClick={() => {
                        const textarea = document.createElement('textarea');
                        textarea.value = SUPABASE_SQL_MIGRATION;
                        document.body.appendChild(textarea);
                        textarea.select();
                        document.execCommand('copy');
                        document.body.removeChild(textarea);
                        showToast('Skrip SQL Migration berhasil disalin!');
                      }}
                      className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold flex items-center gap-1.5"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Salin SQL</span>
                    </button>
                  </div>
                  <pre className="p-3 sm:p-4 rounded-xl bg-slate-900 text-emerald-300 font-mono text-[10px] sm:text-[11px] overflow-x-auto max-h-60 leading-relaxed">
                    {SUPABASE_SQL_MIGRATION}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}