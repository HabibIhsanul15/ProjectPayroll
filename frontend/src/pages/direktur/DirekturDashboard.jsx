import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageContainer from "../../components/PageContainer";
import { listPenggajianApproval } from "../../lib/penggajianApi";
import { motion } from "framer-motion";
import {
    ShieldCheck, AlertCircle, Clock, ChevronRight,
    TrendingDown, CheckCircle, XCircle
} from "lucide-react";

// --- THEME: PREMIUM MIDNIGHT (Blue & Gold) ---
const theme = {
    bg: "transparent",
    card: "white",
    text: "#1e293b",
    primary: "#0f172a", // Midnight
    accent: "#d97706", // Gold
    subtle: "#64748b"
};

export default function DirekturDashboard() {
    const navigate = useNavigate();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);

    async function loadData() {
        setLoading(true);
        try {
            const res = await listPenggajianApproval();
            setItems(Array.isArray(res) ? res : res.data || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadData();
    }, []);

    const pendingItems = items.filter(i => i.status === "MENUNGGU_APPROVAL_DIREKTUR");
    const historyItems = items.filter(i => i.status !== "MENUNGGU_APPROVAL_DIREKTUR");

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
                            <ShieldCheck size={28} color="#d97706" />
                        </div>
                        <div>
                            <h1 style={styles.pageTitle}>Director Approval</h1>
                            <p style={styles.pageSubtitle}>Tinjau dan setujui pengajuan gaji</p>
                        </div>
                    </div>
                </div>
            </motion.div>

            <div style={styles.contentArea}>

                {/* SECTION: NEED ACTION */}
                <h3 style={styles.sectionTitle}>
                    <AlertCircle size={18} color="#d97706" />
                    BUTUH PERSETUJUAN ({pendingItems.length})
                </h3>

                {loading ? (
                    <div style={styles.centerText}>Memuat data...</div>
                ) : pendingItems.length > 0 ? (
                    <div style={styles.grid}>
                        {pendingItems.map(item => (
                            <motion.div
                                key={item.id}
                                whileHover={{ y: -4, boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)" }}
                                style={styles.cardPending}
                            >
                                <div style={styles.cardHeader}>
                                    <div style={styles.periodBadge}>{item.periode}</div>
                                    <div style={styles.statusBadgePending}>PENDING</div>
                                </div>

                                <div style={styles.cardBody}>
                                    <div style={styles.row}>
                                        <span style={styles.label}>Diajukan:</span>
                                        <span style={styles.val}>{item.diajukan_pada ? item.diajukan_pada.slice(0, 10) : "-"}</span>
                                    </div>
                                    <div style={styles.row}>
                                        <span style={styles.label}>Total Pegawai:</span>
                                        <span style={styles.val}>{item.detail_count} Orang</span>
                                    </div>
                                </div>

                                <div style={styles.cardFooter}>
                                    <button
                                        onClick={() => navigate(`/direktur/approval/${item.id}`)}
                                        style={styles.btnAction}
                                    >
                                        Review Pengajuan <ChevronRight size={16} />
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <div style={styles.emptyState}>
                        <CheckCircle size={40} color="#cbd5e1" />
                        <p>Tidak ada pengajuan yang menunggu persetujuan.</p>
                    </div>
                )}

                <div style={{ height: 32 }} />

                {/* SECTION: HISTORY */}
                <h3 style={styles.sectionTitle}>
                    <Clock size={18} color="#64748b" />
                    RIWAYAT
                </h3>

                <div style={styles.historyList}>
                    {historyItems.map(item => {
                        const isApproved = item.status === "DISETUJUI" || item.status === "DIBAYARKAN";
                        return (
                            <div key={item.id} style={styles.historyItem}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    {isApproved ? <CheckCircle size={20} color="#10b981" /> : <Clock size={20} color="#94a3b8" />}
                                    <div>
                                        <div style={styles.historyPeriode}>{item.periode}</div>
                                        <div style={styles.historySub}>Pegawai: {item.detail_count}</div>
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{
                                        ...styles.statusBadgeSmall,
                                        color: isApproved ? "#059669" : "#64748b",
                                        background: isApproved ? "#ecfdf5" : "#f1f5f9"
                                    }}>
                                        {item.status.replace(/_/g, " ")}
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                    {historyItems.length === 0 && <div style={styles.muted}>Belum ada riwayat.</div>}
                </div>

            </div>
        </div>
    );
}

const styles = {
    pageWrapper: {
        minHeight: "100vh",
        fontFamily: "'Inter', sans-serif",
        background: "#f8fafc"
    },
    headerGlass: {
        background: "#0f172a", // Midnight Blue
        color: "white",
        padding: "24px 32px",
        position: "sticky",
        top: 0,
        zIndex: 10,
        boxShadow: "0 4px 20px -5px rgba(15, 23, 42, 0.3)"
    },
    headerContent: {
        maxWidth: 1000,
        margin: "0 auto",
    },
    titleGroup: { display: "flex", alignItems: "center", gap: 16 },
    iconBox: {
        width: 48, height: 48, borderRadius: 12,
        background: "rgba(255,255,255,0.1)",
        display: "flex", alignItems: "center", justifyContent: "center"
    },
    pageTitle: { fontSize: 24, fontWeight: 700, margin: 0, color: "white" },
    pageSubtitle: { fontSize: 13, color: "#94a3b8", margin: 0 },

    contentArea: {
        maxWidth: 1000,
        margin: "0 auto",
        padding: "32px 24px"
    },
    sectionTitle: {
        fontSize: 13, fontWeight: 700, color: "#64748b",
        letterSpacing: "0.05em",
        marginBottom: 16, display: "flex", alignItems: "center", gap: 8
    },

    grid: {
        display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 24
    },
    cardPending: {
        background: "white",
        borderRadius: 16,
        borderTop: "4px solid #d97706", // Gold accent
        padding: 24,
        boxShadow: "0 4px 6px -2px rgba(0,0,0,0.05)"
    },
    cardHeader: { display: "flex", justifyContent: "space-between", marginBottom: 20 },
    periodBadge: { fontSize: 20, fontWeight: 800, color: "#0f172a" },
    statusBadgePending: {
        fontSize: 11, fontWeight: 700, background: "#fff7ed", color: "#c2410c",
        padding: "4px 8px", borderRadius: 6
    },
    cardBody: { display: "flex", flexDirection: "column", gap: 8, marginBottom: 24 },
    row: { display: "flex", justifyContent: "space-between", fontSize: 14 },
    label: { color: "#64748b" },
    val: { fontWeight: 600, color: "#334155" },

    cardFooter: { borderTop: "1px solid #f1f5f9", paddingTop: 16 },
    btnAction: {
        width: "100%", padding: "12px", borderRadius: 10,
        background: "#0f172a", color: "white", border: "none",
        fontWeight: 600, cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center", gap: 8
    },

    emptyState: {
        background: "white", padding: 40, borderRadius: 16, textAlign: "center",
        border: "1px dashed #e2e8f0", color: "#94a3b8", gap: 12, display: "flex", flexDirection: "column", alignItems: "center"
    },

    historyList: {
        background: "white", borderRadius: 16, overflow: "hidden", border: "1px solid #e2e8f0"
    },
    historyItem: {
        padding: "16px 20px", borderBottom: "1px solid #f1f5f9",
        display: "flex", justifyContent: "space-between", alignItems: "center"
    },
    historyPeriode: { fontWeight: 700, color: "#334155", fontSize: 15 },
    historySub: { fontSize: 12, color: "#94a3b8" },
    statusBadgeSmall: { fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 4, textTransform: "uppercase" },
    muted: { padding: 20, textAlign: "center", color: "#94a3b8" }
};
