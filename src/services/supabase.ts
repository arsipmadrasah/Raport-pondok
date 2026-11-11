// ============================================================================
// SUPABASE CONFIGURATION & FAST REST CLIENT
// ============================================================================

export const SUPABASE_CONFIG = {
  url:
    (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_SUPABASE_URL) ||
    'https://gpjnbtgyzptxjxdnsctn.supabase.co',
  publishableKey:
    (typeof import.meta !== 'undefined' &&
      ((import.meta as any).env?.VITE_SUPABASE_ANON_KEY || (import.meta as any).env?.VITE_SUPABASE_PUBLISHABLE_KEY)) ||
    'sb_publishable_Q3tZd-fBoeUzG2divhAz4Q_-YIL7Ftx'
};

export async function fetchWithTimeout(resource: RequestInfo | URL, options: RequestInit = {}, timeoutMs = 4500) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(resource, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(id);
    return response;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}

export function compressLogoImageToBase64(file: File, maxSize = 320): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Gagal membaca file gambar'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => resolve(String(reader.result));
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          if (width > maxSize || height > maxSize) {
            if (width > height) {
              height = Math.round((height * maxSize) / width);
              width = maxSize;
            } else {
              width = Math.round((width * maxSize) / height);
              height = maxSize;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.clearRect(0, 0, width, height);
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/png', 0.92));
          } else {
            resolve(String(reader.result));
          }
        } catch (_) {
          resolve(String(reader.result));
        }
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

export const SupabaseDB = {
  headers(prefer = 'return=representation') {
    return {
      apikey: SUPABASE_CONFIG.publishableKey,
      Authorization: `Bearer ${SUPABASE_CONFIG.publishableKey}`,
      'Content-Type': 'application/json',
      Prefer: prefer
    };
  },

  async selectAll(table: string, orderCol: string | null = null, ascending = true) {
    const orderParam = orderCol ? `&order=${orderCol}.${ascending ? 'asc' : 'desc'}` : '';
    const res = await fetchWithTimeout(
      `${SUPABASE_CONFIG.url}/rest/v1/${table}?select=*${orderParam}`,
      {
        method: 'GET',
        headers: this.headers()
      }
    );
    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw new Error(errBody.message || `HTTP ${res.status} pada tabel ${table}`);
    }
    return await res.json();
  },

  async upsert(table: string, payload: any, onConflict = 'id') {
    const rows = Array.isArray(payload) ? payload : [payload];
    const res = await fetchWithTimeout(
      `${SUPABASE_CONFIG.url}/rest/v1/${table}?on_conflict=${onConflict}`,
      {
        method: 'POST',
        headers: this.headers('resolution=merge-duplicates,return=representation'),
        body: JSON.stringify(rows)
      }
    );
    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw new Error(errBody.message || `Gagal menyimpan ke tabel ${table}`);
    }
    return await res.json();
  },

  async updateById(table: string, id: string, payload: any) {
    const res = await fetchWithTimeout(
      `${SUPABASE_CONFIG.url}/rest/v1/${table}?id=eq.${encodeURIComponent(id)}`,
      {
        method: 'PATCH',
        headers: this.headers('return=representation'),
        body: JSON.stringify(payload)
      }
    );
    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw new Error(errBody.message || `Gagal memperbarui data di tabel ${table}`);
    }
    return await res.json();
  },

  async deleteById(table: string, id: string) {
    const res = await fetchWithTimeout(
      `${SUPABASE_CONFIG.url}/rest/v1/${table}?id=eq.${encodeURIComponent(id)}`,
      {
        method: 'DELETE',
        headers: this.headers('return=minimal')
      }
    );
    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw new Error(errBody.message || `Gagal menghapus dari tabel ${table}`);
    }
    return true;
  },

  async deleteByIds(table: string, ids: string[]) {
    if (!ids || ids.length === 0) return true;
    const inList = ids.map((id) => `"${id}"`).join(',');
    const res = await fetchWithTimeout(
      `${SUPABASE_CONFIG.url}/rest/v1/${table}?id=in.(${encodeURIComponent(inList)})`,
      {
        method: 'DELETE',
        headers: this.headers('return=minimal')
      }
    );
    if (!res.ok) {
      for (const singleId of ids) {
        await this.deleteById(table, singleId);
      }
    }
    return true;
  },

  async deleteNilaiCell(santriId: string, semesterId: string, mapelId: string) {
    const q = `santri_id=eq.${encodeURIComponent(santriId)}&semester_id=eq.${encodeURIComponent(
      semesterId
    )}&mapel_id=eq.${encodeURIComponent(mapelId)}`;
    const res = await fetchWithTimeout(`${SUPABASE_CONFIG.url}/rest/v1/nilai?${q}`, {
      method: 'DELETE',
      headers: this.headers('return=minimal')
    });
    if (!res.ok) throw new Error('Gagal mengosongkan sel nilai di Supabase');
    return true;
  }
};

