import React from 'react';
import { BaliBinaInsaniLogo } from '../common/BaliBinaInsaniLogo';
import { isMapelForKelas } from '../../utils/academicHelpers';

export function RaporA4Sheet({
  pondok,
  tahunAjaran,
  semester,
  kelas,
  kelasList = [],
  evaluation,
  kelompokMapelList,
  activeMapels,
  showRankOnRapor
}) {
  const { santri, mapelScores, totalNilai, rataRata, peringkat } = evaluation;
  const santriKelas = (kelasList && kelasList.find((k) => k.id === santri.kelasId)) || kelas;

  const groupedMapels = kelompokMapelList
    .map((grp) => ({
      kelompok: grp,
      items: activeMapels
        .filter((m) => m.kelompokId === grp.id && isMapelForKelas(m, santriKelas?.id))
        .sort((a, b) => a.urutanTampil - b.urutanTampil)
    }))
    .filter((g) => g.items.length > 0);

  const totalMapelsCount = groupedMapels.reduce((sum, g) => sum + g.items.length, 0);
  const isDense = totalMapelsCount >= 7;
  const isSuperDense = totalMapelsCount >= 10;

  let runningNo = 0;

  return (
    <div
      dir="ltr"
      className="rapor-page-break bg-white text-black shadow-xl border border-slate-300 relative overflow-hidden font-rapor-latin"
      style={{
        width: '794px',
        height: '1123px',
        minHeight: '1123px',
        maxHeight: '1123px',
        padding: '40px 46px 24px 46px',
        boxSizing: 'border-box',
        margin: '0 auto'
      }}
    >
      {/* WATERMARK LOGO DI TENGAH TABEL */}
      <div
        className="pointer-events-none absolute inset-x-0 flex items-center justify-center opacity-[0.11] z-0"
        style={{ top: isDense ? '260px' : '290px' }}
      >
        <BaliBinaInsaniLogo
          size={isDense ? 360 : 400}
          customLogoUrl={pondok.logoUrl}
        />
      </div>

      <div className="relative z-10 w-full">
        {/* KOP ATAS RAPOR */}
          <div className="flex flex-col items-center text-center w-full">
            <BaliBinaInsaniLogo
              size={isSuperDense ? 54 : isDense ? 62 : 72}
              customLogoUrl={pondok.logoUrl}
            />

            <h1
              dir="rtl"
              className="font-arabic font-bold text-black text-center w-full"
              style={{
                fontSize: isDense ? '20px' : '22px',
                lineHeight: '1.15',
                marginTop: isDense ? '3px' : '5px'
              }}
            >
              كشف الدرجات
            </h1>
            <h2
              dir="rtl"
              className="font-arabic font-normal text-black text-center w-full"
              style={{
                fontSize: isDense ? '17px' : '18.5px',
                lineHeight: '1.2',
                marginTop: '1px'
              }}
            >
              {pondok.namaPondokArab}
            </h2>
            <h3
              dir="rtl"
              className="font-arabic font-normal text-black text-center w-full"
              style={{
                fontSize: isDense ? '15px' : '16px',
                lineHeight: '1.2',
                marginTop: '1px'
              }}
            >
              للعام الدراسي {tahunAjaran?.namaArab || '٢٠٢٦ - ٢٠٢٧'}
            </h3>
          </div>

          {/* IDENTITAS SANTRI */}
          <div className="mt-4 mb-2.5 flex items-end justify-between font-bold text-black w-full text-[12.5px]">
            <div className="space-y-0.5 text-left">
              <div className="flex items-baseline">
                <span className="w-14 inline-block">Nama</span>
                <span className="mr-1.5">:</span>
                <span className="uppercase">{santri.namaLengkap}</span>
              </div>
              <div className="flex items-baseline">
                <span className="w-14 inline-block">Kelas</span>
                <span className="mr-1.5">:</span>
                <span>{santriKelas?.namaKelas || kelas?.namaKelas || '—'}</span>
              </div>
            </div>

            <div className="pr-10 text-left space-y-0.5">
              <div className="flex items-baseline">
                <span className="w-24 inline-block">Semester</span>
                <span className="mr-1.5">:</span>
                <span>{semester?.nama || 'Ganjil'}</span>
              </div>
              <div className="flex items-baseline">
                <span className="w-24 inline-block">Tahun Ajaran</span>
                <span className="mr-1.5">:</span>
                <span>{tahunAjaran?.nama || '2026 – 2027'}</span>
              </div>
            </div>
          </div>

          {/* TABEL NILAI 4 KOLOM */}
          <table
            dir="ltr"
            className={`w-full border-collapse border-[1px] border-black text-black table-fixed ${
              isDense ? 'text-[12px]' : 'text-[12.5px]'
            }`}
          >
            <thead>
              <tr className="bg-[#e5e5e5] font-bold text-center">
                <th
                  className={`border-[1px] border-black ${
                    isDense ? 'py-0.5' : 'py-1'
                  } px-1 w-[46px]`}
                >
                  NO
                </th>
                <th
                  className={`border-[1px] border-black ${
                    isDense ? 'py-0.5' : 'py-1'
                  } px-3 w-[400px]`}
                >
                  MATA PELAJARAN
                </th>
                <th
                  className={`border-[1px] border-black ${
                    isDense ? 'py-0.5' : 'py-1'
                  } px-2 w-[110px]`}
                >
                  NILAI
                </th>
                <th
                  className={`border-[1px] border-black ${
                    isDense ? 'py-0.5' : 'py-1'
                  } px-2 w-[130px]`}
                >
                  KETERANGAN
                </th>
              </tr>
            </thead>
            <tbody>
              {groupedMapels.map((group) => (
                <React.Fragment key={group.kelompok.id}>
                  <tr>
                    <td
                      colSpan={4}
                      className={`border-[1px] border-black text-left bg-transparent ${
                        isDense ? 'py-0.5 px-2' : 'py-0.5 px-2.5'
                      }`}
                    >
                      <div
                        className={`font-arabic font-bold text-left leading-tight ${
                          isDense ? 'text-[13px]' : 'text-[14px]'
                        }`}
                        style={{ direction: 'ltr', unicodeBidi: 'plaintext' }}
                      >
                        {group.kelompok.namaArab}
                      </div>
                      <div
                        className={`italic font-normal leading-tight text-left ${
                          isDense ? 'text-[10.5px] mt-0' : 'text-[11.5px] mt-0.5'
                        }`}
                      >
                        {group.kelompok.namaKelompok}
                      </div>
                    </td>
                  </tr>

                  {group.items.map((mp) => {
                    runningNo += 1;
                    const scoreObj = mapelScores[mp.id];
                    const formattedVal = scoreObj?.isFilled
                      ? scoreObj.angkaNilai.toFixed(2)
                      : '—';
                    const ketLatin = scoreObj?.isFilled ? scoreObj.predikatLatin : '—';

                    return (
                      <tr key={mp.id}>
                        <td
                          className={`border-[1px] border-black text-center align-middle ${
                            isDense ? 'py-0.5 px-1 text-[11px]' : 'py-0.5 px-1.5 text-[12px]'
                          }`}
                        >
                          {runningNo}.
                        </td>
                        <td
                          className={`border-[1px] border-black text-left align-middle ${
                            isDense ? 'py-0.5 px-2' : 'py-0.5 px-2.5'
                          }`}
                        >
                          <div
                            className={`font-arabic font-normal text-left leading-tight ${
                              isDense ? 'text-[13px]' : 'text-[14px]'
                            }`}
                            style={{ direction: 'ltr', unicodeBidi: 'plaintext' }}
                          >
                            {mp.namaArab}
                          </div>
                          <div
                            className={`italic font-normal leading-tight text-left ${
                              isDense ? 'text-[10.5px] mt-0' : 'text-[11.5px] mt-0.5'
                            }`}
                          >
                            {mp.namaLatin}
                          </div>
                        </td>
                        <td
                          className={`border-[1px] border-black text-center align-middle font-normal ${
                            isDense ? 'py-0.5 px-2 text-[11.5px]' : 'py-0.5 px-2 text-[12px]'
                          }`}
                        >
                          {formattedVal}
                        </td>
                        <td
                          className={`border-[1px] border-black text-center align-middle font-bold ${
                            isDense ? 'py-0.5 px-2 text-[11px]' : 'py-0.5 px-2 text-[11.5px]'
                          }`}
                        >
                          {ketLatin}
                        </td>
                      </tr>
                    );
                  })}
                </React.Fragment>
              ))}

              <tr className="bg-[#e5e5e5] font-bold">
                <td
                  colSpan={2}
                  className={`border-[1px] border-black text-center align-middle ${
                    isDense ? 'py-0.5 px-2' : 'py-0.5 px-3'
                  }`}
                >
                  <div
                    className={`font-arabic font-bold text-center leading-tight ${
                      isDense ? 'text-[13px]' : 'text-[14px]'
                    }`}
                    dir="rtl"
                  >
                    مجموع الدرجات
                  </div>
                  <div
                    className={`italic font-bold text-center leading-tight ${
                      isDense ? 'text-[10.5px]' : 'text-[11.5px]'
                    }`}
                  >
                    Nilai Total
                  </div>
                </td>
                <td
                  className={`border-[1px] border-black text-center align-middle font-bold ${
                    isDense ? 'py-0.5 px-2 text-[11.5px]' : 'py-0.5 px-2 text-[12px]'
                  }`}
                >
                  {totalNilai !== null ? totalNilai.toFixed(2) : '—'}
                </td>
                <td className="border-[1px] border-black py-0.5 px-2"></td>
              </tr>

              <tr className="bg-[#e5e5e5] font-bold">
                <td
                  colSpan={2}
                  className={`border-[1px] border-black text-center align-middle ${
                    isDense ? 'py-0.5 px-2' : 'py-0.5 px-3'
                  }`}
                >
                  <div
                    className={`font-arabic font-bold text-center leading-tight ${
                      isDense ? 'text-[13px]' : 'text-[14px]'
                    }`}
                    dir="rtl"
                  >
                    معدل الدرجات
                  </div>
                  <div
                    className={`italic font-bold text-center leading-tight ${
                      isDense ? 'text-[10.5px]' : 'text-[11.5px]'
                    }`}
                  >
                    Rata-rata
                  </div>
                </td>
                <td
                  className={`border-[1px] border-black text-center align-middle font-bold ${
                    isDense ? 'py-0.5 px-2 text-[11.5px]' : 'py-0.5 px-2 text-[12px]'
                  }`}
                >
                  {rataRata !== null ? rataRata.toFixed(2) : '—'}
                </td>
                <td className="border-[1px] border-black py-0.5 px-2"></td>
              </tr>

              {showRankOnRapor && (
                <tr className="bg-[#e5e5e5] font-bold">
                  <td
                    colSpan={2}
                    className={`border-[1px] border-black text-center align-middle ${
                      isDense ? 'py-0.5 px-2' : 'py-0.5 px-3'
                    }`}
                  >
                    <div
                      className={`font-arabic font-bold text-center leading-tight ${
                        isDense ? 'text-[13px]' : 'text-[14px]'
                      }`}
                      dir="rtl"
                    >
                      الترتيب العلمي
                    </div>
                    <div
                      className={`italic font-bold text-center leading-tight ${
                        isDense ? 'text-[10.5px]' : 'text-[11.5px]'
                      }`}
                    >
                      Peringkat Kelas
                    </div>
                  </td>
                  <td
                    className={`border-[1px] border-black text-center align-middle font-bold ${
                      isDense ? 'py-0.5 px-2 text-[11.5px]' : 'py-0.5 px-2 text-[12px]'
                    }`}
                  >
                    {peringkat ? `${peringkat}` : '—'}
                  </td>
                  <td className="border-[1px] border-black py-0.5 px-2"></td>
                </tr>
              )}
            </tbody>
          </table>

        {/* TEMPAT & TANGGAL CETAK - GESER 3X SPASI DI BAWAH TABEL */}
        <div className="mt-10 flex justify-end text-black w-full pr-4 text-[12px]">
          <div className="text-left leading-snug">
            <div className="border-b border-black pb-0.5">
              <span>{pondok.kabupatenKota},</span>
              <span className="inline-block w-6"></span>
              <span>{pondok.tanggalCetakMasehi || '20 Juni 2024M'}</span>
            </div>
            <div className="text-right pt-0.5 text-[11.5px]">
              {pondok.tanggalCetakHijriyah || '13 Dzulhijjah 1445H'}
            </div>
          </div>
        </div>

        {/* 3 KOLOM TANDA TANGAN */}
        <div className="mt-4 grid grid-cols-3 text-black w-full text-[12px]">
          {/* Kolom 1: Wali Santri */}
          <div className="flex flex-col items-center text-center">
            <div>Wali Santri</div>
            <div className="h-16 flex items-end justify-center">
              <div className="font-bold whitespace-pre">
                {'(                                    )'}
              </div>
            </div>
          </div>

          {/* Kolom 2: Wali Kelas */}
          <div className="flex flex-col items-center text-center">
            <div>Wali Kelas</div>
            <div className="h-16 flex items-end justify-center">
              <div className="font-bold underline">
                ( {santriKelas?.waliKelas || kelas?.waliKelas || '—'} )
              </div>
            </div>
          </div>

          {/* Kolom 3: Pimpinan / Direktur */}
          <div className="flex flex-col items-center text-center">
            <div>{pondok.nipPimpinan || 'Direktur'}</div>
            <div className="h-16 flex items-end justify-center">
              <div className="font-bold underline">
                ( {pondok.namaPimpinan || 'I BM Andhika S, S.H., C.P.L'} )
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
