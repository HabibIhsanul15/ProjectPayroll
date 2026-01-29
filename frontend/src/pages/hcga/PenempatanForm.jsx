// frontend/src/pages/hcga/PenempatanForm.jsx
import { useEffect, useMemo, useState } from "react";
import { createPenempatan, listJabatan } from "../../lib/penempatanApi";

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
  // tampilkan angka biasa, tapi kita bantu hint rupiah di bawah
  return v;
}

function formatRupiahHint(v) {
  if (v === "" || v === null || v === undefined) return "-";
  const n = Number(String(v).replace(/[^\d.]/g, ""));
  if (Number.isNaN(n)) return "-";
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(n);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  return (
    <form onSubmit={submit}>
      <div style={styles.info}>
        <div style={styles.infoTitle}>{pegawai?.nama_lengkap || pegawai?.name || "-"}</div>
        <div style={styles.infoSub}>
          Isi jabatan, tanggal mulai, jenis perubahan, dan gaji pokok.
        </div>
      </div>

      {/* ROW 1 */}
      <div style={styles.grid2}>
        <div>
          <label style={styles.label}>Jabatan</label>
          <select
            value={form.jabatan_id}
            onChange={(e) => set("jabatan_id", e.target.value)}
            style={styles.input}
            disabled={loadingJabatan}
          >
            {jabatanList.map((j) => (
              <option key={j.id} value={j.id}>
                {j.nama_jabatan || j.nama || `Jabatan #${j.id}`}
              </option>
            ))}
          </select>
          {loadingJabatan && <div style={styles.hint}>Memuat jabatan...</div>}
          {errors.jabatan_id?.[0] && <div style={styles.error}>{errors.jabatan_id[0]}</div>}
        </div>

        <div>
          <label style={styles.label}>Tanggal Mulai</label>
          <input
            type="date"
            value={form.berlaku_mulai}
            onChange={(e) => set("berlaku_mulai", e.target.value)}
            style={styles.input}
          />
          {errors.berlaku_mulai?.[0] && <div style={styles.error}>{errors.berlaku_mulai[0]}</div>}
        </div>
      </div>

      {/* ROW 2 */}
      <div style={styles.grid2}>
        <div>
          <label style={styles.label}>Jenis Perubahan</label>
          <select
            value={form.jenis_perubahan}
            onChange={(e) => set("jenis_perubahan", e.target.value)}
            style={styles.input}
          >
            {JENIS_PERUBAHAN_OPTIONS.map((x) => (
              <option key={x} value={x}>{x}</option>
            ))}
          </select>
          {errors.jenis_perubahan?.[0] && (
            <div style={styles.error}>{errors.jenis_perubahan[0]}</div>
          )}
        </div>

        <div>
          <label style={styles.label}>Gaji Pokok</label>
          <input
            type="number"
            min={0}
            value={formatRupiahInput(form.gaji_pokok)}
            onChange={(e) => set("gaji_pokok", e.target.value)}
            style={styles.input}
            placeholder="Contoh: 4500000"
          />
          <div style={styles.hintRow}>
            <span style={styles.hint}>
              Preview: <b>{formatRupiahHint(form.gaji_pokok)}</b>
            </span>
            {(golMin !== null || golMax !== null) && (
              <span style={styles.hint}>
                Range Golongan:{" "}
                <b>
                  {golMin !== null ? formatRupiahHint(golMin) : "-"}{" "}
                  —{" "}
                  {golMax !== null ? formatRupiahHint(golMax) : "-"}
                </b>
              </span>
            )}
          </div>

          {errors.gaji_pokok?.[0] && <div style={styles.error}>{errors.gaji_pokok[0]}</div>}
        </div>
      </div>

      {/* NOTES */}
      <div style={{ marginTop: 12 }}>
        <label style={styles.label}>Catatan (opsional)</label>
        <textarea
          value={form.catatan}
          onChange={(e) => set("catatan", e.target.value)}
          rows={3}
          style={{ ...styles.input, resize: "vertical", minHeight: 90 }}
          placeholder="Contoh: mutasi internal, promosi, penempatan sementara, dll."
        />
        {errors.catatan?.[0] && <div style={styles.error}>{errors.catatan[0]}</div>}
      </div>

      {errMsg && (
        <div style={styles.errBox}>
          {errMsg}
          {/* kalau backend return errors banyak, biasanya message: "The gaji pokok field is required. (and 2 more errors)" */}
        </div>
      )}

      <div style={styles.actions}>
        <button type="button" style={styles.btnGhost} onClick={onCancel}>
          Batal
        </button>
        <button type="submit" style={styles.btnPrimary} disabled={loading || loadingJabatan}>
          {loading ? "Menyimpan..." : "Simpan"}
        </button>
      </div>
    </form>
  );
}

const styles = {
  info: {
    padding: 12,
    borderRadius: 14,
    border: "1px solid #eef2f7",
    background:
      "linear-gradient(180deg, rgba(239,246,255,1) 0%, rgba(255,255,255,1) 80%)",
    marginBottom: 14,
  },
  infoTitle: { fontWeight: 950, color: "#0f172a" },
  infoSub: { marginTop: 4, fontSize: 12.5, color: "#64748b", fontWeight: 650 },

  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 },
  label: {
    fontSize: 13,
    fontWeight: 900,
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
    background: "white",
  },
  hintRow: {
    marginTop: 6,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    flexWrap: "wrap",
  },
  hint: { fontSize: 12.5, color: "#64748b", fontWeight: 650 },

  error: { color: "#dc2626", fontSize: 12, marginTop: 6, fontWeight: 700 },

  errBox: {
    marginTop: 10,
    padding: "10px 12px",
    borderRadius: 12,
    background: "#fff1f2",
    border: "1px solid #fecdd3",
    color: "#9f1239",
    fontSize: 13,
    fontWeight: 800,
  },

  actions: { marginTop: 14, display: "flex", justifyContent: "flex-end", gap: 10 },
  btnPrimary: {
    padding: "10px 14px",
    borderRadius: 12,
    border: "none",
    cursor: "pointer",
    background: "#2563eb",
    color: "white",
    fontWeight: 950,
    fontFamily: "Inter",
    boxShadow: "0 12px 30px rgba(37, 99, 235, 0.18)",
  },
  btnGhost: {
    padding: "10px 14px",
    borderRadius: 12,
    border: "1px solid #e5e7eb",
    background: "white",
    cursor: "pointer",
    fontWeight: 900,
    fontFamily: "Inter",
  },
};
