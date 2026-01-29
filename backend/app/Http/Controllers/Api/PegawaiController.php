<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Pegawai;
use Illuminate\Http\Request;

class PegawaiController extends Controller
{
    public function index()
    {
        return Pegawai::latest()->get();
    }

    public function store(Request $r)
    {
        $data = $r->validate([
            'kode_pegawai'     => 'required|unique:pegawai,kode_pegawai',
            'nama_lengkap'     => 'required|string',
            'tanggal_masuk'    => 'required|date',
            'status_kerja'     => 'required|in:PERMANEN,KONTRAK,PROBATION',
            'jenis_penggajian' => 'required|in:BULANAN,PROYEK,CAMPURAN',
            'nama_bank'        => 'nullable|string',
            'nomor_rekening'   => 'nullable|string',
            'npwp'             => 'nullable|string',
            'status_ptkp'      => 'nullable|string',
        ]);

        return Pegawai::create($data);
    }

    public function show($id)
    {
        return Pegawai::findOrFail($id);
    }

    public function update(Request $r, $id)
    {
        $pegawai = Pegawai::findOrFail($id);

        $data = $r->validate([
            'nama_lengkap'     => 'sometimes|string',
            'status_kerja'     => 'sometimes|in:PERMANEN,KONTRAK,PROBATION',
            'jenis_penggajian' => 'sometimes|in:BULANAN,PROYEK,CAMPURAN',
            'nama_bank'        => 'nullable|string',
            'nomor_rekening'   => 'nullable|string',
            'npwp'             => 'nullable|string',
            'status_ptkp'      => 'nullable|string',
            'aktif'            => 'boolean'
        ]);

        $pegawai->update($data);
        return $pegawai;
    }

    public function destroy($id)
    {
        Pegawai::findOrFail($id)->delete();
        return response()->noContent();
    }
}

