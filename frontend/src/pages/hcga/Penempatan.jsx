// frontend/src/pages/hcga/Penempatan.jsx
import { useEffect, useMemo, useState } from "react";
import PageContainer from "../../components/PageContainer";
import Modal from "../../components/ui/Modal";
import PenempatanForm from "./PenempatanForm";
import {
  getCurrentPenempatan,
  listPegawai,
  listPenempatanHistory,
} from "../../lib/penempatanApi";

function pickArray(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  // beberapa API Laravel suka return {data: {...}} untuk single, ini untuk list biasanya array
  return [];
}

function toYMD(d) {
  if (!d) return "";
  return String(d).slice(0, 10);
}

function formatDate(d) {
  const ymd = toYMD(d);
  return ymd || "-";
}

function formatRupiah(v) {
  if (v === null || v === undefined || v === "") return "-";
  const n = Number(v);
  if (Number.isNaN(n)) return String(v);
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(n);
}

function getPegawaiName(p) {
  return p?.nama_lengkap || p?.name || "-";
}

function getJabatanName(item) {
  // current() endpoint kamu return: data: { jabatan: { nama_jabatan, departemen, golongan } }
  return (
    item?.jabatan?.nama_jabatan ||
    item?.jabatan?.nama ||
    item?.nama_jabatan ||
    item?.nama ||
    (item?.jabatan_id ? `Jabatan #${item.jabatan_id}` : "-")
  );
}

function getDepartemenName(item) {
  return (
    item?.jabatan?.departemen?.nama_departemen ||
    item?.departemen?.nama_departemen ||
    "-"
  );
}

function getGolonganName(item) {
  const kode = item?.jabatan?.golongan?.kode_golongan;
  const nama = item?.jabatan?.golongan?.nama_golongan;
  if (kode && nama) return `${kode} • ${nama}`;
  if (kode) return kode;
  if (nama) return nama;
  return "-";
}

function badgeStyle(type) {
  const t = String(type || "").toUpperCase();
  if (t === "MASUK") return { color: "#1d4ed8", bg: "#eff6ff", bd: "#bfdbfe" };
  if (t === "PROMOSI") return { color: "#065f46", bg: "#ecfdf5", bd: "#a7f3d0" };
  if (t === "MUTASI") return { color: "#7c2d12", bg: "#fff7ed", bd: "#fed7aa" };
  if (t === "DEMOSI") return { color: "#9f1239", bg: "#fff1f2", bd: "#fecdd3" };
  if (t === "PENYESUAIAN") return { color: "#334155", bg: "#f1f5f9", bd: "#e2e8f0" };
  return { color: "#334155", bg: "#f1f5f9", bd: "#e2e8f0" };
}

