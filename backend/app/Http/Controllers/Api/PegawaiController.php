<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Pegawai;
use Illuminate\Http\Request;

class PegawaiController extends Controller
{
    public function nextKode()
    {
        // Ambil semua kode, termasuk yang tidak aktif (soft delete logic here if any, but currently 'aktif' is just a boolean, so simple query works)
        // Check MAX code directly from DB
        $lastPegawai = Pegawai::select('kode_pegawai')
            ->orderByRaw('LENGTH(kode_pegawai) DESC') // PG1 vs PG10
            ->orderBy('kode_pegawai', 'desc')
            ->first();

        if (!$lastPegawai) {
            return response()->json(['code' => 'PG001']);
        }

        // Extract number
        if (preg_match('/(\d+)$/', $lastPegawai->kode_pegawai, $matches)) {
            $nextNum = (int)$matches[1] + 1;
            $nextCode = 'PG' . str_pad($nextNum, 3, '0', STR_PAD_LEFT);
            return response()->json(['code' => $nextCode]);
        }

        return response()->json(['code' => 'PG001']); // Fallback
    }

    public function index()
    {
        return response()->json([
            'data' => Pegawai::where('aktif', true)
                ->orderBy('created_at', 'desc')
                ->get()
        ]);
    }

    public function store(Request $r)
    {
        $data = $r->validate([
            'kode_pegawai'     => 'required|string|unique:pegawai,kode_pegawai',
            'nama_lengkap'     => 'required|string|max:255',
            'tanggal_masuk'    => 'required|date',
            'status_kerja'     => 'required|in:PERMANEN,KONTRAK,MAGANG,PROBATION',
            'jenis_penggajian' => 'required|in:BULANAN,PROYEK',
            'nama_bank'        => 'nullable|string|max:100',
            'nomor_rekening'   => 'nullable|string|max:50',
            'npwp'             => 'nullable|string|max:30',
            'status_ptkp'      => 'nullable|in:TK0,TK1,TK2,TK3,K0,K1,K2,K3',
            'create_account'   => 'nullable|boolean',
            'email'            => 'required_if:create_account,true|nullable|email|unique:users,email',
        ]);

        return \Illuminate\Support\Facades\DB::transaction(function () use ($data) {
            $userId = null;

            // 1. Buat User jika diminta
            if (!empty($data['create_account']) && filter_var($data['create_account'], FILTER_VALIDATE_BOOLEAN)) {
                $user = \App\Models\User::create([
                    'name'     => $data['nama_lengkap'],
                    'email'    => $data['email'],
                    'password' => \Illuminate\Support\Facades\Hash::make('password123'),
                    'peran'    => 'PEGAWAI',
                ]);
                $userId = $user->id;
            }

            // 2. Buat Pegawai
            // Hapus field 'create_account' & 'email' dari array data sebelum save ke tabel pegawai
            $pegawaiData = collect($data)->except(['create_account', 'email'])->toArray();
            $pegawaiData['pengguna_id'] = $userId;
            $pegawaiData['aktif'] = true;

            $pegawai = Pegawai::create($pegawaiData);

            return response()->json([
                'message' => 'Pegawai berhasil ditambahkan',
                'data' => $pegawai,
            ], 201);
        });
    }

    public function show(Pegawai $pegawai)
    {
        return response()->json([
            'data' => $pegawai
        ]);
    }

    public function update(Request $r, Pegawai $pegawai)
    {
        $data = $r->validate([
            'nama_lengkap'     => 'required|string|max:255',
            'tanggal_masuk'    => 'required|date',
            'status_kerja'     => 'required|in:PERMANEN,KONTRAK,MAGANG,PROBATION',
            'jenis_penggajian' => 'required|in:BULANAN,PROYEK',
            'nama_bank'        => 'nullable|string|max:100',
            'nomor_rekening'   => 'nullable|string|max:50',
            'npwp'             => 'nullable|string|max:30',
            'status_ptkp'      => 'nullable|in:TK0,TK1,TK2,TK3,K0,K1,K2,K3',
        ]);

        $pegawai->update($data);

        return response()->json([
            'message' => 'Pegawai berhasil diperbarui',
            'data' => $pegawai
        ]);
    }

    public function destroy(Pegawai $pegawai)
    {
        // 1. Cek History Penggajian (Financial Record)
        // Jika sudah ada slip gaji, TIDAK BOLEH dihapus fisik (harus Soft Delete/Non-aktif)
        $hasPayroll = \App\Models\PenggajianDetail::where('pegawai_id', $pegawai->id)->exists();

        if ($hasPayroll) {
            // === SOFT DELETE (NON-AKTIFKAN) ===
            $pegawai->update(['aktif' => false]);

            // Tutup Penempatan Terakhir
            $penempatanAktif = $pegawai->penempatan()
                ->whereNull('berlaku_sampai')
                ->orderByDesc('berlaku_mulai')
                ->first();

            if ($penempatanAktif) {
                $penempatanAktif->update([
                    'berlaku_sampai' => now()->toDateString(),
                    'catatan' => $penempatanAktif->catatan . ' (Ditutup karena pegawai dinonaktifkan)',
                ]);
            }

            return response()->json([
                'message' => 'Pegawai dinonaktifkan (data penggajian harus disimpan sebagai arsip). Penempatan aktif telah ditutup.'
            ]);
        }

        // === HARD DELETE (HAPUS BERSIH) ===
        // Karena belum ada data gaji, aman untuk dihapus total dari database.
        
        \Illuminate\Support\Facades\DB::transaction(function () use ($pegawai) {
            // Simpan ID user sebelum pegawai dihapus
            $userId = $pegawai->pengguna_id;

            // 1. Hapus Riwayat Penempatan (Child of Pegawai)
            $pegawai->penempatan()->delete();

            // 2. Hapus Pegawai (Child of User)
            $pegawai->delete();

            // 3. Hapus User Login (Parent) - Sekarang aman karena child (pegawai) sudah hilang
            if ($userId) {
                $user = \App\Models\User::find($userId);
                if ($user && $user->peran === 'PEGAWAI') {
                    $user->delete();
                }
            }
        });

        return response()->json([
            'message' => 'Pegawai dan data terkait berhasil dihapus permanen dari database.'
        ]);
    }
}
