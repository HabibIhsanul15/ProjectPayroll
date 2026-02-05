import { api } from "./api";

export const listJurnal = async () => {
    const res = await api.get("/jurnal-umum");
    return res.data;
};

export const getJurnal = async (id) => {
    const res = await api.get(`/jurnal-umum/${id}`);
    return res.data;
};
