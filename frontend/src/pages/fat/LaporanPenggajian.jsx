import { useState, useEffect } from "react";
import { listPenggajianFull, showPenggajianFull } from "../../lib/penggajianApi";
import { motion } from "framer-motion";
import { FileText, Download, Calendar, TrendingUp, Users, DollarSign, Printer } from "lucide-react";

function formatRupiah(n) {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n || 0);
}

export default function LaporanPenggajian() {
    const [loading, setLoading] = useState(true);
    const [periodes, setPeriodes] = useState([]);
    const [selectedPeriodeId, setSelectedPeriodeId] = useState(null);
    const [reportData, setReportData] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);

    useEffect(() => {
        loadPeriodes();
    }, []);

    async function loadPeriodes() {
        try {
            const res = await listPenggajianFull();
            const list = res.data || [];
            setPeriodes(list);
            if (list.length > 0) {
                setSelectedPeriodeId(list[0].id);
                await loadDetailReport(list[0].id);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }

    async function loadDetailReport(periodeId) {
        setDetailLoading(true);
        try {
            const res = await showPenggajianFull(periodeId);
            const { penggajian_periode: p, total_biaya } = res.data;

            const details = p.detail || [];
            const totalBruto = details.reduce((sum, d) => sum + Number(d.gaji_pokok || 0) + Number(d.tunjangan || 0), 0);
            const totalPph = details.reduce((sum, d) => sum + Number(d.pph21 || 0), 0);
            const totalPotongan = details.reduce((sum, d) => sum + Number(d.potongan || 0), 0);

            // Group by jabatan
            const byJabatan = {};
            details.forEach(d => {
                const jab = d.jabatan?.nama_jabatan || "Lainnya";
                if (!byJabatan[jab]) byJabatan[jab] = { count: 0, total: 0 };
                byJabatan[jab].count++;
                byJabatan[jab].total += Number(d.total || 0);
            });

            setReportData({
                periode: p.periode,
                status: p.status,
                jumlahPegawai: details.length,
                totalBruto,
                totalPph,
                totalPotongan,
                totalGaji: total_biaya,
                byJabatan
            });
        } catch (e) {
            console.error(e);
        } finally {
            setDetailLoading(false);
        }
    }

    async function handlePeriodeChange(e) {
        const id = parseInt(e.target.value);
        setSelectedPeriodeId(id);
        await loadDetailReport(id);
    }

    if (loading) return <div style={styles.center}>Memuat data...</div>;

    return (
        <div style={styles.page}>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                style={styles.container}
            >
                {/* HEADER */}
                <div style={styles.header}>
                    <div>
                        <h1 style={styles.title}><FileText size={28} /> Laporan Penggajian</h1>
                        <p style={styles.subtitle}>Ringkasan dan analisis data penggajian</p>
                    </div>
                    <div style={{ display: "flex", gap: 12 }}>
                        <select
                            value={selectedPeriodeId || ""}
                            onChange={handlePeriodeChange}
                            style={styles.select}
                        >
                            {periodes.map(p => (
                                <option key={p.id} value={p.id}>{p.periode} ({p.status})</option>
                            ))}
                        </select>
                        <button onClick={() => window.print()} style={styles.btnPrint}>
                            <Printer size={18} /> Print
                        </button>
                    </div>
                </div>

                {reportData && (
                    <>
                        {/* SUMMARY CARDS */}
                        <div style={styles.cardGrid}>
                            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} style={styles.statCard}>
                                <div style={styles.statIcon}><Users size={24} /></div>
                                <div>
                                    <div style={styles.statLabel}>Total Pegawai</div>
                                    <div style={styles.statValue}>{reportData.jumlahPegawai}</div>
                                </div>
                            </motion.div>

                            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} style={{ ...styles.statCard, background: "linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)" }}>
                                <div style={{ ...styles.statIcon, background: "#059669", color: "white" }}><TrendingUp size={24} /></div>
                                <div>
                                    <div style={styles.statLabel}>Total Bruto</div>
                                    <div style={{ ...styles.statValue, color: "#059669" }}>{formatRupiah(reportData.totalBruto)}</div>
                                </div>
                            </motion.div>

                            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} style={{ ...styles.statCard, background: "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)" }}>
                                <div style={{ ...styles.statIcon, background: "#d97706", color: "white" }}><DollarSign size={24} /></div>
                                <div>
                                    <div style={styles.statLabel}>Total PPh21</div>
                                    <div style={{ ...styles.statValue, color: "#d97706" }}>{formatRupiah(reportData.totalPph)}</div>
                                </div>
                            </motion.div>

                            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} style={{ ...styles.statCard, background: "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)" }}>
                                <div style={{ ...styles.statIcon, background: "#2563eb", color: "white" }}><DollarSign size={24} /></div>
                                <div>
                                    <div style={styles.statLabel}>Total Netto</div>
                                    <div style={{ ...styles.statValue, color: "#2563eb" }}>{formatRupiah(reportData.totalGaji)}</div>
                                </div>
                            </motion.div>
                        </div>

                        {/* BY JABATAN */}
                        <div style={styles.card}>
                            <div style={styles.cardTitle}>Breakdown per Jabatan</div>
                            <table style={styles.table}>
                                <thead>
                                    <tr>
                                        <th style={styles.th}>Jabatan</th>
                                        <th style={styles.thNum}>Jumlah</th>
                                        <th style={styles.thNum}>Total Gaji</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {Object.entries(reportData.byJabatan).map(([jab, data]) => (
                                        <tr key={jab}>
                                            <td style={styles.td}>{jab}</td>
                                            <td style={styles.tdNum}>{data.count} Orang</td>
                                            <td style={styles.tdNum}>{formatRupiah(data.total)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr style={{ background: "#f8fafc" }}>
                                        <td style={{ ...styles.td, fontWeight: 700 }}>TOTAL</td>
                                        <td style={{ ...styles.tdNum, fontWeight: 700 }}>{reportData.jumlahPegawai} Orang</td>
                                        <td style={{ ...styles.tdNum, fontWeight: 700, color: "#059669" }}>{formatRupiah(reportData.totalGaji)}</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>

                        {/* FOOTER */}
                        <div style={styles.reportFooter}>
                            <div>Periode: <strong>{reportData.periode}</strong></div>
                            <div>Status: <span style={{
                                padding: "4px 12px",
                                borderRadius: 20,
                                background: reportData.status === "DIBAYARKAN" ? "#dcfce7" : "#fef3c7",
                                color: reportData.status === "DIBAYARKAN" ? "#166534" : "#92400e",
                                fontWeight: 600,
                                fontSize: 12
                            }}>{reportData.status}</span></div>
                            <div style={{ fontSize: 11, color: "#94a3b8" }}>Dibuat: {new Date().toLocaleString("id-ID")}</div>
                        </div>
                    </>
                )}
            </motion.div>
        </div>
    );
}

const styles = {
    page: { minHeight: "100vh", background: "#f1f5f9", padding: 32, fontFamily: "'Inter', sans-serif" },
    center: { textAlign: "center", paddingTop: 100, color: "#64748b" },
    container: { maxWidth: 1000, margin: "0 auto" },

    header: {
        display: "flex", justifyContent: "space-between", alignItems: "center",
        marginBottom: 32, flexWrap: "wrap", gap: 16
    },
    title: { margin: 0, fontSize: 28, fontWeight: 800, color: "#0f172a", display: "flex", alignItems: "center", gap: 12 },
    subtitle: { margin: "4px 0 0", color: "#64748b", fontSize: 14 },

    select: {
        padding: "12px 16px", borderRadius: 12, border: "1px solid #e2e8f0",
        fontSize: 14, background: "white", minWidth: 200
    },
    btnPrint: {
        padding: "12px 20px", borderRadius: 12, border: "none",
        background: "#0f172a", color: "white", fontSize: 14, fontWeight: 600,
        cursor: "pointer", display: "flex", alignItems: "center", gap: 8
    },

    cardGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 24 },
    statCard: {
        background: "white", borderRadius: 16, padding: 20,
        display: "flex", alignItems: "center", gap: 16,
        boxShadow: "0 4px 20px -5px rgba(0,0,0,0.08)"
    },
    statIcon: {
        width: 48, height: 48, borderRadius: 12,
        background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", color: "#475569"
    },
    statLabel: { fontSize: 12, color: "#64748b", marginBottom: 4 },
    statValue: { fontSize: 20, fontWeight: 800, color: "#0f172a" },

    card: {
        background: "white", borderRadius: 16, padding: 24, marginBottom: 24,
        boxShadow: "0 4px 20px -5px rgba(0,0,0,0.08)"
    },
    cardTitle: { fontSize: 14, fontWeight: 700, color: "#334155", marginBottom: 16 },

    table: { width: "100%", borderCollapse: "collapse" },
    th: { textAlign: "left", padding: 12, fontSize: 12, color: "#64748b", borderBottom: "1px solid #e2e8f0" },
    thNum: { textAlign: "right", padding: 12, fontSize: 12, color: "#64748b", borderBottom: "1px solid #e2e8f0" },
    td: { padding: 12, fontSize: 14, borderBottom: "1px solid #f1f5f9" },
    tdNum: { padding: 12, fontSize: 14, textAlign: "right", borderBottom: "1px solid #f1f5f9", fontFamily: "monospace" },

    reportFooter: {
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: 16, background: "white", borderRadius: 12, fontSize: 13, color: "#475569"
    }
};
