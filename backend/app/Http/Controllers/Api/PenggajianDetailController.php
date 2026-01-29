<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PenggajianDetail;
use Illuminate\Http\Request;

class PenggajianDetailController extends Controller
{
    public function update(Request $r, $id)
    {
        $detail = PenggajianDetail::with('periode')->findOrFail($id);
        $this->authorize('update', $detail->periode);

        $data = $r->validate([
            'tunjangan' => 'sometimes|numeric|min:0',
            'potongan'  => 'sometimes|numeric|min:0',
        ]);

        $detail->fill($data);

        $detail->total = ((float)$detail->gaji_pokok + (float)$detail->tunjangan)
            - (float)$detail->potongan
            - (float)$detail->pph21;

        $detail->save();

        return response()->json([
            'message' => 'Detail penggajian diperbarui (DRAFT)',
            'data' => $detail->fresh(),
        ]);
    }
}
