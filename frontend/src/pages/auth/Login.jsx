import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PageContainer from "../../components/PageContainer";
import { api } from "../../lib/api";
import { setAuth } from "../../lib/auth";

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

      // patokan backend kamu:
      // { token, peran, user }
      setAuth({
        token: res.data.token,
        peran: res.data.peran,
        user: res.data.user,
      });

      // routing per role (sementara ke halaman yang ada)
      const role = res.data.peran;
      if (role === "HCGA") nav("/pegawai");
      else if (role === "FAT") nav("/");
      else if (role === "DIREKTUR") nav("/");
      else nav("/");
    } catch (err) {
      setErrMsg(err?.response?.data?.message || "Login gagal");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 520, margin: "40px auto" }}>
      <PageContainer title="Login">
        <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
          <label style={styles.label}>Email</label>
          <input
            style={styles.input}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@contoh.com"
          />

          <label style={styles.label}>Password</label>
          <input
            style={styles.input}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />

          {errMsg && <div style={styles.error}>{errMsg}</div>}

          <button style={styles.btn} disabled={loading}>
            {loading ? "Masuk..." : "Masuk"}
          </button>
        </form>
      </PageContainer>
    </div>
  );
}

const styles = {
  label: { fontSize: 13, color: "#374151", fontWeight: 600 },
  input: {
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid #e5e7eb",
    outline: "none",
  },
  btn: {
    marginTop: 8,
    padding: "10px 12px",
    borderRadius: 10,
    border: "none",
    cursor: "pointer",
    background: "#2563eb",
    color: "white",
    fontWeight: 700,
  },
  error: { color: "crimson", fontSize: 13 },
};
