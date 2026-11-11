// ============================================================================
// INITIAL DATABASE SEED, CONSTANTS & DEFAULT DATASETS
// ============================================================================

export const TINGKAT_LABELS = {
  1: 'Tingkat 1 (Kelas 1 / VII)',
  2: 'Tingkat 2 (Kelas 2 / VIII)',
  3: 'Tingkat 3 (Kelas 3 / IX)',
  4: 'Tingkat 4 (Kelas 4 / X)',
  5: 'Tingkat 5 (Kelas 5 / XI)',
  6: 'Tingkat 6 Akhir (Kelas 6 / XII)'
};

export function inferTingkatFromNama(namaKelas = '', rawTingkat = 1) {
  const n = Number(rawTingkat || 0);
  if (n >= 1 && n <= 6) return n;

  const upper = String(namaKelas || '').toUpperCase().trim();
  if (
    n === 12 ||
    /\b(XII|6|VI|AKHIR)\b/.test(upper) ||
    upper.includes('KELAS 6') ||
    upper.includes('TINGKAT 6')
  ) {
    return 6;
  }
  if (
    n === 11 ||
    /\b(XI|5)\b/.test(upper) ||
    upper.includes('KELAS 5') ||
    upper.includes('TINGKAT 5')
  ) {
    return 5;
  }
  if (
    n === 10 ||
    /\b(X|4)\b/.test(upper) ||
    upper.includes('KELAS 4') ||
    upper.includes('TINGKAT 4')
  ) {
    return 4;
  }
  if (
    n === 9 ||
    /\b(IX|3)\b/.test(upper) ||
    upper.includes('KELAS 3') ||
    upper.includes('TINGKAT 3')
  ) {
    return 3;
  }
  if (
    n === 8 ||
    /\b(VIII|2)\b/.test(upper) ||
    upper.includes('KELAS 2') ||
    upper.includes('TINGKAT 2')
  ) {
    return 2;
  }
  if (n >= 7 && n <= 12) return n - 6;
  return 1;
}

export function normalizeTingkat(rawTingkat, namaKelas = '') {
  const num = Number(rawTingkat || 0);
  if (num >= 2 && num <= 6) return num;
  return inferTingkatFromNama(namaKelas, num);
}

export const INITIAL_PONDOK = {
  namaPondokLatin: "Ma'had Bali Bina Insani",
  namaPondokArab: 'معهد بالي بينا انساني الاسلامية',
  alamat: 'Jl. Raya Timpag, Meliling, Kec. Kerambitan, Kabupaten Tabanan, Bali',
  kabupatenKota: 'Kerambitan',
  telepon: '(0361) 8945123',
  email: 'akademik@balibinainsani.sch.id',
  website: 'www.balibinainsani.sch.id',
  logoUrl: '',
  namaPimpinan: 'I BM Andhika S, S.H., C.P.L',
  nipPimpinan: 'Direktur',
  tanggalCetakMasehi: '20 Juni 2024M',
  tanggalCetakHijriyah: '13 Dzulhijjah 1445H',
  tanggalCetakDefault: '20 Juni 2024M / 13 Dzulhijjah 1445H'
};

export const INITIAL_TAHUN_AJARAN = [
  { id: 'ta-2026', nama: '2026 – 2027', namaArab: '٢٠٢٦ - ٢٠٢٧', isActive: true },
  { id: 'ta-2023', nama: '2023 – 2024', namaArab: '٢٠٢٣ - ٢٠٢٤', isActive: false },
  { id: 'ta-2024', nama: '2024 – 2025', namaArab: '٢٠٢٤ - ٢٠٢٥', isActive: false }
];

export const INITIAL_SEMESTERS = [
  { id: 'sem-2026-1', tahunAjaranId: 'ta-2026', nama: 'Ganjil', namaArab: 'الأول', angka: 1, isActive: true },
  { id: 'sem-2026-2', tahunAjaranId: 'ta-2026', nama: 'Genap', namaArab: 'الثاني', angka: 2, isActive: false },
  { id: 'sem-2023-1', tahunAjaranId: 'ta-2023', nama: 'Ganjil', namaArab: 'الأول', angka: 1, isActive: false },
  { id: 'sem-2023-2', tahunAjaranId: 'ta-2023', nama: 'Genap', namaArab: 'الثاني', angka: 2, isActive: false },
  { id: 'sem-2024-1', tahunAjaranId: 'ta-2024', nama: 'Ganjil', namaArab: 'الأول', angka: 1, isActive: false },
  { id: 'sem-2024-2', tahunAjaranId: 'ta-2024', nama: 'Genap', namaArab: 'الثاني', angka: 2, isActive: false }
];

export const INITIAL_KELAS = [
  {
    id: 'kls-7a',
    namaKelas: 'VII A',
    namaArab: 'الأول أ',
    tingkat: 1,
    waliKelas: "Baiq Jannatun 'Adnin, S.Pd",
    nipWali: 'Wali Kelas Tingkat 1 (VII A)',
    kapasitas: 30,
    isActive: true
  },
  {
    id: 'kls-7b',
    namaKelas: 'VII B',
    namaArab: 'الأول ب',
    tingkat: 1,
    waliKelas: 'Ust. Muhammad Al-Fatih, Lc.',
    nipWali: 'Wali Kelas Tingkat 1 (VII B)',
    kapasitas: 30,
    isActive: true
  },
  {
    id: 'kls-7c',
    namaKelas: 'VII C',
    namaArab: 'الأول ج',
    tingkat: 1,
    waliKelas: 'Ust. Fathul Ulum, S.Pd',
    nipWali: 'Wali Kelas Tingkat 1 (VII C)',
    kapasitas: 30,
    isActive: true
  },
  {
    id: 'kls-8a',
    namaKelas: 'VIII A',
    namaArab: 'الثاني أ',
    tingkat: 2,
    waliKelas: 'Ustzh. Siti Aisyah, S.Pd.I',
    nipWali: 'Wali Kelas Tingkat 2 (VIII A)',
    kapasitas: 30,
    isActive: true
  },
  {
    id: 'kls-9a',
    namaKelas: 'IX A',
    namaArab: 'الثالث أ',
    tingkat: 3,
    waliKelas: 'Ust. M. Zainuddin, S.Pd',
    nipWali: 'Wali Kelas Tingkat 3 (IX A)',
    kapasitas: 30,
    isActive: true
  },
  {
    id: 'kls-10a',
    namaKelas: 'X A',
    namaArab: 'الرابع أ',
    tingkat: 4,
    waliKelas: 'Ust. H. Abdul Karim, Lc.',
    nipWali: 'Wali Kelas Tingkat 4 (X A)',
    kapasitas: 30,
    isActive: true
  },
  {
    id: 'kls-11a',
    namaKelas: 'XI A',
    namaArab: 'الخامس أ',
    tingkat: 5,
    waliKelas: 'Ust. Ahmad Fauzan, M.Pd',
    nipWali: 'Wali Kelas Tingkat 5 (XI A)',
    kapasitas: 30,
    isActive: true
  },
  {
    id: 'kls-12a',
    namaKelas: 'Kelas 6 Akhir (XII A)',
    namaArab: 'السادس النهائي',
    tingkat: 6,
    waliKelas: 'KH. Muh. Ridwan, M.A.',
    nipWali: 'Wali Kelas Tingkat 6 Akhir',
    kapasitas: 30,
    isActive: true
  }
];

