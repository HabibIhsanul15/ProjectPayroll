<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class ProfileController extends Controller
{
    public function show(Request $request)
    {
        $user = $request->user();
        
        // If user is PEGAWAI, also get their employee data
        $pegawai = null;
        if ($user->peran === 'PEGAWAI') {
            $pegawai = \App\Models\Pegawai::where('pengguna_id', $user->id)->first();
        }

        return response()->json([
            'message' => 'OK',
            'data' => [
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'peran' => $user->peran,
                ],
                'pegawai' => $pegawai
            ]
        ]);
    }

    public function updatePassword(Request $request)
    {
        $request->validate([
            'password_lama' => 'required|string',
            'password_baru' => 'required|string|min:6|confirmed',
        ]);

        $user = $request->user();

        if (!Hash::check($request->password_lama, $user->password)) {
            return response()->json(['message' => 'Password lama salah'], 422);
        }

        $user->password = Hash::make($request->password_baru);
        $user->save();

        return response()->json(['message' => 'Password berhasil diubah']);
    }

    /**
     * Update editable pegawai fields (self-service)
     */
    public function updatePegawai(Request $request)
    {
        $user = $request->user();
        
        // Only PEGAWAI role can update their own data
        if ($user->peran !== 'PEGAWAI') {
            return response()->json(['message' => 'Hanya pegawai yang bisa update data diri'], 403);
        }

        $pegawai = \App\Models\Pegawai::where('pengguna_id', $user->id)->first();
        if (!$pegawai) {
            return response()->json(['message' => 'Data pegawai tidak ditemukan'], 404);
        }

        $request->validate([
            'alamat' => 'nullable|string|max:500',
            'no_telepon' => 'nullable|string|max:20',
            'email_pribadi' => 'nullable|email|max:100',
            'nama_bank' => 'nullable|string|max:50',
            'nomor_rekening' => 'nullable|string|max:30',
            'atas_nama_rekening' => 'nullable|string|max:100',
        ]);

        $pegawai->update([
            'alamat' => $request->alamat,
            'no_telepon' => $request->no_telepon,
            'email_pribadi' => $request->email_pribadi,
            'nama_bank' => $request->nama_bank,
            'nomor_rekening' => $request->nomor_rekening,
            'atas_nama_rekening' => $request->atas_nama_rekening,
        ]);

        return response()->json([
            'message' => 'Data berhasil diperbarui',
            'data' => $pegawai
        ]);
    }
}
