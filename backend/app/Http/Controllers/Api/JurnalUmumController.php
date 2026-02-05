<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\JurnalUmum;
use Illuminate\Http\Request;

class JurnalUmumController extends Controller
{
    public function index()
    {
        $data = JurnalUmum::with('pembuat:id,name')
            ->orderByDesc('tanggal')
            ->orderByDesc('id')
            ->get();

        return response()->json(['message' => 'OK', 'data' => $data]);
    }

    public function show($id)
    {
        $jurnal = JurnalUmum::with(['details.coa', 'pembuat:id,name'])
            ->findOrFail($id);

        return response()->json(['message' => 'OK', 'data' => $jurnal]);
    }
}