export const INITIAL_KELOMPOK_MAPEL = [
  { id: 'grp-1', kode: 'FIQIH', namaKelompok: 'Fiqih', namaArab: 'فقه', urutan: 1 },
  { id: 'grp-2', kode: 'AQIDAH', namaKelompok: 'Aqidah', namaArab: 'العقيدة', urutan: 2 },
  { id: 'grp-akhlak', kode: 'AKHLAK', namaKelompok: 'Akhlak', namaArab: 'الأخلاق', urutan: 3 },
  { id: 'grp-3', kode: 'HADIST', namaKelompok: 'Hadist', namaArab: 'الحديث', urutan: 4 },
  { id: 'grp-4', kode: 'LUGHOH', namaKelompok: 'Bahasa Arab', namaArab: 'اللغة العربية', urutan: 5 },
  { id: 'grp-tafsir', kode: 'TAFSIR', namaKelompok: 'Tafsir', namaArab: 'التفسير', urutan: 6 },
  { id: 'grp-tajwid', kode: 'TAJWID', namaKelompok: 'Tajwid', namaArab: 'تجويد', urutan: 7 },
  { id: 'grp-quran', kode: 'AL_QURAN', namaKelompok: 'Al-Qur’an', namaArab: 'القرآن', urutan: 8 },
  { id: 'grp-aqidah-akhlak', kode: 'AQIDAH_AKHLAK', namaKelompok: 'Aqidah Akhlak', namaArab: 'العقيدة والاخلاق', urutan: 9 },
  { id: 'grp-tarikh', kode: 'TARIKH', namaKelompok: 'Tarikh', namaArab: 'التاريخ', urutan: 10 }
];

