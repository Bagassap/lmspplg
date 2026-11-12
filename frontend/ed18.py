p = 'components/ukk/NilaiSemuaModal.tsx'
b = open(p, 'rb').read().decode()
crlf = '\r\n' in b
s = b.replace('\r\n', '\n')


def rep(o, n, count=1):
    global s
    assert o in s, o[:60]
    s = s.replace(o, n, count)


rep("type SiswaNilai = { nama: string; nis: string; nilai: NilaiRow[] };\ntype KelasNilai = { kelas: string; siswa: SiswaNilai[] };",
    "type SiswaNilai = { kelas: string; nama: string; nis: string; nilai: NilaiRow[] };\ntype GrupNilai = { grup: string; lokasi: string; penguji: string; siswa: SiswaNilai[] };")
rep("useState<KelasNilai[] | null>(null)", "useState<GrupNilai[] | null>(null)")
rep("setKelas(d[0]?.kelas ?? \"\");", "setGrup(d[0]?.grup ?? \"\");")
rep("const [kelas, setKelas] = useState(\"\");", "const [grup, setGrup] = useState(\"\");")
rep("const aktif = useMemo(() => data?.find((k) => k.kelas === kelas) ?? null, [data, kelas]);",
    "const aktif = useMemo(() => data?.find((g) => g.grup === grup) ?? null, [data, grup]);")
rep("s.nama.toLowerCase().includes(q) || s.nis.toLowerCase().includes(q)", "s.nama.toLowerCase().includes(q) || s.nis.toLowerCase().includes(q) || s.kelas.toLowerCase().includes(q)")
rep("""                {data.map((k) => {
                  const on = k.kelas === kelas;
                  const dinilai = k.siswa.filter((s) => s.nilai.length > 0).length;
                  return (
                    <button key={k.kelas} type="button" onClick={() => setKelas(k.kelas)}
                      className={`shrink-0 rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${on ? "bg-[#3E03B3] text-white" : "bg-[#F1EDFA] text-[#3E03B3] dark:text-[#C4B5FD]"}`}>
                      {k.kelas} <span className={on ? "text-white/75" : "opacity-70"}>({dinilai}/{k.siswa.length})</span>
                    </button>""", """                {data.map((g) => {
                  const on = g.grup === grup;
                  return (
                    <button key={g.grup} type="button" onClick={() => setGrup(g.grup)}
                      className={`shrink-0 rounded-xl px-3.5 py-2 text-left transition-all ${on ? "bg-[#3E03B3] text-white" : "bg-[#F1EDFA] text-[#3E03B3] dark:text-[#C4B5FD]"}`}>
                      <span className="block text-xs font-bold leading-tight">{g.lokasi} <span className={on ? "text-white/75" : "opacity-70"}>({g.siswa.length})</span></span>
                      {g.penguji && <span className={`block text-[10px] font-semibold leading-tight ${on ? "text-white/80" : "opacity-75"}`}>Pengawas: {g.penguji}</span>}
                    </button>""")
rep("""placeholder="Cari nama atau NIS..." """, """placeholder="Cari nama, NIS, atau kelas..." """)
rep("""                      <th className="w-[13%] bg-[#3E03B3] px-2 py-3">Nama</th>""", """                      <th className="w-[7%] bg-[#3E03B3] px-2 py-3">Kelas</th>
                      <th className="w-[12%] bg-[#3E03B3] px-2 py-3">Nama</th>""")
rep("""<th className="w-[7%] bg-[#3E03B3] px-2 py-3">NIS</th>""", """<th className="w-[6%] bg-[#3E03B3] px-2 py-3">NIS</th>""")
rep("""<th className="w-[11%] bg-[#3E03B3] px-2 py-3">Task</th>""", """<th className="w-[10%] bg-[#3E03B3] px-2 py-3">Task</th>""")
rep("colSpan={ASPEK_NILAI.length + 7}", "colSpan={ASPEK_NILAI.length + 8}")
rep("""                                <td className="bg-[#F1EDFA] px-2 py-2.5 text-sm font-bold text-slate-900 dark:bg-[#3E03B3]/15 dark:text-white">{j === 0 ? s.nama : ""}</td>""",
    """                                <td className="bg-[#F1EDFA] px-2 py-2.5 text-xs font-semibold text-slate-700 dark:bg-[#3E03B3]/15 dark:text-slate-200">{j === 0 ? s.kelas : ""}</td>
                                <td className="bg-[#F1EDFA] px-2 py-2.5 text-sm font-bold text-slate-900 dark:bg-[#3E03B3]/15 dark:text-white">{j === 0 ? s.nama : ""}</td>""")
rep("<Fragment key={s.nis}>", "<Fragment key={`${s.nis}-${i}`}>")
open(p, 'wb').write((s.replace('\n', '\r\n') if crlf else s).encode())
