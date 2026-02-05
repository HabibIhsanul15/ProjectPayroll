// frontend/src/lib/pegawaiApi.js
import { api } from "./api";

// LIST
export async function listPegawai() {
  const res = await api.get("/pegawai");
  return res.data?.data ?? [];
}

// CREATE
export async function createPegawai(payload) {
  const res = await api.post("/pegawai", payload);
  return res.data;
}

// GET DETAIL (untuk edit)
export async function getPegawai(id) {
  const res = await api.get(`/pegawai/${id}`);
  return res.data?.data;
}

// UPDATE
export async function updatePegawai(id, payload) {
  const res = await api.put(`/pegawai/${id}`, payload);
  return res.data;
}

// DELETE (nonaktif)
export async function deletePegawai(id) {
  const res = await api.delete(`/pegawai/${id}`);
  return res.data;
}
