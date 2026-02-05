import { useEffect, useMemo, useState } from "react";
import { api } from "../../lib/api";
import { motion, AnimatePresence } from "framer-motion";
import {
  User, Calendar, Briefcase, CreditCard,
  FileText, Activity, Save, X, ChevronDown, CheckCircle,
  Hash, Building2, Wallet, Mail
} from "lucide-react";

const PTKP_OPTIONS = ["TK0", "TK1", "TK2", "TK3", "K0", "K1", "K2", "K3"];
const STATUS_KERJA_OPTIONS = ["PERMANEN", "KONTRAK", "MAGANG", "PROBATION"];
const JENIS_PENGGAJIAN_OPTIONS = ["BULANAN", "PROYEK"];

export default function PegawaiForm({
  data,
  suggestedKode,
  onSuccess,
  onCancel,
}) {
  const isEdit = !!data;

  const initialKode = useMemo(
    () => data?.kode_pegawai || suggestedKode || "PG001",
    [data, suggestedKode]
  );

  const [form, setForm] = useState({
    kode_pegawai: initialKode,
    nama_lengkap: "",
    tanggal_masuk: "",
    status_kerja: "PERMANEN",
    jenis_penggajian: "BULANAN",
    nama_bank: "",
    nomor_rekening: "",
    npwp: "",
    status_ptkp: "TK0",
    aktif: true,
    create_account: false,
    email: "",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState("");

  const isMagang = String(form.status_kerja).toUpperCase() === "MAGANG";

  function set(name, val) {
    setForm((prev) => ({ ...prev, [name]: val }));
  }

  // ===============================
  // 🔥 ISI FORM SAAT MODE EDIT
  // ===============================
  useEffect(() => {
    if (data) {
      setForm({
        kode_pegawai: data.kode_pegawai,
        nama_lengkap: data.nama_lengkap || "",
        tanggal_masuk: data.tanggal_masuk || "",
        status_kerja: data.status_kerja || "PERMANEN",
        jenis_penggajian: data.jenis_penggajian || "BULANAN",
        nama_bank: data.nama_bank || "",
        nomor_rekening: data.nomor_rekening || "",
        npwp: data.npwp || "",
        status_ptkp: data.status_ptkp || "TK0",
        aktif: !!data.aktif,
      });
    }
  }, [data]);

  // aturan PTKP magang
  useEffect(() => {
    if (isMagang && form.status_ptkp !== "TK0") {
      set("status_ptkp", "TK0");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMagang]);

  async function submit(e) {
    e.preventDefault();
    setErrors({});
    setErrMsg("");
    setLoading(true);

    try {
      const payload = {
        ...form,
        aktif: form.aktif ? 1 : 0,
        status_ptkp: isMagang ? "TK0" : form.status_ptkp,
      };

      if (isEdit) {
        await api.put(`/pegawai/${data.id}`, payload);
      } else {
        // Jika perlu await delay biar animasi loading kelihatan
        // await new Promise(r => setTimeout(r, 800)); 
        await api.post("/pegawai", payload);
      }

      onSuccess?.();
    } catch (err) {
      if (err?.response?.status === 422) {
        setErrors(err.response.data.errors || {});
        setErrMsg(err.response.data.message || "Validasi gagal");
      } else {
        setErrMsg(err?.response?.data?.message || "Gagal menyimpan pegawai");
      }
    } finally {
      setLoading(false);
    }
  }

  // ---- ANIMATION VARIANTS ----
  const containerVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.4, ease: "easeOut", staggerChildren: 0.1 }
    },
    exit: { opacity: 0, scale: 0.95, transition: { duration: 0.3 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="form-container"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        style={modernStyles.glassContainer}
      >
        <form onSubmit={submit} style={{ display: "grid", gap: 24 }}>

          {/* HEADER SECTION */}
          <motion.div variants={itemVariants} style={modernStyles.header}>
            <div style={modernStyles.iconBox}>
              <User size={24} color="#3b82f6" />
            </div>
            <div>
              <h2 style={modernStyles.title}>
                {isEdit ? "Edit Data Pegawai" : "Tambah Pegawai Baru"}
              </h2>
              <p style={modernStyles.subtitle}>
                {isEdit ? "Perbarui informasi data diri pegawai" : "Lengkapi form data diri pegawai di bawah ini"}
              </p>
            </div>
          </motion.div>

          {/* MAIN FORM GRID */}
          <div style={modernStyles.formGrid}>

            {/* COLUMN 1: IDENTITAS */}
            <motion.div variants={itemVariants} style={modernStyles.col}>
              <div style={modernStyles.sectionLabel}>Identitas & Pekerjaan</div>

              {/* KODE PEGAWAI (READONLY) */}
              <div style={modernStyles.inputGroup}>
                <label style={modernStyles.label}>Kode Pegawai</label>
                <div style={modernStyles.inputWrapperDisabled}>
                  <Hash size={18} color="#94a3b8" />
                  <input
                    value={form.kode_pegawai}
                    readOnly
                    style={modernStyles.inputTransparent}
                  />
                  <span style={modernStyles.badge}>AUTO</span>
                </div>
              </div>

              {/* NAMA LENGKAP */}
              <div style={modernStyles.inputGroup}>
                <label style={modernStyles.label}>Nama Lengkap</label>
                <div style={errors.nama_lengkap?.[0] ? modernStyles.inputWrapperError : modernStyles.inputWrapper}>
                  <User size={18} color="#64748b" />
                  <input
                    value={form.nama_lengkap}
                    onChange={(e) => set("nama_lengkap", e.target.value)}
                    placeholder="Contoh: Budi Santoso"
                    style={modernStyles.inputTransparent}
                  />
                </div>
                {errors.nama_lengkap?.[0] && <div style={modernStyles.errorText}>{errors.nama_lengkap[0]}</div>}
              </div>

              {/* TANGGAL MASUK */}
              <div style={modernStyles.inputGroup}>
                <label style={modernStyles.label}>Tanggal Masuk</label>
                <div style={modernStyles.inputWrapper}>
                  <Calendar size={18} color="#64748b" />
                  <input
                    type="date"
                    value={form.tanggal_masuk}
                    onChange={(e) => set("tanggal_masuk", e.target.value)}
                    style={modernStyles.inputTransparent}
                  />
                </div>
              </div>

              {/* GRID 2: Status & Jenis */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div style={modernStyles.inputGroup}>
                  <label style={modernStyles.label}>Status Kerja</label>
                  <div style={modernStyles.inputWrapper}>
                    <Briefcase size={18} color="#64748b" />
                    <select
                      value={form.status_kerja}
                      onChange={(e) => set("status_kerja", e.target.value)}
                      style={modernStyles.selectTransparent}
                    >
                      {STATUS_KERJA_OPTIONS.map((x) => (
                        <option key={x} value={x}>{x}</option>
                      ))}
                    </select>
                    <ChevronDown size={16} color="#64748b" style={{ position: 'absolute', right: 10, pointerEvents: 'none' }} />
                  </div>
                </div>

                <div style={modernStyles.inputGroup}>
                  <label style={modernStyles.label}>Penggajian</label>
                  <div style={modernStyles.inputWrapper}>
                    <Building2 size={18} color="#64748b" />
                    <select
                      value={form.jenis_penggajian}
                      onChange={(e) => set("jenis_penggajian", e.target.value)}
                      style={modernStyles.selectTransparent}
                    >
                      {JENIS_PENGGAJIAN_OPTIONS.map((x) => (
                        <option key={x} value={x}>{x}</option>
                      ))}
                    </select>
                    <ChevronDown size={16} color="#64748b" style={{ position: 'absolute', right: 10, pointerEvents: 'none' }} />
                  </div>
                </div>
              </div>

            </motion.div>

            {/* COLUMN 2: FINANCIAL & PAJAK */}
            <motion.div variants={itemVariants} style={modernStyles.col}>
              <div style={modernStyles.sectionLabel}>Finansial & Pajak</div>

              {/* NPWP & PTKP */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div style={modernStyles.inputGroup}>
                  <label style={modernStyles.label}>Status PTKP</label>
                  <div style={isMagang ? modernStyles.inputWrapperDisabled : modernStyles.inputWrapper}>
                    <Activity size={18} color="#64748b" />
                    <select
                      value={form.status_ptkp}
                      disabled={isMagang}
                      onChange={(e) => set("status_ptkp", e.target.value)}
                      style={modernStyles.selectTransparent}
                    >
                      {PTKP_OPTIONS.map((x) => (
                        <option key={x} value={x}>{x}</option>
                      ))}
                    </select>
                    <ChevronDown size={16} color="#64748b" style={{ position: 'absolute', right: 10, pointerEvents: 'none' }} />
                  </div>
                </div>

                <div style={modernStyles.inputGroup}>
                  <label style={modernStyles.label}>NPWP</label>
                  <div style={modernStyles.inputWrapper}>
                    <FileText size={18} color="#64748b" />
                    <input
                      value={form.npwp}
                      onChange={(e) => set("npwp", e.target.value)}
                      placeholder="XX.XXX.XXX..."
                      style={modernStyles.inputTransparent}
                    />
                  </div>
                </div>
              </div>

              {/* BANK */}
              <div style={modernStyles.inputGroup}>
                <label style={modernStyles.label}>Nama Bank</label>
                <div style={modernStyles.inputWrapper}>
                  <Building2 size={18} color="#64748b" />
                  <input
                    value={form.nama_bank}
                    onChange={(e) => set("nama_bank", e.target.value)}
                    placeholder="Contoh: BCA / Mandiri"
                    style={modernStyles.inputTransparent}
                  />
                </div>
              </div>

              {/* REKENING */}
              <div style={modernStyles.inputGroup}>
                <label style={modernStyles.label}>Nomor Rekening</label>
                <div style={modernStyles.inputWrapper}>
                  <Wallet size={18} color="#64748b" />
                  <input
                    value={form.nomor_rekening}
                    onChange={(e) => set("nomor_rekening", e.target.value)}
                    placeholder="1234xxxxxx"
                    style={modernStyles.inputTransparent}
                  />
                </div>
              </div>

              {/* ===== AKUN LOGIN (APPS) ===== */}
              {!isEdit && (
                <div style={{
                  background: "#f8fafc",
                  borderRadius: 16,
                  padding: 16,
                  border: "1px solid #eef2f7"
                }}>
                  <div style={modernStyles.sectionLabel}>AKUN LOGIN (APPS)</div>

                  <motion.label
                    style={form.create_account ? modernStyles.activeSwitch : modernStyles.inactiveSwitch}
                    whileTap={{ scale: 0.98 }}
                  >
                    <input
                      type="checkbox"
                      checked={!!form.create_account}
                      onChange={(e) => set("create_account", e.target.checked)}
                      style={{ display: 'none' }}
                    />
                    <div style={modernStyles.switchDisplay}>
                      <User size={20} color={form.create_account ? "#fff" : "#94a3b8"} />
                      <span>{form.create_account ? "Buatkan Akun Login" : "Tidak Perlu Akun Login"}</span>
                    </div>
                  </motion.label>

                  <AnimatePresence>
                    {form.create_account && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        style={{ overflow: 'hidden', marginTop: 16 }}
                      >
                        <div style={modernStyles.inputGroup}>
                          <label style={modernStyles.label}>Email Login</label>
                          <div style={errors.email?.[0] ? modernStyles.inputWrapperError : modernStyles.inputWrapper}>
                            <Mail size={18} color="#64748b" />
                            <input
                              type="email"
                              value={form.email}
                              onChange={(e) => set("email", e.target.value)}
                              placeholder="pegawai@company.com"
                              style={modernStyles.inputTransparent}
                            />
                          </div>
                          <div style={{ fontSize: 11, color: "#64748b", marginTop: 4, fontWeight: 500 }}>
                            Password default: <span style={{ color: "#2563eb", fontFamily: "monospace" }}>password123</span>
                          </div>
                          {errors.email?.[0] && <div style={modernStyles.errorText}>{errors.email[0]}</div>}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* AKTIF CHECKBOX */}
              <motion.label
                style={form.aktif ? modernStyles.activeSwitch : modernStyles.inactiveSwitch}
                whileTap={{ scale: 0.98 }}
              >
                <input
                  type="checkbox"
                  checked={!!form.aktif}
                  onChange={(e) => set("aktif", e.target.checked)}
                  style={{ display: 'none' }}
                />
                <div style={modernStyles.switchDisplay}>
                  <CheckCircle size={20} color={form.aktif ? "#fff" : "#94a3b8"} />
                  <span>{form.aktif ? "Status Pegawai: AKTIF" : "Status Pegawai: TIDAK AKTIF"}</span>
                </div>
              </motion.label>

            </motion.div>
          </div>

          {/* ERROR MESSAGE */}
          <AnimatePresence>
            {errMsg && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                style={modernStyles.errBox}
              >
                <Activity size={20} />
                {errMsg}
              </motion.div>
            )}
          </AnimatePresence>

          {/* ACTIONS */}
          <motion.div variants={itemVariants} style={modernStyles.actions}>
            <motion.button
              type="button"
              onClick={onCancel}
              style={modernStyles.btnGhost}
              whileHover={{ scale: 1.02, backgroundColor: "#f1f5f9" }}
              whileTap={{ scale: 0.98 }}
            >
              <X size={18} />
              Batal
            </motion.button>

            <motion.button
              type="submit"
              disabled={loading}
              style={loading ? modernStyles.btnDisabled : modernStyles.btnPrimary}
              whileHover={!loading ? { scale: 1.02, boxShadow: "0 10px 15px -3px rgba(37, 99, 235, 0.3)" } : {}}
              whileTap={!loading ? { scale: 0.98 } : {}}
            >
              {loading ? (
                <span className="animate-spin">⏳</span>
              ) : (
                <Save size={18} />
              )}
              {loading ? "Menyimpan..." : isEdit ? "Simpan Perubahan" : "Simpan Data Baru"}
            </motion.button>
          </motion.div>

        </form>
      </motion.div>
    </AnimatePresence>
  );
}

/* ================= MODERN STYLES (Futuristic/Glassy) ================= */
const modernStyles = {
  glassContainer: {
    background: "rgba(255, 255, 255, 0.85)", // Milky glass
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    borderRadius: "24px",
    border: "1px solid rgba(255, 255, 255, 0.5)",
    boxShadow: "0 20px 50px -12px rgba(0, 0, 0, 0.1)",
    padding: "32px",
    maxWidth: "850px",
    margin: "0 auto",
    fontFamily: "'Inter', sans-serif",
    color: "#1e293b"
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    marginBottom: "16px",
    borderBottom: "1px solid rgba(0,0,0,0.05)",
    paddingBottom: "20px"
  },
  iconBox: {
    width: "48px",
    height: "48px",
    borderRadius: "14px",
    background: "linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#0284c7"
  },
  title: {
    margin: 0,
    fontSize: "20px",
    fontWeight: "700",
    background: "linear-gradient(to right, #1e293b, #475569)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  subtitle: {
    margin: 0,
    fontSize: "14px",
    color: "#64748b",
    marginTop: "4px"
  },
  sectionLabel: {
    fontSize: "12px",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    color: "#94a3b8",
    marginBottom: "16px"
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
    gap: "32px"
  },
  col: {
    display: "flex",
    flexDirection: "column",
    gap: "20px"
  },
  inputGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "8px"
  },
  label: {
    fontSize: "13px",
    fontWeight: "600",
    color: "#475569",
    marginLeft: "4px"
  },
  inputWrapper: {
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    padding: "0 12px",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    height: "46px",
    transition: "all 0.2s ease",
    position: 'relative'
  },
  inputWrapperError: {
    background: "#fff1f2",
    border: "1px solid #fda4af",
    borderRadius: "12px",
    padding: "0 12px",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    height: "46px",
  },
  inputWrapperDisabled: {
    background: "#f1f5f9",
    border: "1px solid #cbd5e1",
    borderRadius: "12px",
    padding: "0 12px",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    height: "46px",
    color: "#94a3b8"
  },
  inputTransparent: {
    border: "none",
    background: "transparent",
    outline: "none",
    width: "100%",
    fontSize: "14px",
    fontWeight: "500",
    color: "#334155",
    height: "100%"
  },
  selectTransparent: {
    border: "none",
    background: "transparent",
    outline: "none",
    width: "100%",
    fontSize: "14px",
    fontWeight: "500",
    color: "#334155",
    appearance: "none",
    cursor: "pointer",
    height: "100%",
    zIndex: 2
  },
  errorText: {
    fontSize: "12px",
    color: "#e11d48",
    marginLeft: "4px",
    fontWeight: "600"
  },
  badge: {
    fontSize: "11px",
    fontWeight: "700",
    background: "#cbd5e1",
    color: "#64748b",
    padding: "2px 6px",
    borderRadius: "6px"
  },
  activeSwitch: {
    background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
    padding: "12px",
    borderRadius: "14px",
    cursor: "pointer",
    color: "white",
    boxShadow: "0 10px 15px -3px rgba(16, 185, 129, 0.2)",
    transition: "all 0.3s ease"
  },
  inactiveSwitch: {
    background: "#f1f5f9",
    padding: "12px",
    borderRadius: "14px",
    cursor: "pointer",
    color: "#94a3b8",
    border: "1px solid #e2e8f0",
    transition: "all 0.3s ease"
  },
  switchDisplay: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    fontWeight: "600",
    fontSize: "14px"
  },
  errBox: {
    background: "#fee2e2",
    border: "1px solid #fecaca",
    color: "#b91c1c",
    padding: "14px",
    borderRadius: "12px",
    fontSize: "14px",
    fontWeight: "600",
    display: "flex",
    alignItems: "center",
    gap: "10px"
  },
  actions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "16px",
    marginTop: "16px",
    paddingTop: "24px",
    borderTop: "1px solid rgba(0,0,0,0.05)"
  },
  btnGhost: {
    padding: "12px 24px",
    borderRadius: "12px",
    background: "white",
    border: "1px solid #e2e8f0",
    color: "#64748b",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "8px"
  },
  btnPrimary: {
    padding: "12px 28px",
    borderRadius: "12px",
    background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
    border: "none",
    color: "white",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    boxShadow: "0 4px 6px -1px rgba(37, 99, 235, 0.2)"
  },
  btnDisabled: {
    padding: "12px 28px",
    borderRadius: "12px",
    background: "#94a3b8",
    border: "none",
    color: "white",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "not-allowed",
    display: "flex",
    alignItems: "center",
    gap: "8px"
  }
};
