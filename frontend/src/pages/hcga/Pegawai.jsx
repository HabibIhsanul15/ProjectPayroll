import { useEffect, useMemo, useState } from "react";
import PageContainer from "../../components/PageContainer";
import { api } from "../../lib/api";
import Modal from "../../components/ui/Modal";
import PegawaiForm from "./PegawaiForm";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, Search, Plus, Trash2, Edit2,
  MapPin, CreditCard, ChevronRight, Ban, CheckCircle
} from "lucide-react";

// Helper removed, using API now


export default function HcgaPegawai() {
  const [items, setItems] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [selectedPegawai, setSelectedPegawai] = useState(null);

  async function fetchPegawai() {
    setError("");
    setLoading(true);
    try {
      const res = await api.get("/pegawai");
      const list = Array.isArray(res.data) ? res.data : res.data?.data ?? [];
      setItems(list);
    } catch (err) {
      setError(err?.response?.data?.message || "Gagal mengambil data pegawai");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchPegawai();
  }, []);

  const filtered = useMemo(() => {
    const keyword = q.trim().toLowerCase();
    if (!keyword) return items;
    return items.filter((p) => {
      return (
        (p.kode_pegawai ?? "").toLowerCase().includes(keyword) ||
        (p.nama_lengkap ?? "").toLowerCase().includes(keyword) ||
        (p.status_ptkp ?? "").toLowerCase().includes(keyword)
      );
    });
  }, [items, q]);

  const [suggestedKode, setSuggestedKode] = useState("");

  async function fetchNextKode() {
    try {
      const res = await api.get("/pegawai/next-kode");
      setSuggestedKode(res.data.code || "PG001");
    } catch (e) {
      console.error("Gagal ambil next kode", e);
      setSuggestedKode("PG001");
    }
  }

  // Effect to load code when modal opens for CREATE
  useEffect(() => {
    if (open && !selectedPegawai) {
      fetchNextKode();
    }
  }, [open, selectedPegawai]);

  async function handleDelete(id) {
    if (!confirm("Yakin ingin menghapus pegawai ini?")) return;

    try {
      await api.delete(`/pegawai/${id}`);
      await fetchPegawai();
    } catch (err) {
      alert(err?.response?.data?.message || "Gagal menghapus pegawai");
    }
  }

  // --- ANIMATION VARIANTS ---
  const containerVars = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const itemVars = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div style={styles.pageWrapper}>
      {/* HEADER WITH GLASS EFFECT */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        style={styles.headerGlass}
      >
        <div style={styles.headerContent}>
          <div style={styles.titleGroup}>
            <div style={styles.iconBox}>
              <Users size={24} color="#3b82f6" />
            </div>
            <div>
              <h1 style={styles.pageTitle}>Data Pegawai</h1>
              <p style={styles.pageSubtitle}>Manajemen SDM & Karyawan</p>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            style={styles.btnAdd}
            onClick={() => {
              setEditing(null);
              setOpen(true);
            }}
          >
            <Plus size={18} />
            Tambah Pegawai
          </motion.button>
        </div>

        {/* SEARCH BAR */}
        <div style={styles.searchContainer}>
          <div style={styles.searchBox}>
            <Search size={18} color="#94a3b8" />
            <input
              style={styles.searchInput}
              placeholder="Cari nama, kode pegawai, atau status..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <div style={styles.stats}>
            Total: <b>{filtered.length}</b> Pegawai
          </div>
        </div>
      </motion.div>

      {/* ERROR & LOADING */}
      <div style={styles.contentArea}>
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={styles.centerMsg}
          >
            <div className="animate-spin" style={{ fontSize: 24 }}>⏳</div>
            <p>Memuat data pegawai...</p>
          </motion.div>
        )}

        {error && (
          <div style={styles.errorBanner}>{error}</div>
        )}

        {/* CARD GRID / LIST */}
        {!loading && !error && (
          <motion.div
            variants={containerVars}
            initial="hidden"
            animate="visible"
            style={styles.gridContainer}
          >
            {filtered.map((p) => (
              <motion.div
                key={p.id}
                variants={itemVars}
                whileHover={{ y: -5, boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)" }}
                style={styles.card}
              >
                {/* CARD HEADER */}
                <div style={styles.cardHeader}>
                  <div style={styles.avatar}>
                    {(p.nama_lengkap || "?")[0].toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={styles.cardTitle}>{p.nama_lengkap}</div>
                    <div style={styles.cardSubtitle}>{p.kode_pegawai} • {p.status_ptkp}</div>
                  </div>
                  <div style={p.aktif ? styles.statusActive : styles.statusInactive}>
                    {p.aktif ? "Aktif" : "Non-Aktif"}
                  </div>
                </div>

                {/* CARD BODY */}
                <div style={styles.cardBody}>
                  <div style={styles.infoRow}>
                    <CreditCard size={14} color="#64748b" />
                    <span>{p.jenis_penggajian}</span>
                  </div>
                  <div style={styles.infoRow}>
                    <MapPin size={14} color="#64748b" />
                    <span>{p.status_kerja}</span>
                  </div>
                </div>

                {/* CARD FOOTER (ACTIONS) */}
                <div style={styles.cardFooter}>
                  <motion.button
                    whileHover={{ scale: 1.1, color: "#3b82f6", background: "#eff6ff" }}
                    whileTap={{ scale: 0.9 }}
                    style={styles.actionBtn}
                    onClick={() => {
                      setSelectedPegawai(p);
                      setOpen(true);
                    }}
                    title="Edit Pegawai"
                  >
                    <Edit2 size={16} />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1, color: "#ef4444", background: "#fef2f2" }}
                    whileTap={{ scale: 0.9 }}
                    style={styles.actionBtn}
                    onClick={() => handleDelete(p.id)}
                    title="Hapus Pegawai"
                  >
                    <Trash2 size={16} />
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div style={styles.emptyState}>
            <Users size={48} color="#cbd5e1" />
            <p>Tidak ada data pegawai ditemukan.</p>
          </div>
        )}
      </div>

      {/* MODAL */}
      <Modal
        open={open}
        title={null} // Title handled inside Form for better styling
        onClose={() => {
          setOpen(false);
          setSelectedPegawai(null);
        }}
      // Using custom modal style override if possible, or we rely on Modal's structure
      >
        <PegawaiForm
          data={selectedPegawai}
          suggestedKode={suggestedKode}
          onCancel={() => {
            setOpen(false);
            setSelectedPegawai(null);
          }}
          onSuccess={async () => {
            setOpen(false);
            setSelectedPegawai(null);
            await fetchPegawai();
          }}
        />
      </Modal>
    </div>
  );
}

const styles = {
  pageWrapper: {
    minHeight: "100vh",
    fontFamily: "'Inter', sans-serif",
    background: "transparent", // Assumes main layout has background
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
    display: "flex",
    flexDirection: "column",
    gap: 20
  },
  headerContent: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
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
  btnAdd: {
    background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
    color: "white",
    border: "none",
    padding: "12px 20px",
    borderRadius: 14,
    fontWeight: 600,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: 8,
    boxShadow: "0 4px 12px rgba(37, 99, 235, 0.3)"
  },
  searchContainer: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },
  searchBox: {
    display: "flex",
    alignItems: "center",
    background: "white",
    border: "1px solid #e2e8f0",
    borderRadius: 12,
    padding: "10px 16px",
    width: 350,
    gap: 10,
    boxShadow: "0 2px 4px rgba(0,0,0,0.02)"
  },
  searchInput: {
    border: "none",
    outline: "none",
    fontSize: 14,
    width: "100%",
    color: "#334155"
  },
  stats: {
    fontSize: 13,
    color: "#64748b",
    background: "#f8fafc",
    padding: "6px 12px",
    borderRadius: 20,
    border: "1px solid #e2e8f0"
  },
  contentArea: {
    padding: "32px",
    maxWidth: 1280,
    margin: "0 auto"
  },
  gridContainer: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
    gap: 24
  },
  card: {
    background: "rgba(255,255,255,0.8)",
    backdropFilter: "blur(12px)",
    borderRadius: 20,
    border: "1px solid rgba(255,255,255,0.6)",
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
    padding: 20,
    display: "flex",
    flexDirection: "column",
    gap: 16,
    transition: "transform 0.2s"
  },
  cardHeader: {
    display: "flex",
    alignItems: "start",
    gap: 12
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 12,
    background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
    fontSize: 18,
    boxShadow: "0 4px 10px rgba(79, 70, 229, 0.2)"
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 700,
    color: "#1e293b",
    marginBottom: 2
  },
  cardSubtitle: {
    fontSize: 12,
    color: "#94a3b8",
    fontWeight: 500
  },
  statusActive: {
    fontSize: 10,
    fontWeight: 700,
    background: "#dcfce7",
    color: "#166534",
    padding: "4px 8px",
    borderRadius: 8,
    border: "1px solid #bbf7d0"
  },
  statusInactive: {
    fontSize: 10,
    fontWeight: 700,
    background: "#fee2e2",
    color: "#991b1b",
    padding: "4px 8px",
    borderRadius: 8,
    border: "1px solid #fecaca"
  },
  cardBody: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
    paddingTop: 12,
    borderTop: "1px solid #f1f5f9"
  },
  infoRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontSize: 13,
    color: "#64748b"
  },
  cardFooter: {
    display: "flex",
    justifyContent: "flex-end",
    gap: 8,
    marginTop: 4
  },
  actionBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    border: "none",
    background: "transparent",
    color: "#94a3b8",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  centerMsg: {
    textAlign: "center",
    padding: 40,
    color: "#64748b"
  },
  errorBanner: {
    background: "#fee2e2",
    color: "#b91c1c",
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    border: "1px solid #fecaca"
  },
  emptyState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 16,
    padding: 60,
    color: "#94a3b8"
  }
};
