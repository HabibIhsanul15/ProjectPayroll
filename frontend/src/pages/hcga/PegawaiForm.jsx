import { useEffect, useMemo, useState } from "react";
import { api } from "../../lib/api";
import { Input } from "../../components/ui/Input";

const PTKP_OPTIONS = ["TK0", "TK1", "TK2", "TK3", "K0", "K1", "K2", "K3"];
const STATUS_KERJA_OPTIONS = ["PERMANEN", "KONTRAK", "MAGANG", "PROBATION"];
const JENIS_PENGGAJIAN_OPTIONS = ["BULANAN", "PROYEK"];

export default function PegawaiForm({ suggestedKode, onSuccess, onCancel }) {
  const initialKode = useMemo(() => suggestedKode || "PG001", [suggestedKode]);

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
  });

  const isMagang = String(form.status_kerja).toUpperCase() === "MAGANG";

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState("");

  function set(name, val) {
    setForm((prev) => ({ ...prev, [name]: val }));
  }

  // ✅ aturan enterprise sederhana:
  // kalau MAGANG -> PTKP disable & diset TK0 (atau bisa null kalau backend kamu izinkan)
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
      await api.post("/pegawai", {
        ...form,
        aktif: form.aktif ? 1 : 0,
        // kalau magang, kita paksa TK0 (biar aman validasi backend)
        status_ptkp: isMagang ? "TK0" : form.status_ptkp,
      });
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

  return (
    <form onSubmit={submit} style={{ display: "grid", gap: 12 }}>
      {/* ===== SECTION: DATA UTAMA ===== */}
      <div style={styles.section}>
        <div style={styles.sectionHead}>
          <div>
            <div style={styles.sectionTitle}>Data Utama</div>
            <div style={styles.sectionDesc}>
              Informasi dasar pegawai untuk kebutuhan administrasi.
            </div>
          </div>
        </div>

        <div style={styles.grid2}>
          <div>
            <label style={styles.label}>Kode Pegawai (Auto)</label>
            <input
              value={form.kode_pegawai}
              readOnly
              style={{ ...styles.input, background: "#f8fafc" }}
            />
            <div style={styles.hint}>
              Saat ini di-generate dari data terakhir. Versi enterprise: generate di backend.
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "flex-end" }}>
            <button
              type="button"
              style={styles.btnGhost}
              onClick={() => set("kode_pegawai", initialKode)}
            >
              Reset Kode
            </button>
          </div>
        </div>

        <Input
          label="Nama Lengkap"
          value={form.nama_lengkap}
          onChange={(e) => set("nama_lengkap", e.target.value)}
          error={errors.nama_lengkap?.[0]}
        />

        <div style={styles.grid2}>
          <div>
            <label style={styles.label}>Tanggal Masuk</label>
            <input
              type="date"
              value={form.tanggal_masuk}
              onChange={(e) => set("tanggal_masuk", e.target.value)}
              style={styles.input}
            />
            {errors.tanggal_masuk?.[0] && <div style={styles.error}>{errors.tanggal_masuk[0]}</div>}
          </div>

          <div>
            <label style={styles.label}>Status Kerja</label>
            <select
              value={form.status_kerja}
              onChange={(e) => set("status_kerja", e.target.value)}
              style={styles.input}
            >
              {STATUS_KERJA_OPTIONS.map((x) => (
                <option key={x} value={x}>
                  {x}
                </option>
              ))}
            </select>
            {errors.status_kerja?.[0] && <div style={styles.error}>{errors.status_kerja[0]}</div>}
          </div>
        </div>

        <div style={styles.grid2}>
          <div>
            <label style={styles.label}>Jenis Penggajian</label>
            <select
              value={form.jenis_penggajian}
              onChange={(e) => set("jenis_penggajian", e.target.value)}
              style={styles.input}
            >
              {JENIS_PENGGAJIAN_OPTIONS.map((x) => (
                <option key={x} value={x}>
                  {x}
                </option>
              ))}
            </select>
            {errors.jenis_penggajian?.[0] && (
              <div style={styles.error}>{errors.jenis_penggajian[0]}</div>
            )}
          </div>

          {/* spacer biar grid tetep rapi */}
          <div />
        </div>
      </div>

      {/* ===== SECTION: PAJAK & PEMBAYARAN ===== */}
      <div style={styles.section}>
        <div style={styles.sectionHead}>
          <div>
            <div style={styles.sectionTitle}>Pajak & Pembayaran</div>
            <div style={styles.sectionDesc}>
              PTKP hanya relevan untuk pegawai non-magang. Data rekening opsional.
            </div>
          </div>

          {isMagang && <span style={styles.badgeInfo}>MAGANG • PTKP nonaktif</span>}
        </div>

        <div style={styles.grid2}>
          <div>
            <label style={styles.label}>PTKP</label>
            <select
              value={form.status_ptkp}
              onChange={(e) => set("status_ptkp", e.target.value)}
              style={{
                ...styles.input,
                background: isMagang ? "#f8fafc" : "white",
                cursor: isMagang ? "not-allowed" : "pointer",
              }}
              disabled={isMagang}
            >
              {PTKP_OPTIONS.map((x) => (
                <option key={x} value={x}>
                  {x}
                </option>
              ))}
            </select>

            {isMagang ? (
              <div style={styles.hint}>Pegawai magang umumnya tidak dikenakan PPh21, jadi PTKP dinonaktifkan.</div>
            ) : (
              errors.status_ptkp?.[0] && <div style={styles.error}>{errors.status_ptkp[0]}</div>
            )}
          </div>

          <Input
            label="NPWP (opsional)"
            value={form.npwp}
            onChange={(e) => set("npwp", e.target.value)}
            error={errors.npwp?.[0]}
          />
        </div>

        <div style={styles.grid2}>
          <Input
            label="Nama Bank (opsional)"
            value={form.nama_bank}
            onChange={(e) => set("nama_bank", e.target.value)}
            error={errors.nama_bank?.[0]}
          />
          <Input
            label="Nomor Rekening (opsional)"
            value={form.nomor_rekening}
            onChange={(e) => set("nomor_rekening", e.target.value)}
            error={errors.nomor_rekening?.[0]}
          />
        </div>

        <div style={styles.switchRow}>
          <label style={styles.switchLabel}>
            <input
              type="checkbox"
              checked={!!form.aktif}
              onChange={(e) => set("aktif", e.target.checked)}
            />
            <span style={{ fontWeight: 800 }}>Aktif</span>
          </label>
          {errors.aktif?.[0] && <div style={styles.error}>{errors.aktif[0]}</div>}
        </div>
      </div>

      {errMsg && <div style={styles.errBox}>{errMsg}</div>}

      <div style={styles.actions}>
        <button type="button" style={styles.btnGhost} onClick={onCancel}>
          Batal
        </button>
        <button type="submit" style={styles.btnPrimary} disabled={loading}>
          {loading ? "Menyimpan..." : "Simpan"}
        </button>
      </div>
    </form>
  );
}

