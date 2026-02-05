import { useEffect, useState } from "react";
import PageContainer from "../../components/PageContainer";
import { listJurnal, getJurnal } from "../../lib/jurnalApi";
import { motion, AnimatePresence } from "framer-motion";
import {
    FileText, Calendar, User, ChevronRight,
    ArrowRight, BookOpen, Search, Filter
} from "lucide-react";
import Modal from "../../components/ui/Modal";

function formatRupiah(n) {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n || 0);
}

export default function JurnalUmum() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [selectedJurnal, setSelectedJurnal] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);

    async function loadData() {
        setLoading(true);
        try {
            const res = await listJurnal();
            setItems(res.data || []);
        } catch (e) {
            setError("Gagal memuat data jurnal umum.");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadData();
    }, []);

    async function handleShowDetail(id) {
        setDetailLoading(true);
        try {
            const res = await getJurnal(id);
            setSelectedJurnal(res.data);
        } catch (e) {
            alert("Gagal memuat detail jurnal");
        } finally {
            setDetailLoading(false);
        }
    }

    const containerVars = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };

    const itemVars = {
        hidden: { opacity: 0, x: -20 },
        visible: { opacity: 1, x: 0 }
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
                            <BookOpen size={28} color="#3b82f6" />
                        </div>
                        <div>
                            <h1 style={styles.pageTitle}>Jurnal Umum</h1>
                            <p style={styles.pageSubtitle}>Pencatatan transaksi akuntansi otomatis</p>
                        </div>
                    </div>
                </div>
            </motion.div>

            <div style={styles.contentArea}>
                {loading ? (
                    <div style={styles.centerText}>Memuat data jurnal...</div>
                ) : error ? (
                    <div style={styles.errorBanner}>{error}</div>
                ) : items.length === 0 ? (
                    <div style={styles.emptyState}>
                        <FileText size={48} color="#cbd5e1" />
                        <p>Belum ada data jurnal umum yang tercatat.</p>
                        <p style={{ fontSize: 14 }}>Jurnal akan otomatis terbuat saat penggajian ditandai sebagai "DIBAYARKAN".</p>
                    </div>
                ) : (
                    <div style={styles.tableCard}>
                        <table style={styles.table}>
                            <thead>
                                <tr>
                                    <th style={styles.th}>Tanggal</th>
                                    <th style={styles.th}>Nomor Jurnal</th>
                                    <th style={styles.th}>Keterangan</th>
                                    <th style={styles.th}>Total (Debet/Kredit)</th>
                                    <th style={styles.th}>Oleh</th>
                                    <th style={styles.th}></th>
                                </tr>
                            </thead>
                            <motion.tbody
                                variants={containerVars}
                                initial="hidden"
                                animate="visible"
                            >
                                {items.map((item) => (
                                    <motion.tr
                                        key={item.id}
                                        variants={itemVars}
                                        style={styles.tr}
                                    >
                                        <td style={styles.td}>{item.tanggal}</td>
                                        <td style={styles.td}>
                                            <span style={styles.journalNo}>{item.nomor_jurnal}</span>
                                        </td>
                                        <td style={styles.td}>{item.keterangan}</td>
                                        <td style={styles.td}>
                                            <span style={styles.totalVal}>{formatRupiah(item.total_debet)}</span>
                                        </td>
                                        <td style={styles.td}>
                                            <div style={styles.userBadge}>
                                                <User size={12} />
                                                <span>{item.pembuat?.name || 'System'}</span>
                                            </div>
                                        </td>
                                        <td style={styles.td}>
                                            <button
                                                style={styles.btnAction}
                                                onClick={() => handleShowDetail(item.id)}
                                            >
                                                Detail <ChevronRight size={14} />
                                            </button>
                                        </td>
                                    </motion.tr>
                                ))}
                            </motion.tbody>
                        </table>
                    </div>
                )}
            </div>

            <Modal
                open={!!selectedJurnal}
                title={`Detail Jurnal: ${selectedJurnal?.nomor_jurnal}`}
                onClose={() => setSelectedJurnal(null)}
                width={800}
            >
                {selectedJurnal && (
                    <div style={styles.detailContent}>
                        <div style={styles.detailHeader}>
                            <div style={styles.detailHeaderItem}>
                                <div style={styles.labelSmall}>Tanggal</div>
                                <div style={styles.valMedium}>{selectedJurnal.tanggal}</div>
                            </div>
                            <div style={styles.detailHeaderItem}>
                                <div style={styles.labelSmall}>Referensi</div>
                                <div style={styles.valMedium}>{selectedJurnal.referensi_tipe} #{selectedJurnal.referensi_id}</div>
                            </div>
                        </div>

                        <table style={styles.detailTable}>
                            <thead>
                                <tr>
                                    <th style={styles.dth}>Kode Akun</th>
                                    <th style={styles.dth}>Nama Akun</th>
                                    <th style={styles.dthRight}>Debet</th>
                                    <th style={styles.dthRight}>Kredit</th>
                                </tr>
                            </thead>
                            <tbody>
                                {selectedJurnal.details?.map((det) => (
                                    <tr key={det.id} style={styles.dtr}>
                                        <td style={styles.dtd}>{det.coa?.kode_akun}</td>
                                        <td style={styles.dtd}>
                                            <div style={det.kredit > 0 ? { paddingLeft: 24 } : {}}>
                                                {det.coa?.nama_akun}
                                                {det.keterangan && <div style={styles.detDesc}>{det.keterangan}</div>}
                                            </div>
                                        </td>
                                        <td style={styles.dtdRight}>{det.debet > 0 ? formatRupiah(det.debet) : '-'}</td>
                                        <td style={styles.dtdRight}>{det.kredit > 0 ? formatRupiah(det.kredit) : '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr style={styles.dfooter}>
                                    <td colSpan={2} style={styles.dtdTotal}>TOTAL</td>
                                    <td style={styles.dtdRightTotal}>{formatRupiah(selectedJurnal.total_debet)}</td>
                                    <td style={styles.dtdRightTotal}>{formatRupiah(selectedJurnal.total_kredit)}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                )}
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
        borderBottom: "1px solid rgba(59, 130, 246, 0.2)", // Blue tint
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
        background: "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 4px 10px rgba(59, 130, 246, 0.15)"
    },
    pageTitle: {
        fontSize: 24,
        fontWeight: 800,
        margin: 0,
        color: "#1e3a8a", // Dark Blue
        letterSpacing: "-0.5px"
    },
    pageSubtitle: {
        fontSize: 14,
        color: "#64748b",
        margin: 0,
        fontWeight: 500
    },
    contentArea: {
        maxWidth: 1200,
        margin: "0 auto",
        padding: "32px 20px"
    },
    tableCard: {
        background: "white",
        borderRadius: 20,
        border: "1px solid #e2e8f0",
        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
        overflow: "hidden"
    },
    table: {
        width: "100%",
        borderCollapse: "collapse",
        textAlign: "left"
    },
    th: {
        padding: "16px 24px",
        background: "#f8fafc",
        borderBottom: "1px solid #e2e8f0",
        fontSize: 12,
        fontWeight: 700,
        color: "#64748b",
        textTransform: "uppercase"
    },
    tr: {
        borderBottom: "1px solid #f1f5f9",
        transition: "background 0.2s"
    },
    td: {
        padding: "16px 24px",
        fontSize: 14,
        color: "#334155"
    },
    journalNo: {
        fontWeight: 700,
        color: "#2563eb",
        background: "#eff6ff",
        padding: "4px 8px",
        borderRadius: 6
    },
    totalVal: {
        fontWeight: 700,
        color: "#1e293b"
    },
    userBadge: {
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        background: "#f1f5f9",
        padding: "4px 10px",
        borderRadius: 12,
        fontSize: 12,
        color: "#475569"
    },
    btnAction: {
        background: "transparent",
        border: "none",
        color: "#2563eb",
        fontWeight: 700,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: 4
    },
    centerText: { textAlign: "center", color: "#94a3b8", marginTop: 40 },
    errorBanner: { padding: 16, background: "#fee2e2", color: "#b91c1c", borderRadius: 12, marginBottom: 20 },
    emptyState: { textAlign: "center", padding: 60, display: "flex", flexDirection: "column", alignItems: "center", gap: 16, color: "#94a3b8" },

    // DETAIL MODAL
    detailContent: { padding: "10px 0" },
    detailHeader: {
        display: "flex",
        gap: 40,
        marginBottom: 24,
        background: "#f8fafc",
        padding: 16,
        borderRadius: 12
    },
    labelSmall: { fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", marginBottom: 4 },
    valMedium: { fontSize: 15, fontWeight: 700, color: "#1e293b" },
    detailTable: { width: "100%", borderCollapse: "collapse" },
    dth: { textAlign: "left", padding: 12, borderBottom: "2px solid #e2e8f0", fontSize: 13, color: "#64748b" },
    dthRight: { textAlign: "right", padding: 12, borderBottom: "2px solid #e2e8f0", fontSize: 13, color: "#64748b" },
    dtd: { padding: 12, borderBottom: "1px solid #f1f5f9", fontSize: 14, verticalAlign: "top" },
    dtdRight: { padding: 12, borderBottom: "1px solid #f1f5f9", fontSize: 14, textAlign: "right", fontWeight: 600, color: "#1e293b" },
    detDesc: { fontSize: 11, color: "#94a3b8", marginTop: 2 },
    dfooter: { background: "#f8fafc" },
    dtdTotal: { padding: 16, fontWeight: 800, color: "#1e293b", fontSize: 14 },
    dtdRightTotal: { padding: 16, textAlign: "right", fontWeight: 800, color: "#2563eb", fontSize: 15 }
};
