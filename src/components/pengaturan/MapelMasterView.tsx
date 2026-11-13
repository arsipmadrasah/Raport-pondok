import React, { useState } from 'react';
import {
  BookOpen,
  Plus,
  GraduationCap,
  Sparkles,
  Layers,
  Save,
  CheckCircle2,
  Edit3,
  Trash2,
  X
} from 'lucide-react';
import { isMapelForKelas } from '../../utils/academicHelpers';
import { SupabaseDB } from '../../services/supabase';

const PONDOK_KITAB_DIRECTORY = [
  // AQIDAH
  {
    namaLatin: 'Jawahirul Kalamiyah',
    namaArab: 'جواهر الكلامية',
    kelompokNama: 'Aqidah',
    kelompokArab: 'العقيدة',
    keywords: ['jawahir', 'kalam', 'jawahirul kalamiah', 'jawahirul kalamiyah']
  },
  {
    namaLatin: 'Aqidatul Awam',
    namaArab: 'عقيدة العوام',
    kelompokNama: 'Aqidah',
    kelompokArab: 'العقيدة',
    keywords: ['aqidatul', 'awam', 'awan', 'aqidatul awan']
  },
  {
    namaLatin: 'Tijan Darori',
    namaArab: 'تيجان الدراري',
    kelompokNama: 'Aqidah',
    kelompokArab: 'العقيدة',
    keywords: ['tijan', 'darori']
  },
  {
    namaLatin: 'Kifayatul Awam',
    namaArab: 'كفاية العوام',
    kelompokNama: 'Aqidah',
    kelompokArab: 'العقيدة',
    keywords: ['kifayatul']
  },
  {
    namaLatin: 'Fathul Majid',
    namaArab: 'فتح المجيد',
    kelompokNama: 'Aqidah',
    kelompokArab: 'العقيدة',
    keywords: ['fathul majid']
  },
  {
    namaLatin: 'Ummul Barahin (As-Sanusiyah)',
    namaArab: 'أم البراهين (السنوسية)',
    kelompokNama: 'Aqidah',
    kelompokArab: 'العقيدة',
    keywords: ['ummul', 'barahin', 'sanusi']
  },
  {
    namaLatin: 'Durusut Tauhid',
    namaArab: 'دروس التوحيد',
    kelompokNama: 'Aqidah',
    kelompokArab: 'العقيدة',
    keywords: ['tauhid']
  },
  {
    namaLatin: 'Nuru Dzolam',
    namaArab: 'نور الظلام',
    kelompokNama: 'Aqidah Akhlak',
    kelompokArab: 'العقيدة والاخلاق',
    keywords: ['nuru', 'dzolam', 'nurudz', 'dholam']
  },

  // FIQIH
  {
    namaLatin: 'Safinatunnajah',
    namaArab: 'سفينة النجاة',
    kelompokNama: 'Fiqih',
    kelompokArab: 'فقه',
    keywords: ['safina', 'safinatun']
  },
  {
    namaLatin: 'Fathul Qorib',
    namaArab: 'فتح القريب',
    kelompokNama: 'Fiqih',
    kelompokArab: 'فقه',
    keywords: ['qorib', 'fathul qorib']
  },
  {
    namaLatin: 'Sulam Taufiq',
    namaArab: 'سلم التوفيق',
    kelompokNama: 'Fiqih',
    kelompokArab: 'فقه',
    keywords: ['sulam', 'taufiq']
  },
  {
    namaLatin: 'Matan Al-Ghayah wat Taqrib',
    namaArab: 'متن الغاية والتقريب',
    kelompokNama: 'Fiqih',
    kelompokArab: 'فقه',
    keywords: ['taqrib', 'ghayah']
  },
  {
    namaLatin: 'Mabadiul Fiqhiyyah',
    namaArab: 'مبادئ الفقهية',
    kelompokNama: 'Fiqih',
    kelompokArab: 'فقه',
    keywords: ['mabadi']
  },
  {
    namaLatin: 'Fathul Mu\'in',
    namaArab: 'فتح المعين',
    kelompokNama: 'Fiqih',
    kelompokArab: 'فقه',
    keywords: ['muin']
  },

  // AKHLAK
  {
    namaLatin: 'Akhlak Lilbanat',
    namaArab: 'الأخلاق للبنات',
    kelompokNama: 'Akhlak',
    kelompokArab: 'الأخلاق',
    keywords: ['banat']
  },
  {
    namaLatin: 'Akhlak Lilbanin',
    namaArab: 'الأخلاق للبنين',
    kelompokNama: 'Akhlak',
    kelompokArab: 'الأخلاق',
    keywords: ['banin']
  },
  {
    namaLatin: 'Ta\'limul Muta\'allim',
    namaArab: 'تعليم المتعلم',
    kelompokNama: 'Akhlak',
    kelompokArab: 'الأخلاق',
    keywords: ['talim', 'mutaallim']
  },
  {
    namaLatin: 'Taisirul Khalaq',
    namaArab: 'تيسير الخلاق',
    kelompokNama: 'Akhlak',
    kelompokArab: 'الأخلاق',
    keywords: ['taisir', 'khalaq']
  },
  {
    namaLatin: 'Bidayatul Hidayah',
    namaArab: 'بداية الهداية',
    kelompokNama: 'Akhlak',
    kelompokArab: 'الأخلاق',
    keywords: ['bidayah', 'hidayah']
  },
  {
    namaLatin: 'Wasoya (Washoya)',
    namaArab: 'وصايا الآباء للأبناء',
    kelompokNama: 'Akhlak',
    kelompokArab: 'الأخلاق',
    keywords: ['wasoya', 'washoya', 'washoya al-abaa']
  },

  // HADIST
  {
    namaLatin: 'Arbain Nawawi',
    namaArab: 'الأربعون النووية',
    kelompokNama: 'Hadist',
    kelompokArab: 'الحديث',
    keywords: ['arbain', 'nawawi']
  },
  {
    namaLatin: 'Bulughul Maram',
    namaArab: 'بلوغ المرام',
    kelompokNama: 'Hadist',
    kelompokArab: 'الحديث',
    keywords: ['bulugh', 'maram', 'marom', 'bulughul marom']
  },
  {
    namaLatin: 'Minhatul Mughis',
    namaArab: 'منحة المغيث',
    kelompokNama: 'Hadist',
    kelompokArab: 'الحديث',
    keywords: ['minhatul', 'mughis', 'minhajul', 'mugist']
  },
  {
    namaLatin: 'Riyadhus Shalihin',
    namaArab: 'رياض الصالحين',
    kelompokNama: 'Hadist',
    kelompokArab: 'الحديث',
    keywords: ['riyadh', 'shalihin']
  },

  // BAHASA ARAB / NAHWU / SHOROF
  {
    namaLatin: 'Durusul Lughoh',
    namaArab: 'دروس اللغة العربية',
    kelompokNama: 'Bahasa Arab',
    kelompokArab: 'اللغة العربية',
    keywords: ['durus', 'lughoh']
  },
  {
    namaLatin: 'Al-Jurumiyah',
    namaArab: 'الآجرومية',
    kelompokNama: 'Bahasa Arab',
    kelompokArab: 'اللغة العربية',
    keywords: ['jurumiyah', 'ajurumiyah']
  },
  {
    namaLatin: 'Amtsilatut Tashrifiyah',
    namaArab: 'الأمثلة التصريفية',
    kelompokNama: 'Bahasa Arab',
    kelompokArab: 'اللغة العربية',
    keywords: ['amtsilah', 'tashrif']
  },
  {
    namaLatin: 'Al-Imrithi',
    namaArab: 'العمريطي',
    kelompokNama: 'Bahasa Arab',
    kelompokArab: 'اللغة العربية',
    keywords: ['imrithi']
  },
  {
    namaLatin: 'Alfiyah Ibnu Malik',
    namaArab: 'ألفية ابن مالك',
    kelompokNama: 'Bahasa Arab',
    kelompokArab: 'اللغة العربية',
    keywords: ['alfiyah', 'malik']
  },
  {
    namaLatin: 'Nahwu Wadih',
    namaArab: 'النحو الواضح',
    kelompokNama: 'Bahasa Arab',
    kelompokArab: 'اللغة العربية',
    keywords: ['nahwu', 'wadih', 'nahwu wadih', 'an-nahwul wadhih']
  },
  {
    namaLatin: 'Mutammimah',
    namaArab: 'متممة',
    kelompokNama: 'Bahasa Arab',
    kelompokArab: 'اللغة العربية',
    keywords: ['mutammimah', 'mutammimatu', 'jurumiyyah']
  },

  // TAFSIR, TAJWID, TARIKH
  {
    namaLatin: 'Tafsir Jalalain',
    namaArab: 'تفسير الجلالين',
    kelompokNama: 'Tafsir',
    kelompokArab: 'التفسير',
    keywords: ['jalalain', 'tafsir']
  },
  {
    namaLatin: 'Tuhfatul Athfal',
    namaArab: 'تحفة الأطفال',
    kelompokNama: 'Tajwid',
    kelompokArab: 'التجويد',
    keywords: ['tuhfah', 'athfal']
  },
  {
    namaLatin: 'Al-Jazariyah',
    namaArab: 'المقدمة الجزرية',
    kelompokNama: 'Tajwid',
    kelompokArab: 'التجويد',
    keywords: ['jazari']
  },
  {
    namaLatin: 'Tajwid Batu Ngompal',
    namaArab: 'تجويد باتو ڠومڤل',
    kelompokNama: 'Tajwid',
    kelompokArab: 'تجويد',
    keywords: ['tajwid', 'batu ngompal', 'ngompal']
  },
  {
    namaLatin: 'Khulasoh Nurul Yaqin',
    namaArab: 'خلاصة نور اليقين',
    kelompokNama: 'Tarikh',
    kelompokArab: 'التاريخ',
    keywords: ['khulasoh', 'nurul yaqin', 'tarikh']
  },
  {
    namaLatin: 'Siroh Nabawi',
    namaArab: 'السيرة النبوية',
    kelompokNama: 'Tarikh',
    kelompokArab: 'التاريخ',
    keywords: ['siroh', 'nabawi', 'sirah']
  }
];

