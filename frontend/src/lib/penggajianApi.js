import { api } from "./api";

// === FAT: LIST & GENERATE ===

export async function listPenggajianFull() {
    const res = await api.get("/penggajian-full");
    return res.data; // { message, data: [...] }
}

export async function getStats() {
    const res = await api.get("/penggajian-stats");
    return res.data; // { message, data: { total_dibayar_ytd, periode_aktif, ... } }
}

export async function showPenggajianFull(id) {
    const res = await api.get(`/penggajian-full/${id}`);
    return res.data; // { message, data: { penggajian_periode, total_biaya } }
}

export async function generatePenggajian(periode) {
    // periode format: "YYYY-MM"
    const res = await api.post("/penggajian/generate", { periode });
    return res.data;
}

// === FAT: WORKFLOW ===

export async function ajukanPenggajian(id) {
    const res = await api.post(`/penggajian/${id}/ajukan`);
    return res.data;
}

export async function bayarPenggajian(id) {
    const res = await api.post(`/penggajian/${id}/bayar`);
    return res.data;
}

// === FAT: PPH21 UTILS ===

export async function hitungPph21Periode(id) {
    const res = await api.post(`/penggajian-periode/${id}/pph21/hitung`);
    return res.data;
}

export async function hitungPph21TerPeriode(id) {
    const res = await api.post(`/penggajian-periode/${id}/pph21-ter/hitung`);
    return res.data;
}

export async function rekonsiliasiPph21Tahunan(id) {
    const res = await api.post(`/penggajian-periode/${id}/pph21-rekonsiliasi`);
    return res.data;
}

export async function uploadBuktiTransfer(detailId, file) {
    const formData = new FormData();
    formData.append("bukti", file);

    // Header 'Content-Type': 'multipart/form-data' usually auto-handled by axios when FormData is used
    const res = await api.post(`/penggajian-detail/${detailId}/upload-bukti`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
    });
    return res.data;
}

export async function tambahKomponen(detailId, data) {
    const res = await api.post(`/penggajian-detail/${detailId}/komponen`, data);
    return res.data;
}

export async function hapusKomponen(id) {
    const res = await api.delete(`/penggajian-komponen/${id}`);
    return res.data;
}

// === DIREKTUR: APPROVAL ===

export async function listPenggajianApproval() {
    const res = await api.get("/penggajian-approval");
    return res.data;
}

export async function showPenggajianApproval(id) {
    const res = await api.get(`/penggajian-approval/${id}`);
    return res.data;
}

export async function approvePenggajian(id) {
    const res = await api.post(`/penggajian/${id}/approve`);
    return res.data;
}

export async function rejectPenggajian(id, catatan) {
    const res = await api.post(`/penggajian/${id}/reject`, { catatan });
    return res.data;
}

// === PEGAWAI: SELF SERVICE ===

export async function getSlipSaya() {
    const res = await api.get("/saya/slip-gaji");
    return res.data; // { message, data: { pegawai, slip: [] } }
}

export async function getSlipSayaDetail(periodeId) {
    const res = await api.get(`/saya/slip-gaji/${periodeId}`);
    return res.data; // { message, data: detail }
}
