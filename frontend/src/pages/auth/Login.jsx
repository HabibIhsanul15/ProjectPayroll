import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../lib/api";
import { setAuth } from "../../lib/auth";
import { motion } from "framer-motion";
import { Lock, Mail, ArrowRight, ShieldCheck } from "lucide-react";

export default function Login() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errMsg, setErrMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setErrMsg("");
    setLoading(true);

    try {
      const res = await api.post("/login", { email, password });

      setAuth({
        token: res.data.token,
        peran: res.data.peran,
        user: res.data.user,
      });

      const role = res.data.peran;
      if (role === "HCGA") nav("/pegawai");
      else if (role === "FAT") nav("/fat/dashboard");
      else if (role === "DIREKTUR") nav("/direktur/dashboard");
      else if (role === "PEGAWAI") nav("/pegawai/dashboard");
      else nav("/");
    } catch (err) {
      setErrMsg(err?.response?.data?.message || "Login gagal, periksa email/password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.bgOverlay} />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        style={styles.card}
      >
        {/* LOGO AREA */}
        <div style={styles.logoArea}>
          <div style={styles.logoIcon}>
            <ShieldCheck size={32} color="#d97706" />
          </div>
          <h1 style={styles.appName}>PAYROLL<span style={{ color: "#3b82f6" }}>PRO</span></h1>
          <p style={styles.appDesc}>Sistem Penggajian Terintegrasi</p>
        </div>

        <form onSubmit={onSubmit} style={styles.form}>
          {errMsg && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              style={styles.errorBox}
            >
              {errMsg}
            </motion.div>
          )}

          <div style={styles.inputGroup}>
            <div style={styles.iconBox}><Mail size={18} color="#94a3b8" /></div>
            <input
              style={styles.input}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email Perusahaan"
              required
            />
          </div>

          <div style={styles.inputGroup}>
            <div style={styles.iconBox}><Lock size={18} color="#94a3b8" /></div>
            <input
              style={styles.input}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
            />
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            style={styles.submitBtn}
            disabled={loading}
          >
            {loading ? "Memuat..." : (
              <>
                Sign In <ArrowRight size={18} />
              </>
            )}
          </motion.button>
        </form>

        <div style={styles.footer}>
          © 2026 PT Human Plus Institute. All Rights Reserved.
        </div>
      </motion.div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    display: "flex", alignItems: "center", justifyContent: "center",
    background: "radial-gradient(circle at top right, #1e293b 0%, #0f172a 100%)",
    fontFamily: "'Inter', sans-serif",
    position: "relative",
    overflow: "hidden"
  },
  bgOverlay: {
    position: "absolute", top: -200, left: -200, width: 600, height: 600,
    background: "rgba(59, 130, 246, 0.15)", filter: "blur(100px)", borderRadius: "50%"
  },
  card: {
    width: "100%", maxWidth: 420,
    background: "rgba(255, 255, 255, 0.95)",
    backdropFilter: "blur(20px)",
    borderRadius: 24,
    padding: "40px 32px",
    boxShadow: "0 20px 50px -10px rgba(0,0,0,0.3)",
    zIndex: 10
  },
  logoArea: { textAlign: "center", marginBottom: 32 },
  logoIcon: {
    width: 64, height: 64, borderRadius: 16, background: "#fffbeb",
    display: "flex", alignItems: "center", justifyContent: "center",
    margin: "0 auto 16px auto",
    boxShadow: "0 10px 20px -5px rgba(217, 119, 6, 0.2)"
  },
  appName: { fontSize: 24, fontWeight: 900, color: "#0f172a", margin: 0, letterSpacing: "-0.5px" },
  appDesc: { fontSize: 13, color: "#64748b", marginTop: 4, letterSpacing: "0.5px" },

  form: { display: "flex", flexDirection: "column", gap: 20 },

  inputGroup: { position: "relative" },
  iconBox: { position: "absolute", top: 14, left: 16, zIndex: 2 },
  input: {
    width: "100%", padding: "14px 16px 14px 48px",
    borderRadius: 12, border: "1px solid #e2e8f0",
    fontSize: 14, fontWeight: 500, color: "#334155",
    background: "#f8fafc", outline: "none",
    transition: "all 0.2s"
  },

  errorBox: {
    background: "#fee2e2", color: "#b91c1c", fontSize: 13, padding: "10px 14px",
    borderRadius: 8, textAlign: "center", fontWeight: 500
  },

  submitBtn: {
    width: "100%", padding: "14px", borderRadius: 12,
    background: "linear-gradient(135deg, #0f172a 0%, #334155 100%)",
    color: "white", fontSize: 14, fontWeight: 700,
    border: "none", cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
    boxShadow: "0 10px 20px -5px rgba(15, 23, 42, 0.3)"
  },

  footer: { textAlign: "center", marginTop: 32, fontSize: 11, color: "#94a3b8" }
};