export const INITIAL_MAPEL = [
  {
    id: 'mp-1',
    kodeMapel: 'FQ-01',
    namaLatin: 'Safinatunnajah',
    namaArab: 'سفينة النجاة',
    kelompokId: 'grp-1',
    urutanTampil: 1,
    statusAktif: true,
    statusWajib: true,
    targetKelasIds: ['kls-7a', 'kls-7b', 'kls-7c', 'kls-8a', 'kls-9a', 'kls-10a', 'kls-11a']
  },
  {
    id: 'mp-2',
    kodeMapel: 'AQ-01',
    namaLatin: 'Jawahirul Kalamiah',
    namaArab: 'جواهر الكلامية',
    kelompokId: 'grp-2',
    urutanTampil: 2,
    statusAktif: true,
    statusWajib: true,
    targetKelasIds: ['kls-7a', 'kls-7b', 'kls-7c']
  },
  {
    id: 'mp-3',
    kodeMapel: 'AK-01',
    namaLatin: 'Akhlak Lilbanat/Banin',
    namaArab: 'الاخلاق للبنين / للبنات',
    kelompokId: 'grp-akhlak',
    urutanTampil: 3,
    statusAktif: true,
    statusWajib: true,
    targetKelasIds: ['kls-7a', 'kls-7b', 'kls-7c']
  },
  {
    id: 'mp-4',
    kodeMapel: 'HD-01',
    namaLatin: 'Arbain Nawawi',
    namaArab: 'الأربعون النووية',
    kelompokId: 'grp-3',
    urutanTampil: 4,
    statusAktif: true,
    statusWajib: true,
    targetKelasIds: ['kls-7a', 'kls-7b', 'kls-7c', 'kls-8a']
  },
  {
    id: 'mp-5',
    kodeMapel: 'BA-01',
    namaLatin: 'Durusul Lughoh',
    namaArab: 'دروس اللغة العربية',
    kelompokId: 'grp-4',
    urutanTampil: 5,
    statusAktif: true,
    statusWajib: true,
    targetKelasIds: ['kls-7a', 'kls-7b', 'kls-7c', 'kls-8a']
  },
  {
    id: 'mp-6',
    kodeMapel: 'TF-01',
    namaLatin: 'Tafsir Jalalain',
    namaArab: 'تفسير الجلالين',
    kelompokId: 'grp-quran',
    urutanTampil: 6,
    statusAktif: true,
    statusWajib: true,
    targetKelasIds: ['kls-12a', 'kls-1794194269522']
  },
  {
    id: 'mp-7',
    kodeMapel: 'AQ-02',
    namaLatin: 'Nuru Dzolam',
    namaArab: 'نور الظلام',
    kelompokId: 'grp-aqidah-akhlak',
    urutanTampil: 7,
    statusAktif: true,
    statusWajib: true,
    targetKelasIds: ['kls-12a', 'kls-1794194070001', 'kls-1794194269522']
  },
  {
    id: 'mp-8',
    kodeMapel: 'FQ-02',
    namaLatin: 'Fathul Qorib',
    namaArab: 'فتح القريب',
    kelompokId: 'grp-1',
    urutanTampil: 8,
    statusAktif: true,
    statusWajib: true,
    targetKelasIds: ['kls-12a', 'kls-1794194070001', 'kls-1794194269522']
  },
  {
    id: 'mp-9',
    kodeMapel: 'AK-02',
    namaLatin: "Ta'lim Muta'alim",
    namaArab: 'تعليم المتعلم',
    kelompokId: 'grp-akhlak',
    urutanTampil: 9,
    statusAktif: true,
    statusWajib: true,
    targetKelasIds: ['kls-10a', 'kls-11a', 'kls-12a', 'kls-1794194070001', 'kls-1794194269522']
  },
  {
    id: 'mp-10',
    kodeMapel: 'BA-02',
    namaLatin: 'Qoulul Munir',
    namaArab: 'القول المنير',
    kelompokId: 'grp-3',
    urutanTampil: 10,
    statusAktif: true,
    statusWajib: true,
    targetKelasIds: ['kls-1794194070001']
  },
  {
    id: 'mp-11',
    kodeMapel: 'HD-02',
    namaLatin: 'Minhatul Mughis',
    namaArab: 'منحة المغيث',
    kelompokId: 'grp-3',
    urutanTampil: 11,
    statusAktif: true,
    statusWajib: true,
    targetKelasIds: ['kls-12a']
  },
  {
    id: 'mp-aqidatul-awam',
    kodeMapel: 'AQ-03',
    namaLatin: 'Aqidatul Awam',
    namaArab: 'عقيدة العوام',
    kelompokId: 'grp-2',
    urutanTampil: 14,
    statusAktif: true,
    statusWajib: true,
    targetKelasIds: ['kls-8a', 'kls-9a', 'kls-10a', 'kls-11a']
  },
  {
    id: 'mp-bulughul-maram',
    kodeMapel: 'HD-03',
    namaLatin: 'Bulughul Marom',
    namaArab: 'بلوغ المرام',
    kelompokId: 'grp-3',
    urutanTampil: 15,
    statusAktif: true,
    statusWajib: true,
    targetKelasIds: ['kls-8a', 'kls-9a', 'kls-10a', 'kls-11a']
  },
  {
    id: 'mp-tajwid-batu-ngompal',
    kodeMapel: 'TJ-01',
    namaLatin: 'Tajwid Batu Ngompal',
    namaArab: 'تجويد باتو ڠومڤل',
    kelompokId: 'grp-tajwid',
    urutanTampil: 16,
    statusAktif: true,
    statusWajib: true,
    targetKelasIds: ['kls-8a', 'kls-9a']
  },
  {
    id: 'mp-washoya',
    kodeMapel: 'AK-03',
    namaLatin: 'Wasoya',
    namaArab: 'وصايا الآباء للأبناء',
    kelompokId: 'grp-akhlak',
    urutanTampil: 17,
    statusAktif: true,
    statusWajib: true,
    targetKelasIds: ['kls-8a', 'kls-9a']
  },
  {
    id: 'mp-nahwu-wadih',
    kodeMapel: 'BA-03',
    namaLatin: 'Nahwu Wadih',
    namaArab: 'النحو الواضح',
    kelompokId: 'grp-4',
    urutanTampil: 18,
    statusAktif: true,
    statusWajib: true,
    targetKelasIds: ['kls-8a', 'kls-9a', 'kls-10a', 'kls-11a']
  },
  {
    id: 'mp-tuhfatul-athfal',
    kodeMapel: 'TJ-02',
    namaLatin: 'Tuhfatul Athfal',
    namaArab: 'تحفة الأطفال',
    kelompokId: 'grp-tajwid',
    urutanTampil: 19,
    statusAktif: true,
    statusWajib: true,
    targetKelasIds: ['kls-10a', 'kls-11a']
  },
  {
    id: 'mp-siroh-nabawi',
    kodeMapel: 'TR-01',
    namaLatin: 'Siroh Nabawi',
    namaArab: 'السيرة النبوية',
    kelompokId: 'grp-tarikh',
    urutanTampil: 20,
    statusAktif: true,
    statusWajib: true,
    targetKelasIds: ['kls-1794194070001']
  },
  {
    id: 'mp-mutammimah',
    kodeMapel: 'BA-04',
    namaLatin: 'Mutammimah',
    namaArab: 'متممة',
    kelompokId: 'grp-4',
    urutanTampil: 21,
    statusAktif: true,
    statusWajib: true,
    targetKelasIds: ['kls-1794194070001', 'kls-1794194269522']
  }
];

export const INITIAL_PREDIKAT = [
  { id: 'pr-1', batasBawah: 4.0, batasAtas: 4.0, predikatArab: 'ممتاز', predikatLatin: 'Mumtaz', keterangan: 'Istimewa', urutan: 1 },
  { id: 'pr-2', batasBawah: 3.5, batasAtas: 3.99, predikatArab: 'جيد جداً', predikatLatin: 'Jayyid Jiddan', keterangan: 'Baik Sekali', urutan: 2 },
  { id: 'pr-3', batasBawah: 3.0, batasAtas: 3.49, predikatArab: 'جيد', predikatLatin: 'Jayyid', keterangan: 'Baik', urutan: 3 },
  { id: 'pr-4', batasBawah: 2.7, batasAtas: 2.99, predikatArab: 'مقبول', predikatLatin: 'Maqbul', keterangan: 'Cukup', urutan: 4 },
  { id: 'pr-5', batasBawah: 0.0, batasAtas: 2.69, predikatArab: '—', predikatLatin: 'Dhaif', keterangan: 'Belum mencapai standar', urutan: 5 }
];

