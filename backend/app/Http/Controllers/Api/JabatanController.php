<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Jabatan;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class JabatanController extends Controller
{
    /**
     * GET /api/jabatan
     * Optional query:
     * - q: search nama_jabatan
     * - per_page: kalau mau paginate (contoh 20)
     */
    public function index(Request $request)
    {
        $q = trim((string) $request->query('q', ''));
        $perPage = (int) $request->query('per_page', 0); // 0 = non paginate

        $query = Jabatan::query()
            ->with([
                'departemen:id,nama_departemen',
                'golongan:id,kode_golongan,nama_golongan,gaji_pokok_min,gaji_pokok_maks',
            ])
            ->when($q !== '', function ($qr) use ($q) {
                $qr->where('nama_jabatan', 'like', "%{$q}%");
            })
            ->orderBy('nama_jabatan')
            ->select(['id','departemen_id','golongan_id','nama_jabatan','created_at','updated_at']);

        // Kalau mau paginate (disarankan untuk data besar)
        if ($perPage > 0) {
            $data = $query->paginate($perPage);
        } else {
            $data = $query->get();
        }

        return response()->json([
            'message' => 'OK',
            'data' => $data,
        ]);
    }

    /**
     * GET /api/jabatan/{id}
     */
    public function show($id)
    {
        $jabatan = Jabatan::query()
            ->with([
                'departemen:id,nama_departemen',
                'golongan:id,kode_golongan,nama_golongan,gaji_pokok_min,gaji_pokok_maks',
            ])
            ->findOrFail($id);

        return response()->json([
            'message' => 'OK',
            'data' => $jabatan,
        ]);
    }

    /**
     * POST /api/jabatan
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'nama_jabatan'   => ['required','string','max:255'],
            'departemen_id'  => ['required','integer', Rule::exists('departemen', 'id')],
            'golongan_id'    => ['required','integer', Rule::exists('golongan', 'id')],
        ]);

        $jabatan = Jabatan::create($data);

        // reload with relations biar response langsung lengkap
        $jabatan->load([
            'departemen:id,nama_departemen',
            'golongan:id,kode_golongan,nama_golongan,gaji_pokok_min,gaji_pokok_maks',
        ]);

        return response()->json([
            'message' => 'Berhasil menambah jabatan',
            'data' => $jabatan,
        ], 201);
    }

    /**
     * PATCH/PUT /api/jabatan/{id}
     */
    public function update(Request $request, $id)
    {
        $jabatan = Jabatan::findOrFail($id);

        $data = $request->validate([
            'nama_jabatan'   => ['sometimes','required','string','max:255'],
            'departemen_id'  => ['sometimes','required','integer', Rule::exists('departemen', 'id')],
            'golongan_id'    => ['sometimes','required','integer', Rule::exists('golongan', 'id')],
        ]);

        $jabatan->update($data);

        $jabatan->load([
            'departemen:id,nama_departemen',
            'golongan:id,kode_golongan,nama_golongan,gaji_pokok_min,gaji_pokok_maks',
        ]);

        return response()->json([
            'message' => 'Berhasil mengubah jabatan',
            'data' => $jabatan,
        ]);
    }

    /**
     * DELETE /api/jabatan/{id}
     * Catatan: kalau jabatan dipakai di riwayat_penempatan, delete bisa gagal karena FK.
     * Lebih aman: blok delete kalau masih dipakai.
     */
    public function destroy($id)
    {
        $jabatan = Jabatan::findOrFail($id);

        // OPTIONAL guard: kalau relasi riwayat_penempatan ada, blok delete
        // (aktifkan kalau model Jabatan punya relasi riwayatPenempatan())
        if (method_exists($jabatan, 'riwayatPenempatan')) {
            $used = $jabatan->riwayatPenempatan()->exists();
            if ($used) {
                return response()->json([
                    'message' => 'Jabatan tidak bisa dihapus karena masih dipakai di riwayat penempatan.',
                ], 422);
            }
        }

        $jabatan->delete();

        return response()->json([
            'message' => 'Berhasil menghapus jabatan',
        ]);
    }
}
