<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\PegawaiController;
use App\Http\Controllers\Api\JabatanController;
use App\Http\Controllers\Api\PenempatanController;
use App\Http\Controllers\Api\PenggajianController;
use App\Http\Controllers\Api\PenggajianKomponenController;
use App\Http\Controllers\Api\PenggajianDetailController;
use App\Http\Controllers\Api\JurnalUmumController;

Route::get('/ping', fn () => response()->json(['status' => 'API OK']));
Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {

    // ===== PEGAWAI =====
    Route::middleware('cek_peran:PEGAWAI')->group(function () {
        Route::get('/saya/slip-gaji', [PenggajianController::class, 'slipSayaIndex']);
        Route::get('/saya/slip-gaji/{penggajianPeriodeId}', [PenggajianController::class, 'slipSayaShow']);
    });

    // ===== MASTER (umum internal) =====
    Route::get('/jabatan', [JabatanController::class, 'index']);

    // ===== HCGA =====
    Route::middleware('cek_peran:HCGA')->group(function () {
        Route::get('/pegawai/next-kode', [PegawaiController::class, 'nextKode']);
        Route::apiResource('pegawai', PegawaiController::class);

        Route::get('/pegawai/{pegawaiId}/penempatan/current', [PenempatanController::class, 'current']);
        Route::get('/pegawai/{pegawaiId}/penempatan', [PenempatanController::class, 'index']);
        Route::post('/pegawai/{pegawaiId}/penempatan', [PenempatanController::class, 'store']);

        // ringkasan penggajian (tanpa nominal)
        Route::get('/penggajian', [PenggajianController::class, 'indexRingkas']);
        Route::get('/penggajian/{id}', [PenggajianController::class, 'showRingkas']);
    });

    // ===== FAT =====
    Route::middleware('cek_peran:FAT')->group(function () {

        // periode + full nominal
        Route::post('/penggajian/generate', [PenggajianController::class, 'generate']);
        Route::get('/penggajian-full', [PenggajianController::class, 'indexFull']);
        Route::get('/penggajian-full/{id}', [PenggajianController::class, 'showFull']);
        Route::get('/penggajian-stats', [PenggajianController::class, 'stats']);

        // workflow
        Route::post('/penggajian/{id}/ajukan', [PenggajianController::class, 'ajukanKeDirektur']);
        Route::post('/penggajian/{id}/bayar', [PenggajianController::class, 'tandaiDibayar']);

        // edit detail (tunjangan/potongan manual) — hanya DRAFT (via Policy)
        Route::patch('/penggajian-detail/{id}', [PenggajianDetailController::class, 'update']);

        // komponen tunjangan/potongan — hanya DRAFT (via Policy)
        Route::get('/penggajian-detail/{detailId}/komponen', [PenggajianKomponenController::class, 'index']);
        Route::post('/penggajian-detail/{detailId}/komponen', [PenggajianKomponenController::class, 'store']);
        Route::patch('/penggajian-komponen/{id}', [PenggajianKomponenController::class, 'update']);
        Route::delete('/penggajian-komponen/{id}', [PenggajianKomponenController::class, 'destroy']);

        // pajak
        Route::post('/penggajian-detail/{detailId}/pph21/hitung', [PenggajianController::class, 'hitungPph21Detail']);
        
        // bukti transfer
        Route::post('/penggajian-detail/{detailId}/upload-bukti', [PenggajianController::class, 'uploadBukti']);

        Route::post('/penggajian-periode/{periodeId}/pph21/hitung', [PenggajianController::class, 'hitungPph21Periode']);
        Route::post('/penggajian-periode/{periodeId}/pph21-ter/hitung', [PenggajianController::class, 'hitungPph21TerPeriode']);
        Route::post('/penggajian-periode/{periodeId}/pph21-rekonsiliasi', [PenggajianController::class, 'rekonsiliasiPph21Tahunan']);

        // Jurnal Umum
        Route::get('/jurnal-umum', [JurnalUmumController::class, 'index']);
        Route::get('/jurnal-umum/{id}', [JurnalUmumController::class, 'show']);
    });

    // ===== DIREKTUR =====
    Route::middleware('cek_peran:DIREKTUR')->group(function () {
        Route::get('/penggajian-approval', [PenggajianController::class, 'indexApproval']);
        Route::get('/penggajian-approval/{id}', [PenggajianController::class, 'showApproval']);

        Route::post('/penggajian/{id}/approve', [PenggajianController::class, 'approveDirektur']);
        Route::post('/penggajian/{id}/reject', [PenggajianController::class, 'rejectDirektur']);
    });

    // ===== PROFILE (All Roles) =====
    Route::get('/profile', [\App\Http\Controllers\Api\ProfileController::class, 'show']);
    Route::post('/profile/password', [\App\Http\Controllers\Api\ProfileController::class, 'updatePassword']);
    Route::patch('/profile/pegawai', [\App\Http\Controllers\Api\ProfileController::class, 'updatePegawai']);

});
