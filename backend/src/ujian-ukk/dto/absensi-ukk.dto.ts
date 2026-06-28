export class AbsenSendiriUkkDto {
  tahapanId!: string;
  lokasi?: string;
  waktuAbsen?: string;
  ttd?: string;
  catatan?: string;
}

export class UpsertAbsensiUkkDto {
  tahapanId!: string;
  tanggal!: string;
  absensi!: { siswaId: string; status: string }[];
}
