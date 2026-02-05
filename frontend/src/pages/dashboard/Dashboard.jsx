import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { api } from "../../lib/api";
import { getPeran } from "../../lib/auth";
import { useNavigate } from "react-router-dom";
import {
    LayoutDashboard, Users, DollarSign, Clock, TrendingUp,
    CheckCircle, AlertCircle, ChevronRight, Wallet
} from "lucide-react";

function formatRupiah(n) {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n || 0);
}

export default function Dashboard() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({});
    const peran = getPeran();

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        try {
            // Fetch stats based on role
            if (peran === "FAT") {
                const res = await api.get("/penggajian-stats");
                setStats(res.data.data || {});
            } else if (peran === "HCGA") {
                const res = await api.get("/pegawai");
                setStats({ totalPegawai: (res.data.data || []).length });
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }

    if (loading) return <div style={styles.center}>Memuat dashboard...</div>;

    return (
        <div style={styles.page}>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                style={styles.container}
            >
                {/* HERO */}
                <div style={styles.hero}>
                    <LayoutDashboard size={32} color="#3b82f6" />
                    <div>
                        <h1 style={styles.title}>Selamat Datang!</h1>
                        <p style={styles.subtitle}>Dashboard {peran}</p>
                    </div>
                </div>

                {/* STATS */}
                <div style={styles.statsGrid}>
                    {peran === "FAT" && (
                        <>
                            <StatCard
                                icon={<TrendingUp />}
                                label="Total Dibayarkan (YTD)"
                                value={formatRupiah(stats.total_dibayar_ytd)}
                                color="#059669"
                                bg="#dcfce7"
                            />
                            <StatCard
                                icon={<Clock />}
                                label="Periode Aktif"
                                value={stats.periode_aktif}
                                color="#d97706"
                                bg="#fef3c7"
                            />
                            <StatCard
                                icon={<Users />}
                                label="Pegawai Aktif"
                                value={stats.pegawai_aktif}
                                color="#2563eb"
                                bg="#dbeafe"
                            />
                            <StatCard
                                icon={<AlertCircle />}
                                label="Menunggu Approval"
                                value={stats.pending_approval}
                                color="#dc2626"
                                bg="#fee2e2"
                            />
                        </>
                    )}

                    {peran === "HCGA" && (
                        <>
                            <StatCard
                                icon={<Users />}
                                label="Total Pegawai"
                                value={stats.totalPegawai || 0}
                                color="#2563eb"
                                bg="#dbeafe"
                            />
                        </>
                    )}

                    {(peran === "DIREKTUR" || peran === "PEGAWAI") && (
                        <div style={styles.emptyState}>
                            <CheckCircle size={40} color="#10b981" />
                            <p>Gunakan menu di samping untuk navigasi.</p>
                        </div>
                    )}
                </div>

                {/* QUICK ACTIONS */}
                <h3 style={styles.sectionTitle}>Akses Cepat</h3>
                <div style={styles.actionsGrid}>
                    {peran === "FAT" && (
                        <>
                            <QuickAction label="Penggajian" icon={<DollarSign />} onClick={() => navigate("/fat/dashboard")} />
                            <QuickAction label="Laporan" icon={<TrendingUp />} onClick={() => navigate("/fat/laporan")} />
                        </>
                    )}
                    {peran === "HCGA" && (
                        <>
                            <QuickAction label="Pegawai" icon={<Users />} onClick={() => navigate("/hcga/pegawai")} />
                        </>
                    )}
                    {peran === "DIREKTUR" && (
                        <QuickAction label="Approval" icon={<CheckCircle />} onClick={() => navigate("/direktur/dashboard")} />
                    )}
                    {peran === "PEGAWAI" && (
                        <QuickAction label="Slip Gaji" icon={<Wallet />} onClick={() => navigate("/pegawai/dashboard")} />
                    )}
                </div>
            </motion.div>
        </div>
    );
}

function StatCard({ icon, label, value, color, bg }) {
    return (
        <motion.div
            whileHover={{ scale: 1.02 }}
            style={{ ...styles.statCard, background: bg }}
        >
            <div style={{ ...styles.statIcon, color }}>{icon}</div>
            <div>
                <div style={styles.statLabel}>{label}</div>
                <div style={{ ...styles.statValue, color }}>{value}</div>
            </div>
        </motion.div>
    );
}

function QuickAction({ label, icon, onClick }) {
    return (
        <motion.button
            whileHover={{ scale: 1.02, boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)" }}
            style={styles.actionBtn}
            onClick={onClick}
        >
            {icon}
            <span>{label}</span>
            <ChevronRight size={16} />
        </motion.button>
    );
}

const styles = {
    page: { minHeight: "100vh", background: "#f8fafc", padding: 32, fontFamily: "'Inter', sans-serif" },
    center: { textAlign: "center", paddingTop: 100, color: "#64748b" },
    container: { maxWidth: 900, margin: "0 auto" },

    hero: {
        display: "flex", alignItems: "center", gap: 16, marginBottom: 32,
        background: "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)",
        padding: 24, borderRadius: 20
    },
    title: { margin: 0, fontSize: 28, fontWeight: 800, color: "#0f172a" },
    subtitle: { margin: 0, color: "#64748b", fontSize: 14 },

    statsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 32 },
    statCard: {
        borderRadius: 16, padding: 20, display: "flex", alignItems: "center", gap: 16
    },
    statIcon: { fontSize: 24 },
    statLabel: { fontSize: 12, color: "#475569", marginBottom: 4 },
    statValue: { fontSize: 24, fontWeight: 800 },

    emptyState: {
        gridColumn: "1/-1", textAlign: "center", padding: 40,
        display: "flex", flexDirection: "column", alignItems: "center", gap: 12, color: "#64748b"
    },

    sectionTitle: { fontSize: 14, fontWeight: 700, color: "#64748b", marginBottom: 16 },

    actionsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 },
    actionBtn: {
        background: "white", border: "1px solid #e2e8f0", borderRadius: 12,
        padding: 16, display: "flex", alignItems: "center", gap: 12,
        cursor: "pointer", fontSize: 14, fontWeight: 600, color: "#334155"
    }
};
