<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\RiwayatPenempatan;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class PenempatanController extends Controller
{
    // GET /pegawai/{pegawaiId}/penempatan  (history)
    public function index($pegawaiId)
    {
        return RiwayatPenempatan::where('pegawai_id', $pegawaiId)
            ->with([
                'jabatan:id,departemen_id,golongan_id,nama_jabatan',
                'jabatan.departemen:id,nama_departemen',
                'jabatan.golongan:id,kode_golongan,nama_golongan,gaji_pokok_min,gaji_pokok_maks',
            ])
            ->orderByDesc('berlaku_mulai')
            ->get();
    }

    // GET /pegawai/{pegawaiId}/penempatan/current
    public function current($pegawaiId)
    {
        $current = RiwayatPenempatan::where('pegawai_id', $pegawaiId)
            ->whereNull('berlaku_sampai')
            ->orderByDesc('berlaku_mulai')
            ->with([
                'jabatan:id,departemen_id,golongan_id,nama_jabatan',
                'jabatan.departemen:id,nama_departemen',
                'jabatan.golongan:id,kode_golongan,nama_golongan,gaji_pokok_min,gaji_pokok_maks',
            ])
            ->first();

        if (!$current) {
            return response()->json([
                'message' => 'Penempatan aktif tidak ditemukan',
                'data' => null,
            ], 404);
        }

        return response()->json([
            'message' => 'OK',
            'data' => $current,
        ]);
    }

    // POST /pegawai/{pegawaiId}/penempatan
    public function store(Request $r, $pegawaiId)
    {
        $data = $r->validate([
            'jabatan_id'       => 'required|integer|exists:jabatan,id',
            'gaji_pokok'       => 'required|numeric|min:0',
            'berlaku_mulai'    => 'required|date',
            'jenis_perubahan'  => 'required|in:MASUK,PROMOSI,MUTASI,DEMOSI,PENYESUAIAN',
            'catatan'          => 'nullable|string',
        ]);

        // Tutup penempatan aktif sebelumnya (kalau ada)
        $aktif = RiwayatPenempatan::where('pegawai_id', $pegawaiId)
            ->whereNull('berlaku_sampai')
            ->orderByDesc('berlaku_mulai')
            ->first();

        if ($aktif) {
            $mulaiBaru = Carbon::parse($data['berlaku_mulai']);
            $aktif->berlaku_sampai = $mulaiBaru->copy()->subDay()->toDateString();
            $aktif->save();
        }

        $data['pegawai_id'] = $pegawaiId;

        $created = RiwayatPenempatan::create($data);

        // balikin data yg sudah lengkap relasinya
        $created->load([
            'jabatan:id,departemen_id,golongan_id,nama_jabatan',
            'jabatan.departemen:id,nama_departemen',
            'jabatan.golongan:id,kode_golongan,nama_golongan,gaji_pokok_min,gaji_pokok_maks',
        ]);

        return response()->json([
            'message' => 'Created',
            'data' => $created,
        ], 201);
    }
}
