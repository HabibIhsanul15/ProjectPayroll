// src/lib/penempatanApi.js
import { api } from "./api";

function pickArray(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
}

export async function listPegawai() {
  const res = await api.get("/pegawai");
  return pickArray(res.data);
}

export async function listJabatan(q = "") {
  const res = await api.get("/jabatan", { params: q ? { q } : undefined });
  // jabatan controller kamu return {message,data}
  return pickArray(res.data);
}

export async function listPenempatanHistory(pegawaiId) {
  const res = await api.get(`/pegawai/${pegawaiId}/penempatan`);
  return pickArray(res.data);
}

export async function getCurrentPenempatan(pegawaiId) {
  try {
    const res = await api.get(`/pegawai/${pegawaiId}/penempatan/current`);
    return res.data?.data ?? null;
  } catch (err) {
    if (err?.response?.status === 404) return null;
    throw err;
  }
}

export async function createPenempatan(pegawaiId, payload) {
  const res = await api.post(`/pegawai/${pegawaiId}/penempatan`, payload);
  return res.data?.data ?? res.data;
}
