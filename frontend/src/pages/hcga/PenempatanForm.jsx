import { useEffect, useMemo, useState } from "react";
import { createPenempatan, listJabatan } from "../../lib/penempatanApi";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2, Calendar, DollarSign, FileText,
  Briefcase, Save, X, Activity, TrendingUp, AlertCircle
} from "lucide-react";

const JENIS_PERUBAHAN_OPTIONS = [
  "MASUK",
  "PROMOSI",
  "MUTASI",
  "DEMOSI",
  "PENYESUAIAN",
];

function pickArray(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
}

function formatRupiahInput(v) {
  return v;
}

function formatRupiahHint(v) {
  if (v === "" || v === null || v === undefined) return "-";
  const n = Number(String(v).replace(/[^\d.]/g, ""));
  if (Number.isNaN(n)) return "-";
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);
}

export default function PenempatanForm({ pegawai, onSuccess, onCancel }) {
  const [jabatanList, setJabatanList] = useState([]);
  const [loadingJabatan, setLoadingJabatan] = useState(true);

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [errMsg, setErrMsg] = useState("");

  const [form, setForm] = useState({
    jabatan_id: "",
    berlaku_mulai: "",
    gaji_pokok: "",
    jenis_perubahan: "MASUK",
    catatan: "",
  });

  const selectedJabatan = useMemo(() => {
    const id = Number(form.jabatan_id);
    if (!id) return null;
    return jabatanList.find((j) => Number(j.id) === id) || null;
  }, [form.jabatan_id, jabatanList]);

  const golMin = selectedJabatan?.golongan?.gaji_pokok_min ?? selectedJabatan?.gaji_pokok_min ?? null;
  const golMax = selectedJabatan?.golongan?.gaji_pokok_maks ?? selectedJabatan?.gaji_pokok_maks ?? null;

  useEffect(() => {
    (async () => {
      setLoadingJabatan(true);
      setErrMsg("");
      try {
        const data = await listJabatan();
        const arr = pickArray(data);
        setJabatanList(arr);

        if (!form.jabatan_id && arr.length) {
          setForm((p) => ({ ...p, jabatan_id: String(arr[0].id) }));
        }
      } catch (e) {
        setErrMsg("Gagal mengambil data jabatan");
      } finally {
        setLoadingJabatan(false);
      }
    })();
  }, []);

  function set(name, val) {
    setForm((p) => ({ ...p, [name]: val }));
  }

  async function submit(e) {
    e.preventDefault();
    setErrors({});
    setErrMsg("");
    setLoading(true);

    try {
      await createPenempatan(pegawai.id, {
        jabatan_id: Number(form.jabatan_id),
        berlaku_mulai: form.berlaku_mulai,
        gaji_pokok: Number(String(form.gaji_pokok).replace(/[^\d.]/g, "")),
        jenis_perubahan: form.jenis_perubahan,
        catatan: form.catatan?.trim() ? form.catatan.trim() : null,
      });

      onSuccess?.();
    } catch (err) {
      const status = err?.response?.status;
      if (status === 422) {
        setErrors(err.response.data.errors || {});
        setErrMsg(err.response.data.message || "Validasi gagal");
      } else {
        setErrMsg(err?.response?.data?.message || "Gagal menyimpan penempatan");
      }
    } finally {
      setLoading(false);
    }
  }

  // --- ANIMATION ---
  const fadeIn = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={fadeIn}
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      <form onSubmit={submit} style={{ display: 'grid', gap: 24 }}>

        {/* HEADER: PEGAWAI INFO */}
        <div style={styles.infoBox}>
          <div style={styles.avatar}>
            {(pegawai?.nama_lengkap || "P")[0].toUpperCase()}
          </div>
          <div>
            <div style={styles.infoTitle}>{pegawai?.nama_lengkap || pegawai?.name || "-"}</div>
            <div style={styles.infoSub}>
              Kode: {pegawai?.kode_pegawai} • Status: {pegawai?.status_kerja}
            </div>
          </div>
        </div>

        <div style={styles.formSection}>
          <h3 style={styles.sectionHeading}>Detail Kontrak & Jabatan</h3>

          {/* ROW 1: Jabatan & Tanggal */}
          <div style={styles.grid2}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Jabatan</label>
              <div style={styles.inputWrapper}>
                <Building2 size={18} color="#64748b" />
                <select
                  value={form.jabatan_id}
                  onChange={(e) => set("jabatan_id", e.target.value)}
                  style={styles.select}
                  disabled={loadingJabatan}
                >
                  {jabatanList.map((j) => (
                    <option key={j.id} value={j.id}>
                      {j.nama_jabatan || j.nama || `Jabatan #${j.id}`}
                    </option>
                  ))}
                </select>
              </div>
              {loadingJabatan && <div style={styles.hint}>Memuat jabatan...</div>}
              {errors.jabatan_id?.[0] && <div style={styles.error}>{errors.jabatan_id[0]}</div>}
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Tanggal Mulai Berlaku</label>
              <div style={styles.inputWrapper}>
                <Calendar size={18} color="#64748b" />
                <input
                  type="date"
                  value={form.berlaku_mulai}
                  onChange={(e) => set("berlaku_mulai", e.target.value)}
                  style={styles.input}
                />
              </div>
              {errors.berlaku_mulai?.[0] && <div style={styles.error}>{errors.berlaku_mulai[0]}</div>}
            </div>
          </div>

          {/* ROW 2: Jenis & Gaji */}
          <div style={styles.grid2}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Jenis Perubahan</label>
              <div style={styles.inputWrapper}>
                <TrendingUp size={18} color="#64748b" />
                <select
                  value={form.jenis_perubahan}
                  onChange={(e) => set("jenis_perubahan", e.target.value)}
                  style={styles.select}
                >
                  {JENIS_PERUBAHAN_OPTIONS.map((x) => (
                    <option key={x} value={x}>{x}</option>
                  ))}
                </select>
              </div>
              {errors.jenis_perubahan?.[0] && <div style={styles.error}>{errors.jenis_perubahan[0]}</div>}
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Gaji Pokok (Base Salary)</label>
              <div style={styles.inputWrapper}>
                <span style={{ fontSize: 14, fontWeight: 700, color: "#64748b" }}>Rp</span>
                <input
                  type="number"
                  min={0}
                  value={formatRupiahInput(form.gaji_pokok)}
                  onChange={(e) => set("gaji_pokok", e.target.value)}
                  style={styles.input}
                  placeholder="0"
                />
              </div>

              {/* SALARY RANGE HINT */}
              <div style={styles.hintBox}>
                <div style={styles.hintRow}>
                  <span>Input:</span>
                  <b>{formatRupiahHint(form.gaji_pokok)}</b>
                </div>
                {(golMin !== null || golMax !== null) && (
                  <div style={styles.hintRow}>
                    <span>Range Golongan:</span>
                    <span style={{ color: "#059669" }}>
                      {golMin !== null ? formatRupiahHint(golMin) : "-"} — {golMax !== null ? formatRupiahHint(golMax) : "-"}
                    </span>
                  </div>
                )}
              </div>
              {errors.gaji_pokok?.[0] && <div style={styles.error}>{errors.gaji_pokok[0]}</div>}
            </div>
          </div>

          {/* NOTES */}
          <div style={styles.inputGroup}>
            <label style={styles.label}>Catatan (Opsional)</label>
            <div style={{ ...styles.inputWrapper, alignItems: 'flex-start', padding: "10px 12px" }}>
              <FileText size={18} color="#64748b" style={{ marginTop: 2 }} />
              <textarea
                value={form.catatan}
                onChange={(e) => set("catatan", e.target.value)}
                rows={3}
                style={styles.textarea}
                placeholder="Contoh: Promosi tahunan, penyesuaian UMR, dll."
              />
            </div>
          </div>
        </div>

        {/* ERROR BOX */}
        <AnimatePresence>
          {errMsg && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              style={styles.errBox}
            >
              <AlertCircle size={20} />
              {errMsg}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ACTIONS */}
        <div style={styles.actions}>
          <motion.button
            type="button"
            style={styles.btnGhost}
            onClick={onCancel}
            whileHover={{ backgroundColor: "#f1f5f9" }}
            whileTap={{ scale: 0.98 }}
          >
            <X size={18} />
            Batal
          </motion.button>

          <motion.button
            type="submit"
            style={loading ? styles.btnDisabled : styles.btnPrimary}
            disabled={loading || loadingJabatan}
            whileHover={!loading ? { scale: 1.02, boxShadow: "0 4px 12px rgba(37, 99, 235, 0.2)" } : {}}
            whileTap={!loading ? { scale: 0.98 } : {}}
          >
            {loading ? "Menyimpan..." : (
              <>
                <Save size={18} />
                Simpan Penempatan
              </>
            )}
          </motion.button>
        </div>

      </form>
    </motion.div>
  );
}

