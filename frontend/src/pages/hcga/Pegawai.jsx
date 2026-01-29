import { useEffect, useMemo, useState } from "react";
import PageContainer from "../../components/PageContainer";
import { api } from "../../lib/api";
import { Table, TableHeader, TableBody, Row, Cell } from "../../components/ui/Table";
import Modal from "../../components/ui/Modal";
import PegawaiForm from "./PegawaiForm";

function nextKodePegawai(items) {
  // format: PG001, PG002, dst
  const nums = items
    .map((p) => String(p.kode_pegawai || ""))
    .map((k) => {
      const m = k.match(/(\d+)$/);
      return m ? parseInt(m[1], 10) : null;
    })
    .filter((n) => Number.isFinite(n));

  const next = (nums.length ? Math.max(...nums) : 0) + 1;
  return `PG${String(next).padStart(3, "0")}`;
}

export default function HcgaPegawai() {
  const [items, setItems] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [open, setOpen] = useState(false);

  async function fetchPegawai() {
    setError("");
    setLoading(true);
    try {
      const res = await api.get("/pegawai");
      const list = Array.isArray(res.data) ? res.data : (res.data?.data ?? []);
      setItems(list);
    } catch (err) {
      setError(err?.response?.data?.message || "Gagal mengambil data pegawai");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchPegawai();
  }, []);

  const filtered = useMemo(() => {
    const keyword = q.trim().toLowerCase();
    if (!keyword) return items;
    return items.filter((p) => {
      const kode = (p.kode_pegawai ?? "").toLowerCase();
      const nama = (p.nama_lengkap ?? "").toLowerCase();
      const ptkp = (p.status_ptkp ?? "").toLowerCase();
      return kode.includes(keyword) || nama.includes(keyword) || ptkp.includes(keyword);
    });
  }, [items, q]);

  const suggestedKode = useMemo(() => nextKodePegawai(items), [items]);

  return (
    <PageContainer title="Pegawai">
      <div style={styles.topBar}>
        <div style={styles.left}>
          <input
            style={styles.search}
            placeholder="Cari kode / nama / PTKP..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <div style={styles.count}>
            Total: <b>{filtered.length}</b>
          </div>
        </div>

        <button style={styles.btnPrimary} onClick={() => setOpen(true)}>
          + Tambah Pegawai
        </button>
      </div>

      {loading && <p>Loading data pegawai...</p>}
      {error && <p style={{ color: "crimson" }}>{error}</p>}

      {!loading && !error && (
        <Table>
          <TableHeader>
            <Row header>
              <Cell w="110px">Kode</Cell>
              <Cell>Nama</Cell>
              <Cell w="140px">Tanggal Masuk</Cell>
              <Cell w="90px">PTKP</Cell>
              <Cell w="130px">Status Kerja</Cell>
              <Cell w="140px">Jenis Penggajian</Cell>
              <Cell w="70px" align="center">Aktif</Cell>
              <Cell w="120px" align="right">Aksi</Cell>
            </Row>
          </TableHeader>

          <TableBody>
            {filtered.map((p) => (
              <Row key={p.id}>
                <Cell w="110px" bold>{p.kode_pegawai}</Cell>
                <Cell>{p.nama_lengkap}</Cell>
                <Cell w="140px" muted>{p.tanggal_masuk ?? "-"}</Cell>
                <Cell w="90px">{p.status_ptkp ?? "-"}</Cell>
                <Cell w="130px">{p.status_kerja ?? "-"}</Cell>
                <Cell w="140px">{p.jenis_penggajian ?? "-"}</Cell>
                <Cell w="70px" align="center">
                  <span style={pill(!!p.aktif ? "on" : "off")}>
                    {p.aktif ? "Ya" : "Tidak"}
                  </span>
                </Cell>
                <Cell w="120px" align="right">
                  <button style={styles.btnGhost} onClick={() => alert("Next: edit")}>
                    Edit
                  </button>
                  <button style={styles.btnDanger} onClick={() => alert("Next: hapus")}>
                    Hapus
                  </button>
                </Cell>
              </Row>
            ))}

            {filtered.length === 0 && (
              <Row>
                <Cell muted>Tidak ada data pegawai.</Cell>
              </Row>
            )}
          </TableBody>
        </Table>
      )}

      <Modal open={open} title="Tambah Pegawai" onClose={() => setOpen(false)}>
        <PegawaiForm
          suggestedKode={suggestedKode}
          onCancel={() => setOpen(false)}
          onSuccess={async () => {
            setOpen(false);
            await fetchPegawai();
          }}
        />
      </Modal>
    </PageContainer>
  );
}

function pill(state) {
  const base = {
    display: "inline-block",
    padding: "4px 8px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 700,
  };
  if (state === "on")
    return { ...base, background: "#ecfdf5", color: "#047857", border: "1px solid #a7f3d0" };
  return { ...base, background: "#fff1f2", color: "#be123c", border: "1px solid #fecdd3" };
}

const styles = {
  topBar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 14,
  },
  left: { display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" },
  search: {
    width: 320,
    maxWidth: "60vw",
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid #e5e7eb",
    outline: "none",
    fontFamily: "Inter",
  },
  count: { fontSize: 13, color: "#374151" },
  btnPrimary: {
    padding: "10px 12px",
    borderRadius: 12,
    border: "none",
    cursor: "pointer",
    background: "#2563eb",
    color: "white",
    fontWeight: 800,
    fontFamily: "Inter",
  },
  btnGhost: {
    padding: "8px 10px",
    borderRadius: 10,
    border: "1px solid #e5e7eb",
    background: "white",
    cursor: "pointer",
    marginRight: 8,
    fontSize: 12,
    fontFamily: "Inter",
  },
  btnDanger: {
    padding: "8px 10px",
    borderRadius: 10,
    border: "1px solid #fecaca",
    background: "#fff1f2",
    color: "#be123c",
    cursor: "pointer",
    fontSize: 12,
    fontFamily: "Inter",
  },
};