export const INITIAL_SANTRI = [
  // Kelas VII A
  {
    id: 'snt-1',
    nis: '202307001',
    nisn: '0098123401',
    namaLengkap: 'AULIYA GHITA NADIRA MULIYANA',
    namaArab: 'أوليا غيتا ناديرا موليانا',
    jenisKelamin: 'P',
    tempatLahir: 'Tabanan',
    tanggalLahir: '2011-04-12',
    namaWali: 'Bpk. Muliyana',
    alamat: 'Kerambitan, Tabanan, Bali',
    tahunMasuk: 2023,
    statusAktif: true,
    kelasId: 'kls-7a'
  },
  {
    id: 'snt-2',
    nis: '202307002',
    nisn: '0098123402',
    namaLengkap: 'NAJWA SHIHAB AL-QUDWAH',
    namaArab: 'نجوى شهاب القدوة',
    jenisKelamin: 'P',
    tempatLahir: 'Denpasar',
    tanggalLahir: '2011-08-21',
    namaWali: 'H. Quraish',
    alamat: 'Denpasar Barat, Bali',
    tahunMasuk: 2023,
    statusAktif: true,
    kelasId: 'kls-7a'
  },
  {
    id: 'snt-3',
    nis: '202307003',
    nisn: '0098123403',
    namaLengkap: 'FATIMAH AZ-ZAHRA PUTRI',
    namaArab: 'فاطمة الزهراء بنت أحمد',
    jenisKelamin: 'P',
    tempatLahir: 'Badung',
    tanggalLahir: '2011-02-19',
    namaWali: 'H. Ahmad Fauzi',
    alamat: 'Mengwi, Badung, Bali',
    tahunMasuk: 2023,
    statusAktif: true,
    kelasId: 'kls-7a'
  },
  {
    id: 'snt-4',
    nis: '202307004',
    nisn: '0098123404',
    namaLengkap: 'AISYAH HUMAIRA RABBANI',
    namaArab: 'عائشة حميراء رباني',
    jenisKelamin: 'P',
    tempatLahir: 'Gianyar',
    tanggalLahir: '2011-11-05',
    namaWali: 'Bpk. Rabbani',
    alamat: 'Gianyar, Bali',
    tahunMasuk: 2023,
    statusAktif: true,
    kelasId: 'kls-7a'
  },
  {
    id: 'snt-5',
    nis: '202307005',
    nisn: '0098123405',
    namaLengkap: 'KHADIJAH KUBRO AL-MAKKIYAH',
    namaArab: 'خديجة الكبرى المكية',
    jenisKelamin: 'P',
    tempatLahir: 'Singaraja',
    tanggalLahir: '2011-07-30',
    namaWali: 'Ust. Mansyur',
    alamat: 'Buleleng, Bali',
    tahunMasuk: 2023,
    statusAktif: true,
    kelasId: 'kls-7a'
  },

  // Kelas VII C
  {
    id: 'snt-6',
    nis: '202307101',
    nisn: '0098123406',
    namaLengkap: 'RIKI INDRA',
    namaArab: 'ريكي إندرا',
    jenisKelamin: 'L',
    tempatLahir: 'Tabanan',
    tanggalLahir: '2011-03-14',
    namaWali: 'Bpk. Indra',
    alamat: 'Kerambitan, Tabanan',
    tahunMasuk: 2023,
    statusAktif: true,
    kelasId: 'kls-7c'
  },
  {
    id: 'snt-7',
    nis: '202307102',
    nisn: '0098123407',
    namaLengkap: 'AHMAD SYAUQI RAMADHAN',
    namaArab: 'أحمد شوقي رمضان',
    jenisKelamin: 'L',
    tempatLahir: 'Jembrana',
    tanggalLahir: '2011-09-01',
    namaWali: 'Bpk. Ridwan',
    alamat: 'Negara, Jembrana',
    tahunMasuk: 2023,
    statusAktif: true,
    kelasId: 'kls-7c'
  },

  // Kelas VIII A
  {
    id: 'snt-8',
    nis: '202208001',
    nisn: '0087123408',
    namaLengkap: 'ABDURRAHMAN WAHID AL-BALI',
    namaArab: 'عبد الرحمن واحد البالي',
    jenisKelamin: 'L',
    tempatLahir: 'Denpasar',
    tanggalLahir: '2010-05-20',
    namaWali: 'H. Hasyim',
    alamat: 'Denpasar Timur',
    tahunMasuk: 2022,
    statusAktif: true,
    kelasId: 'kls-8a'
  },

  // Kelas IX A
  {
    id: 'snt-9',
    nis: '202109001',
    nisn: '0076123409',
    namaLengkap: 'MUHAMMAD ZAINAL ABIDIN',
    namaArab: 'محمد زين العابدين',
    jenisKelamin: 'L',
    tempatLahir: 'Tabanan',
    tanggalLahir: '2009-04-10',
    namaWali: 'Bpk. Zainal',
    alamat: 'Tabanan, Bali',
    tahunMasuk: 2021,
    statusAktif: true,
    kelasId: 'kls-9a'
  },

  // Kelas X A (10PAPI) Sesuai Gambar Referensi Excel
  {
    id: 'snt-101',
    nis: '202010001',
    nisn: '0065123401',
    namaLengkap: 'AHMAD IKMAL FATONI',
    namaArab: 'أحمد إكمال فطوني',
    jenisKelamin: 'L',
    tempatLahir: 'Tabanan',
    tanggalLahir: '2008-01-10',
    namaWali: 'Bpk. Fatoni',
    alamat: 'Kerambitan, Tabanan',
    tahunMasuk: 2020,
    statusAktif: true,
    kelasId: 'kls-10a'
  },
  {
    id: 'snt-102',
    nis: '202010002',
    nisn: '0065123402',
    namaLengkap: 'RAMLI AZZUHRI',
    namaArab: 'رملي الزهري',
    jenisKelamin: 'L',
    tempatLahir: 'Denpasar',
    tanggalLahir: '2008-02-15',
    namaWali: 'Bpk. Azzuhri',
    alamat: 'Denpasar',
    tahunMasuk: 2020,
    statusAktif: true,
    kelasId: 'kls-10a'
  },
  {
    id: 'snt-103',
    nis: '202010003',
    nisn: '0065123403',
    namaLengkap: 'FIRMANSYAH HAFFANDIANATA',
    namaArab: 'فرمانشاه حفنديانتا',
    jenisKelamin: 'L',
    tempatLahir: 'Badung',
    tanggalLahir: '2008-03-20',
    namaWali: 'Bpk. Firmansyah',
    alamat: 'Badung',
    tahunMasuk: 2020,
    statusAktif: true,
    kelasId: 'kls-10a'
  },
  {
    id: 'snt-104',
    nis: '202010004',
    nisn: '0065123404',
    namaLengkap: 'RIFAT AHMAD RIZAL',
    namaArab: 'رفعت أحمد ريزال',
    jenisKelamin: 'L',
    tempatLahir: 'Tabanan',
    tanggalLahir: '2008-04-25',
    namaWali: 'Bpk. Rizal',
    alamat: 'Tabanan',
    tahunMasuk: 2020,
    statusAktif: true,
    kelasId: 'kls-10a'
  },
  {
    id: 'snt-105',
    nis: '202010005',
    nisn: '0065123405',
    namaLengkap: 'MUHAMMAD AKBAR AIDIL PUTRA',
    namaArab: 'محمد أكبر عادل فوترا',
    jenisKelamin: 'L',
    tempatLahir: 'Gianyar',
    tanggalLahir: '2008-05-30',
    namaWali: 'Bpk. Aidil',
    alamat: 'Gianyar',
    tahunMasuk: 2020,
    statusAktif: true,
    kelasId: 'kls-10a'
  },
  {
    id: 'snt-106',
    nis: '202010006',
    nisn: '0065123406',
    namaLengkap: 'CALISTA QURATA AIYUN',
    namaArab: 'كاليستا قرة أعين',
    jenisKelamin: 'P',
    tempatLahir: 'Denpasar',
    tanggalLahir: '2008-06-05',
    namaWali: 'Bpk. Aiyun',
    alamat: 'Denpasar',
    tahunMasuk: 2020,
    statusAktif: true,
    kelasId: 'kls-10a'
  },
  {
    id: 'snt-107',
    nis: '202010007',
    nisn: '0065123407',
    namaLengkap: 'INTAN NURAINI',
    namaArab: 'إنتان نور عيني',
    jenisKelamin: 'P',
    tempatLahir: 'Tabanan',
    tanggalLahir: '2008-07-10',
    namaWali: 'Bpk. Nuraini',
    alamat: 'Tabanan',
    tahunMasuk: 2020,
    statusAktif: true,
    kelasId: 'kls-10a'
  },
  {
    id: 'snt-108',
    nis: '202010008',
    nisn: '0065123408',
    namaLengkap: 'MAISAROH',
    namaArab: 'ميسرة',
    jenisKelamin: 'P',
    tempatLahir: 'Buleleng',
    tanggalLahir: '2008-08-15',
    namaWali: 'Bpk. Mansyur',
    alamat: 'Buleleng',
    tahunMasuk: 2020,
    statusAktif: true,
    kelasId: 'kls-10a'
  },
  {
    id: 'snt-109',
    nis: '202010009',
    nisn: '0065123409',
    namaLengkap: 'RILA KURNIA AL JANNAH',
    namaArab: 'ريلا كورنيا الجنة',
    jenisKelamin: 'P',
    tempatLahir: 'Jembrana',
    tanggalLahir: '2008-09-20',
    namaWali: 'Bpk. Kurnia',
    alamat: 'Jembrana',
    tahunMasuk: 2020,
    statusAktif: true,
    kelasId: 'kls-10a'
  },
  {
    id: 'snt-110',
    nis: '202010010',
    nisn: '0065123410',
    namaLengkap: 'SHAFA ALYA NAJWA',
    namaArab: 'صفا عليا نجوى',
    jenisKelamin: 'P',
    tempatLahir: 'Badung',
    tanggalLahir: '2008-10-25',
    namaWali: 'Bpk. Najwa',
    alamat: 'Badung',
    tahunMasuk: 2020,
    statusAktif: true,
    kelasId: 'kls-10a'
  },
  {
    id: 'snt-111',
    nis: '202010011',
    nisn: '0065123411',
    namaLengkap: 'TIYARA WULANDA',
    namaArab: 'تيارا ولندا',
    jenisKelamin: 'P',
    tempatLahir: 'Tabanan',
    tanggalLahir: '2008-11-30',
    namaWali: 'Bpk. Wulanda',
    alamat: 'Tabanan',
    tahunMasuk: 2020,
    statusAktif: true,
    kelasId: 'kls-10a'
  },

  // Kelas XI A
  {
    id: 'snt-11',
    nis: '201911001',
    nisn: '0054123411',
    namaLengkap: 'LUTFHI HAKIM AL-FARISI',
    namaArab: 'لطفي حكيم الفارسي',
    jenisKelamin: 'L',
    tempatLahir: 'Badung',
    tanggalLahir: '2007-12-03',
    namaWali: 'Bpk. Hakim',
    alamat: 'Kuta Utara, Badung',
    tahunMasuk: 2019,
    statusAktif: true,
    kelasId: 'kls-11a'
  },
  {
    id: 'snt-1793587519072',
    nis: '12309873',
    nisn: '0054123412',
    namaLengkap: 'YUNI AGGRAINI',
    namaArab: 'يوني أغريني',
    jenisKelamin: 'P',
    tempatLahir: 'Tabanan',
    tanggalLahir: '2007-06-18',
    namaWali: 'Bpk. Aggraini',
    alamat: 'Kerambitan, Tabanan',
    tahunMasuk: 2019,
    statusAktif: true,
    kelasId: 'kls-11a'
  },

  // Kelas 6 Akhir (XII A)
  {
    id: 'snt-12',
    nis: '201812001',
    nisn: '0043123412',
    namaLengkap: 'IBRAHIM KHALILULLAH (SANTRI AKHIR)',
    namaArab: 'إبراهيم خليل الله',
    jenisKelamin: 'L',
    tempatLahir: 'Tabanan',
    tanggalLahir: '2006-01-25',
    namaWali: 'H. Abdullah',
    alamat: 'Kerambitan, Tabanan',
    tahunMasuk: 2018,
    statusAktif: true,
    kelasId: 'kls-12a'
  }
];