export const SUPABASE_SQL_MIGRATION = `-- ============================================================================
-- SQL MIGRATION & RLS: APLIKASI RAPOR PONDOK PESANTREN (BALI BINA INSANI)
-- Jalankan skrip ini di Supabase Dashboard -> SQL Editor -> New Query -> Run
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.pondok_profile (
  id TEXT PRIMARY KEY DEFAULT 'main-profile',
  nama_pondok_latin TEXT NOT NULL,
  nama_pondok_arab TEXT NOT NULL,
  alamat TEXT NOT NULL DEFAULT '',
  kabupaten_kota TEXT NOT NULL DEFAULT 'Kerambitan',
  telepon TEXT DEFAULT '',
  email TEXT DEFAULT '',
  website TEXT DEFAULT '',
  logo_url TEXT DEFAULT '',
  nama_pimpinan TEXT NOT NULL,
  nip_pimpinan TEXT DEFAULT 'Direktur',
  tanggal_cetak_masehi TEXT DEFAULT '20 Juni 2024M',
  tanggal_cetak_hijriyah TEXT DEFAULT '13 Dzulhijjah 1445H',
  tanggal_cetak_default TEXT DEFAULT '20 Juni 2024M / 13 Dzulhijjah 1445H',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.tahun_ajaran (
  id TEXT PRIMARY KEY,
  nama TEXT NOT NULL UNIQUE,
  nama_arab TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.semester (
  id TEXT PRIMARY KEY,
  tahun_ajaran_id TEXT NOT NULL REFERENCES public.tahun_ajaran(id) ON DELETE CASCADE,
  nama TEXT NOT NULL,
  nama_arab TEXT NOT NULL,
  angka SMALLINT NOT NULL CHECK (angka IN (1, 2)),
  is_active BOOLEAN NOT NULL DEFAULT FALSE,
  CONSTRAINT uq_semester_per_ta UNIQUE (tahun_ajaran_id, angka)
);

CREATE TABLE IF NOT EXISTS public.kelas (
  id TEXT PRIMARY KEY,
  nama_kelas TEXT NOT NULL UNIQUE,
  nama_arab TEXT DEFAULT '',
  tingkat SMALLINT NOT NULL DEFAULT 1,
  wali_kelas TEXT NOT NULL,
  nip_wali TEXT DEFAULT '',
  kapasitas SMALLINT NOT NULL DEFAULT 30 CHECK (kapasitas > 0),
  is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS public.kelompok_mapel (
  id TEXT PRIMARY KEY,
  kode TEXT NOT NULL UNIQUE,
  nama_kelompok TEXT NOT NULL,
  nama_arab TEXT NOT NULL,
  urutan SMALLINT NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS public.mata_pelajaran (
  id TEXT PRIMARY KEY,
  kode_mapel TEXT NOT NULL UNIQUE,
  nama_latin TEXT NOT NULL,
  nama_arab TEXT NOT NULL,
  kelompok_id TEXT NOT NULL REFERENCES public.kelompok_mapel(id) ON DELETE RESTRICT,
  urutan_tampil SMALLINT NOT NULL DEFAULT 1,
  status_aktif BOOLEAN NOT NULL DEFAULT TRUE,
  status_wajib BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS public.predikat_config (
  id TEXT PRIMARY KEY,
  batas_bawah NUMERIC(4,2) NOT NULL CHECK (batas_bawah >= 0.00 AND batas_bawah <= 4.00),
  batas_atas NUMERIC(4,2) NOT NULL CHECK (batas_atas >= 0.00 AND batas_atas <= 4.00),
  predikat_arab TEXT NOT NULL,
  predikat_latin TEXT NOT NULL,
  keterangan TEXT NOT NULL,
  urutan SMALLINT NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS public.santri (
  id TEXT PRIMARY KEY,
  nis TEXT NOT NULL UNIQUE,
  nisn TEXT DEFAULT '',
  nama_lengkap TEXT NOT NULL,
  nama_arab TEXT NOT NULL,
  jenis_kelamin CHAR(1) NOT NULL CHECK (jenis_kelamin IN ('L', 'P')),
  tempat_lahir TEXT NOT NULL,
  tanggal_lahir DATE NOT NULL,
  nama_wali TEXT NOT NULL,
  alamat TEXT NOT NULL,
  tahun_masuk INT NOT NULL DEFAULT 2023,
  status_aktif BOOLEAN NOT NULL DEFAULT TRUE,
  kelas_id TEXT NOT NULL REFERENCES public.kelas(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.nilai (
  id TEXT PRIMARY KEY,
  santri_id TEXT NOT NULL REFERENCES public.santri(id) ON DELETE CASCADE,
  semester_id TEXT NOT NULL REFERENCES public.semester(id) ON DELETE CASCADE,
  mapel_id TEXT NOT NULL REFERENCES public.mata_pelajaran(id) ON DELETE CASCADE,
  angka_nilai NUMERIC(4,2) CHECK (angka_nilai >= 0.00 AND angka_nilai <= 4.00),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_nilai_santri_mapel_semester UNIQUE (santri_id, semester_id, mapel_id)
);

CREATE TABLE IF NOT EXISTS public.log_aktivitas (
  id TEXT PRIMARY KEY,
  tipe TEXT NOT NULL,
  deskripsi TEXT NOT NULL,
  waktu TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_admin TEXT DEFAULT 'Admin'
);

ALTER TABLE public.pondok_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tahun_ajaran ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.semester ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kelas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kelompok_mapel ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mata_pelajaran ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.predikat_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.santri ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nilai ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.log_aktivitas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_all_pondok" ON public.pondok_profile;
CREATE POLICY "anon_all_pondok" ON public.pondok_profile FOR ALL TO anon USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_all_ta" ON public.tahun_ajaran;
CREATE POLICY "anon_all_ta" ON public.tahun_ajaran FOR ALL TO anon USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_all_semester" ON public.semester;
CREATE POLICY "anon_all_semester" ON public.semester FOR ALL TO anon USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_all_kelas" ON public.kelas;
CREATE POLICY "anon_all_kelas" ON public.kelas FOR ALL TO anon USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_all_kelompok" ON public.kelompok_mapel;
CREATE POLICY "anon_all_kelompok" ON public.kelompok_mapel FOR ALL TO anon USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_all_mapel" ON public.mata_pelajaran;
CREATE POLICY "anon_all_mapel" ON public.mata_pelajaran FOR ALL TO anon USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_all_predikat" ON public.predikat_config;
CREATE POLICY "anon_all_predikat" ON public.predikat_config FOR ALL TO anon USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_all_santri" ON public.santri;
CREATE POLICY "anon_all_santri" ON public.santri FOR ALL TO anon USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_all_nilai" ON public.nilai;
CREATE POLICY "anon_all_nilai" ON public.nilai FOR ALL TO anon USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_all_logs" ON public.log_aktivitas;
CREATE POLICY "anon_all_logs" ON public.log_aktivitas FOR ALL TO anon USING (true) WITH CHECK (true);`;