const PRESET_KELOMPOK_SUGGESTIONS = [
  { nama: 'Aqidah', arab: 'العقيدة', kode: 'AQIDAH' },
  { nama: 'Akhlak', arab: 'الأخلاق', kode: 'AKHLAK' },
  { nama: 'Fiqih', arab: 'فقه', kode: 'FIQIH' },
  { nama: 'Hadist', arab: 'الحديث', kode: 'HADIST' },
  { nama: 'Bahasa Arab', arab: 'اللغة العربية', kode: 'LUGHOH' },
  { nama: 'Nahwu & Shorof', arab: 'النحو والصرف', kode: 'NAHWU_SHOROF' },
  { nama: 'Tafsir', arab: 'التفسير', kode: 'TAFSIR' },
  { nama: 'Tajwid', arab: 'التجويد', kode: 'TAJWID' },
  { nama: 'Tarikh Islam', arab: 'التاريخ الإسلامي', kode: 'TARIKH' },
  { nama: 'Tasawuf', arab: 'التصوف', kode: 'TASAWUF' }
];

export function MapelMasterView({
  mapelList,
  setMapelList,
  kelompokMapelList,
  setKelompokMapelList,
  kelasList = [],
  showToast,
  addLog
}) {
  const [namaLatin, setNamaLatin] = useState('');
  const [namaArab, setNamaArab] = useState('');
  const [kelompokId, setKelompokId] = useState(
    kelompokMapelList.find((k) => k.namaKelompok.toLowerCase().includes('aqidah'))?.id ||
    kelompokMapelList[0]?.id ||
    'grp-1'
  );
  const [autoDetectedGroup, setAutoDetectedGroup] = useState(null);
  const [showAddKelompokModal, setShowAddKelompokModal] = useState(false);
  const [newKelompokNama, setNewKelompokNama] = useState('');
  const [newKelompokArab, setNewKelompokArab] = useState('');
  const [searchFilter, setSearchFilter] = useState('');
  const [filterKelompokId, setFilterKelompokId] = useState('ALL');
  const [filterKelasId, setFilterKelasId] = useState('ALL');
  const [suggestedKitabList, setSuggestedKitabList] = useState([]);

  // State untuk peruntukan kelas saat input kitab baru
  const [newTargetKelasIds, setNewTargetKelasIds] = useState(['ALL']);

  // State untuk modal edit peruntukan kelas
  const [editingKitabForKelas, setEditingKitabForKelas] = useState(null);
  const [modalTargetKelasIds, setModalTargetKelasIds] = useState(['ALL']);

  // State untuk modal edit kelompok & mapel
  const [editingKitabForKelompok, setEditingKitabForKelompok] = useState(null);
  const [modalEditKelompokId, setModalEditKelompokId] = useState('');
  const [modalEditNamaLatin, setModalEditNamaLatin] = useState('');
  const [modalEditNamaArab, setModalEditNamaArab] = useState('');
  const [showInlineAddKelompok, setShowInlineAddKelompok] = useState(false);
  const [inlineNewKelompokNama, setInlineNewKelompokNama] = useState('');
  const [inlineNewKelompokArab, setInlineNewKelompokArab] = useState('');

  // Tangani pengetikan nama kitab latin & integrasikan otomatis ke kelompok mapel
  const handleNamaLatinChange = (val) => {
    setNamaLatin(val);
    if (!val.trim()) {
      setAutoDetectedGroup(null);
      setSuggestedKitabList([]);
      return;
    }

    const clean = val.trim().toLowerCase();

    // Tampilkan suggestion autocomplete
    const matches = PONDOK_KITAB_DIRECTORY.filter(
      (k) =>
        k.namaLatin.toLowerCase().includes(clean) ||
        k.keywords.some((kw) => clean.includes(kw) || kw.includes(clean))
    );
    setSuggestedKitabList(matches.slice(0, 5));

    // Cek kecocokan persis atau parsial untuk auto-pilih kelompok & nama arab
    const exactOrBest = PONDOK_KITAB_DIRECTORY.find((k) =>
      clean.includes(k.namaLatin.toLowerCase()) ||
      k.namaLatin.toLowerCase().includes(clean) ||
      k.keywords.some((kw) => clean.includes(kw))
    );

    if (exactOrBest) {
      if (!namaArab.trim() || PONDOK_KITAB_DIRECTORY.some((p) => p.namaArab === namaArab.trim())) {
        setNamaArab(exactOrBest.namaArab);
      }

      // Cari kelompok yang sesuai di kelompokMapelList
      const targetGroup = kelompokMapelList.find(
        (g) =>
          g.namaKelompok.toLowerCase() === exactOrBest.kelompokNama.toLowerCase() ||
          g.namaKelompok.toLowerCase().includes(exactOrBest.kelompokNama.toLowerCase()) ||
          exactOrBest.kelompokNama.toLowerCase().includes(g.namaKelompok.toLowerCase())
      );

      if (targetGroup) {
        setKelompokId(targetGroup.id);
        setAutoDetectedGroup({
          nama: targetGroup.namaKelompok,
          arab: targetGroup.namaArab
        });
      } else {
        // Jika kelompok belum ada di list, otomatis buat kelompok baru
        const newGrpId = `grp-${Date.now()}`;
        const autoGrp = {
          id: newGrpId,
          kode: exactOrBest.kelompokNama.toUpperCase().replace(/[^A-Z0-9]/g, '_'),
          namaKelompok: exactOrBest.kelompokNama,
          namaArab: exactOrBest.kelompokArab,
          urutan: kelompokMapelList.length + 1
        };
        if (setKelompokMapelList) {
          setKelompokMapelList((prev) => [...prev, autoGrp]);
        }
        setKelompokId(newGrpId);
        setAutoDetectedGroup({
          nama: autoGrp.namaKelompok,
          arab: autoGrp.namaArab
        });
        SupabaseDB.upsert('kelompok_mapel', {
          id: autoGrp.id,
          kode: autoGrp.kode,
          nama_kelompok: autoGrp.namaKelompok,
          nama_arab: autoGrp.namaArab,
          urutan: autoGrp.urutan
        }).catch(() => { });
      }
    } else {
      // Heuristik kata kunci umum
      if (clean.includes('kalam') || clean.includes('aqid') || clean.includes('tauhid')) {
        const aqGroup = kelompokMapelList.find(
          (g) => g.namaKelompok.toLowerCase().includes('aqidah') || g.kode === 'AQIDAH'
        );
        if (aqGroup) {
          setKelompokId(aqGroup.id);
          setAutoDetectedGroup({ nama: aqGroup.namaKelompok, arab: aqGroup.namaArab });
        }
      } else if (clean.includes('fiqh') || clean.includes('fiqih')) {
        const fq = kelompokMapelList.find((g) => g.namaKelompok.toLowerCase().includes('fiqih'));
        if (fq) {
          setKelompokId(fq.id);
          setAutoDetectedGroup({ nama: fq.namaKelompok, arab: fq.namaArab });
        }
      } else if (clean.includes('hadis') || clean.includes('hadits') || clean.includes('hadist')) {
        const hd = kelompokMapelList.find((g) => g.namaKelompok.toLowerCase().includes('hadis'));
        if (hd) {
          setKelompokId(hd.id);
          setAutoDetectedGroup({ nama: hd.namaKelompok, arab: hd.namaArab });
        }
      }
    }
  };

  const handleSelectSuggestedKitab = (kitab) => {
    setNamaLatin(kitab.namaLatin);
    setNamaArab(kitab.namaArab);
    setSuggestedKitabList([]);

    const targetGroup = kelompokMapelList.find(
      (g) =>
        g.namaKelompok.toLowerCase() === kitab.kelompokNama.toLowerCase() ||
        g.namaKelompok.toLowerCase().includes(kitab.kelompokNama.toLowerCase()) ||
        kitab.kelompokNama.toLowerCase().includes(g.namaKelompok.toLowerCase())
    );

    if (targetGroup) {
      setKelompokId(targetGroup.id);
      setAutoDetectedGroup({
        nama: targetGroup.namaKelompok,
        arab: targetGroup.namaArab
      });
    } else {
      const newGrpId = `grp-${Date.now()}`;
      const autoGrp = {
        id: newGrpId,
        kode: kitab.kelompokNama.toUpperCase().replace(/[^A-Z0-9]/g, '_'),
        namaKelompok: kitab.kelompokNama,
        namaArab: kitab.kelompokArab,
        urutan: kelompokMapelList.length + 1
      };
      if (setKelompokMapelList) {
        setKelompokMapelList((prev) => [...prev, autoGrp]);
      }
      setKelompokId(newGrpId);
      setAutoDetectedGroup({
        nama: autoGrp.namaKelompok,
        arab: autoGrp.namaArab
      });
      SupabaseDB.upsert('kelompok_mapel', {
        id: autoGrp.id,
        kode: autoGrp.kode,
        nama_kelompok: autoGrp.namaKelompok,
        nama_arab: autoGrp.namaArab,
        urutan: autoGrp.urutan
      }).catch(() => { });
    }
  };

  // Tambah Mapel Baru
  const handleAddMapel = async (e) => {
    e.preventDefault();
    if (!namaLatin.trim() || !namaArab.trim()) return;

    const finalTargetKelasIds = newTargetKelasIds.length > 0 ? newTargetKelasIds : ['ALL'];

    const newMp = {
      id: `mp-${Date.now()}`,
      kodeMapel: `MP-${mapelList.length + 1}`,
      namaLatin: namaLatin.trim(),
      namaArab: namaArab.trim(),
      kelompokId,
      urutanTampil: mapelList.length + 1,
      statusAktif: true,
      statusWajib: true,
      targetKelasIds: finalTargetKelasIds
    };

    setMapelList((prev) => [...prev, newMp]);

    // Simpan relasi kelas ke localStorage
    try {
      const currentMap = JSON.parse(localStorage.getItem('rapor_kitab_kelas_map') || '{}');
      currentMap[newMp.id] = finalTargetKelasIds;
      localStorage.setItem('rapor_kitab_kelas_map', JSON.stringify(currentMap));
    } catch (_) { }

    setNamaLatin('');
    setNamaArab('');
    setAutoDetectedGroup(null);
    setSuggestedKitabList([]);
    setNewTargetKelasIds(['ALL']);

    try {
      await SupabaseDB.upsert('mata_pelajaran', {
        id: newMp.id,
        kode_mapel: newMp.kodeMapel,
        nama_latin: newMp.namaLatin,
        nama_arab: newMp.namaArab,
        kelompok_id: newMp.kelompokId,
        urutan_tampil: newMp.urutanTampil,
        status_aktif: true,
        status_wajib: true
      });
    } catch (_) { }

    const selectedGroup = kelompokMapelList.find((g) => g.id === newMp.kelompokId);
    const kelasDesc = finalTargetKelasIds.includes('ALL')
      ? 'Semua Kelas'
      : `${finalTargetKelasIds.length} Rombel Terpilih`;
    addLog(
      'TAMBAH_MAPEL',
      `Menambahkan kitab/mapel ${newMp.namaLatin} (Kelompok: ${selectedGroup?.namaKelompok || 'Umum'} • Peruntukan: ${kelasDesc})`
    );
    showToast(
      `Mata pelajaran ${newMp.namaLatin} berhasil ditambahkan (${kelasDesc})!`
    );
  };

  // Tambah Kelompok Baru secara fleksibel & langsung simpan ke Supabase
  const handleSaveNewKelompok = async (e) => {
    e.preventDefault();
    if (!newKelompokNama.trim()) return;

    const trimmedNama = newKelompokNama.trim();
    const matchedPreset = PRESET_KELOMPOK_SUGGESTIONS.find(
      (p) => p.nama.toLowerCase() === trimmedNama.toLowerCase()
    );
    const finalArab = newKelompokArab.trim() || matchedPreset?.arab || trimmedNama;

    const newGrp = {
      id: `grp-${Date.now()}`,
      kode: trimmedNama.toUpperCase().replace(/[^A-Z0-9]/g, '_').slice(0, 15) || 'GRP',
      namaKelompok: trimmedNama,
      namaArab: finalArab,
      urutan: kelompokMapelList.length + 1
    };

    if (setKelompokMapelList) {
      setKelompokMapelList((prev) => [...prev, newGrp]);
    }
    setKelompokId(newGrp.id);
    setAutoDetectedGroup({ nama: newGrp.namaKelompok, arab: newGrp.namaArab });

    try {
      await SupabaseDB.upsert('kelompok_mapel', {
        id: newGrp.id,
        kode: newGrp.kode,
        nama_kelompok: newGrp.namaKelompok,
        nama_arab: newGrp.namaArab,
        urutan: newGrp.urutan
      });
    } catch (err) {
      console.warn('Gagal simpan kelompok ke Supabase:', err);
    }

    addLog('TAMBAH_KELOMPOK', `Menambahkan kelompok mapel baru: ${newGrp.namaKelompok} (${newGrp.namaArab})`);
    showToast(`Kelompok "${newGrp.namaKelompok}" berhasil ditambahkan & tersimpan ke Supabase!`);
    setNewKelompokNama('');
    setNewKelompokArab('');
    setShowAddKelompokModal(false);
  };

  // Buka Modal Atur Peruntukan Kelas
  const openEditKelasModal = (m) => {
    setEditingKitabForKelas(m);
    setModalTargetKelasIds(
      m.targetKelasIds && m.targetKelasIds.length > 0 ? [...m.targetKelasIds] : ['ALL']
    );
  };

  // Simpan Peruntukan Kelas dari Modal
  const handleSavePeruntukanKelasModal = () => {
    if (!editingKitabForKelas) return;

    let finalIds = modalTargetKelasIds;
    if (finalIds.length === 0) finalIds = ['ALL'];

    const updatedList = mapelList.map((m) =>
      m.id === editingKitabForKelas.id ? { ...m, targetKelasIds: finalIds } : m
    );

    setMapelList(updatedList);

    try {
      const currentMap = JSON.parse(localStorage.getItem('rapor_kitab_kelas_map') || '{}');
      currentMap[editingKitabForKelas.id] = finalIds;
      localStorage.setItem('rapor_kitab_kelas_map', JSON.stringify(currentMap));
    } catch (_) { }

    const countLabel = finalIds.includes('ALL')
      ? 'Semua Kelas'
      : `${finalIds.length} Rombel Terpilih`;
    addLog(
      'UPDATE_KITAB_KELAS',
      `Memperbarui peruntukan kelas untuk kitab ${editingKitabForKelas.namaLatin} (${countLabel})`
    );
    showToast(
      `Peruntukan kelas untuk kitab "${editingKitabForKelas.namaLatin}" berhasil disimpan (${countLabel})!`
    );
    setEditingKitabForKelas(null);
  };

  // Buka Modal Atur Kelompok & Edit Kitab
  const openEditKelompokModal = (m) => {
    setEditingKitabForKelompok(m);
    setModalEditKelompokId(m.kelompokId || kelompokMapelList[0]?.id || '');
    setModalEditNamaLatin(m.namaLatin || '');
    setModalEditNamaArab(m.namaArab || '');
    setShowInlineAddKelompok(false);
    setInlineNewKelompokNama('');
    setInlineNewKelompokArab('');
  };

  // Simpan Perubahan Kelompok & Detail Kitab
  const handleSaveEditKelompokModal = async () => {
    if (!editingKitabForKelompok) return;
    if (!modalEditNamaLatin.trim() || !modalEditNamaArab.trim() || !modalEditKelompokId) {
      showToast('Nama latin, nama Arab, dan kelompok tidak boleh kosong!', 'warning');
      return;
    }

    const updatedMp = {
      ...editingKitabForKelompok,
      namaLatin: modalEditNamaLatin.trim(),
      namaArab: modalEditNamaArab.trim(),
      kelompokId: modalEditKelompokId
    };

    setMapelList((prev) =>
      prev.map((m) => (m.id === editingKitabForKelompok.id ? updatedMp : m))
    );

    try {
      await SupabaseDB.updateById('mata_pelajaran', editingKitabForKelompok.id, {
        nama_latin: updatedMp.namaLatin,
        nama_arab: updatedMp.namaArab,
        kelompok_id: updatedMp.kelompokId
      });
    } catch (_) { }

    const targetGrp = kelompokMapelList.find((g) => g.id === modalEditKelompokId);
    addLog(
      'EDIT_MAPEL',
      `Mengubah kelompok kitab ${updatedMp.namaLatin} menjadi ${targetGrp?.namaKelompok || 'Umum'}`
    );
    showToast(
      `Kelompok kitab "${updatedMp.namaLatin}" berhasil diubah ke ${targetGrp?.namaKelompok || ''}!`
    );
    setEditingKitabForKelompok(null);
  };

  // Tambah kelompok baru langsung dari dalam modal edit
  const handleSaveInlineKelompok = async () => {
    if (!inlineNewKelompokNama.trim()) return;
    const trimmedNama = inlineNewKelompokNama.trim();
    const matchedPreset = PRESET_KELOMPOK_SUGGESTIONS.find(
      (p) => p.nama.toLowerCase() === trimmedNama.toLowerCase()
    );
    const finalArab = inlineNewKelompokArab.trim() || matchedPreset?.arab || trimmedNama;

    const newGrp = {
      id: `grp-${Date.now()}`,
      kode: trimmedNama.toUpperCase().replace(/[^A-Z0-9]/g, '_').slice(0, 15) || 'GRP',
      namaKelompok: trimmedNama,
      namaArab: finalArab,
      urutan: kelompokMapelList.length + 1
    };

    if (setKelompokMapelList) {
      setKelompokMapelList((prev) => [...prev, newGrp]);
    }
    setModalEditKelompokId(newGrp.id);

    try {
      await SupabaseDB.upsert('kelompok_mapel', {
        id: newGrp.id,
        kode: newGrp.kode,
        nama_kelompok: newGrp.namaKelompok,
        nama_arab: newGrp.namaArab,
        urutan: newGrp.urutan
      });
    } catch (_) { }

    showToast(`Kelompok "${newGrp.namaKelompok}" berhasil ditambahkan & langsung dipilih!`);
    setShowInlineAddKelompok(false);
    setInlineNewKelompokNama('');
    setInlineNewKelompokArab('');
  };

  // Hapus mapel
  const handleDeleteMapel = async (id, nama) => {
    if (!window.confirm(`Hapus mata pelajaran ${nama}?`)) return;
    setMapelList((prev) => prev.filter((m) => m.id !== id));
    try {
      const currentMap = JSON.parse(localStorage.getItem('rapor_kitab_kelas_map') || '{}');
      delete currentMap[id];
      localStorage.setItem('rapor_kitab_kelas_map', JSON.stringify(currentMap));
    } catch (_) { }
    try {
      await SupabaseDB.deleteById('mata_pelajaran', id);
    } catch (_) { }
    addLog('HAPUS_MAPEL', `Menghapus kitab/mapel ${nama}`);
    showToast(`Mapel ${nama} dihapus.`);
  };

  const filteredMapels = mapelList.filter((m) => {
    const matchSearch =
      m.namaLatin.toLowerCase().includes(searchFilter.toLowerCase()) ||
      m.namaArab.includes(searchFilter);
    const matchKelompok = filterKelompokId === 'ALL' || m.kelompokId === filterKelompokId;
    const matchKelas =
      filterKelasId === 'ALL'
        ? true
        : filterKelasId === '__ALL_ONLY__'
          ? !m.targetKelasIds || m.targetKelasIds.length === 0 || m.targetKelasIds.includes('ALL')
          : isMapelForKelas(m, filterKelasId);
    return matchSearch && matchKelompok && matchKelas;
  });

  return (
    <div className="space-y-4">
      {/* FORM INPUT MAPEL BARU DENGAN INTEGRASI KELOMPOK & PERUNTUKAN KELAS */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3.5">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold shrink-0">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-xs sm:text-sm">Input Mata Pelajaran / Kitab Baru</h3>
              <p className="text-[11px] text-slate-500">
                Ketik nama kitab latin, tentukan peruntukan kelas, nama Arab, dan kelompoknya secara otomatis
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowAddKelompokModal(true)}
            className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-700" />
            <span>+ Tambah Kelompok Baru</span>
          </button>
        </div>

        <form onSubmit={handleAddMapel} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 text-xs items-center">
            {/* INPUT NAMA LATIN DENGAN AUTOCOMPLETE */}
            <div className="relative sm:col-span-4">
              <input
                type="text"
                value={namaLatin}
                onChange={(e) => handleNamaLatinChange(e.target.value)}
                placeholder="Nama Kitab (Misal: Jawahirul Kalamiyah)"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
                required
              />
              {suggestedKitabList.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded-xl shadow-xl border border-slate-200 z-30 overflow-hidden divide-y divide-slate-100">
                  {suggestedKitabList.map((item, idx) => (
                    <div
                      key={idx}
                      onClick={() => handleSelectSuggestedKitab(item)}
                      className="p-2.5 hover:bg-emerald-50 cursor-pointer flex items-center justify-between text-xs transition"
                    >
                      <div>
                        <div className="font-bold text-slate-800">{item.namaLatin}</div>
                        <div className="text-[10px] text-emerald-700 font-bold">
                          Kelompok: {item.kelompokNama}
                        </div>
                      </div>
                      <div dir="rtl" className="font-arabic text-emerald-900 text-sm font-bold">
                        {item.namaArab}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* INPUT NAMA ARAB */}
            <div className="sm:col-span-3">
              <input
                type="text"
                dir="rtl"
                value={namaArab}
                onChange={(e) => setNamaArab(e.target.value)}
                placeholder="Nama Kitab Arab (الجواهر الكلامية)"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-arabic text-base font-bold text-emerald-950 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
                required
              />
            </div>

            {/* DROPDOWN PILIHAN KELOMPOK DENGAN FITUR TAMBAH KELOMPOK */}
            <div className="sm:col-span-3 flex items-center gap-1.5">
              <select
                value={kelompokId}
                onChange={(e) => {
                  if (e.target.value === '__NEW__') {
                    setShowAddKelompokModal(true);
                  } else {
                    setKelompokId(e.target.value);
                    const sel = kelompokMapelList.find((g) => g.id === e.target.value);
                    setAutoDetectedGroup(sel ? { nama: sel.namaKelompok, arab: sel.namaArab } : null);
                  }
                }}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
              >
                {kelompokMapelList.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.namaKelompok} ({g.namaArab})
                  </option>
                ))}
                <option value="__NEW__" className="text-emerald-700 font-bold">
                  ➕ + Tambah Kelompok Baru...
                </option>
              </select>
            </div>

            {/* TOMBOL SUBMIT */}
            <div className="sm:col-span-2">
              <button
                type="submit"
                className="w-full px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold flex items-center justify-center gap-1.5 shadow-xs transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Tambah Kitab</span>
              </button>
            </div>
          </div>

          {/* PERUNTUKAN KELAS UNTUK KITAB INI */}
          <div className="pt-2.5 border-t border-slate-100 bg-slate-50/70 p-3 rounded-xl border border-slate-200/80">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                <GraduationCap className="w-4 h-4 text-emerald-700" />
                <span>Peruntukan Kelas:</span>
                <span className="text-[11px] font-normal text-slate-500">
                  (Pilih kelas mana saja yang mempelajari kitab ini)
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-1 text-[11px]">
                <button
                  type="button"
                  onClick={() => setNewTargetKelasIds(['ALL'])}
                  className={`px-2.5 py-0.5 rounded-lg font-bold transition cursor-pointer border ${newTargetKelasIds.includes('ALL') || newTargetKelasIds.length === 0
                      ? 'bg-emerald-700 text-white border-emerald-700 shadow-2xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                >
                  ✓ Semua Kelas
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const t1Ids = kelasList.filter((k) => k.tingkat === 1).map((k) => k.id);
                    setNewTargetKelasIds(t1Ids);
                  }}
                  className="px-2 py-0.5 rounded-lg font-semibold bg-white text-slate-700 border border-slate-200 hover:bg-slate-100 transition cursor-pointer"
                >
                  Tingkat 1 (VII)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const t4Ids = kelasList.filter((k) => k.tingkat === 4).map((k) => k.id);
                    setNewTargetKelasIds(t4Ids);
                  }}
                  className="px-2 py-0.5 rounded-lg font-semibold bg-white text-slate-700 border border-slate-200 hover:bg-slate-100 transition cursor-pointer"
                >
                  Tingkat 4 (X)
                </button>
                <button
                  type="button"
                  onClick={() => setNewTargetKelasIds([])}
                  className="px-2 py-0.5 rounded-lg font-semibold text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                >
                  Kosongkan
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {kelasList.map((k) => {
                const isAll = newTargetKelasIds.includes('ALL');
                const isSelected = isAll || newTargetKelasIds.includes(k.id);
                return (
                  <button
                    key={k.id}
                    type="button"
                    onClick={() => {
                      if (newTargetKelasIds.includes('ALL')) {
                        setNewTargetKelasIds([k.id]);
                      } else if (newTargetKelasIds.includes(k.id)) {
                        const filtered = newTargetKelasIds.filter((id) => id !== k.id);
                        setNewTargetKelasIds(filtered.length === 0 ? ['ALL'] : filtered);
                      } else {
                        setNewTargetKelasIds([...newTargetKelasIds, k.id]);
                      }
                    }}
                    className={`px-2.5 py-1 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer border ${isSelected && !isAll
                        ? 'bg-emerald-700 text-white border-emerald-700 shadow-2xs font-bold'
                        : isAll
                          ? 'bg-emerald-50/90 text-emerald-800 border-emerald-200 font-semibold'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70"></span>
                    <span>{k.namaKelas}</span>
                    <span className="text-[10px] opacity-75">(T{k.tingkat})</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* BADGE INDIKATOR INTEGRASI OTOMATIS */}
          {autoDetectedGroup && (
            <div className="flex items-center gap-2 text-[11px] bg-emerald-50 text-emerald-900 border border-emerald-200/80 px-3 py-1.5 rounded-xl">
              <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>
                <b>Integrasi Otomatis:</b> Kitab ini otomatis dimasukkan ke kelompok{' '}
                <span className="font-extrabold text-emerald-950 underline decoration-emerald-500">
                  {autoDetectedGroup.nama} ({autoDetectedGroup.arab})
                </span>
              </span>
            </div>
          )}
        </form>
      </div>

      {/* MODAL TAMBAH KELOMPOK BARU */}
      {showAddKelompokModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-900 to-teal-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-emerald-300 font-bold">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Tambah Kelompok Mapel Baru</h3>
                  <p className="text-[11px] text-emerald-200/90">
                    Otomatis tersimpan ke Supabase & muncul di cetak rapor
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddKelompokModal(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveNewKelompok} className="p-4 sm:p-5 space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nama Kelompok (Latin):
                </label>
                <input
                  type="text"
                  value={newKelompokNama}
                  onChange={(e) => {
                    setNewKelompokNama(e.target.value);
                    const match = PRESET_KELOMPOK_SUGGESTIONS.find(
                      (p) => p.nama.toLowerCase() === e.target.value.trim().toLowerCase()
                    );
                    if (match && !newKelompokArab) {
                      setNewKelompokArab(match.arab);
                    }
                  }}
                  placeholder="Misal: Aqidah, Nahwu, Tafsir, Tajwid..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nama Kelompok (Bahasa Arab):
                </label>
                <input
                  type="text"
                  dir="rtl"
                  value={newKelompokArab}
                  onChange={(e) => setNewKelompokArab(e.target.value)}
                  placeholder="العقيدة / النحو / التفسير"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-arabic text-base font-bold text-emerald-950 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  required
                />
              </div>

              {/* QUICK PRESET CHIPS */}
              <div>
                <span className="block text-[11px] text-slate-500 font-medium mb-1.5">
                  Pilihan Rekomendasi Cepat (Klik untuk memilih):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_KELOMPOK_SUGGESTIONS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setNewKelompokNama(preset.nama);
                        setNewKelompokArab(preset.arab);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-emerald-100 hover:text-emerald-900 border border-slate-200 text-[11px] font-semibold text-slate-700 transition cursor-pointer"
                    >
                      {preset.nama} ({preset.arab})
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddKelompokModal(false)}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Simpan Kelompok</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL ATUR PERUNTUKAN KELAS UNTUK KITAB TERTENTU */}
      {editingKitabForKelas && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-900 via-teal-900 to-emerald-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-emerald-300 font-bold">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Atur Peruntukan Kelas</h3>
                  <p className="text-[11px] text-emerald-200/90 font-medium">
                    Kitab: <span className="font-bold text-white">{editingKitabForKelas.namaLatin}</span>{' '}
                    <span dir="rtl" className="font-arabic font-bold text-emerald-300">
                      ({editingKitabForKelas.namaArab})
                    </span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingKitabForKelas(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 sm:p-5 space-y-4 text-xs">
              {/* Card Toggle Semua Kelas */}
              <div
                onClick={() => {
                  if (modalTargetKelasIds.includes('ALL')) {
                    setModalTargetKelasIds([]);
                  } else {
                    setModalTargetKelasIds(['ALL']);
                  }
                }}
                className={`p-3.5 rounded-2xl border-2 transition cursor-pointer flex items-center justify-between ${modalTargetKelasIds.includes('ALL') || modalTargetKelasIds.length === 0
                    ? 'bg-emerald-50/90 border-emerald-600 shadow-xs'
                    : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                  }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-5 h-5 rounded-md flex items-center justify-center border font-bold ${modalTargetKelasIds.includes('ALL') || modalTargetKelasIds.length === 0
                        ? 'bg-emerald-700 text-white border-emerald-700'
                        : 'border-slate-300 bg-white'
                      }`}
                  >
                    {(modalTargetKelasIds.includes('ALL') || modalTargetKelasIds.length === 0) && (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    )}
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 text-xs sm:text-sm">
                      Berlaku untuk Semua Kelas
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Kitab ini dipelajari oleh santri di seluruh rombel dan tingkat
                    </div>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-extrabold uppercase tracking-wide">
                  Umum
                </span>
              </div>

              {/* Pilihan Rombel Spesifik */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-slate-700 text-[11px]">
                    Atau Pilih Kelas Tertentu yang Mempelajari Kitab Ini:
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setModalTargetKelasIds(kelasList.map((k) => k.id))}
                      className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold cursor-pointer"
                    >
                      Pilih Semua Rombel
                    </button>
                    <button
                      type="button"
                      onClick={() => setModalTargetKelasIds([])}
                      className="px-2 py-0.5 rounded text-rose-600 hover:bg-rose-50 text-[10px] font-bold cursor-pointer"
                    >
                      Reset
                    </button>
                  </div>
                </div>

                {/* Quick Tingkat Filters */}
                <div className="flex flex-wrap gap-1.5 mb-2.5">
                  {[1, 2, 3, 4, 5, 6].map((tingkatNum) => {
                    const klsInTingkat = kelasList.filter((k) => k.tingkat === tingkatNum);
                    if (klsInTingkat.length === 0) return null;
                    const isAllSelected =
                      !modalTargetKelasIds.includes('ALL') &&
                      klsInTingkat.every((k) => modalTargetKelasIds.includes(k.id));
                    return (
                      <button
                        key={tingkatNum}
                        type="button"
                        onClick={() => {
                          const ids = klsInTingkat.map((k) => k.id);
                          if (modalTargetKelasIds.includes('ALL')) {
                            setModalTargetKelasIds(ids);
                          } else if (isAllSelected) {
                            setModalTargetKelasIds((prev) => prev.filter((id) => !ids.includes(id)));
                          } else {
                            setModalTargetKelasIds((prev) =>
                              Array.from(new Set([...prev.filter((id) => id !== 'ALL'), ...ids]))
                            );
                          }
                        }}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer border ${isAllSelected
                            ? 'bg-emerald-700 text-white border-emerald-700'
                            : 'bg-slate-100 hover:bg-emerald-50 text-slate-700 border-slate-200'
                          }`}
                      >
                        + Tingkat {tingkatNum}
                      </button>
                    );
                  })}
                </div>

                {/* Grid of classes */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto p-1.5 border border-slate-200 rounded-2xl bg-slate-50/50">
                  {kelasList.map((k) => {
                    const isChecked =
                      modalTargetKelasIds.includes('ALL') ||
                      modalTargetKelasIds.includes(k.id);
                    return (
                      <div
                        key={k.id}
                        onClick={() => {
                          if (modalTargetKelasIds.includes('ALL')) {
                            setModalTargetKelasIds([k.id]);
                          } else if (modalTargetKelasIds.includes(k.id)) {
                            setModalTargetKelasIds((prev) => prev.filter((id) => id !== k.id));
                          } else {
                            setModalTargetKelasIds((prev) => [...prev, k.id]);
                          }
                        }}
                        className={`p-2.5 rounded-xl border transition cursor-pointer flex items-center gap-2.5 ${isChecked && !modalTargetKelasIds.includes('ALL')
                            ? 'bg-emerald-50 border-emerald-400 text-emerald-950 font-bold'
                            : modalTargetKelasIds.includes('ALL')
                              ? 'bg-white border-emerald-200 text-emerald-900'
                              : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                          }`}
                      >
                        <div
                          className={`w-4 h-4 rounded flex items-center justify-center border shrink-0 ${isChecked
                              ? 'bg-emerald-700 text-white border-emerald-700'
                              : 'border-slate-300 bg-white'
                            }`}
                        >
                          {isChecked && <CheckCircle2 className="w-3 h-3" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs">{k.namaKelas}</span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-medium">
                              Tingkat {k.tingkat}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-500 truncate">
                            Wali: {k.waliKelas}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingKitabForKelas(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSavePeruntukanKelasModal}
                  className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan Peruntukan Kelas</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ATUR KELOMPOK & DETAIL KITAB */}
      {editingKitabForKelompok && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-900 via-teal-900 to-emerald-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-emerald-300 font-bold">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Atur Kelompok & Detail Kitab</h3>
                  <p className="text-[11px] text-emerald-200/90 font-medium">
                    Kitab: <span className="font-bold text-white">{editingKitabForKelompok.namaLatin}</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingKitabForKelompok(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 sm:p-5 space-y-4 text-xs">
              {/* EDIT NAMA LATIN & ARAB */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Nama Kitab (Latin):
                  </label>
                  <input
                    type="text"
                    value={modalEditNamaLatin}
                    onChange={(e) => setModalEditNamaLatin(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    placeholder="Nama Kitab Latin"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Nama Kitab (Arab):
                  </label>
                  <input
                    type="text"
                    dir="rtl"
                    value={modalEditNamaArab}
                    onChange={(e) => setModalEditNamaArab(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-300 font-arabic text-base font-bold text-emerald-950 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    placeholder="اسم الكتاب بالعربية"
                    required
                  />
                </div>
              </div>

              {/* PILIHAN KELOMPOK */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block font-bold text-slate-800 text-xs">
                    Pilih Kelompok Mapel / Kitab:
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowInlineAddKelompok((prev) => !prev)}
                    className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{showInlineAddKelompok ? 'Tutup Form' : '+ Buat Kelompok Baru'}</span>
                  </button>
                </div>

                {/* FORM INLINE BUAT KELOMPOK BARU */}
                {showInlineAddKelompok && (
                  <div className="mb-3 p-3 rounded-2xl bg-emerald-50/80 border border-emerald-200 space-y-2.5 animate-in fade-in duration-150">
                    <div className="text-[11px] font-bold text-emerald-900 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>Buat Kelompok Baru & Langsung Terapkan:</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={inlineNewKelompokNama}
                        onChange={(e) => setInlineNewKelompokNama(e.target.value)}
                        placeholder="Nama Kelompok Latin (Mis: Nahwu, Tarikh)"
                        className="px-2.5 py-1.5 rounded-xl border border-slate-300 text-xs font-semibold bg-white"
                      />
                      <input
                        type="text"
                        dir="rtl"
                        value={inlineNewKelompokArab}
                        onChange={(e) => setInlineNewKelompokArab(e.target.value)}
                        placeholder="الاسم بالعربية"
                        className="px-2.5 py-1.5 rounded-xl border border-slate-300 text-xs font-arabic font-bold text-emerald-950 bg-white"
                      />
                    </div>
                    <div className="flex justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => setShowInlineAddKelompok(false)}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-bold text-slate-600 hover:bg-slate-200 cursor-pointer"
                      >
                        Batal
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveInlineKelompok}
                        className="px-3 py-1 rounded-lg text-[11px] font-bold bg-emerald-700 hover:bg-emerald-800 text-white cursor-pointer shadow-2xs"
                      >
                        Simpan & Pilih
                      </button>
                    </div>
                  </div>
                )}

                {/* GRID PILIHAN KELOMPOK */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto p-1.5 border border-slate-200 rounded-2xl bg-slate-50/50">
                  {kelompokMapelList.map((grp) => {
                    const isSelected = modalEditKelompokId === grp.id;
                    const bookCount = mapelList.filter((m) => m.kelompokId === grp.id).length;
                    return (
                      <div
                        key={grp.id}
                        onClick={() => setModalEditKelompokId(grp.id)}
                        className={`p-2.5 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? 'bg-emerald-50 border-emerald-500 shadow-xs'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-4 h-4 rounded-full flex items-center justify-center border shrink-0 ${
                              isSelected
                                ? 'bg-emerald-700 text-white border-emerald-700'
                                : 'border-slate-300 bg-white'
                            }`}
                          >
                            {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white"></span>}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 text-xs">{grp.namaKelompok}</div>
                            <div dir="rtl" className="font-arabic text-[11px] text-emerald-800 font-bold">
                              {grp.namaArab}
                            </div>
                          </div>
                        </div>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold">
                          {bookCount} kitab
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* FOOTER MODAL */}
              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingKitabForKelompok(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSaveEditKelompokModal}
                  className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan Perubahan Kelompok</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FILTER & TABEL DAFTAR MATA PELAJARAN */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-3.5 sm:p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-xs sm:text-sm text-slate-900">
              Daftar Kitab & Mata Pelajaran ({filteredMapels.length})
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* FILTER KELOMPOK */}
            <select
              value={filterKelompokId}
              onChange={(e) => setFilterKelompokId(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 font-bold text-slate-700 bg-slate-50"
            >
              <option value="ALL">Semua Kelompok</option>
              {kelompokMapelList.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.namaKelompok}
                </option>
              ))}
            </select>

            {/* FILTER BERDASARKAN PERUNTUKAN KELAS */}
            <select
              value={filterKelasId}
              onChange={(e) => setFilterKelasId(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 font-bold text-slate-700 bg-slate-50"
            >
              <option value="ALL">Semua Kelas & Kitab</option>
              <option value="__ALL_ONLY__">Khusus Berlaku Semua Kelas</option>
              {kelasList.map((k) => (
                <option key={k.id} value={k.id}>
                  Kitab untuk {k.namaKelas} (Tingkat {k.tingkat})
                </option>
              ))}
            </select>

            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Cari kitab..."
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs w-36 sm:w-48"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700">
              <tr>
                <th className="py-3 px-4 text-center w-12 font-bold">No</th>
                <th className="py-3 px-4 text-left font-bold">Kelompok</th>
                <th className="py-3 px-4 text-left font-bold">Nama Kitab (Latin)</th>
                <th className="py-3 px-4 text-right font-bold">Nama Kitab (Arab)</th>
                <th className="py-3 px-4 text-left font-bold">Peruntukan Kelas</th>
                <th className="py-3 px-4 text-right font-bold w-20">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMapels.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Tidak ada mata pelajaran yang cocok dengan filter yang dipilih.
                  </td>
                </tr>
              ) : (
                filteredMapels.map((m, i) => {
                  const grp = kelompokMapelList.find((g) => g.id === m.kelompokId);
                  const isAllKelas =
                    !m.targetKelasIds ||
                    m.targetKelasIds.length === 0 ||
                    m.targetKelasIds.includes('ALL');
                  return (
                    <tr key={m.id} className="hover:bg-slate-50 transition">
                      <td className="py-2.5 px-4 text-center text-slate-400 font-mono">{i + 1}</td>
                      <td className="py-2.5 px-4">
                        <div className="flex flex-col items-start gap-1">
                          <span className="font-bold text-slate-800 text-xs">
                            {grp ? `${grp.namaKelompok} (${grp.namaArab})` : '—'}
                          </span>
                          <button
                            type="button"
                            onClick={() => openEditKelompokModal(m)}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px] font-bold transition cursor-pointer shadow-2xs"
                            title="Ubah kelompok untuk kitab ini"
                          >
                            <Layers className="w-3 h-3 text-emerald-700" />
                            <span>Atur Kelompok</span>
                          </button>
                        </div>
                      </td>
                      <td className="py-2.5 px-4 font-bold text-slate-900">{m.namaLatin}</td>
                      <td
                        dir="rtl"
                        className="py-2.5 px-4 text-right font-arabic text-base font-bold text-emerald-900"
                      >
                        {m.namaArab}
                      </td>
                      <td className="py-2.5 px-4">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {isAllKelas ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200/80 font-bold text-[10px]">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              Semua Kelas
                            </span>
                          ) : (
                            <div className="flex flex-wrap gap-1">
                              {m.targetKelasIds.map((kid) => {
                                const kObj = kelasList.find((k) => k.id === kid);
                                return (
                                  <span
                                    key={kid}
                                    className="inline-flex items-center px-2 py-0.5 rounded-md bg-teal-50 text-teal-800 border border-teal-200 font-bold text-[10px]"
                                  >
                                    {kObj ? kObj.namaKelas : kid}
                                  </span>
                                );
                              })}
                            </div>
                          )}
                          <button
                            type="button"
                            onClick={() => openEditKelasModal(m)}
                            className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border border-slate-200 text-[10px] font-bold flex items-center gap-1 transition cursor-pointer"
                            title="Ubah peruntukan kelas untuk kitab ini"
                          >
                            <GraduationCap className="w-3 h-3 text-emerald-700" />
                            <span>Atur Kelas</span>
                          </button>
                        </div>
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => openEditKelompokModal(m)}
                            className="text-emerald-700 hover:text-emerald-900 p-1.5 rounded-lg hover:bg-emerald-50 transition cursor-pointer"
                            title="Edit Kitab & Kelompok"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteMapel(m.id, m.namaLatin)}
                            className="text-rose-500 hover:text-rose-700 p-1.5 rounded-lg hover:bg-rose-50 transition cursor-pointer"
                            title="Hapus Mapel"
                          >
                            <Trash2 className="w-4 h-4" />
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
    </div>
  );
}