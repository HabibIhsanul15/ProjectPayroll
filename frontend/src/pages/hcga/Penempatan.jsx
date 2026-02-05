import { useEffect, useMemo, useState } from "react";
import PageContainer from "../../components/PageContainer";
import Modal from "../../components/ui/Modal";
import PenempatanForm from "./PenempatanForm";
import {
  getCurrentPenempatan,
  listPegawai,
  listPenempatanHistory,
} from "../../lib/penempatanApi";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, Search, Plus, Briefcase, Building2,
  TrendingUp, Calendar, ChevronRight, Activity,
  MapPin, User
} from "lucide-react";

/* --- HELPERS --- */
function pickArray(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
}

function toYMD(d) {
  if (!d) return "";
  return String(d).slice(0, 10);
}

function formatDate(d) {
  if (!d) return "-";
  return new Date(d).toLocaleDateString("id-ID", {
    day: "numeric", month: "short", year: "numeric"
  });
}

function formatRupiah(v) {
  if (v === null || v === undefined || v === "") return "-";
  const n = Number(v);
  if (Number.isNaN(n)) return String(v);
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);
}

function getPegawaiName(p) {
  return p?.nama_lengkap || p?.name || "-";
}

function getJabatanName(item) {
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

function getBadgeColor(type) {
  const t = String(type || "").toUpperCase();
  if (t === "MASUK") return { bg: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe" }; // Blue
  if (t === "PROMOSI") return { bg: "#ecfdf5", color: "#047857", border: "#a7f3d0" }; // Green
  if (t === "MUTASI") return { bg: "#fff7ed", color: "#c2410c", border: "#fed7aa" }; // Orange
  if (t === "DEMOSI") return { bg: "#fff1f2", color: "#be123c", border: "#fecdd3" }; // Red
  if (t === "PENYESUAIAN") return { bg: "#f8fafc", color: "#475569", border: "#e2e8f0" }; // Slate
  return { bg: "#f8fafc", color: "#475569", border: "#e2e8f0" };
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

  // Filter List Pegawai
  const filteredPegawai = useMemo(() => {
    const key = q.trim().toLowerCase();
    if (!key) return pegawai;
    return pegawai.filter((p) => {
      const kode = String(p.kode_pegawai || "").toLowerCase();
      const nama = String(getPegawaiName(p)).toLowerCase();
      return kode.includes(key) || nama.includes(key);
    });
  }, [pegawai, q]);

  // Initial Load
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

  // Load Details (Current & History)
  async function loadRight(pegawaiId) {
    if (!pegawaiId) return;
    setLoadingRight(true);
    setErrRight("");
    try {
      const [cur, hist] = await Promise.all([
        getCurrentPenempatan(pegawaiId),
        listPenempatanHistory(pegawaiId),
      ]);

      const curObj = cur?.data ?? cur ?? null;
      setCurrent(curObj);

      const histArr = pickArray(hist);
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
  }, []);

  useEffect(() => {
    if (selected?.id) loadRight(selected.id);
  }, [selected?.id]);

  return (
    <div style={styles.pageWrapper}>
      {/* HEADER */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        style={styles.headerGlass}
      >
        <div style={styles.headerContent}>
          <div style={styles.titleGroup}>
            <div style={styles.iconBox}>
              <MapPin size={24} color="#3b82f6" />
            </div>
            <div>
              <h1 style={styles.pageTitle}>Penempatan & Mutasi</h1>
              <p style={styles.pageSubtitle}>Kelola jabatan, departemen, dan riwayat karir pegawai</p>
            </div>
          </div>
        </div>
      </motion.div>

      <div style={styles.container}>
        {/* === LEFT COLUMN: PEGAWAI LIST === */}
        <div style={styles.leftCol}>
          <div style={styles.searchBox}>
            <Search size={18} color="#94a3b8" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Cari Pegawai..."
              style={styles.searchInput}
            />
          </div>

          <div style={styles.listContainer}>
            {loadingPegawai ? (
              <div style={styles.centerText}>Memuat pegawai...</div>
            ) : filteredPegawai.length === 0 ? (
              <div style={styles.centerText}>Tidak ada data.</div>
            ) : (
              <div style={styles.scrollArea}>
                {filteredPegawai.map((p) => {
                  const active = selected?.id === p.id;
                  return (
                    <motion.div
                      key={p.id}
                      onClick={() => setSelected(p)}
                      whileHover={{ backgroundColor: active ? "rgba(59, 130, 246, 0.15)" : "rgba(255,255,255,0.6)" }}
                      style={active ? styles.cardActive : styles.cardItem}
                    >
                      <div style={styles.avatar}>
                        <User size={18} color={active ? "#3b82f6" : "#64748b"} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={active ? styles.nameActive : styles.name}>{getPegawaiName(p)}</div>
                        <div style={styles.subText}>{p.kode_pegawai}</div>
                      </div>
                      {active && <ChevronRight size={16} color="#3b82f6" />}
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* === RIGHT COLUMN: DETAILS === */}
        <div style={styles.rightCol}>
          <AnimatePresence mode="wait">
            {selected ? (
              <motion.div
                key={selected.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                style={styles.detailWrapper}
              >
                {/* DETAIL HEADER */}
                <div style={styles.detailHeader}>
                  <div>
                    <h2 style={styles.detailName}>{getPegawaiName(selected)}</h2>
                    <div style={styles.detailBadge}>
                      {selected.kode_pegawai} • {selected.status_kerja}
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    style={styles.btnAdd}
                    onClick={() => setOpenAdd(true)}
                  >
                    <Plus size={16} />
                    Promosi / Mutasi
                  </motion.button>
                </div>

                {loadingRight ? (
                  <div style={styles.loadingBox}>Thinking...</div>
                ) : errRight ? (
                  <div style={styles.errorBox}>{errRight}</div>
                ) : (
                  <>
                    {/* CURRENT POSITION CARD */}
                    <div style={styles.sectionTitle}>JABATAN SAAT INI</div>
                    <motion.div
                      style={styles.currentCard}
                      whileHover={{ y: -2 }}
                    >
                      {current ? (
                        <div style={styles.currentGrid}>
                          <div style={styles.currentIcon}>
                            <Briefcase size={32} color="white" />
                          </div>
                          <div style={styles.currentInfo}>
                            <div style={styles.currentLabel}>Jabatan</div>
                            <div style={styles.currentValue}>{getJabatanName(current)}</div>
                            <div style={styles.currentSub}>{getDepartemenName(current)} • {getGolonganName(current)}</div>
                          </div>
                          <div style={styles.paramsGrid}>
                            <div>
                              <div style={styles.paramLabel}>Gaji Pokok</div>
                              <div style={styles.paramValue}>{formatRupiah(current?.gaji_pokok)}</div>
                            </div>
                            <div>
                              <div style={styles.paramLabel}>Berlaku Sejak</div>
                              <div style={styles.paramValue}>{formatDate(current?.berlaku_mulai)}</div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div style={styles.emptyState}>
                          <Activity size={32} color="#94a3b8" />
                          <p>Belum ada jabatan aktif.</p>
                        </div>
                      )}
                    </motion.div>

                    {/* HISTORY TIMELINE */}
                    <div style={styles.sectionTitle}>RIWAYAT KARIR</div>
                    <div style={styles.timelineContainer}>
                      {history.length === 0 ? (
                        <div style={styles.muted}>Belum ada riwayat.</div>
                      ) : (
                        history.map((h, i) => {
                          const badge = getBadgeColor(h.jenis_perubahan);
                          const isLatest = i === 0;
                          return (
                            <motion.div
                              key={h.id || i}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: i * 0.1 }}
                              style={styles.timelineItem}
                            >
                              <div style={styles.timelineIcon}>
                                <div style={isLatest ? styles.dotActive : styles.dot} />
                                <div style={styles.line} />
                              </div>
                              <div style={styles.timelineContent}>
                                <div style={styles.timelineHeader}>
                                  <div style={styles.timelineTitle}>{getJabatanName(h)}</div>
                                  <div style={{
                                    ...styles.typeBadge,
                                    background: badge.bg, color: badge.color, border: `1px solid ${badge.border}`
                                  }}>
                                    {h.jenis_perubahan}
                                  </div>
                                </div>
                                <div style={styles.timelineSub}>{getDepartemenName(h)}</div>
                                <div style={styles.timelineMeta}>
                                  <Calendar size={14} /> {formatDate(h.berlaku_mulai)}
                                  <span style={{ margin: "0 6px" }}>•</span>
                                  Gaji: {formatRupiah(h.gaji_pokok)}
                                </div>
                                {h.catatan && (
                                  <div style={styles.note}>"{h.catatan}"</div>
                                )}
                              </div>
                            </motion.div>
                          )
                        })
                      )}
                    </div>
                  </>
                )}
              </motion.div>
            ) : (
              <div style={styles.emptySelect}>
                <Users size={64} color="#cbd5e1" />
                <h3>Pilih Pegawai</h3>
                <p>Pilih salah satu pegawai di sebelah kiri untuk melihat detail penempatan.</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* MODAL ADD */}
      <Modal open={openAdd} title={null} onClose={() => setOpenAdd(false)}>
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
          <div style={{ padding: 20 }}>Pilih pegawai dulu</div>
        )}
      </Modal>
    </div>
  );
}

const styles = {
  pageWrapper: {
    minHeight: "100vh",
    fontFamily: "'Inter', sans-serif",
    paddingBottom: 40
  },
  headerGlass: {
    background: "rgba(255, 255, 255, 0.7)",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    borderBottom: "1px solid rgba(255,255,255,0.5)",
    padding: "24px 32px",
    position: "sticky",
    top: 0,
    zIndex: 10,
  },
  headerContent: {
    maxWidth: 1400,
    margin: "0 auto",
  },
  titleGroup: {
    display: "flex",
    alignItems: "center",
    gap: 16
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    background: "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 4px 6px -1px rgba(59, 130, 246, 0.1)"
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: 800,
    margin: 0,
    color: "#1e293b",
    letterSpacing: "-0.5px"
  },
  pageSubtitle: {
    fontSize: 14,
    color: "#64748b",
    margin: 0,
    fontWeight: 500
  },
  container: {
    display: "flex",
    gap: 24,
    padding: "32px",
    maxWidth: 1400,
    margin: "0 auto",
    height: "calc(100vh - 120px)",
  },

  // LEFT COL
  leftCol: {
    width: 320,
    display: "flex",
    flexDirection: "column",
    gap: 16,
    background: "rgba(255,255,255,0.6)",
    backdropFilter: "blur(12px)",
    borderRadius: 24,
    border: "1px solid rgba(255,255,255,0.6)",
    padding: 20,
    boxShadow: "0 10px 30px -10px rgba(0,0,0,0.05)"
  },
  searchBox: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    background: "white",
    padding: "10px 14px",
    borderRadius: 14,
    border: "1px solid #e2e8f0",
  },
  searchInput: {
    border: "none",
    width: "100%",
    outline: "none",
    fontSize: 14,
    fontWeight: 500,
    color: "#334155"
  },
  listContainer: {
    flex: 1,
    overflow: "hidden",
    position: "relative"
  },
  scrollArea: {
    height: "100%",
    overflowY: "auto",
    paddingRight: 4,
    display: "flex",
    flexDirection: "column",
    gap: 8
  },
  cardItem: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "12px",
    borderRadius: 14,
    background: "white",
    border: "1px solid transparent",
    cursor: "pointer",
    transition: "all 0.2s"
  },
  cardActive: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "12px",
    borderRadius: 14,
    background: "rgba(59, 130, 246, 0.08)",
    border: "1px solid #bfdbfe",
    cursor: "pointer",
    boxShadow: "0 4px 6px -1px rgba(59, 130, 246, 0.1)"
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 10,
    background: "#f1f5f9",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  name: {
    fontSize: 14,
    fontWeight: 600,
    color: "#334155"
  },
  nameActive: {
    fontSize: 14,
    fontWeight: 700,
    color: "#1e40af"
  },
  subText: {
    fontSize: 11,
    color: "#94a3b8",
    marginTop: 2
  },

  // RIGHT COL
  rightCol: {
    flex: 1,
    overflowY: "auto",
    paddingRight: 8
  },
  detailWrapper: {
    display: "flex",
    flexDirection: "column",
    gap: 24
  },
  detailHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8
  },
  detailName: {
    fontSize: 28,
    fontWeight: 800,
    color: "#0f172a",
    margin: 0,
    letterSpacing: "-0.5px"
  },
  detailBadge: {
    display: "inline-block",
    marginTop: 6,
    padding: "4px 10px",
    borderRadius: 8,
    background: "#f1f5f9",
    color: "#64748b",
    fontSize: 12,
    fontWeight: 600
  },
  btnAdd: {
    display: "flex",
    gap: 8,
    alignItems: "center",
    background: "#2563eb",
    color: "white",
    border: "none",
    padding: "10px 18px",
    borderRadius: 12,
    fontWeight: 600,
    cursor: "pointer",
    boxShadow: "0 4px 10px rgba(37, 99, 235, 0.25)"
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: "0.1em",
    color: "#94a3b8",
    marginBottom: 12
  },

  // CURRENT CARD
  currentCard: {
    background: "linear-gradient(135deg, #2563eb 0%, #1e40af 100%)",
    borderRadius: 24,
    padding: 24,
    color: "white",
    boxShadow: "0 10px 25px -5px rgba(30, 64, 175, 0.4)",
    position: "relative",
    overflow: "hidden"
  },
  currentGrid: {
    display: "grid",
    gridTemplateColumns: "auto 1fr auto",
    gap: 20,
    alignItems: "center"
  },
  currentIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    background: "rgba(255,255,255,0.2)",
    backdropFilter: "blur(10px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  currentInfo: {
    display: "flex",
    flexDirection: "column",
    gap: 4
  },
  currentLabel: {
    fontSize: 12,
    opacity: 0.8,
    fontWeight: 600
  },
  currentValue: {
    fontSize: 20,
    fontWeight: 700
  },
  currentSub: {
    fontSize: 14,
    opacity: 0.9
  },
  paramsGrid: {
    display: "flex",
    gap: 24,
    background: "rgba(0,0,0,0.1)",
    padding: "12px 20px",
    borderRadius: 16
  },
  paramLabel: {
    fontSize: 11,
    opacity: 0.7,
    fontWeight: 600,
    marginBottom: 2
  },
  paramValue: {
    fontSize: 15,
    fontWeight: 700
  },

  // HISTORY TIMELINE
  timelineContainer: {
    display: "flex",
    flexDirection: "column",
    gap: 0,
    paddingLeft: 10
  },
  timelineItem: {
    display: "flex",
    gap: 16,
    position: "relative",
    paddingBottom: 24
  },
  timelineIcon: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center"
  },
  dotActive: {
    width: 14,
    height: 14,
    borderRadius: "50%",
    background: "#3b82f6",
    boxShadow: "0 0 0 4px rgba(59, 130, 246, 0.2)",
    zIndex: 2
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: "50%",
    background: "#cbd5e1",
    zIndex: 2,
    marginTop: 2
  },
  line: {
    flex: 1,
    width: 2,
    background: "#e2e8f0",
    margin: "4px 0"
  },
  timelineContent: {
    flex: 1,
    background: "rgba(255,255,255,0.6)",
    border: "1px solid rgba(255,255,255,0.8)",
    borderRadius: 16,
    padding: 16,
    marginTop: -4,
    boxShadow: "0 4px 6px -1px rgba(0,0,0,0.02)"
  },
  timelineHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4
  },
  timelineTitle: {
    fontSize: 15,
    fontWeight: 700,
    color: "#1e293b"
  },
  typeBadge: {
    fontSize: 11,
    padding: "2px 8px",
    borderRadius: 6,
    fontWeight: 700,
    textTransform: "uppercase"
  },
  timelineSub: {
    fontSize: 13,
    color: "#64748b",
    fontWeight: 500,
    marginBottom: 8
  },
  timelineMeta: {
    display: "flex",
    alignItems: "center",
    fontSize: 12,
    color: "#94a3b8",
    fontWeight: 500
  },
  note: {
    marginTop: 8,
    fontSize: 13,
    color: "#475569",
    fontStyle: "italic",
    background: "#f8fafc",
    padding: "8px 12px",
    borderRadius: 8
  },

  // STATES
  centerText: { textAlign: "center", color: "#94a3b8", marginTop: 40 },
  emptySelect: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    textAlign: "center",
    color: "#94a3b8",
    background: "rgba(255,255,255,0.4)",
    borderRadius: 32,
    border: "2px dashed #e2e8f0",
    padding: 40
  },
  emptyState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 12,
    color: "rgba(255,255,255,0.8)"
  },
  loadingBox: { padding: 40, textAlign: "center", color: "#94a3b8" },
  errorBox: { padding: 20, background: "#fee2e2", color: "#b91c1c", borderRadius: 12 },
  muted: { color: "#94a3b8", fontSize: 13 }
};