export const INITIAL_NILAI = [
  // Data Nilai Santri Kelas X A Sesuai Excel Referensi (di kedua semester)
  ...['sem-2024-1', 'sem-2026-1', 'sem-2023-2'].flatMap((semId) => [
    // snt-101: AHMAD IKMAL FATONI (Tafsir: 2.6 [Dhoif/red], Nurudz: 3.0, Fathul: 3.9, Ta'lim: 3.1, Qoulum: 3.5, Minhajul: 3.0)
    { santriId: 'snt-101', semesterId: semId, mapelId: 'mp-6', angkaNilai: 2.60 },
    { santriId: 'snt-101', semesterId: semId, mapelId: 'mp-7', angkaNilai: 3.00 },
    { santriId: 'snt-101', semesterId: semId, mapelId: 'mp-8', angkaNilai: 3.90 },
    { santriId: 'snt-101', semesterId: semId, mapelId: 'mp-9', angkaNilai: 3.10 },
    { santriId: 'snt-101', semesterId: semId, mapelId: 'mp-10', angkaNilai: 3.50 },
    { santriId: 'snt-101', semesterId: semId, mapelId: 'mp-11', angkaNilai: 3.00 },

    // snt-102: RAMLI AZZUHRI
    { santriId: 'snt-102', semesterId: semId, mapelId: 'mp-6', angkaNilai: 2.90 },
    { santriId: 'snt-102', semesterId: semId, mapelId: 'mp-7', angkaNilai: 3.00 },
    { santriId: 'snt-102', semesterId: semId, mapelId: 'mp-8', angkaNilai: 3.80 },
    { santriId: 'snt-102', semesterId: semId, mapelId: 'mp-9', angkaNilai: 2.70 },
    { santriId: 'snt-102', semesterId: semId, mapelId: 'mp-10', angkaNilai: 3.40 },
    { santriId: 'snt-102', semesterId: semId, mapelId: 'mp-11', angkaNilai: 3.30 },

    // snt-103: FIRMANSYAH HAFFANDIANATA
    { santriId: 'snt-103', semesterId: semId, mapelId: 'mp-6', angkaNilai: 3.00 },
    { santriId: 'snt-103', semesterId: semId, mapelId: 'mp-7', angkaNilai: 3.00 },
    { santriId: 'snt-103', semesterId: semId, mapelId: 'mp-8', angkaNilai: 3.80 },
    { santriId: 'snt-103', semesterId: semId, mapelId: 'mp-9', angkaNilai: 3.30 },
    { santriId: 'snt-103', semesterId: semId, mapelId: 'mp-10', angkaNilai: 3.60 },
    { santriId: 'snt-103', semesterId: semId, mapelId: 'mp-11', angkaNilai: 3.30 },

    // snt-104: RIFAT AHMAD RIZAL
    { santriId: 'snt-104', semesterId: semId, mapelId: 'mp-6', angkaNilai: 2.90 },
    { santriId: 'snt-104', semesterId: semId, mapelId: 'mp-7', angkaNilai: 3.00 },
    { santriId: 'snt-104', semesterId: semId, mapelId: 'mp-8', angkaNilai: 3.30 },
    { santriId: 'snt-104', semesterId: semId, mapelId: 'mp-9', angkaNilai: 3.60 },
    { santriId: 'snt-104', semesterId: semId, mapelId: 'mp-10', angkaNilai: 3.00 },
    { santriId: 'snt-104', semesterId: semId, mapelId: 'mp-11', angkaNilai: 3.00 },

    // snt-105: MUHAMMAD AKBAR AIDIL PUTRA
    { santriId: 'snt-105', semesterId: semId, mapelId: 'mp-6', angkaNilai: 3.10 },
    { santriId: 'snt-105', semesterId: semId, mapelId: 'mp-7', angkaNilai: 3.00 },
    { santriId: 'snt-105', semesterId: semId, mapelId: 'mp-8', angkaNilai: 3.70 },
    { santriId: 'snt-105', semesterId: semId, mapelId: 'mp-9', angkaNilai: 3.50 },
    { santriId: 'snt-105', semesterId: semId, mapelId: 'mp-10', angkaNilai: 3.20 },
    { santriId: 'snt-105', semesterId: semId, mapelId: 'mp-11', angkaNilai: 3.00 },

    // snt-106: CALISTA QURATA AIYUN
    { santriId: 'snt-106', semesterId: semId, mapelId: 'mp-6', angkaNilai: 4.00 },
    { santriId: 'snt-106', semesterId: semId, mapelId: 'mp-7', angkaNilai: 4.00 },
    { santriId: 'snt-106', semesterId: semId, mapelId: 'mp-8', angkaNilai: 3.80 },
    { santriId: 'snt-106', semesterId: semId, mapelId: 'mp-9', angkaNilai: 3.50 },
    { santriId: 'snt-106', semesterId: semId, mapelId: 'mp-10', angkaNilai: 3.90 },
    { santriId: 'snt-106', semesterId: semId, mapelId: 'mp-11', angkaNilai: 4.00 },

    // snt-107: INTAN NURAINI
    { santriId: 'snt-107', semesterId: semId, mapelId: 'mp-6', angkaNilai: 2.90 },
    { santriId: 'snt-107', semesterId: semId, mapelId: 'mp-7', angkaNilai: 3.30 },
    { santriId: 'snt-107', semesterId: semId, mapelId: 'mp-8', angkaNilai: 3.20 },
    { santriId: 'snt-107', semesterId: semId, mapelId: 'mp-9', angkaNilai: 3.20 },
    { santriId: 'snt-107', semesterId: semId, mapelId: 'mp-10', angkaNilai: 3.20 },
    { santriId: 'snt-107', semesterId: semId, mapelId: 'mp-11', angkaNilai: 3.24 },

    // snt-108: MAISAROH
    { santriId: 'snt-108', semesterId: semId, mapelId: 'mp-6', angkaNilai: 3.90 },
    { santriId: 'snt-108', semesterId: semId, mapelId: 'mp-7', angkaNilai: 4.00 },
    { santriId: 'snt-108', semesterId: semId, mapelId: 'mp-8', angkaNilai: 3.80 },
    { santriId: 'snt-108', semesterId: semId, mapelId: 'mp-9', angkaNilai: 3.80 },
    { santriId: 'snt-108', semesterId: semId, mapelId: 'mp-10', angkaNilai: 3.90 },
    { santriId: 'snt-108', semesterId: semId, mapelId: 'mp-11', angkaNilai: 4.00 },

    // snt-109: RILA KURNIA AL JANNAH
    { santriId: 'snt-109', semesterId: semId, mapelId: 'mp-6', angkaNilai: 3.90 },
    { santriId: 'snt-109', semesterId: semId, mapelId: 'mp-7', angkaNilai: 4.00 },
    { santriId: 'snt-109', semesterId: semId, mapelId: 'mp-8', angkaNilai: 3.80 },
    { santriId: 'snt-109', semesterId: semId, mapelId: 'mp-9', angkaNilai: 3.50 },
    { santriId: 'snt-109', semesterId: semId, mapelId: 'mp-10', angkaNilai: 3.60 },
    { santriId: 'snt-109', semesterId: semId, mapelId: 'mp-11', angkaNilai: 4.00 },

    // snt-110: SHAFA ALYA NAJWA
    { santriId: 'snt-110', semesterId: semId, mapelId: 'mp-6', angkaNilai: 3.30 },
    { santriId: 'snt-110', semesterId: semId, mapelId: 'mp-7', angkaNilai: 4.00 },
    { santriId: 'snt-110', semesterId: semId, mapelId: 'mp-8', angkaNilai: 3.30 },
    { santriId: 'snt-110', semesterId: semId, mapelId: 'mp-9', angkaNilai: 3.30 },
    { santriId: 'snt-110', semesterId: semId, mapelId: 'mp-10', angkaNilai: 3.40 },
    { santriId: 'snt-110', semesterId: semId, mapelId: 'mp-11', angkaNilai: 3.50 },

    // snt-111: TIYARA WULANDA
    { santriId: 'snt-111', semesterId: semId, mapelId: 'mp-6', angkaNilai: 3.10 },
    { santriId: 'snt-111', semesterId: semId, mapelId: 'mp-7', angkaNilai: 4.00 },
    { santriId: 'snt-111', semesterId: semId, mapelId: 'mp-8', angkaNilai: 3.80 },
    { santriId: 'snt-111', semesterId: semId, mapelId: 'mp-9', angkaNilai: 3.30 },
    { santriId: 'snt-111', semesterId: semId, mapelId: 'mp-10', angkaNilai: 3.80 },
    { santriId: 'snt-111', semesterId: semId, mapelId: 'mp-11', angkaNilai: 3.40 },

    // Kelas VII A Nilai (mp-1 s/d mp-5)
    { santriId: 'snt-1', semesterId: semId, mapelId: 'mp-1', angkaNilai: 3.80 },
    { santriId: 'snt-1', semesterId: semId, mapelId: 'mp-2', angkaNilai: 3.90 },
    { santriId: 'snt-1', semesterId: semId, mapelId: 'mp-3', angkaNilai: 3.70 },
    { santriId: 'snt-1', semesterId: semId, mapelId: 'mp-4', angkaNilai: 4.00 },
    { santriId: 'snt-1', semesterId: semId, mapelId: 'mp-5', angkaNilai: 3.60 },

    { santriId: 'snt-2', semesterId: semId, mapelId: 'mp-1', angkaNilai: 3.90 },
    { santriId: 'snt-2', semesterId: semId, mapelId: 'mp-2', angkaNilai: 4.00 },
    { santriId: 'snt-2', semesterId: semId, mapelId: 'mp-3', angkaNilai: 3.80 },
    { santriId: 'snt-2', semesterId: semId, mapelId: 'mp-4', angkaNilai: 4.00 },
    { santriId: 'snt-2', semesterId: semId, mapelId: 'mp-5', angkaNilai: 3.90 },

    { santriId: 'snt-3', semesterId: semId, mapelId: 'mp-1', angkaNilai: 3.30 },
    { santriId: 'snt-3', semesterId: semId, mapelId: 'mp-2', angkaNilai: 3.40 },
    { santriId: 'snt-3', semesterId: semId, mapelId: 'mp-3', angkaNilai: 3.20 },
    { santriId: 'snt-3', semesterId: semId, mapelId: 'mp-4', angkaNilai: 3.50 },
    { santriId: 'snt-3', semesterId: semId, mapelId: 'mp-5', angkaNilai: 3.10 },

    { santriId: 'snt-4', semesterId: semId, mapelId: 'mp-1', angkaNilai: 3.00 },
    { santriId: 'snt-4', semesterId: semId, mapelId: 'mp-2', angkaNilai: 3.10 },
    { santriId: 'snt-4', semesterId: semId, mapelId: 'mp-3', angkaNilai: 2.90 },
    { santriId: 'snt-4', semesterId: semId, mapelId: 'mp-4', angkaNilai: 3.00 },
    { santriId: 'snt-4', semesterId: semId, mapelId: 'mp-5', angkaNilai: 3.00 },

    { santriId: 'snt-5', semesterId: semId, mapelId: 'mp-1', angkaNilai: 3.50 },
    { santriId: 'snt-5', semesterId: semId, mapelId: 'mp-2', angkaNilai: 3.40 },
    { santriId: 'snt-5', semesterId: semId, mapelId: 'mp-3', angkaNilai: 3.20 },
    { santriId: 'snt-5', semesterId: semId, mapelId: 'mp-4', angkaNilai: 3.60 },
    { santriId: 'snt-5', semesterId: semId, mapelId: 'mp-5', angkaNilai: 3.30 },

    // Kelas VIII A
    { santriId: 'snt-8', semesterId: semId, mapelId: 'mp-1', angkaNilai: 4.00 },
    { santriId: 'snt-8', semesterId: semId, mapelId: 'mp-2', angkaNilai: 3.90 },
    { santriId: 'snt-8', semesterId: semId, mapelId: 'mp-3', angkaNilai: 3.85 },
    { santriId: 'snt-8', semesterId: semId, mapelId: 'mp-4', angkaNilai: 4.00 },
    { santriId: 'snt-8', semesterId: semId, mapelId: 'mp-5', angkaNilai: 3.95 },

    // Kelas 6 Akhir (XII A)
    { santriId: 'snt-12', semesterId: semId, mapelId: 'mp-1', angkaNilai: 4.00 },
    { santriId: 'snt-12', semesterId: semId, mapelId: 'mp-2', angkaNilai: 3.95 },
    { santriId: 'snt-12', semesterId: semId, mapelId: 'mp-3', angkaNilai: 3.90 },
    { santriId: 'snt-12', semesterId: semId, mapelId: 'mp-4', angkaNilai: 4.00 },
    { santriId: 'snt-12', semesterId: semId, mapelId: 'mp-5', angkaNilai: 3.85 }
  ])
];

