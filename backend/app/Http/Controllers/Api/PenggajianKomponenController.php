<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PenggajianDetail;
use App\Models\PenggajianKomponen;
use Illuminate\Http\Request;

class PenggajianKomponenController extends Controller
{
    public function index(Request $r, $detailId)
    {
        $detail = PenggajianDetail::with(['periode', 'komponen'])->findOrFail($detailId);

        // untuk lihat komponen: FAT boleh lihat, tapi kalau mau strict juga boleh kunci DRAFT.
        // aku biarin boleh lihat, tapi kalau kamu mau kunci juga: aktifkan authorize di bawah
        // $this->authorize('update', $detail->periode);

        return response()->json([
            'message' => 'OK',
            'data' => [
                'detail' => $detail->only(['id','penggajian_periode_id','pegawai_id','jabatan_id','gaji_pokok','tunjangan','potongan','pph21','total']),
                'komponen' => $detail->komponen,
            ],
        ]);
    }

    public function store(Request $r, $detailId)
    {
        $detail = PenggajianDetail::with('periode')->findOrFail($detailId);
        $this->authorize('update', $detail->periode);

        $data = $r->validate([
            'jenis' => 'required|in:TUNJANGAN,POTONGAN',
            'nama'  => 'required|string|min:2|max:100',
            'nilai' => 'required|numeric|min:0',
        ]);

        $komponen = PenggajianKomponen::create([
            'penggajian_detail_id' => $detail->id,
            'jenis' => $data['jenis'],
            'nama' => $data['nama'],
            'nilai' => (float) $data['nilai'],
            'dibuat_oleh' => optional($r->user())->id,
        ]);

        $this->rebuildDetailDariKomponen($detail);

        return response()->json([
            'message' => 'Komponen berhasil ditambahkan (DRAFT)',
            'data' => [
                'komponen' => $komponen->fresh(),
                'detail' => $detail->fresh(),
            ],
        ], 201);
    }

    public function update(Request $r, $id)
    {
        $komponen = PenggajianKomponen::findOrFail($id);
        $detail = PenggajianDetail::with('periode')->findOrFail($komponen->penggajian_detail_id);

        $this->authorize('update', $detail->periode);

        $data = $r->validate([
            'nama'  => 'sometimes|string|min:2|max:100',
            'nilai' => 'sometimes|numeric|min:0',
        ]);

        $komponen->update($data);

        $this->rebuildDetailDariKomponen($detail);

        return response()->json([
            'message' => 'Komponen berhasil diubah (DRAFT)',
            'data' => [
                'komponen' => $komponen->fresh(),
                'detail' => $detail->fresh(),
            ],
        ]);
    }

    public function destroy(Request $r, $id)
    {
        $komponen = PenggajianKomponen::findOrFail($id);
        $detail = PenggajianDetail::with('periode')->findOrFail($komponen->penggajian_detail_id);

        $this->authorize('update', $detail->periode);

        $komponen->delete();
        $this->rebuildDetailDariKomponen($detail);

        return response()->json([
            'message' => 'Komponen berhasil dihapus (DRAFT)',
            'data' => [
                'detail' => $detail->fresh(),
            ],
        ]);
    }

    private function rebuildDetailDariKomponen(PenggajianDetail $detail): void
    {
        $sumTunj = (float) PenggajianKomponen::where('penggajian_detail_id', $detail->id)
            ->where('jenis', 'TUNJANGAN')
            ->sum('nilai');

        $sumPot = (float) PenggajianKomponen::where('penggajian_detail_id', $detail->id)
            ->where('jenis', 'POTONGAN')
            ->sum('nilai');

        $detail->tunjangan = $sumTunj;
        $detail->potongan  = $sumPot;

        $detail->total = ((float) $detail->gaji_pokok + (float) $detail->tunjangan)
            - (float) $detail->potongan
            - (float) $detail->pph21;

        $detail->save();
    }
}