const styles = {
  // INFO BOX
  infoBox: {
    padding: 16,
    borderRadius: 16,
    background: "linear-gradient(135deg, #eff6ff 0%, #f8fafc 100%)",
    border: "1px solid #dbeafe",
    display: "flex",
    gap: 16,
    alignItems: "center"
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 14,
    background: "#3b82f6",
    color: "white",
    fontSize: 20,
    fontWeight: 700,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 4px 6px -1px rgba(59, 130, 246, 0.3)"
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 700,
    color: "#1e293b"
  },
  infoSub: {
    fontSize: 13,
    color: "#64748b",
    marginTop: 2,
    fontWeight: 500
  },

  // FORM SECTION
  formSection: {
    display: "flex",
    flexDirection: "column",
    gap: 20
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: 700,
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    borderBottom: "1px solid #f1f5f9",
    paddingBottom: 8,
    marginBottom: 4
  },
  grid2: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 20
  },
  inputGroup: {
    display: "flex",
    flexDirection: "column",
    gap: 8
  },
  label: {
    fontSize: 13,
    fontWeight: 600,
    color: "#475569",
    marginLeft: 4
  },
  inputWrapper: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "0 12px",
    background: "white",
    border: "1px solid #e2e8f0",
    borderRadius: 12,
    height: 46,
    transition: "all 0.2s"
  },
  icon: {
    color: "#64748b"
  },
  input: {
    border: "none",
    outline: "none",
    width: "100%",
    fontSize: 14,
    color: "#334155",
    fontWeight: 500
  },
  select: {
    border: "none",
    outline: "none",
    width: "100%",
    fontSize: 14,
    color: "#334155",
    fontWeight: 500,
    background: "transparent",
    cursor: "pointer"
  },
  textarea: {
    border: "none",
    outline: "none",
    width: "100%",
    fontSize: 14,
    color: "#334155",
    resize: "none",
    fontFamily: "'Inter', sans-serif"
  },

  // HINTS
  hintBox: {
    background: "#f8fafc",
    borderRadius: 8,
    padding: "8px 12px",
    border: "1px solid #f1f5f9",
    fontSize: 12,
    color: "#64748b",
    display: "flex",
    flexDirection: "column",
    gap: 4
  },
  hintRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },
  error: {
    color: "#e11d48",
    fontSize: 12,
    fontWeight: 600,
    marginLeft: 4
  },
  errBox: {
    background: "#fee2e2",
    border: "1px solid #fecaca",
    color: "#b91c1c",
    padding: "12px 16px",
    borderRadius: 12,
    display: "flex",
    alignItems: "center",
    gap: 10,
    fontSize: 13,
    fontWeight: 600
  },

  // ACTONS
  actions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: 12,
    paddingTop: 12,
    borderTop: "1px solid #f1f5f9",
    marginTop: 8
  },
  btnGhost: {
    padding: "10px 18px",
    borderRadius: 12,
    border: "1px solid #e2e8f0",
    background: "white",
    color: "#64748b",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: 8
  },
  btnPrimary: {
    padding: "10px 24px",
    borderRadius: 12,
    border: "none",
    background: "#2563eb",
    color: "white",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: 8,
    boxShadow: "0 4px 6px -1px rgba(37, 99, 235, 0.2)"
  },
  btnDisabled: {
    padding: "10px 24px",
    borderRadius: 12,
    border: "none",
    background: "#94a3b8",
    color: "white",
    fontSize: 14,
    fontWeight: 600,
    cursor: "not-allowed",
    display: "flex",
    alignItems: "center",
    gap: 8
  }
};
