const INDONESIAN_HOLIDAYS = new Set([
  // ── 2024 ──────────────────────────────────────────────────────────────────

  '2024-01-01', // Tahun Baru Masehi
  '2024-02-08', // Hari Raya Imlek 2575
  '2024-02-09', // Cuti Bersama Imlek
  '2024-02-14', // Isra Mi'raj Nabi Muhammad SAW
  '2024-03-11', // Hari Suci Nyepi (Tahun Baru Saka 1946)
  '2024-03-29', // Wafat Yesus Kristus (Good Friday)
  '2024-04-10', // Hari Raya Idul Fitri 1445 H
  '2024-04-11', // Hari Raya Idul Fitri 1445 H (hari kedua)
  '2024-04-08', // Cuti Bersama Idul Fitri
  '2024-04-09', // Cuti Bersama Idul Fitri
  '2024-04-12', // Cuti Bersama Idul Fitri
  '2024-04-15', // Cuti Bersama Idul Fitri
  '2024-05-01', // Hari Buruh Internasional
  '2024-05-09', // Kenaikan Yesus Kristus
  '2024-05-10', // Cuti Bersama Kenaikan Yesus Kristus
  '2024-05-23', // Hari Raya Waisak 2568 BE
  '2024-05-24', // Cuti Bersama Waisak
  '2024-06-01', // Hari Lahir Pancasila
  '2024-06-17', // Hari Raya Idul Adha 1445 H
  '2024-06-18', // Cuti Bersama Idul Adha
  '2024-07-07', // Tahun Baru Islam 1 Muharram 1446 H
  '2024-08-17', // Hari Kemerdekaan Republik Indonesia
  '2024-09-16', // Maulid Nabi Muhammad SAW 1446 H
  '2024-12-25', // Hari Raya Natal
  '2024-12-26', // Cuti Bersama Natal

  // ── 2025 ──────────────────────────────────────────────────────────────────

  '2025-01-01', // Tahun Baru Masehi
  '2025-01-27', // Hari Raya Imlek 2576
  '2025-01-28', // Cuti Bersama Imlek
  '2025-01-29', // Isra Mi'raj Nabi Muhammad SAW 1446 H
  '2025-03-28', // Hari Suci Nyepi (Tahun Baru Saka 1947)
  '2025-03-29', // Cuti Bersama Nyepi (hari Sabtu, digeser — catatan: jatuh Jumat 28 Mar)
  '2025-03-31', // Hari Raya Idul Fitri 1446 H
  '2025-04-01', // Hari Raya Idul Fitri 1446 H (hari kedua)
  '2025-04-02', // Cuti Bersama Idul Fitri
  '2025-04-03', // Cuti Bersama Idul Fitri
  '2025-04-04', // Wafat Yesus Kristus (Good Friday)
  '2025-04-07', // Cuti Bersama Idul Fitri
  '2025-05-01', // Hari Buruh Internasional
  '2025-05-12', // Hari Raya Waisak 2569 BE
  '2025-05-13', // Cuti Bersama Waisak
  '2025-05-29', // Kenaikan Yesus Kristus
  '2025-05-30', // Cuti Bersama Kenaikan Yesus Kristus
  '2025-06-01', // Hari Lahir Pancasila
  '2025-06-06', // Hari Raya Idul Adha 1446 H
  '2025-06-27', // Tahun Baru Islam 1 Muharram 1447 H
  '2025-08-17', // Hari Kemerdekaan Republik Indonesia
  '2025-09-05', // Maulid Nabi Muhammad SAW 1447 H
  '2025-12-25', // Hari Raya Natal
  '2025-12-26', // Cuti Bersama Natal

  // ── 2026 ──────────────────────────────────────────────────────────────────

  '2026-01-01', // Tahun Baru Masehi
  '2026-01-17', // Hari Raya Imlek 2577
  '2026-01-19', // Isra Mi'raj Nabi Muhammad SAW 1447 H
  '2026-03-17', // Hari Suci Nyepi (Tahun Baru Saka 1948)
  '2026-03-20', // Hari Raya Idul Fitri 1447 H
  '2026-03-21', // Hari Raya Idul Fitri 1447 H (hari kedua)
  '2026-03-23', // Cuti Bersama Idul Fitri
  '2026-03-24', // Cuti Bersama Idul Fitri
  '2026-03-25', // Cuti Bersama Idul Fitri
  '2026-04-03', // Wafat Yesus Kristus (Good Friday)
  '2026-04-05', // Hari Paskah / Easter Sunday
  '2026-05-01', // Hari Buruh Internasional
  '2026-05-14', // Kenaikan Yesus Kristus
  '2026-05-22', // Hari Raya Waisak 2570 BE
  '2026-05-27', // Hari Raya Idul Adha 1447 H
  '2026-06-01', // Hari Lahir Pancasila
  '2026-06-17', // Tahun Baru Islam 1 Muharram 1448 H
  '2026-08-17', // Hari Kemerdekaan Republik Indonesia
  '2026-08-25', // Maulid Nabi Muhammad SAW 1448 H
  '2026-12-25', // Hari Raya Natal
  '2026-12-26', // Cuti Bersama Natal
]);

/**
 * Returns true if the given Date falls on an Indonesian public holiday
 * or joint leave (cuti bersama) day.
 *
 * @param {Date} date - A JavaScript Date object (UTC or local — only the
 *   calendar date portion is used via toISOString).
 * @returns {boolean}
 */
export function isHoliday(date) {
  const key = date.toISOString().slice(0, 10);
  return INDONESIAN_HOLIDAYS.has(key);
}

export { INDONESIAN_HOLIDAYS };