const styles = {
  grid2: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 12,
  },
  label: {
    fontSize: 13,
    fontWeight: 800,
    marginBottom: 6,
    display: "block",
    color: "#0f172a",
  },
  input: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid #e5e7eb",
    outline: "none",
    fontFamily: "Inter",
  },
  hint: { fontSize: 12, color: "#64748b", marginTop: 6, lineHeight: 1.4 },
  error: { color: "#dc2626", fontSize: 12, marginTop: 6 },
  errBox: {
    marginTop: 2,
    padding: "10px 12px",
    borderRadius: 12,
    background: "#fff1f2",
    border: "1px solid #fecdd3",
    color: "#9f1239",
    fontSize: 13,
    fontWeight: 700,
  },
  switchRow: { marginTop: 6, display: "flex", justifyContent: "space-between", gap: 12 },
  switchLabel: { display: "flex", alignItems: "center", gap: 10, cursor: "pointer" },

  actions: { marginTop: 2, display: "flex", justifyContent: "flex-end", gap: 10 },

  btnPrimary: {
    padding: "10px 14px",
    borderRadius: 12,
    border: "none",
    cursor: "pointer",
    background: "#2563eb",
    color: "white",
    fontWeight: 900,
    fontFamily: "Inter",
    boxShadow: "0 10px 30px rgba(37,99,235,.20)",
  },
  btnGhost: {
    padding: "10px 14px",
    borderRadius: 12,
    border: "1px solid #e5e7eb",
    background: "white",
    cursor: "pointer",
    fontWeight: 800,
    fontFamily: "Inter",
  },

  section: {
    border: "1px solid #eef2f7",
    borderRadius: 16,
    padding: 14,
    background:
      "linear-gradient(180deg, rgba(248,250,252,1) 0%, rgba(255,255,255,1) 80%)",
  },
  sectionHead: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 13.5, fontWeight: 900, color: "#0f172a" },
  sectionDesc: { fontSize: 12.5, color: "#64748b", marginTop: 2 },

  badgeInfo: {
    fontSize: 12,
    fontWeight: 900,
    color: "#1d4ed8",
    background: "#eff6ff",
    border: "1px solid #dbeafe",
    padding: "6px 10px",
    borderRadius: 999,
    whiteSpace: "nowrap",
  },
};
