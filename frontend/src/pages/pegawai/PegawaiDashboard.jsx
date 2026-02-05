import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageContainer from "../../components/PageContainer";
import { getSlipSaya } from "../../lib/penggajianApi";
import { motion } from "framer-motion";
import {
    Wallet, TrendingUp, Calendar, ChevronRight,
    FileText, Activity
} from "lucide-react";

function formatRupiah(n) {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n || 0);
}

export default function PegawaiDashboard() {
    const navigate = useNavigate();
    const [data, setData] = useState(null); // { pegawai, slip: [] }
    const [loading, setLoading] = useState(true);

    async function loadData() {
        setLoading(true);
        try {
            const res = await getSlipSaya();
            setData(res.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadData();
    }, []);

    if (loading) return <div style={styles.centerText}>Memuat data...</div>;
    if (!data) return <div style={styles.centerText}>Data pegawai tidak ditemukan</div>;

    const { pegawai, slip } = data;
    const lastSlip = slip.length > 0 ? slip[0] : null;

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
                        <div style={styles.avatarBox}>
                            <span style={{ fontSize: 20 }}>{pegawai.nama_lengkap.charAt(0)}</span>
                        </div>
                        <div>
                            <h1 style={styles.pageTitle}>Halo, {pegawai.nama_lengkap.split(' ')[0]}!</h1>
                            <p style={styles.pageSubtitle}>{pegawai.kode_pegawai}</p>
                        </div>
                    </div>
                </div>
            </motion.div>

            <div style={styles.contentArea}>

                {/* HERO CARD: LAST PAYCHECK */}
                {lastSlip ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        style={styles.heroCard}
                    >
                        <div style={styles.heroLabel}>Gaji Terakhir ({lastSlip.periode?.periode})</div>
                        <div style={styles.heroValue}>{formatRupiah(lastSlip.total)}</div>
                        <div style={styles.heroFooter}>
                            <div style={styles.heroPill}>
                                <Activity size={14} /> Status: {lastSlip.periode?.status?.replace(/_/g, " ")}
                            </div>
                            <button
                                onClick={() => navigate(`/pegawai/slip/${lastSlip.penggajian_periode_id}`)}
                                style={styles.btnHero}
                            >
                                Lihat Detail <ChevronRight size={16} />
                            </button>
                        </div>
                    </motion.div>
                ) : (
                    <div style={styles.emptyCard}>
                        <Wallet size={32} color="#94a3b8" />
                        <p>Belum ada riwayat gaji.</p>
                    </div>
                )}

                {/* STATS ROW */}
                <div style={styles.statsRow}>
                    <div style={styles.statBox}>
                        <TrendingUp size={20} color="#059669" />
                        <div>
                            <div style={styles.statLabel}>Total Diterima (YTD)</div>
                            <div style={styles.statVal}>{formatRupiah(slip.reduce((s, i) => s + Number(i.total || 0), 0))}</div>
                        </div>
                    </div>
                    <div style={styles.statBox}>
                        <FileText size={20} color="#3b82f6" />
                        <div>
                            <div style={styles.statLabel}>Jumlah Slip</div>
                            <div style={styles.statVal}>{slip.length} Periode</div>
                        </div>
                    </div>
                </div>

                <h3 style={styles.sectionTitle}>Riwayat Gaji</h3>

                <div style={styles.list}>
                    {slip.map((item) => (
                        <motion.div
                            key={item.id}
                            whileHover={{ x: 4, backgroundColor: "#f8fafc" }}
                            style={styles.listItem}
                            onClick={() => navigate(`/pegawai/slip/${item.penggajian_periode_id}`)}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                <div style={styles.iconCal}>
                                    <Calendar size={20} color="#3b82f6" />
                                </div>
                                <div>
                                    <div style={styles.itemTitle}>{item.periode?.periode}</div>
                                    <div style={styles.itemSub}>{item.jabatan?.nama_jabatan}</div>
                                </div>
                            </div>

                            <div style={{ textAlign: 'right' }}>
                                <div style={styles.itemValue}>{formatRupiah(item.total)}</div>
                                <div style={styles.itemStatus}>
                                    {item.periode?.status === "DIBAYARKAN" ? "Sudah Cair" : "Proses"}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

            </div>
        </div>
    );
}

const styles = {
    pageWrapper: {
        minHeight: "100vh",
        fontFamily: "'Inter', sans-serif",
        background: "#ffffff",
        paddingBottom: 40
    },
    headerGlass: {
        background: "white",
        padding: "24px 24px",
        position: "sticky",
        top: 0,
        zIndex: 10,
        borderBottom: "1px solid #f1f5f9"
    },
    headerContent: { maxWidth: 600, margin: "0 auto" },
    titleGroup: { display: "flex", alignItems: "center", gap: 16 },
    avatarBox: {
        width: 48, height: 48, borderRadius: "50%",
        background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
        display: "flex", alignItems: "center", justifyContent: "center",
        color: "white", fontWeight: 700
    },
    pageTitle: { fontSize: 20, fontWeight: 800, margin: 0, color: "#1e293b" },
    pageSubtitle: { fontSize: 13, color: "#64748b", margin: 0, fontWeight: 500 },

    contentArea: { maxWidth: 600, margin: "0 auto", padding: "24px" },

    heroCard: {
        background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
        borderRadius: 20, padding: 24, color: "white", marginBottom: 32,
        boxShadow: "0 10px 30px -10px rgba(15, 23, 42, 0.4)"
    },
    heroLabel: { fontSize: 13, color: "#94a3b8", marginBottom: 8, fontWeight: 500 },
    heroValue: { fontSize: 32, fontWeight: 800, marginBottom: 16, letterSpacing: "-0.5px" },
    heroFooter: { display: "flex", justifyContent: "space-between", alignItems: "center" },
    heroPill: {
        background: "rgba(255,255,255,0.1)", padding: "6px 12px", borderRadius: 20,
        fontSize: 11, display: "flex", alignItems: "center", gap: 6
    },
    btnHero: {
        background: "white", color: "#0f172a", border: "none",
        padding: "8px 16px", borderRadius: 10, fontWeight: 700, fontSize: 12, cursor: "pointer",
        display: "flex", alignItems: "center", gap: 4
    },

    emptyCard: {
        padding: 32, textAlign: "center", border: "2px dashed #f1f5f9", borderRadius: 16, marginBottom: 32,
        display: "flex", flexDirection: "column", alignItems: "center", gap: 8, color: "#94a3b8"
    },

    sectionTitle: { fontSize: 16, fontWeight: 700, color: "#1e293b", marginBottom: 16 },

    list: { display: "flex", flexDirection: "column", gap: 12 },
    listItem: {
        padding: "16px", borderRadius: 16, border: "1px solid #f1f5f9",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        cursor: "pointer", transition: "all 0.2s"
    },
    iconCal: {
        width: 40, height: 40, borderRadius: 12, background: "#eff6ff",
        display: "flex", alignItems: "center", justifyContent: "center"
    },
    itemTitle: { fontWeight: 700, fontSize: 14, color: "#334155" },
    itemSub: { fontSize: 12, color: "#94a3b8" },
    itemValue: { fontWeight: 700, fontSize: 14, color: "#059669" },
    itemStatus: { fontSize: 11, color: "#64748b", textAlign: "right" },

    statsRow: {
        display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24
    },
    statBox: {
        background: "#f8fafc", borderRadius: 12, padding: 16,
        display: "flex", alignItems: "center", gap: 12
    },
    statLabel: { fontSize: 11, color: "#64748b" },
    statVal: { fontSize: 16, fontWeight: 700, color: "#1e293b" },

    centerText: { textAlign: "center", marginTop: 40, color: "#94a3b8" }
};
