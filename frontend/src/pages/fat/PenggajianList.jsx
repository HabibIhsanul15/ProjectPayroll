import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageContainer from "../../components/PageContainer";
import {
    listPenggajianFull,
    generatePenggajian,
    getStats
} from "../../lib/penggajianApi";
import { motion, AnimatePresence } from "framer-motion";
import {
    DollarSign, Calendar, Plus, ChevronRight,
    TrendingUp, Activity, CheckCircle, Clock,
    AlertCircle, FileText, Send
} from "lucide-react";
import Modal from "../../components/ui/Modal";

function formatRupiah(n) {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n || 0);
}

function getStatusColor(status) {
    switch (status) {
        case "DRAFT": return { bg: "#f1f5f9", color: "#64748b", border: "#e2e8f0" };
        case "MENUNGGU_APPROVAL_DIREKTUR": return { bg: "#fff7ed", color: "#c2410c", border: "#fed7aa" };
        case "DISETUJUI": return { bg: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe" };
        case "DIBAYARKAN": return { bg: "#ecfdf5", color: "#047857", border: "#a7f3d0" };
        default: return { bg: "#f8fafc", color: "#94a3b8", border: "#e2e8f0" };
    }
}

export default function PenggajianList() {
    const navigate = useNavigate();
    const [items, setItems] = useState([]);
    const [stats, setStats] = useState({ total_dibayar_ytd: 0, periode_aktif: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [showGenerate, setShowGenerate] = useState(false);
    const [genPeriode, setGenPeriode] = useState(""); // YYYY-MM
    const [genLoading, setGenLoading] = useState(false);

    async function loadData() {
        setLoading(true);
        try {
            // Load periods (now includes stats in response)
            const periodeRes = await listPenggajianFull();
            const list = Array.isArray(periodeRes) ? periodeRes : periodeRes.data || [];
            setItems(list);

            // Stats are now included in the response
            if (periodeRes.stats) {
                setStats(periodeRes.stats);
            } else {
                // Fallback: calculate from list
                const totalDibayarYTD = list
                    .filter(i => i.status === 'DIBAYARKAN')
                    .reduce((sum, i) => sum + Number(i.total_biaya || 0), 0);
                const periodeAktif = list.filter(i => i.status !== 'DIBAYARKAN').length;
                setStats({ total_dibayar_ytd: totalDibayarYTD, periode_aktif: periodeAktif });
            }
        } catch (e) {
            setError("Gagal memuat data penggajian.");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadData();
    }, []);

    async function handleGenerate(e) {
        e.preventDefault();
        if (!genPeriode) return;
        setGenLoading(true);
        try {
            await generatePenggajian(genPeriode);
            setShowGenerate(false);
            setGenPeriode("");
            await loadData();
        } catch (err) {
            alert(err?.response?.data?.message || "Gagal generate penggajian");
        } finally {
            setGenLoading(false);
        }
    }

    const containerVars = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };

    const itemVars = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

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
                            <DollarSign size={28} color="#059669" />
                        </div>
                        <div>
                            <h1 style={styles.pageTitle}>Penggajian (Payroll)</h1>
                            <p style={styles.pageSubtitle}>Kelola periode gaji, pph21, dan pembayaran</p>
                        </div>
                    </div>

                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        style={styles.btnGenerate}
                        onClick={() => setShowGenerate(true)}
                    >
                        <Plus size={18} />
                        Buat Periode Baru
                    </motion.button>
                </div>
            </motion.div>

            <div style={styles.contentArea}>
                {/* STATS ROW */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    style={styles.statsGrid}
                >
                    <div style={styles.statCard}>
                        <div style={styles.statIcon}><TrendingUp size={20} color="#10b981" /></div>
                        <div>
                            <div style={styles.statLabel}>Total Dibayarkan (YTD)</div>
                            <div style={styles.statValue}>{formatRupiah(stats.total_dibayar_ytd)}</div>
                        </div>
                    </div>
                    <div style={styles.statCard}>
                        <div style={styles.statIcon}><Activity size={20} color="#f59e0b" /></div>
                        <div>
                            <div style={styles.statLabel}>Periode Aktif</div>
                            <div style={styles.statValue}>{stats.periode_aktif}</div>
                        </div>
                    </div>
                </motion.div>

                {loading ? (
                    <div style={styles.centerText}>Memuat data...</div>
                ) : error ? (
                    <div style={styles.errorBanner}>{error}</div>
                ) : items.length === 0 ? (
                    <div style={styles.emptyState}>
                        <FileText size={48} color="#cbd5e1" />
                        <p>Belum ada data penggajian.</p>
                        <button style={styles.btnGenerate} onClick={() => setShowGenerate(true)}>Generate Sekarang</button>
                    </div>
                ) : (
                    <motion.div
                        variants={containerVars}
                        initial="hidden"
                        animate="visible"
                        style={styles.listGrid}
                    >
                        {items.map((item) => {
                            const status = getStatusColor(item.status);
                            return (
                                <motion.div
                                    key={item.id}
                                    variants={itemVars}
                                    style={styles.card}
                                    whileHover={{ y: -5, boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)" }}
                                >
                                    <div style={styles.cardHeader}>
                                        <div style={styles.cardPeriod}>
                                            <Calendar size={16} color="#64748b" />
                                            <span>{item.periode}</span>
                                        </div>
                                        <div style={{
                                            ...styles.statusBadge,
                                            background: status.bg, color: status.color, border: `1px solid ${status.border}`
                                        }}>
                                            {item.status.replace(/_/g, " ")}
                                        </div>
                                    </div>

                                    <div style={styles.cardBody}>
                                        <div style={styles.cardRow}>
                                            <div style={styles.label}>Total Pegawai</div>
                                            <div style={styles.val}>{item.detail_count || 0} Orang</div>
                                        </div>
                                        <div style={styles.cardRow}>
                                            <div style={styles.label}>Diajukan</div>
                                            <div style={styles.val}>{item.diajukan_pada ? item.diajukan_pada.slice(0, 10) : "-"}</div>
                                        </div>
                                        {/* Note: Total nominal usually needs 'showFull' but we might fetch it later or modify backend index to return sum */}
                                    </div>

                                    <div style={styles.cardFooter}>
                                        <motion.button
                                            whileHover={{ scale: 1.02, backgroundColor: "#ecfdf5" }}
                                            style={styles.btnDetail}
                                            onClick={() => navigate(`/fat/penggajian/${item.id}`)}
                                        >
                                            Lihat Detail <ChevronRight size={16} />
                                        </motion.button>
                                    </div>
                                </motion.div>
                            )
                        })}
                    </motion.div>
                )}
            </div>

            <Modal open={showGenerate} title="Generate Penggajian" onClose={() => setShowGenerate(false)}>
                <form onSubmit={handleGenerate} style={{ padding: 10 }}>
                    <div style={{ marginBottom: 16 }}>
                        <label style={styles.labelBold}>Pilih Periode (Bulan)</label>
                        <input
                            type="month"
                            value={genPeriode}
                            onChange={(e) => setGenPeriode(e.target.value)}
                            style={styles.input}
                            required
                        />
                        <p style={{ fontSize: 12, color: "#64748b", marginTop: 6 }}>
                            Sistem akan mengambil data pegawai aktif dan menghitung gaji pokok berdasarkan penempatan terakhir.
                        </p>
                    </div>
                    <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                        <button type="button" onClick={() => setShowGenerate(false)} style={styles.btnGhost}>Batal</button>
                        <button type="submit" disabled={genLoading} style={genLoading ? styles.btnDisabled : styles.btnPrimary}>
                            {genLoading ? "Generating..." : "Generate Draft"}
                        </button>
                    </div>
                </form>
            </Modal>

        </div>
    );
}

const styles = {
    pageWrapper: {
        minHeight: "100vh",
        fontFamily: "'Inter', sans-serif",
        paddingBottom: 40,
        background: "transparent"
    },
    headerGlass: {
        background: "rgba(255, 255, 255, 0.8)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(16, 185, 129, 0.2)", // Emerald tint border
        padding: "24px 32px",
        position: "sticky",
        top: 0,
        zIndex: 10,
    },
    headerContent: {
        maxWidth: 1200,
        margin: "0 auto",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center"
    },
    titleGroup: {
        display: "flex",
        alignItems: "center",
        gap: 16
    },
    iconBox: {
        width: 52,
        height: 52,
        borderRadius: 16,
        background: "linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 4px 10px rgba(16, 185, 129, 0.15)"
    },
    pageTitle: {
        fontSize: 24,
        fontWeight: 800,
        margin: 0,
        color: "#064e3b", // Dark Emerald
        letterSpacing: "-0.5px"
    },
    pageSubtitle: {
        fontSize: 14,
        color: "#64748b",
        margin: 0,
        fontWeight: 500
    },
    btnGenerate: {
        background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
        color: "white",
        border: "none",
        padding: "12px 24px",
        borderRadius: 12,
        fontWeight: 700,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: 8,
        boxShadow: "0 4px 12px rgba(16, 185, 129, 0.3)"
    },
    contentArea: {
        maxWidth: 1200,
        margin: "0 auto",
        padding: "32px 20px"
    },
    statsGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
        gap: 20,
        marginBottom: 32
    },
    statCard: {
        background: "white",
        borderRadius: 16,
        padding: 20,
        border: "1px solid #e2e8f0",
        display: "flex",
        alignItems: "center",
        gap: 16,
        boxShadow: "0 4px 6px -2px rgba(0,0,0,0.03)"
    },
    statIcon: {
        width: 42,
        height: 42,
        borderRadius: 12,
        background: "#f8fafc",
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
    },
    statLabel: { fontSize: 13, color: "#64748b", fontWeight: 600 },
    statValue: { fontSize: 20, fontWeight: 800, color: "#1e293b", marginTop: 2 },

    listGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
        gap: 24
    },
    card: {
        background: "white",
        borderRadius: 20,
        border: "1px solid #f1f5f9",
        padding: 20,
        display: "flex",
        flexDirection: "column",
        gap: 16
    },
    cardHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center"
    },
    cardPeriod: {
        display: "flex",
        alignItems: "center",
        gap: 8,
        fontSize: 16,
        fontWeight: 800,
        color: "#0f172a"
    },
    statusBadge: {
        fontSize: 10,
        fontWeight: 700,
        padding: "4px 8px",
        borderRadius: 8,
        textTransform: "uppercase"
    },
    cardBody: {
        display: "flex",
        flexDirection: "column",
        gap: 8,
        padding: "12px 0",
        borderTop: "1px solid #f8fafc",
        borderBottom: "1px solid #f8fafc"
    },
    cardRow: {
        display: "flex",
        justifyContent: "space-between",
        fontSize: 13
    },
    label: { color: "#64748b", fontWeight: 500 },
    val: { color: "#334155", fontWeight: 600 },

    cardFooter: {
        display: "flex",
        justifyContent: "flex-end"
    },
    btnDetail: {
        background: "transparent",
        border: "none",
        color: "#059669",
        fontWeight: 700,
        fontSize: 13,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: 4,
        padding: "6px 10px",
        borderRadius: 8
    },

    centerText: { textAlign: "center", color: "#94a3b8", marginTop: 40 },
    errorBanner: { padding: 16, background: "#fee2e2", color: "#b91c1c", borderRadius: 12, marginBottom: 20 },
    emptyState: { textAlign: "center", padding: 60, display: "flex", flexDirection: "column", alignItems: "center", gap: 16, color: "#94a3b8" },

    // MODAL FORM
    labelBold: { fontWeight: 700, fontSize: 14, color: "#1e293b", display: "block", marginBottom: 8 },
    input: { width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #e2e8f0", outline: "none" },
    btnPrimary: { background: "#10b981", color: "white", border: "none", padding: "10px 18px", borderRadius: 10, fontWeight: 700, cursor: "pointer" },
    btnDisabled: { background: "#cbd5e1", color: "white", border: "none", padding: "10px 18px", borderRadius: 10, fontWeight: 700, cursor: "not-allowed" },
    btnGhost: { background: "white", border: "1px solid #e2e8f0", padding: "10px 18px", borderRadius: 10, fontWeight: 700, cursor: "pointer", color: "#64748b" }
};
