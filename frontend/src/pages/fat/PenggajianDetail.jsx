
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import PageContainer from "../../components/PageContainer";
import {
    showPenggajianFull,
    hitungPph21Periode,
    ajukanPenggajian,
    bayarPenggajian,
    uploadBuktiTransfer,
    tambahKomponen,
    hapusKomponen
} from "../../lib/penggajianApi";
import { motion } from "framer-motion";
import {
    ArrowLeft, Calendar, Calculator, CheckCircle,
    AlertTriangle, DollarSign, Send, FileText, User, Upload, ExternalLink,
    Plus, Trash, X, Copy, CreditCard
} from "lucide-react";

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

export default function PenggajianDetail() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState("");

    // New: Modal State
    const [modalDetail, setModalDetail] = useState(null);
    const [formKomponen, setFormKomponen] = useState({ nama: "", nilai: "", jenis: "TUNJANGAN" });

    async function loadData(keepModal = false) {
        setLoading(!keepModal);
        try {
            const res = await showPenggajianFull(id);
            setData(res.data);

            if (keepModal && modalDetail) {
                // Update modal data from fresh source
                const freshDetail = res.data.penggajian_periode.detail.find(d => d.id === modalDetail.id);
                if (freshDetail) setModalDetail(freshDetail);
            }
        } catch (e) {
            setError("Gagal memuat detail penggajian.");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        if (id) loadData();
    }, [id]);

    // COMPONENT HANDLERS
    async function handleTambahKomponen(e) {
        e.preventDefault();
        setProcessing(true);
        try {
            await tambahKomponen(modalDetail.id, formKomponen);
            await loadData(true); // reload and keep modal open
            setFormKomponen({ nama: "", nilai: "", jenis: "TUNJANGAN" });
        } catch (e) {
            alert("Gagal tambah: " + (e.response?.data?.message || "Error"));
        } finally {
            setProcessing(false);
        }
    }

    async function handleHapusKomponen(komponenId) {
        if (!confirm("Hapus komponen ini?")) return;
        setProcessing(true);
        try {
            await hapusKomponen(komponenId);
            await loadData(true);
        } catch (e) {
            alert("Gagal hapus: " + (e.response?.data?.message || "Error"));
        } finally {
            setProcessing(false);
        }
    }

    // ACTION HANDLERS
    async function handleHitungPph21() {
        if (!confirm("Hitung ulang PPh21 untuk semua pegawai di periode ini?")) return;
        setProcessing(true);
        try {
            await hitungPph21Periode(id);
            await loadData();
            alert("Perhitungan PPh21 selesai!");
        } catch (e) {
            alert("Gagal hitung PPh21: " + (e.response?.data?.message || "Error"));
        } finally {
            setProcessing(false);
        }
    }

    async function handleAjukan() {
        if (!confirm("Ajukan periode ini ke Direktur? Data tidak bisa diubah lagi setelah diajukan.")) return;
        setProcessing(true);
        try {
            await ajukanPenggajian(id);
            await loadData();
            alert("Berhasil diajukan!");
        } catch (e) {
            alert("Gagal mengajukan: " + (e.response?.data?.message || "Error"));
        } finally {
            setProcessing(false);
        }
    }

    async function handleBayar() {
        // VALIDASI: Cek apakah semua ada bukti
        const pending = p.detail?.filter(d => !d.bukti_transfer);
        if (pending && pending.length > 0) {
            alert(`Gagal! Masih ada ${pending.length} pegawai yang belum memiliki bukti transfer. Harap upload semua bukti sebelum finalisasi.`);
            return;
        }

        if (!confirm("Semua bukti sudah lengkap. Tandai periode ini sebagai SUDAH DIBAYAR?")) return;

        setProcessing(true);
        try {
            await bayarPenggajian(id);
            await loadData();
            alert("Status diperbarui: DIBAYARKAN");
        } catch (e) {
            alert("Gagal memproses: " + (e.response?.data?.message || "Error"));
        } finally {
            setProcessing(false);
        }
    }

    async function handleUpload(e, detailId) {
        const file = e.target.files[0];
        if (!file) return;

        // Validasi size/type simple di frontend
        if (file.size > 2 * 1024 * 1024) return alert("Ukuran file maksimal 2MB");

        try {
            // Show local loading state if needed, or just global
            setProcessing(true);
            await uploadBuktiTransfer(detailId, file);
            // Reload data to show link
            await loadData();
            alert("Bukti berhasil diupload!");
        } catch (err) {
            alert("Gagal upload: " + (err.response?.data?.message || "Error"));
        } finally {
            setProcessing(false);
        }
    }

    function triggerUpload(detailId) {
        document.getElementById(`file-input-${detailId}`).click();
    }

    if (loading) return <div style={styles.centerText}>Memuat detil...</div>;
    if (error || !data) return <div style={styles.errorBanner}>{error || "Data tidak ditemukan"}</div>;

    const { penggajian_periode: p, total_biaya } = data;
    const status = getStatusColor(p.status);
    const isDraft = p.status === "DRAFT";
    const isApproved = p.status === "DISETUJUI";

    return (
        <div style={styles.pageWrapper}>
            {/* HEADER */}
            <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                style={styles.headerGlass}
            >
                <div style={styles.headerContent}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <button onClick={() => navigate("/fat/dashboard")} style={styles.btnBack}>
                            <ArrowLeft size={20} />
                        </button>
                        <div>
                            <div style={styles.crumb}>Penggajian / Detail</div>
                            <h1 style={styles.pageTitle}>Periode: {p.periode}</h1>
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{
                            ...styles.statusBadge,
                            background: status.bg, color: status.color, border: `1px solid ${status.border} `,
                            fontSize: 12, padding: "6px 12px"
                        }}>
                            {p.status.replace(/_/g, " ")}
                        </div>
                    </div>
                </div>
            </motion.div>

            <div style={styles.contentArea}>

                {/* SUMMARY CARD */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={styles.summaryCard}
                >
                    <div style={styles.summaryItem}>
                        <div style={styles.summaryLabel}>Total Pengeluaran</div>
                        <div style={styles.totalValue}>{formatRupiah(total_biaya)}</div>
                    </div>
                    <div style={styles.summaryItem}>
                        <div style={styles.summaryLabel}>Total Pegawai</div>
                        <div style={styles.summaryValue}>{p.detail_count} Orang</div>
                    </div>

                    <div style={styles.actions}>
                        {isDraft && (
                            <>
                                <button
                                    onClick={handleHitungPph21}
                                    disabled={processing}
                                    style={styles.btnAction}
                                >
                                    <Calculator size={16} />
                                    Hitung PPh21 (Auto)
                                </button>
                                <button
                                    onClick={handleAjukan}
                                    disabled={processing}
                                    style={styles.btnPrimary}
                                >
                                    <Send size={16} />
                                    Ajukan ke Direktur
                                </button>
                            </>
                        )}

                        {isApproved && (
                            <button
                                onClick={handleBayar}
                                disabled={processing}
                                style={styles.btnSuccess}
                            >
                                <CheckCircle size={16} />
                                Tandai Sudah Dibayar
                            </button>
                        )}
                    </div>
                </motion.div>

                {/* TABLE */}
                <div style={styles.tableCard}>
                    <div style={styles.tableHeader}>Rincian Gaji Pegawai</div>
                    <div style={{ overflowX: 'auto', paddingBottom: 12 }}>
                        <table style={styles.table}>
                            <thead>
                                <tr>
                                    <th style={styles.th}>Pegawai</th>
                                    <th style={styles.th}>Jabatan</th>
                                    <th style={styles.th}>Rekening</th>
                                    <th style={styles.thNum}>Gaji Pokok</th>
                                    <th style={styles.thNum}>Tunjangan</th>
                                    <th style={styles.thNum}>Potongan</th>
                                    <th style={styles.thNum}>PPh21</th>
                                    <th style={styles.thNum}>Take Home Pay</th>
                                    <th style={styles.th}>Bukti Transfer</th>
                                    <th style={styles.th}>Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {p.detail?.map((d) => (
                                    <tr key={d.id}>
                                        <td style={styles.td}>
                                            <div style={{ fontWeight: 600, color: "#1e293b" }}>{d.pegawai?.nama_lengkap}</div>
                                            <div style={{ fontSize: 11, color: "#64748b" }}>{d.pegawai?.kode_pegawai}</div>
                                        </td>
                                        <td style={styles.td}>{d.jabatan?.nama_jabatan}</td>
                                        <td style={styles.td}>
                                            {d.pegawai?.nomor_rekening ? (
                                                <div style={styles.bankInfo}>
                                                    <div style={{ fontWeight: 700, fontSize: 12 }}>{d.pegawai.nama_bank}</div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                        <code style={styles.code}>{d.pegawai.nomor_rekening}</code>
                                                        <button
                                                            onClick={() => {
                                                                navigator.clipboard.writeText(d.pegawai.nomor_rekening);
                                                                alert("Rekening disalin!");
                                                            }}
                                                            style={styles.btnCopy}
                                                            title="Salin No. Rekening"
                                                        >
                                                            <Copy size={12} />
                                                        </button>
                                                    </div>
                                                    <div style={{ fontSize: 10, color: "#64748b", textTransform: "uppercase", marginTop: 2 }}>
                                                        a.n {d.pegawai.atas_nama_rekening || "-"}
                                                    </div>
                                                </div>
                                            ) : (
                                                <span style={{ color: "#cbd5e1", fontSize: 12 }}>Belum diisi</span>
                                            )}
                                        </td>
                                        <td style={styles.tdNum}>{formatRupiah(d.gaji_pokok)}</td>
                                        <td style={styles.tdNum}>{formatRupiah(d.tunjangan)}</td>
                                        <td style={{ ...styles.tdNum, color: "#ef4444" }}>{d.potongan > 0 ? `(${formatRupiah(d.potongan)})` : "-"}</td>
                                        <td style={styles.tdNum}>{formatRupiah(d.pph21)}</td>
                                        <td style={{ ...styles.tdNum, fontWeight: 700, color: "#059669" }}>{formatRupiah(d.total)}</td>
                                        <td style={styles.td}>
                                            {/* Hidden Input per row */}
                                            <input
                                                type="file"
                                                id={`file-input-${d.id}`}
                                                style={{ display: 'none' }}
                                                accept="image/*,application/pdf"
                                                onChange={(e) => handleUpload(e, d.id)}
                                            />

                                            {d.bukti_transfer ? (
                                                <a
                                                    href={`http://127.0.0.1:8000/storage/${d.bukti_transfer}`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    style={styles.linkBukti}
                                                >
                                                    <FileText size={14} /> Lihat Bukti
                                                </a>
                                            ) : (
                                                <button
                                                    onClick={() => triggerUpload(d.id)}
                                                    style={styles.btnUpload}
                                                    disabled={processing}
                                                >
                                                    <Upload size={14} /> Upload
                                                </button>
                                            )}
                                        </td>
                                        <td style={styles.td}>
                                            <button
                                                onClick={() => setModalDetail(d)}
                                                style={styles.btnActionSmall}
                                            >
                                                {isDraft ? <><Plus size={14} /> Edit</> : <><FileText size={14} /> Rincian</>}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>

            {/* MODAL KOMPONEN */}
            {modalDetail && (
                <div style={styles.modalOverlay}>
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        style={styles.modalCard}
                    >
                        <div style={styles.modalHeader}>
                            <div>
                                <h3 style={{ margin: 0, fontSize: 16 }}>Tunjangan</h3>
                                <div style={{ fontSize: 12, color: "#64748b" }}>{modalDetail.pegawai?.nama_lengkap}</div>
                            </div>
                            <button onClick={() => setModalDetail(null)} style={styles.btnClose}><X size={20} /></button>
                        </div>

                        <div style={styles.komponenList}>
                            {(!modalDetail.komponen || modalDetail.komponen.length === 0) && (
                                <div style={{ textAlign: "center", fontStyle: "italic", color: "#94a3b8", fontSize: 13, padding: 20 }}>
                                    Belum ada komponen tambahan.
                                </div>
                            )}
                            {modalDetail.komponen?.map(k => (
                                <div key={k.id} style={styles.komponenItem}>
                                    <div>
                                        <div style={{ fontWeight: 600, fontSize: 13, color: "#334155" }}>{k.nama}</div>
                                        <div style={{ fontSize: 11, fontWeight: 700, color: k.jenis === 'TUNJANGAN' ? '#059669' : '#ef4444' }}>
                                            {k.jenis}
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                                        <div style={{ fontWeight: 600, fontSize: 14 }}>{formatRupiah(k.nilai)}</div>
                                        {isDraft && (
                                            <button onClick={() => handleHapusKomponen(k.id)} style={styles.btnIcon}>
                                                <Trash size={14} color="#ef4444" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {isDraft && (
                            <form onSubmit={handleTambahKomponen} style={styles.miniForm}>
                                <input
                                    placeholder="Nama (mis: Bonus Project)"
                                    value={formKomponen.nama}
                                    onChange={e => setFormKomponen({ ...formKomponen, nama: e.target.value })}
                                    style={{ ...styles.inputMini, flex: 2 }} required
                                />
                                <select
                                    value={formKomponen.jenis}
                                    onChange={e => setFormKomponen({ ...formKomponen, jenis: e.target.value })}
                                    style={styles.selectMini}
                                >
                                    <option value="TUNJANGAN">Bonus (+)</option>
                                    <option value="POTONGAN">Potongan (-)</option>
                                </select>
                                <input
                                    type="number" placeholder="Nilai"
                                    value={formKomponen.nilai}
                                    onChange={e => setFormKomponen({ ...formKomponen, nilai: e.target.value })}
                                    style={{ ...styles.inputMini, flex: 1.5 }} required
                                />
                                <button type="submit" disabled={processing} style={styles.btnAddMini}>
                                    <Plus size={18} />
                                </button>
                            </form>
                        )}
                    </motion.div>
                </div>
            )}
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
        borderBottom: "1px solid rgba(16, 185, 129, 0.2)",
        padding: "20px 32px",
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
    btnBack: {
        background: "transparent",
        border: "none",
        cursor: "pointer",
        padding: 8,
        borderRadius: "50%",
        color: "#64748b", // slate
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'background 0.2s',
        marginRight: 8
    },
    crumb: { fontSize: 12, color: "#64748b", fontWeight: 600, marginBottom: 4, textTransform: "uppercase" },
    pageTitle: { fontSize: 20, fontWeight: 800, margin: 0, color: "#064e3b" },
    statusBadge: { borderRadius: 20, fontWeight: 700, textTransform: "uppercase" },

    contentArea: {
        maxWidth: 1200,
        margin: "0 auto",
        padding: "32px 20px",
        display: "flex",
        flexDirection: "column",
        gap: 24
    },

    // SUMMARY CARD
    summaryCard: {
        background: "white",
        borderRadius: 20,
        padding: 24,
        boxShadow: "0 10px 30px -5px rgba(0,0,0,0.05)",
        border: "1px solid #e2e8f0",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 20
    },
    summaryItem: {
        paddingRight: 32,
        borderRight: "1px solid #f1f5f9"
    },
    summaryLabel: { fontSize: 13, color: "#64748b", fontWeight: 600, marginBottom: 4 },
    totalValue: { fontSize: 28, fontWeight: 800, color: "#059669", letterSpacing: "-0.5px" },
    summaryValue: { fontSize: 20, fontWeight: 700, color: "#1e293b" },

    actions: { display: "flex", gap: 12, flexWrap: "wrap" },
    btnAction: {
        display: "flex", alignItems: "center", gap: 8,
        background: "white", border: "1px solid #cbd5e1", color: "#475569",
        padding: "10px 16px", borderRadius: 12, fontWeight: 600, cursor: "pointer"
    },
    btnPrimary: {
        display: "flex", alignItems: "center", gap: 8,
        background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
        border: "none", color: "white",
        padding: "10px 20px", borderRadius: 12, fontWeight: 600, cursor: "pointer",
        boxShadow: "0 4px 12px rgba(16, 185, 129, 0.3)"
    },
    btnSuccess: {
        display: "flex", alignItems: "center", gap: 8,
        background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
        border: "none", color: "white",
        padding: "10px 20px", borderRadius: 12, fontWeight: 600, cursor: "pointer",
        boxShadow: "0 4px 12px rgba(37, 99, 235, 0.3)"
    },

    // TABLE
    tableCard: {
        background: "white", borderRadius: 16, border: "1px solid #e2e8f0",
        padding: 0,
        boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)"
    },
    tableHeader: {
        padding: "16px 24px",
        borderBottom: "1px solid #f1f5f9",
        fontWeight: 700,
        color: "#64748b",
        fontSize: 14,
        textTransform: "uppercase",
        letterSpacing: "0.05em",
        background: "#f8fafc"
    },
    table: { width: "100%", borderCollapse: "collapse", minWidth: 800 },
    th: { padding: "12px 24px", textAlign: "left", fontSize: 12, color: "#64748b", fontWeight: 600, borderBottom: "1px solid #f1f5f9", whiteSpace: "nowrap" },
    thNum: { padding: "12px 24px", textAlign: "right", fontSize: 12, color: "#64748b", fontWeight: 600, borderBottom: "1px solid #f1f5f9" },
    td: { padding: "16px 24px", borderBottom: "1px solid #f8fafc", fontSize: 14, color: "#334155" },
    tdNum: { padding: "16px 24px", borderBottom: "1px solid #f8fafc", fontSize: 14, color: "#334155", textAlign: "right", fontFamily: "monospace", fontWeight: 500 },

    centerText: { textAlign: "center", color: "#94a3b8", marginTop: 40 },
    errorBanner: { padding: 16, background: "#fee2e2", color: "#b91c1c", borderRadius: 12, margin: 20 },

    btnUpload: {
        display: "flex", alignItems: "center", gap: 6, fontSize: 12,
        background: "#fff", border: "1px solid #cbd5e1", borderRadius: 8,
        padding: "6px 12px", cursor: "pointer", color: "#475569", fontWeight: 600
    },
    linkBukti: {
        display: "flex", alignItems: "center", gap: 6, fontSize: 12,
        color: "#2563eb", textDecoration: "none", fontWeight: 600,
        background: "#eff6ff", padding: "6px 12px", borderRadius: 8
    },

    btnActionSmall: {
        background: "white", border: "1px solid #cbd5e1", borderRadius: 8,
        padding: "6px 10px", fontSize: 12, fontWeight: 600, color: "#475569",
        cursor: "pointer", display: "flex", alignItems: "center", gap: 4
    },

    // BANK STYLES
    bankInfo: {
        background: "#f8fafc", padding: "8px 12px", borderRadius: 10,
        border: "1px solid #e2e8f0", minWidth: 140
    },
    code: {
        fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 700, color: "#0f172a"
    },
    btnCopy: {
        background: "white", border: "1px solid #cbd5e1", borderRadius: 6,
        padding: "4px", cursor: "pointer", display: "flex", color: "#64748b"
    },

    // MODAL
    modalOverlay: {
        position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
        background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50
    },
    modalCard: {
        background: "white", width: 550, borderRadius: 20, padding: 24,
        boxShadow: "0 20px 50px -10px rgba(0,0,0,0.2)"
    },
    modalHeader: {
        display: "flex", justifyContent: "space-between", alignItems: "center",
        paddingBottom: 16, borderBottom: "1px solid #f1f5f9", marginBottom: 16
    },
    btnClose: {
        background: "none", border: "none", cursor: "pointer", color: "#64748b"
    },
    komponenList: {
        display: "flex", flexDirection: "column", gap: 12, maxHeight: 300, overflowY: "auto"
    },
    komponenItem: {
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "12px", background: "#f8fafc", borderRadius: 12, border: "1px solid #f1f5f9"
    },
    btnIcon: {
        background: "white", border: "1px solid #fee2e2", borderRadius: 6,
        padding: 6, cursor: "pointer", display: "flex"
    },
    miniForm: {
        display: "flex", gap: 8, marginTop: 20, paddingTop: 20, borderTop: "1px dashed #e2e8f0"
    },
    inputMini: {
        padding: 8, borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13, outline: "none", boxSizing: "border-box"
    },
    selectMini: {
        padding: 8, borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13, outline: "none", bg: "white", boxSizing: "border-box"
    },
    btnAddMini: {
        background: "#0f172a", color: "white", border: "none", borderRadius: 8,
        width: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer"
    }
};