export const INITIAL_LOGS = [
  {
    id: 'log-1',
    aksi: 'UPDATE_TAHUN_PELAJARAN',
    deskripsi: 'Mengubah Tahun Pelajaran menjadi 2026 – 2027 (Ganjil)',
    waktu: '14.32'
  },
  {
    id: 'log-2',
    aksi: 'HAPUS_TAHUN_PELAJARAN',
    deskripsi: 'Menghapus Tahun Pelajaran 2023 – 2024',
    waktu: '14.32'
  },
  {
    id: 'log-3',
    aksi: 'TAMBAH_MAPEL',
    deskripsi: 'Menambahkan Mapel Jawahirul Kalamiyah (Kelompok: Aqidah)',
    waktu: '14.31'
  }
];

export interface GuruItem {
  id: string;
  nama: string;
  nip?: string;
  mapelIds: string[];
  kelasIds?: string[];
  statusAktif: boolean;
}

export const INITIAL_GURU: GuruItem[] = [
  {
    id: 'guru-1',
    nama: 'Ust. Ahmad Zaki, S.Pd.I',
    nip: '19850112 201001 1 001',
    mapelIds: ['mp-1'],
    kelasIds: ['kls-7a', 'kls-7b'],
    statusAktif: true
  },
  {
    id: 'guru-2',
    nama: 'Ust. Muhammad Al-Fatih, Lc.',
    nip: '19870420 201201 1 002',
    mapelIds: ['mp-2', 'mp-4'],
    kelasIds: ['kls-8a', 'kls-9a'],
    statusAktif: true
  },
  {
    id: 'guru-3',
    nama: 'Ust. H. Abdul Karim, Lc.',
    nip: '19790815 200501 1 003',
    mapelIds: ['mp-6'],
    kelasIds: ['kls-10a', 'kls-11a'],
    statusAktif: true
  },
  {
    id: 'guru-4',
    nama: 'Ustzh. Siti Aisyah, S.Pd.I',
    nip: '19900210 201501 2 001',
    mapelIds: ['mp-3'],
    kelasIds: ['kls-8a', 'kls-9a'],
    statusAktif: true
  },
  {
    id: 'guru-5',
    nama: 'Ustzh. Fitriani, S.Pd',
    nip: '19920315 201601 2 002',
    mapelIds: ['mp-5'],
    kelasIds: ['kls-7a', 'kls-8a'],
    statusAktif: true
  },
  {
    id: 'guru-6',
    nama: 'Ust. Achmad Yasir, S.Pd',
    nip: '19880622 201301 1 004',
    mapelIds: ['mp-7'],
    kelasIds: ['kls-9a', 'kls-10a'],
    statusAktif: true
  },
  {
    id: 'guru-7',
    nama: 'Ustzh. Nusi Sopiawati, S.Pd',
    nip: '19910905 201401 2 003',
    mapelIds: ['mp-1', 'mp-3'],
    kelasIds: ['kls-7a', 'kls-8a'],
    statusAktif: true
  },
  {
    id: 'guru-8',
    nama: 'Ustzh. Nining Nadhifah, SS',
    nip: '19931118 201701 2 004',
    mapelIds: ['mp-5'],
    kelasIds: ['kls-12a', 'kls-1794194070001'],
    statusAktif: true
  },
  {
    id: 'guru-9',
    nama: 'Ustzh. Siti Mas\'amah, S.Pd',
    nip: '19890712 201401 2 005',
    mapelIds: ['mp-2'],
    kelasIds: ['kls-10a', 'kls-11a'],
    statusAktif: true
  },
  {
    id: 'guru-10',
    nama: 'Ust. M. Zainuddin, S.Pd',
    nip: '19860530 201101 1 005',
    mapelIds: ['mp-4'],
    kelasIds: ['kls-9a', 'kls-10a'],
    statusAktif: true
  },
  {
    id: 'guru-11',
    nama: 'Ust. Fathul Ulum, S.Pd',
    nip: '19841201 200901 1 006',
    mapelIds: ['mp-1', 'mp-8'],
    kelasIds: ['kls-7a', 'kls-7b'],
    statusAktif: true
  },
  {
    id: 'guru-12',
    nama: 'Baiq Jannatun \'Adnin, S.Pd',
    nip: '19940825 201801 2 006',
    mapelIds: ['mp-3'],
    kelasIds: ['kls-7a', 'kls-7b'],
    statusAktif: true
  },
  {
    id: 'guru-13',
    nama: 'Ustzh. Latifaturrohaniah, S.Pd',
    nip: '19950312 201901 2 007',
    mapelIds: ['mp-5'],
    kelasIds: ['kls-7b'],
    statusAktif: true
  },
  {
    id: 'guru-14',
    nama: 'Ustzh. Nuzulia Ismani, QH',
    nip: '19910614 201501 2 008',
    mapelIds: ['mp-1', 'mp-3'],
    kelasIds: ['kls-10a'],
    statusAktif: true
  },
  {
    id: 'guru-15',
    nama: 'Ustzh. Nurul Aini Tehuwayo, S.Pd',
    nip: '19930920 201701 2 009',
    mapelIds: ['mp-2'],
    kelasIds: ['kls-1794194070001'],
    statusAktif: true
  },
  {
    id: 'guru-16',
    nama: 'Ustzh. Nadiya Surya Rahmi, SE',
    nip: '19921105 201601 2 010',
    mapelIds: ['mp-4'],
    kelasIds: ['kls-1794194269522'],
    statusAktif: true
  },
  {
    id: 'guru-17',
    nama: 'Ust. Ahmad Fauzan, M.Pd',
    nip: '19830418 200801 1 007',
    mapelIds: ['mp-2', 'mp-6'],
    kelasIds: ['kls-11a'],
    statusAktif: true
  },
  {
    id: 'guru-18',
    nama: 'KH. Muh. Ridwan, M.A.',
    nip: '19750210 200001 1 001',
    mapelIds: ['mp-6'],
    kelasIds: ['kls-12a'],
    statusAktif: true
  }
];


// ============================================================================