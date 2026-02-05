import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { showPenggajianApproval, approvePenggajian, rejectPenggajian } from "../../lib/penggajianApi";
import { motion } from "framer-motion";
import { ArrowLeft, CheckCircle, XCircle, AlertTriangle, FileText, Download } from "lucide-react";
import Modal from "../../components/ui/Modal";

function formatRupiah(n) {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n || 0);
}

export default function DirekturReview() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [showReject, setShowReject] = useState(false);
    const [rejectNote, setRejectNote] = useState("");

    const [errMsg, setErrMsg] = useState("");

    async function load() {
        setLoading(true);
        try {
            const res = await showPenggajianApproval(id);
            setData(res.data);
        } catch (e) {
            setErrMsg("Gagal memuat data pengajuan.");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => { load() }, [id]);

    async function onApprove() {
        if (!confirm("Anda yakin menyetujui penggajian ini? Aksi ini tidak dapat dibatalkan.")) return;
        setProcessing(true);
        try {
            await approvePenggajian(id);
            alert("Penggajian DISETUJUI. Finance dapat melanjutkan proses pembayaran.");
            navigate("/direktur/dashboard");
        } catch (e) {
            alert("Gagal approve: " + e.message);
        } finally {
            setProcessing(false);
        }
    }

    async function onReject(e) {
        e.preventDefault();
        if (!rejectNote.trim()) return alert("Wajib isi alasan penolakan.");
        setProcessing(true);
        try {
            await rejectPenggajian(id, rejectNote);
            alert("Penggajian DITOLAK dan dikembalikan ke Finance.");
            navigate("/direktur/dashboard");
        } catch (e) {
            alert("Gagal reject: " + e.message);
        } finally {
            setProcessing(false);
        }
    }

    if (loading) return <div style={styles.loading}>Memuat data review...</div>;
    if (!data) return <div style={styles.error}>{errMsg || "Data tidak ditemukan"}</div>;

    const { penggajian_periode: p, total_biaya } = data;

    return (
        <div style={styles.page}>
            {/* HEADER */}
            <div style={styles.header}>
                <button onClick={() => navigate("/direktur/dashboard")} style={styles.btnBack}>
                    <ArrowLeft size={20} color="white" />
                </button>
                <div>
                    <div style={styles.crumb}>Direktur / Approval</div>
                    <h1 style={styles.title}>Review Periode: {p.periode}</h1>
                </div>
            </div>

            <div style={styles.container}>
                <div style={styles.mainCard}>
                    <div style={styles.summaryBox}>
                        <div style={styles.summaryLabel}>Total Pengajuan Gaji</div>
                        <div style={styles.total}>{formatRupiah(total_biaya)}</div>
                        <div style={styles.meta}>
                            <span>Pegawai: <b>{p.detail_count}</b></span>
                            <span>•</span>
                            <span>Diajukan: <b>{p.diajukan_pada ? p.diajukan_pada.slice(0, 10) : "-"}</b></span>
                        </div>
                    </div>

                    <div style={styles.alertBox}>
                        <AlertTriangle size={20} color="#d97706" />
                        <p>
                            Mohon periksa total nominal. Setelah disetujui, Finance akan memproses transfer.
                            Pastikan dana perusahaan mencukupi.
                        </p>
                    </div>

                    {/* LIST PEGAWAI (READ ONLY) */}
                    <div style={styles.tableContainer}>
                        <div style={styles.tableLabel}>Rincian Gaji Pegawai</div>
                        <table style={styles.table}>
                            <thead>
                                <tr>
                                    <th style={styles.th}>Pegawai</th>
                                    <th style={styles.th}>Jabatan</th>
                                    <th style={styles.thNum}>Total (THP)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {p.detail?.map((d) => (
                                    <tr key={d.id}>
                                        <td style={styles.td}>
                                            <div style={{ fontWeight: 600 }}>{d.pegawai?.nama_lengkap}</div>
                                            <div style={{ fontSize: 11, color: "#64748b" }}>{d.pegawai?.kode_pegawai}</div>
                                        </td>
                                        <td style={styles.td}>{d.jabatan?.nama_jabatan}</td>
                                        <td style={styles.tdNum}>{formatRupiah(d.total)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div style={styles.actions}>
                        <button
                            onClick={() => setShowReject(true)}
                            disabled={processing}
                            style={styles.btnReject}
                        >
                            <XCircle size={18} />
                            Tolak / Revisi
                        </button>
                        <button
                            onClick={onApprove}
                            disabled={processing}
                            style={styles.btnApprove}
                        >
                            <CheckCircle size={18} />
                            Setujui (Approve)
                        </button>
                    </div>
                </div>
            </div>

            {/* REJECT MODAL */}
            <Modal open={showReject} title="Alasan Penolakan" onClose={() => setShowReject(false)}>
                <form onSubmit={onReject} style={{ padding: 10 }}>
                    <p style={{ fontSize: 14, color: "#64748b", marginBottom: 8 }}>
                        Berikan catatan kepada Finance untuk perbaikan:
                    </p>
                    <textarea
                        value={rejectNote}
                        onChange={(e) => setRejectNote(e.target.value)}
                        rows={4}
                        placeholder="Contoh: Ada selisih hitungan lembur divisi IT..."
                        style={styles.textarea}
                        required
                    />
                    <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 12 }}>
                        <button type="button" onClick={() => setShowReject(false)} style={styles.btnGhost}>Batal</button>
                        <button type="submit" disabled={processing} style={styles.btnRejectConfirm}>
                            {processing ? "Memproses..." : "Kirim Penolakan"}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}

const styles = {
    page: { minHeight: "100vh", background: "#f1f5f9", fontFamily: "'Inter', sans-serif" },
    header: {
        background: "#0f172a", padding: "24px 32px", color: "white",
        display: "flex", alignItems: "center", gap: 16,
        boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
    },
    btnBack: {
        background: "rgba(255,255,255,0.1)", border: "none", borderRadius: "50%",
        width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center",
        cursor: "pointer"
    },
    crumb: { fontSize: 12, opacity: 0.7, textTransform: "uppercase", fontWeight: 600, marginBottom: 4 },
    title: { margin: 0, fontSize: 20, fontWeight: 700 },

    container: { maxWidth: 800, margin: "32px auto", padding: "0 20px" },
    mainCard: {
        background: "white", borderRadius: 16, padding: 32,
        boxShadow: "0 10px 30px -10px rgba(0,0,0,0.1)"
    },

    summaryBox: { textAlign: "center", marginBottom: 32 },
    summaryLabel: { fontSize: 14, color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" },
    total: { fontSize: 42, fontWeight: 800, color: "#0f172a", margin: "12px 0 8px 0" },
    meta: { display: "flex", gap: 12, justifyContent: "center", fontSize: 14, color: "#64748b" },

    alertBox: {
        background: "#fffbeb", border: "1px solid #fcd34d", borderRadius: 12,
        padding: 16, display: "flex", gap: 12, alignItems: "start",
        color: "#92400e", fontSize: 14, lineHeight: "1.5", marginBottom: 32
    },

    actions: { display: "grid", gridTemplateColumns: "1fr 2fr", gap: 16 },

    // Table
    tableContainer: {
        border: "1px solid #e2e8f0", borderRadius: 12, marginBottom: 32, overflow: "hidden"
    },
    tableLabel: {
        background: "#f8fafc", padding: "12px 16px", fontWeight: 700, fontSize: 13,
        color: "#64748b", borderBottom: "1px solid #e2e8f0", textTransform: "uppercase"
    },
    table: { width: "100%", borderCollapse: "collapse" },
    th: { padding: "12px 16px", textAlign: "left", fontSize: 12, color: "#64748b", borderBottom: "1px solid #e2e8f0" },
    thNum: { padding: "12px 16px", textAlign: "right", fontSize: 12, color: "#64748b", borderBottom: "1px solid #e2e8f0" },
    td: { padding: "12px 16px", fontSize: 14, color: "#334155", borderBottom: "1px solid #f1f5f9" },
    tdNum: { padding: "12px 16px", fontSize: 14, color: "#334155", textAlign: "right", fontWeight: 700, fontFamily: "monospace", borderBottom: "1px solid #f1f5f9" },

    btnReject: {
        background: "white", border: "2px solid #ef4444", color: "#ef4444",
        padding: "16px", borderRadius: 12, fontWeight: 700, fontSize: 16,
        cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
        transition: "all 0.2s"
    },
    btnApprove: {
        background: "#0f172a", border: "2px solid #0f172a", color: "white",
        padding: "16px", borderRadius: 12, fontWeight: 700, fontSize: 16,
        cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
        boxShadow: "0 10px 20px -5px rgba(15, 23, 42, 0.3)",
        transition: "all 0.2s"
    },

    // Modal
    textarea: {
        width: "100%", padding: 12, borderRadius: 8, border: "1px solid #e2e8f0",
        fontSize: 14, fontFamily: "inherit", resize: "vertical"
    },
    btnGhost: { background: "white", border: "1px solid #e2e8f0", padding: "10px 16px", borderRadius: 8, fontWeight: 600, cursor: "pointer" },
    btnRejectConfirm: { background: "#ef4444", border: "none", color: "white", padding: "10px 16px", borderRadius: 8, fontWeight: 600, cursor: "pointer" },

    loading: { textAlign: "center", marginTop: 50, color: "#94a3b8" },
    error: { textAlign: "center", marginTop: 50, color: "#ef4444" }
};