function Badge({ children, tone = "muted" }) {
  const map = {
    ok: { color: "#065f46", bg: "#ecfdf5", bd: "#a7f3d0" },
    muted: { color: "#334155", bg: "#f1f5f9", bd: "#e2e8f0" },
    danger: { color: "#9f1239", bg: "#fff1f2", bd: "#fecdd3" },
  };
  const s = map[tone] || map.muted;

  return (
    <span
      style={{
        padding: "6px 10px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 900,
        color: s.color,
        background: s.bg,
        border: `1px solid ${s.bd}`,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
}

export default function PenempatanPage() {
  const [q, setQ] = useState("");
  const [pegawai, setPegawai] = useState([]);
  const [selected, setSelected] = useState(null);

  const [loadingPegawai, setLoadingPegawai] = useState(true);
  const [loadingRight, setLoadingRight] = useState(false);

  const [current, setCurrent] = useState(null);
  const [history, setHistory] = useState([]);

  const [errPegawai, setErrPegawai] = useState("");
  const [errRight, setErrRight] = useState("");

  const [openAdd, setOpenAdd] = useState(false);

  const filteredPegawai = useMemo(() => {
    const key = q.trim().toLowerCase();
    if (!key) return pegawai;

    return pegawai.filter((p) => {
      const kode = String(p.kode_pegawai || "").toLowerCase();
      const nama = String(getPegawaiName(p)).toLowerCase();
      return kode.includes(key) || nama.includes(key);
    });
  }, [pegawai, q]);

  async function loadPegawai() {
    setLoadingPegawai(true);
    setErrPegawai("");
    try {
      const data = await listPegawai();
      const arr = pickArray(data);
      setPegawai(arr);

      if (!selected && arr.length) setSelected(arr[0]);
    } catch (e) {
      setErrPegawai("Gagal mengambil data pegawai");
    } finally {
      setLoadingPegawai(false);
    }
  }

  async function loadRight(pegawaiId) {
    if (!pegawaiId) return;

    setLoadingRight(true);
    setErrRight("");
    try {
      const [cur, hist] = await Promise.all([
        getCurrentPenempatan(pegawaiId), // bisa object / null / {message,data}
        listPenempatanHistory(pegawaiId), // array
      ]);

      // getCurrentPenempatan kita anggap bisa return:
      // - null
      // - object penempatan
      // - { message, data }
      const curObj = cur?.data ?? cur ?? null;
      setCurrent(curObj);

      const histArr = pickArray(hist);
      // pastikan sorting desc by berlaku_mulai
      const sorted = [...histArr].sort((a, b) => {
        const da = new Date(a?.berlaku_mulai || a?.created_at || 0).getTime();
        const db = new Date(b?.berlaku_mulai || b?.created_at || 0).getTime();
        return db - da;
      });
      setHistory(sorted);
    } catch (e) {
      setErrRight("Gagal mengambil data penempatan");
      setCurrent(null);
      setHistory([]);
    } finally {
      setLoadingRight(false);
    }
  }

  useEffect(() => {
    loadPegawai();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selected?.id) loadRight(selected.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected?.id]);

  return (
    <PageContainer title="Penempatan">
      <div style={styles.wrap}>
        {/* LEFT */}
        <div style={styles.leftCard}>
          <div style={styles.leftHeader}>
            <div style={styles.leftTitle}>Pilih Pegawai</div>
            <div style={styles.leftSub}>Klik satu pegawai untuk lihat penempatan.</div>
          </div>

          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari kode / nama..."
            style={styles.search}
          />

          {loadingPegawai ? (
            <div style={styles.muted}>Memuat pegawai...</div>
          ) : errPegawai ? (
            <div style={styles.errText}>{errPegawai}</div>
          ) : filteredPegawai.length === 0 ? (
            <div style={styles.muted}>Tidak ada data.</div>
          ) : (
            <div style={styles.list}>
              {filteredPegawai.map((p) => {
                const active = selected?.id === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelected(p)}
                    style={{
                      ...styles.item,
                      ...(active ? styles.itemActive : null),
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                      <div style={{ fontWeight: 950, color: "#0f172a" }}>{getPegawaiName(p)}</div>
                      <span style={styles.dot} />
                    </div>

                    <div style={styles.itemSub}>
                      {p.kode_pegawai ? `${p.kode_pegawai} • ` : ""}
                      {p.status_kerja || "-"}
                      {p.jenis_penggajian ? ` • ${p.jenis_penggajian}` : ""}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* RIGHT */}
        <div style={styles.right}>
          <div style={styles.rightTop}>
            <div>
              <div style={styles.rightTitle}>{getPegawaiName(selected)}</div>
              <div style={styles.rightSub}>
                {selected?.kode_pegawai || "-"} • {selected?.status_kerja || "-"} •{" "}
                {selected?.jenis_penggajian || "-"}
              </div>
            </div>

            <button
              style={{
                ...styles.btnPrimary,
                opacity: selected ? 1 : 0.55,
                cursor: selected ? "pointer" : "not-allowed",
              }}
              onClick={() => setOpenAdd(true)}
              disabled={!selected}
              type="button"
            >
              + Tambah Penempatan
            </button>
          </div>

          {loadingRight ? (
            <div style={styles.rightCard}>
              <div style={styles.muted}>Memuat penempatan...</div>
            </div>
          ) : errRight ? (
            <div style={styles.rightCard}>
              <div style={styles.alertDanger}>
                <div style={{ fontWeight: 950 }}>Gagal</div>
                <div style={{ marginTop: 4, fontSize: 12.5, fontWeight: 700 }}>{errRight}</div>
              </div>
            </div>
          ) : (
            <>
              {/* CURRENT */}
              <div style={styles.rightCard}>
                <div style={styles.cardHeader}>
                  <div>
                    <div style={styles.cardTitle}>Current Penempatan</div>
                    <div style={styles.cardSub}>Penempatan yang sedang aktif.</div>
                  </div>

                  {current ? <Badge tone="ok">AKTIF</Badge> : <Badge>BELUM ADA</Badge>}
                </div>

                {current ? (
                  <div style={styles.kvGrid}>
                    <div>
                      <div style={styles.k}>Jabatan</div>
                      <div style={styles.v}>{getJabatanName(current)}</div>
                    </div>

                    <div>
                      <div style={styles.k}>Departemen</div>
                      <div style={styles.v}>{getDepartemenName(current)}</div>
                    </div>

                    <div>
                      <div style={styles.k}>Golongan</div>
                      <div style={styles.v}>{getGolonganName(current)}</div>
                    </div>

                    <div>
                      <div style={styles.k}>Gaji Pokok</div>
                      <div style={styles.v}>{formatRupiah(current?.gaji_pokok)}</div>
                    </div>

                    <div>
                      <div style={styles.k}>Mulai</div>
                      <div style={styles.v}>{formatDate(current?.berlaku_mulai)}</div>
                    </div>

                    <div>
                      <div style={styles.k}>Jenis Perubahan</div>
                      <div style={{ marginTop: 6 }}>
                        {(() => {
                          const s = badgeStyle(current?.jenis_perubahan);
                          return (
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 8,
                                padding: "6px 10px",
                                borderRadius: 999,
                                fontSize: 12,
                                fontWeight: 950,
                                color: s.color,
                                background: s.bg,
                                border: `1px solid ${s.bd}`,
                              }}
                            >
                              {current?.jenis_perubahan || "-"}
                            </span>
                          );
                        })()}
                      </div>
                    </div>

                    <div style={{ gridColumn: "1 / -1" }}>
                      <div style={styles.k}>Catatan</div>
                      <div style={styles.v}>{current?.catatan || "-"}</div>
                    </div>
                  </div>
                ) : (
                  <div style={styles.emptyBox}>
                    <div style={{ fontWeight: 950, color: "#0f172a" }}>Belum ada penempatan aktif</div>
                    <div style={{ marginTop: 6, color: "#64748b", fontSize: 13, fontWeight: 650 }}>
                      Klik <b>Tambah Penempatan</b> untuk memasang jabatan pertama.
                    </div>
                  </div>
                )}
              </div>

              {/* HISTORY */}
              <div style={styles.rightCard}>
                <div style={styles.cardHeader}>
                  <div>
                    <div style={styles.cardTitle}>Riwayat Penempatan</div>
                    <div style={styles.cardSub}>Daftar penempatan dari waktu ke waktu.</div>
                  </div>
                  <Badge>{history.length} data</Badge>
                </div>

                {history.length === 0 ? (
                  <div style={styles.muted}>Belum ada riwayat.</div>
                ) : (
                  <div style={styles.tableWrap}>
                    <table style={styles.table}>
                      <thead>
                        <tr>
                          <th style={styles.th}>Perubahan</th>
                          <th style={styles.th}>Jabatan</th>
                          <th style={styles.th}>Mulai</th>
                          <th style={styles.th}>Sampai</th>
                          <th style={styles.th}>Gaji Pokok</th>
                          <th style={styles.th}>Catatan</th>
                        </tr>
                      </thead>
                      <tbody>
                        {history.map((h, idx) => {
                          const s = badgeStyle(h?.jenis_perubahan);
                          return (
                            <tr key={h.id || idx} style={idx === 0 ? styles.trTop : null}>
                              <td style={styles.td}>
                                <span
                                  style={{
                                    padding: "6px 10px",
                                    borderRadius: 999,
                                    fontSize: 12,
                                    fontWeight: 950,
                                    color: s.color,
                                    background: s.bg,
                                    border: `1px solid ${s.bd}`,
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  {h?.jenis_perubahan || "-"}
                                </span>
                              </td>
                              <td style={styles.td}>{getJabatanName(h)}</td>
                              <td style={styles.td}>{formatDate(h?.berlaku_mulai)}</td>
                              <td style={styles.td}>{formatDate(h?.berlaku_sampai)}</td>
                              <td style={styles.td}>{formatRupiah(h?.gaji_pokok)}</td>
                              <td style={styles.td}>{h?.catatan || "-"}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <Modal open={openAdd} title="Tambah Penempatan" onClose={() => setOpenAdd(false)}>
        {selected ? (
          <PenempatanForm
            pegawai={selected}
            onCancel={() => setOpenAdd(false)}
            onSuccess={async () => {
              setOpenAdd(false);
              await loadRight(selected.id);
            }}
          />
        ) : (
          <div style={styles.muted}>Pilih pegawai dulu.</div>
        )}
      </Modal>
    </PageContainer>
  );
}

const styles = {
  wrap: {
    display: "grid",
    gridTemplateColumns: "320px 1fr",
    gap: 18,
    alignItems: "start",
  },

  leftCard: {
    borderRadius: 20,
    background: "white",
    border: "1px solid #e5e7eb",
    boxShadow: "0 18px 50px rgba(2, 6, 23, 0.06)",
    padding: 14,
    position: "sticky",
    top: 16,
  },
  leftHeader: { padding: 8 },
  leftTitle: { fontWeight: 950, color: "#0f172a" },
  leftSub: { marginTop: 4, fontSize: 12.5, color: "#64748b", fontWeight: 650 },

  search: {
    marginTop: 10,
    width: "100%",
    padding: "10px 12px",
    borderRadius: 14,
    border: "1px solid #e5e7eb",
    outline: "none",
    fontFamily: "Inter",
  },

  list: { marginTop: 10, display: "flex", flexDirection: "column", gap: 8 },
  item: {
    textAlign: "left",
    padding: "10px 12px",
    borderRadius: 14,
    border: "1px solid #eef2f7",
    background: "white",
    cursor: "pointer",
    transition: "all .16s ease",
  },
  itemActive: {
    border: "1px solid #bfdbfe",
    background: "rgba(239,246,255,1)",
    transform: "translateX(2px)",
    boxShadow: "0 14px 36px rgba(37, 99, 235, 0.10)",
  },
  itemSub: { marginTop: 4, fontSize: 12.5, color: "#64748b", fontWeight: 650 },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    background: "#93c5fd",
    boxShadow: "0 0 0 4px rgba(147, 197, 253, .25)",
  },

  right: { display: "flex", flexDirection: "column", gap: 14 },
  rightTop: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 14,
  },
  rightTitle: { fontSize: 22, fontWeight: 950, color: "#0f172a" },
  rightSub: { marginTop: 4, fontSize: 12.5, color: "#64748b", fontWeight: 700 },

  rightCard: {
    borderRadius: 20,
    background: "white",
    border: "1px solid #e5e7eb",
    boxShadow: "0 18px 50px rgba(2, 6, 23, 0.06)",
    padding: 16,
  },

  cardHeader: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
    paddingBottom: 10,
    borderBottom: "1px solid #eef2f7",
    marginBottom: 12,
  },
  cardTitle: { fontWeight: 950, color: "#0f172a" },
  cardSub: { marginTop: 4, fontSize: 12.5, color: "#64748b", fontWeight: 650 },

  kvGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 },
  k: { fontSize: 12.5, color: "#64748b", fontWeight: 800 },
  v: { marginTop: 4, fontSize: 14.5, fontWeight: 900, color: "#0f172a" },

  tableWrap: {
    overflowX: "auto",
    border: "1px solid #eef2f7",
    borderRadius: 14,
  },
  table: { width: "100%", borderCollapse: "collapse", minWidth: 820 },
  th: {
    textAlign: "left",
    padding: "10px 12px",
    fontSize: 12,
    letterSpacing: 0.6,
    color: "#475569",
    background: "#f8fafc",
    borderBottom: "1px solid #eef2f7",
    whiteSpace: "nowrap",
  },
  td: {
    padding: "12px 12px",
    borderBottom: "1px solid #f1f5f9",
    fontSize: 13.5,
    color: "#0f172a",
    fontWeight: 700,
    verticalAlign: "top",
  },
  trTop: { background: "rgba(239,246,255,0.45)" },

  btnPrimary: {
    padding: "10px 14px",
    borderRadius: 12,
    border: "none",
    background: "#2563eb",
    color: "white",
    fontWeight: 950,
    fontFamily: "Inter",
    whiteSpace: "nowrap",
    boxShadow: "0 12px 30px rgba(37, 99, 235, 0.18)",
    transition: "transform .12s ease",
  },

  muted: { color: "#64748b", fontSize: 13, fontWeight: 650 },
  errText: { color: "#dc2626", fontSize: 13, fontWeight: 900 },

  alertDanger: {
    padding: "12px 14px",
    borderRadius: 14,
    background: "#fff1f2",
    border: "1px solid #fecdd3",
    color: "#9f1239",
  },

  emptyBox: {
    padding: 14,
    borderRadius: 14,
    border: "1px dashed #cbd5e1",
    background: "linear-gradient(180deg, rgba(248,250,252,1) 0%, rgba(255,255,255,1) 80%)",
  },
};
