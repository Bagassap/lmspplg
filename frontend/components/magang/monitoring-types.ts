export type MonitoringRow = {
  penempatanId: string;
  siswa: { id: string; nama: string | null; nis: string; fotoProfil: string | null };
  tempatMagang: { id: string; namaTempat: string };
  guruPembimbing: { id: string; nama: string | null };
  tanggalMulai: string;
  hariBerjalan: number;
  rekap: { HADIR: number; IZIN: number; SAKIT: number; ALPA: number };
  totalHariEfektif: number;
  persentaseKehadiran: number;
  lastAktivitas: string | null;
  hariSejakAktivitas: number | null;
  perluPerhatian: boolean;
};

export type MonitoringSummary = {
  totalPenempatan: number;
  totalTempat: number;
  rataRataKehadiran: number;
  perluPerhatianCount: number;
};

export type MonitoringResponse = { summary: MonitoringSummary; rows: MonitoringRow[] };
