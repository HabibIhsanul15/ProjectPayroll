import { useState, useEffect } from "react";
import { api } from "../../lib/api";
import { motion } from "framer-motion";
import {
    User, Mail, Shield, Key, Save, CheckCircle, AlertCircle,
    MapPin, Phone, CreditCard, Briefcase, Building, Lock
} from "lucide-react";

export default function Profile() {
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState(null);
    const [saving, setSaving] = useState(false);
    const [savingData, setSavingData] = useState(false);
    const [message, setMessage] = useState({ type: "", text: "" });

    // Password form
    const [pwForm, setPwForm] = useState({
        password_lama: "",
        password_baru: "",
        password_baru_confirmation: ""
    });

    // Pegawai editable form
    const [pegawaiForm, setPegawaiForm] = useState({
        alamat: "",
        no_telepon: "",
        email_pribadi: "",
        nama_bank: "",
        nomor_rekening: "",
        atas_nama_rekening: ""
    });

    useEffect(() => {
        loadProfile();
    }, []);

    async function loadProfile() {
        try {
            const res = await api.get("/profile");
            const data = res.data.data;
            setProfile(data);

            // Populate editable form if pegawai exists
            if (data.pegawai) {
                setPegawaiForm({
                    alamat: data.pegawai.alamat || "",
                    no_telepon: data.pegawai.no_telepon || "",
                    email_pribadi: data.pegawai.email_pribadi || "",
                    nama_bank: data.pegawai.nama_bank || "",
                    nomor_rekening: data.pegawai.nomor_rekening || "",
                    atas_nama_rekening: data.pegawai.atas_nama_rekening || ""
                });
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }

    async function handleChangePassword(e) {
        e.preventDefault();
        setMessage({ type: "", text: "" });
        setSaving(true);

        try {
            await api.post("/profile/password", pwForm);
            setMessage({ type: "success", text: "Password berhasil diubah!" });
            setPwForm({ password_lama: "", password_baru: "", password_baru_confirmation: "" });
        } catch (err) {
            setMessage({ type: "error", text: err.response?.data?.message || "Gagal mengubah password" });
        } finally {
            setSaving(false);
        }
    }

    async function handleUpdatePegawai(e) {
        e.preventDefault();
        setMessage({ type: "", text: "" });
        setSavingData(true);

        try {
            const res = await api.patch("/profile/pegawai", pegawaiForm);
            setProfile(prev => ({ ...prev, pegawai: res.data.data }));
            setMessage({ type: "success", text: "Data pribadi berhasil diperbarui!" });
        } catch (err) {
            setMessage({ type: "error", text: err.response?.data?.message || "Gagal memperbarui data" });
        } finally {
            setSavingData(false);
        }
    }

    if (loading) return <div style={styles.center}>Memuat profil...</div>;
    if (!profile) return <div style={styles.center}>Gagal memuat profil</div>;

    const { user, pegawai } = profile;

    return (
        <div style={styles.page}>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                style={styles.container}
            >
                {/* HEADER */}
                <div style={styles.header}>
                    <div style={styles.avatar}>
                        <User size={40} color="#3b82f6" />
                    </div>
                    <div>
                        <h1 style={styles.name}>{user.name}</h1>
                        <div style={styles.role}>{user.peran}</div>
                    </div>
                </div>

                {/* ALERT */}
                {message.text && (
                    <div style={{
                        ...styles.alert,
                        background: message.type === "success" ? "#dcfce7" : "#fee2e2",
                        color: message.type === "success" ? "#166534" : "#991b1b"
                    }}>
                        {message.type === "success" ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                        {message.text}
                    </div>
                )}

                {/* INFO AKUN CARD */}
                <div style={styles.card}>
                    <div style={styles.cardTitle}><Mail size={16} /> Informasi Akun</div>
                    <div style={styles.infoGrid}>
                        <InfoItem icon={<Mail size={14} />} label="Email" value={user.email} />
                        <InfoItem icon={<Shield size={14} />} label="Role" value={user.peran} />
                    </div>
                </div>

                {/* DATA KEPEGAWAIAN (View Only) */}
                {pegawai && (
                    <div style={styles.card}>
                        <div style={styles.cardTitle}>
                            <Lock size={16} /> Data Kepegawaian
                            <span style={styles.viewOnlyBadge}>View Only</span>
                        </div>
                        <div style={styles.infoGrid}>
                            <InfoItem label="Kode Pegawai" value={pegawai.kode_pegawai} />
                            <InfoItem label="Nama Lengkap" value={pegawai.nama_lengkap} />
                            <InfoItem label="Status PTKP" value={pegawai.status_ptkp || "-"} />
                            <InfoItem label="NPWP" value={pegawai.npwp || "-"} />
                            <InfoItem label="Tanggal Masuk" value={pegawai.tanggal_masuk?.slice(0, 10) || "-"} />
                            <InfoItem label="Status Kerja" value={pegawai.status_kerja || "-"} />
                        </div>
                    </div>
                )}

                {/* DATA PRIBADI (Editable) - Only for PEGAWAI role */}
                {pegawai && user.peran === "PEGAWAI" && (
                    <div style={styles.card}>
                        <div style={styles.cardTitle}>
                            <Briefcase size={16} /> Data Pribadi & Bank
                            <span style={styles.editableBadge}>Dapat Diubah</span>
                        </div>
                        <form onSubmit={handleUpdatePegawai} style={styles.form}>
                            <div style={styles.formGrid}>
                                <div style={styles.inputGroup}>
                                    <label style={styles.label}><MapPin size={12} /> Alamat</label>
                                    <textarea
                                        value={pegawaiForm.alamat}
                                        onChange={e => setPegawaiForm({ ...pegawaiForm, alamat: e.target.value })}
                                        style={{ ...styles.input, minHeight: 60, resize: "vertical" }}
                                        placeholder="Alamat lengkap..."
                                    />
                                </div>
                                <div style={styles.inputGroup}>
                                    <label style={styles.label}><Phone size={12} /> No. Telepon</label>
                                    <input
                                        type="tel"
                                        value={pegawaiForm.no_telepon}
                                        onChange={e => setPegawaiForm({ ...pegawaiForm, no_telepon: e.target.value })}
                                        style={styles.input}
                                        placeholder="08xxxxxxxxxx"
                                    />
                                </div>
                                <div style={styles.inputGroup}>
                                    <label style={styles.label}><Mail size={12} /> Email Pribadi</label>
                                    <input
                                        type="email"
                                        value={pegawaiForm.email_pribadi}
                                        onChange={e => setPegawaiForm({ ...pegawaiForm, email_pribadi: e.target.value })}
                                        style={styles.input}
                                        placeholder="email@pribadi.com"
                                    />
                                </div>
                            </div>

                            <div style={{ ...styles.cardTitle, marginTop: 20 }}>
                                <CreditCard size={16} /> Data Rekening Bank
                            </div>
                            <div style={styles.formGrid}>
                                <div style={styles.inputGroup}>
                                    <label style={styles.label}><Building size={12} /> Nama Bank</label>
                                    <input
                                        type="text"
                                        value={pegawaiForm.nama_bank}
                                        onChange={e => setPegawaiForm({ ...pegawaiForm, nama_bank: e.target.value })}
                                        style={styles.input}
                                        placeholder="BCA, Mandiri, BNI, dll"
                                    />
                                </div>
                                <div style={styles.inputGroup}>
                                    <label style={styles.label}><CreditCard size={12} /> Nomor Rekening</label>
                                    <input
                                        type="text"
                                        value={pegawaiForm.nomor_rekening}
                                        onChange={e => setPegawaiForm({ ...pegawaiForm, nomor_rekening: e.target.value })}
                                        style={styles.input}
                                        placeholder="1234567890"
                                    />
                                </div>
                                <div style={styles.inputGroup}>
                                    <label style={styles.label}><User size={12} /> Atas Nama</label>
                                    <input
                                        type="text"
                                        value={pegawaiForm.atas_nama_rekening}
                                        onChange={e => setPegawaiForm({ ...pegawaiForm, atas_nama_rekening: e.target.value })}
                                        style={styles.input}
                                        placeholder="Nama sesuai buku tabungan"
                                    />
                                </div>
                            </div>

                            <button type="submit" disabled={savingData} style={styles.btnSave}>
                                <Save size={16} />
                                {savingData ? "Menyimpan..." : "Simpan Data Pribadi"}
                            </button>
                        </form>
                    </div>
                )}

                {/* PASSWORD CARD */}
                <div style={styles.card}>
                    <div style={styles.cardTitle}>
                        <Key size={16} /> Ubah Password
                    </div>
                    <form onSubmit={handleChangePassword} style={styles.form}>
                        <div style={styles.formGrid}>
                            <div style={styles.inputGroup}>
                                <label style={styles.label}>Password Lama</label>
                                <input
                                    type="password"
                                    value={pwForm.password_lama}
                                    onChange={e => setPwForm({ ...pwForm, password_lama: e.target.value })}
                                    style={styles.input}
                                    required
                                />
                            </div>
                            <div style={styles.inputGroup}>
                                <label style={styles.label}>Password Baru</label>
                                <input
                                    type="password"
                                    value={pwForm.password_baru}
                                    onChange={e => setPwForm({ ...pwForm, password_baru: e.target.value })}
                                    style={styles.input}
                                    required
                                    minLength={6}
                                />
                            </div>
                            <div style={styles.inputGroup}>
                                <label style={styles.label}>Konfirmasi Password Baru</label>
                                <input
                                    type="password"
                                    value={pwForm.password_baru_confirmation}
                                    onChange={e => setPwForm({ ...pwForm, password_baru_confirmation: e.target.value })}
                                    style={styles.input}
                                    required
                                />
                            </div>
                        </div>
                        <button type="submit" disabled={saving} style={styles.btnSaveAlt}>
                            <Save size={16} />
                            {saving ? "Menyimpan..." : "Ubah Password"}
                        </button>
                    </form>
                </div>
            </motion.div>
        </div>
    );
}

function InfoItem({ icon, label, value }) {
    return (
        <div style={styles.infoItem}>
            {icon && <span style={{ color: "#94a3b8" }}>{icon}</span>}
            <div>
                <div style={styles.infoLabel}>{label}</div>
                <div style={styles.infoValue}>{value || "-"}</div>
            </div>
        </div>
    );
}

const styles = {
    page: {
        minHeight: "100vh",
        background: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)",
        padding: 32,
        fontFamily: "'Inter', sans-serif"
    },
    center: { textAlign: "center", paddingTop: 100, color: "#64748b" },
    container: { maxWidth: 700, margin: "0 auto" },

    header: {
        display: "flex", alignItems: "center", gap: 20, marginBottom: 24,
        background: "white", padding: 24, borderRadius: 20,
        boxShadow: "0 10px 40px -10px rgba(0,0,0,0.1)"
    },
    avatar: {
        width: 80, height: 80, borderRadius: 20,
        background: "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)",
        display: "flex", alignItems: "center", justifyContent: "center"
    },
    name: { margin: 0, fontSize: 24, fontWeight: 800, color: "#0f172a" },
    role: {
        display: "inline-block", marginTop: 4, padding: "4px 12px",
        background: "#f1f5f9", borderRadius: 20, fontSize: 12, fontWeight: 600, color: "#475569"
    },

    alert: {
        padding: "12px 16px", borderRadius: 12, marginBottom: 16,
        display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 500
    },

    card: {
        background: "white", borderRadius: 20, padding: 24, marginBottom: 20,
        boxShadow: "0 4px 20px -5px rgba(0,0,0,0.08)"
    },
    cardTitle: {
        fontSize: 14, fontWeight: 700, color: "#334155", marginBottom: 16,
        display: "flex", alignItems: "center", gap: 8
    },
    viewOnlyBadge: {
        marginLeft: "auto", fontSize: 10, fontWeight: 600,
        background: "#f1f5f9", color: "#64748b", padding: "3px 8px", borderRadius: 6
    },
    editableBadge: {
        marginLeft: "auto", fontSize: 10, fontWeight: 600,
        background: "#dcfce7", color: "#166534", padding: "3px 8px", borderRadius: 6
    },

    infoGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 },
    infoItem: { display: "flex", alignItems: "flex-start", gap: 10 },
    infoLabel: { fontSize: 11, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em" },
    infoValue: { fontSize: 14, fontWeight: 600, color: "#1e293b" },

    form: { display: "flex", flexDirection: "column", gap: 16 },
    formGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 },
    inputGroup: { display: "flex", flexDirection: "column", gap: 6 },
    label: { fontSize: 12, fontWeight: 600, color: "#475569", display: "flex", alignItems: "center", gap: 6 },
    input: {
        padding: "12px 16px", borderRadius: 12, border: "1px solid #e2e8f0",
        fontSize: 14, outline: "none", transition: "border 0.2s", width: "100%", boxSizing: "border-box"
    },
    btnSave: {
        marginTop: 8, padding: "14px 24px", borderRadius: 12,
        background: "linear-gradient(135deg, #059669 0%, #047857 100%)",
        color: "white", border: "none", fontSize: 14, fontWeight: 600,
        cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8
    },
    btnSaveAlt: {
        marginTop: 8, padding: "14px 24px", borderRadius: 12,
        background: "linear-gradient(135deg, #0f172a 0%, #334155 100%)",
        color: "white", border: "none", fontSize: 14, fontWeight: 600,
        cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8
    }
};
