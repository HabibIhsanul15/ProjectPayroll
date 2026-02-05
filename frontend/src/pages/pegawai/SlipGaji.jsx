import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getSlipSayaDetail } from "../../lib/penggajianApi";
import { ArrowLeft, Printer, Download, ExternalLink } from "lucide-react";

function formatRupiah(n) {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n || 0);
}

export default function SlipGaji() {
    const { id } = useParams(); // id is penggajian_periode_id
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);

    useEffect(() => {
        async function load() {
            try {
                const res = await getSlipSayaDetail(id);
                setData(res.data);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [id]);

    if (loading) return <div style={styles.center}>Memuat slip...</div>;
    if (!data) return <div style={styles.center}>Data tidak ditemukan</div>;

    const d = data; // detail slip

    return (
        <div style={styles.page}>
            {/* NAVBAR */}
            <div style={styles.nav}>
                <div style={styles.navContent}>
                    <button onClick={() => navigate("/pegawai/dashboard")} style={styles.backBtn}>
                        <ArrowLeft size={20} /> Kembali
                    </button>
                    <div style={{ fontWeight: 700 }}>Slip Gaji Digital</div>
                    <button onClick={() => window.print()} style={styles.printBtn}>
                        <Printer size={18} />
                    </button>
                </div>
            </div>

            {/* PAPER SLIP */}
            <div style={styles.paper}>
                {/* HEADER */}
                <div style={styles.header}>
                    <div style={styles.companyName}>PT. COMPANY SEJAHTERA</div>
                    <div style={styles.docTitle}>SLIP GAJI KARYAWAN</div>
                    <div style={styles.period}>{d.periode?.periode}</div>
                </div>

                <div style={styles.divider} />

                {/* INFO */}
                <div style={styles.gridInfo}>
                    <div style={styles.infoRow}>
                        <span style={styles.label}>NAMA</span>
                        <span style={styles.val}>{d.pegawai?.nama_lengkap}</span>
                    </div>
                    <div style={styles.infoRow}>
                        <span style={styles.label}>ID PEGAWAI</span>
                        <span style={styles.val}>{d.pegawai?.kode_pegawai}</span>
                    </div>
                    <div style={styles.infoRow}>
                        <span style={styles.label}>JABATAN</span>
                        <span style={styles.val}>{d.jabatan?.nama_jabatan}</span>
                    </div>
                </div>

                <div style={styles.divider} />

                {/* EARNINGS */}
                <div style={styles.sectionTitle}>PENERIMAAN</div>
                <div style={styles.moneyRow}>
                    <span>Gaji Pokok</span>
                    <span>{formatRupiah(d.gaji_pokok)}</span>
                </div>
                {/* Dynamic Tunjangan Components */}
                {d.komponen?.filter(k => k.jenis === 'TUNJANGAN').map(k => (
                    <div key={k.id} style={{ ...styles.moneyRow, color: "#059669" }}>
                        <span style={{ paddingLeft: 12 }}>• {k.nama}</span>
                        <span>{formatRupiah(k.nilai)}</span>
                    </div>
                ))}
                <div style={{ ...styles.moneyRow, fontWeight: 700, marginTop: 8 }}>
                    <span>Total Bruto</span>
                    <span>{formatRupiah(Number(d.gaji_pokok) + Number(d.tunjangan))}</span>
                </div>

                <div style={{ height: 24 }} />

                {/* DEDUCTIONS */}
                <div style={styles.sectionTitle}>POTONGAN</div>
                <div style={styles.moneyRow}>
                    <span>PPh 21</span>
                    <span>({formatRupiah(d.pph21)})</span>
                </div>
                {/* Dynamic Potongan Components */}
                {d.komponen?.filter(k => k.jenis === 'POTONGAN').map(k => (
                    <div key={k.id} style={{ ...styles.moneyRow, color: "#ef4444" }}>
                        <span style={{ paddingLeft: 12 }}>• {k.nama}</span>
                        <span>({formatRupiah(k.nilai)})</span>
                    </div>
                ))}
                <div style={{ ...styles.moneyRow, fontWeight: 700, marginTop: 8, color: "#64748b" }}>
                    <span>Total Potongan</span>
                    <span>({formatRupiah(Number(d.pph21) + Number(d.potongan))})</span>
                </div>

                <div style={styles.dividerDouble} />

                {/* NET PAY */}
                <div style={styles.netRow}>
                    <span>TAKE HOME PAY</span>
                    <span style={styles.netVal}>{formatRupiah(d.total)}</span>
                </div>
                <div style={styles.terbilang}>
                    *Transfer ke rekening {d.pegawai?.nama_bank || "Bank"} ****{d.pegawai?.nomor_rekening?.slice(-4) || "0000"}
                </div>

                <div style={styles.footer}>
                    <div style={styles.sign}>
                        <div>Dibuat Oleh,</div>
                        <div style={{ height: 40 }} />
                        <div style={{ fontWeight: 700 }}>{d.periode?.pengaju?.name || "Finance Dept."}</div>
                    </div>
                    <div style={styles.sign}>
                        <div>Diterima Oleh,</div>
                        <div style={{ height: 40 }} />
                        <div style={{ fontWeight: 700 }}>{d.pegawai?.nama_lengkap || "-"}</div>
                    </div>
                </div>

                <div style={{ marginTop: 40, borderTop: "1px dashed #cbd5e1", paddingTop: 20 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b", marginBottom: 8 }}>BUKTI TRANSFER</div>
                    {d.bukti_transfer ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <a
                                href={`http://127.0.0.1:8000/storage/${d.bukti_transfer}`}
                                target="_blank"
                                rel="noreferrer"
                                style={styles.linkBukti}
                            >
                                <ExternalLink size={14} /> Lihat Bukti Pembayaran
                            </a>
                            <span style={{ fontSize: 12, color: "#059669", fontWeight: 600 }}>✓ Terverifikasi</span>
                        </div>
                    ) : (
                        <span style={{ fontSize: 12, color: "#94a3b8", fontStyle: "italic" }}>Menunggu proses transfer...</span>
                    )}
                </div>

            </div>
        </div>
    );
}

const styles = {
    page: { minHeight: "100vh", background: "#e2e8f0", paddingBottom: 40, fontFamily: "'Inter', sans-serif" },
    center: { textAlign: "center", paddingTop: 50, color: "#64748b" },

    nav: { background: "white", borderBottom: "1px solid #cbd5e1", padding: "16px 0", position: "sticky", top: 0 },
    navContent: { maxWidth: 700, margin: "0 auto", padding: "0 20px", display: "flex", justifyContent: "space-between", alignItems: "center" },
    backBtn: { background: "none", border: "none", display: "flex", gap: 8, alignItems: "center", cursor: "pointer", color: "#475569" },
    printBtn: { background: "#f1f5f9", border: "none", padding: 8, borderRadius: 8, cursor: "pointer" },

    paper: {
        maxWidth: 700, margin: "24px auto", background: "white", padding: 40,
        boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)", minHeight: 800
    },
    header: { textAlign: "center", marginBottom: 24 },
    companyName: { fontSize: 18, fontWeight: 800, color: "#1e293b", marginBottom: 4 },
    docTitle: { fontSize: 14, letterSpacing: "0.1em", color: "#64748b" },
    period: { fontSize: 14, fontWeight: 700, marginTop: 8 },

    divider: { height: 1, background: "#e2e8f0", margin: "24px 0" },
    dividerDouble: { borderTop: "1px dashed #cbd5e1", borderBottom: "1px dashed #cbd5e1", height: 4, margin: "24px 0" },

    gridInfo: { display: "grid", gridTemplateColumns: "1fr", gap: 8 },
    infoRow: { display: "flex", justifyContent: "space-between", fontSize: 13 },
    label: { color: "#64748b", width: 100 },
    val: { fontWeight: 600, color: "#334155" },

    sectionTitle: { fontSize: 12, fontWeight: 700, background: "#f1f5f9", padding: "4px 8px", marginBottom: 12, display: "inline-block" },

    moneyRow: { display: "flex", justifyContent: "space-between", fontSize: 14, color: "#334155", marginBottom: 6 },

    netRow: { display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 },
    netVal: { fontSize: 24, fontWeight: 800, color: "#0f172a" },
    terbilang: { fontSize: 11, fontStyle: "italic", color: "#64748b", marginTop: 8 },

    footer: { display: "flex", justifyContent: "space-between", marginTop: 60 },
    sign: { textAlign: "center", width: 150, fontSize: 12 },

    linkBukti: {
        display: "flex", alignItems: "center", gap: 6, fontSize: 12,
        color: "#2563eb", textDecoration: "none", fontWeight: 600,
        background: "#eff6ff", padding: "8px 12px", borderRadius: 8,
        border: "1px solid #bfdbfe", width: "fit-content"
    }
};
