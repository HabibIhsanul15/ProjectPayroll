<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PenggajianPeriode;
use App\Models\PenggajianDetail;
use App\Models\Pegawai;
use App\Models\RiwayatPenempatan;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use App\Services\Pph21Service;
use App\Models\JurnalUmum;
use App\Models\JurnalUmumDetail;
use App\Models\Coa;

class PenggajianController extends Controller
{
    // =========================
    // FAT: GENERATE PERIODE
    // =========================
    public function generate(Request $r)
    {
        $data = $r->validate([
            'periode' => ['required', 'regex:/^\d{4}\-(0[1-9]|1[0-2])$/'],
        ]);

        $periode = $data['periode'];
        $mulaiPeriode = $periode . '-01';
        $akhirPeriode = date('Y-m-t', strtotime($mulaiPeriode));

        return DB::transaction(function () use ($r, $periode, $mulaiPeriode, $akhirPeriode) {

            $sudahAda = PenggajianPeriode::where('periode', $periode)->first();
            if ($sudahAda) {
                return response()->json([
                    'message' => 'Periode sudah pernah digenerate',
                    'data' => $sudahAda->loadCount('detail'),
                ], 409);
            }

            $penggajianPeriode = PenggajianPeriode::create([
                'periode' => $periode,
                'status' => 'DRAFT',
                'dibuat_oleh' => optional($r->user())->id,
            ]);

            $pegawaiAktif = Pegawai::where('aktif', 1)->get(['id', 'kode_pegawai', 'nama_lengkap']);

            $jumlahDibuat = 0;
            $dilewati = [];

            foreach ($pegawaiAktif as $p) {
                $penempatan = RiwayatPenempatan::where('pegawai_id', $p->id)
                    ->whereDate('berlaku_mulai', '<=', $akhirPeriode)
                    ->where(function ($q) use ($mulaiPeriode) {
                        $q->whereNull('berlaku_sampai')
                          ->orWhereDate('berlaku_sampai', '>=', $mulaiPeriode);
                    })
                    ->orderByDesc('berlaku_mulai')
                    ->first();

                if (!$penempatan) {
                    $dilewati[] = [
                        'pegawai_id' => $p->id,
                        'kode_pegawai' => $p->kode_pegawai,
                        'nama_lengkap' => $p->nama_lengkap,
                        'alasan' => 'Tidak ada penempatan pada periode ini',
                    ];
                    continue;
                }

                $gajiPokok = (float) $penempatan->gaji_pokok;
                $tunjangan = 0;
                $potongan = 0;
                $pph21 = 0;
                $total = $gajiPokok + $tunjangan - $potongan - $pph21;

                PenggajianDetail::create([
                    'penggajian_periode_id' => $penggajianPeriode->id,
                    'pegawai_id' => $p->id,
                    'jabatan_id' => $penempatan->jabatan_id,
                    'gaji_pokok' => $gajiPokok,
                    'tunjangan' => $tunjangan,
                    'potongan' => $potongan,
                    'pph21' => $pph21,
                    'total' => $total,
                ]);

                $jumlahDibuat++;
            }

            return response()->json([
                'message' => 'Generate penggajian berhasil',
                'data' => [
                    'penggajian_periode' => $penggajianPeriode->fresh()->loadCount('detail'),
                    'jumlah_detail_dibuat' => $jumlahDibuat,
                    'dilewati' => $dilewati,
                ],
            ], 201);
        });
    }

    // =========================
    // HCGA: RINGKAS (tanpa nominal)
    // =========================
    public function indexRingkas()
    {
        $data = PenggajianPeriode::query()
            ->withCount('detail')
            ->orderByDesc('periode')
            ->get(['id', 'periode', 'status', 'diajukan_pada', 'disetujui_pada', 'dibayar_pada', 'catatan', 'created_at']);

        return response()->json(['message' => 'OK', 'data' => $data]);
    }

    public function showRingkas($id)
    {
        $periode = PenggajianPeriode::withCount('detail')
            ->findOrFail($id, ['id', 'periode', 'status', 'diajukan_pada', 'disetujui_pada', 'dibayar_pada', 'catatan', 'created_at']);

        return response()->json(['message' => 'OK', 'data' => $periode]);
    }

    // =========================
    // FAT: FULL (dengan nominal + total per periode + stats)
    // =========================
    public function indexFull()
    {
        $currentYear = date('Y');
        
        $periodes = PenggajianPeriode::withCount('detail')
            ->orderByDesc('periode')
            ->get();

        // Add total_biaya for each periode
        $data = $periodes->map(function ($p) {
            $p->total_biaya = PenggajianDetail::where('penggajian_periode_id', $p->id)->sum('total');
            return $p;
        });

        // Calculate stats inline using DB to avoid any query issues
        $totalDibayarYTD = DB::table('penggajian_detail')
            ->join('penggajian_periode', 'penggajian_detail.penggajian_periode_id', '=', 'penggajian_periode.id')
            ->where('penggajian_periode.status', 'DIBAYARKAN')
            ->where('penggajian_periode.periode', 'like', $currentYear.'-%')
            ->sum('penggajian_detail.total');
            
        $periodeAktif = $periodes->where('status', '!=', 'DIBAYARKAN')->count();

        return response()->json([
            'message' => 'OK', 
            'data' => $data,
            'stats' => [
                'total_dibayar_ytd' => (float) $totalDibayarYTD,
                'periode_aktif' => $periodeAktif,
            ]
        ]);
    }

    // FAT: STATS (aggregated totals)
    public function stats()
    {
        $currentYear = date('Y');
        
        // Total dibayarkan YTD (status = DIBAYARKAN)
        $totalDibayarYTD = DB::table('penggajian_detail')
            ->join('penggajian_periode', 'penggajian_detail.penggajian_periode_id', '=', 'penggajian_periode.id')
            ->where('penggajian_periode.status', 'DIBAYARKAN')
            ->where('penggajian_periode.periode', 'like', $currentYear.'-%')
            ->sum('penggajian_detail.total');
            
        // Total periode aktif (not DIBAYARKAN)
        $periodeAktif = PenggajianPeriode::where('status', '!=', 'DIBAYARKAN')->count();
        
        // Total pegawai aktif
        $pegawaiAktif = \App\Models\Pegawai::where('aktif', 1)->count();
        
        // Pending approval
        $pendingApproval = PenggajianPeriode::where('status', 'MENUNGGU_APPROVAL_DIREKTUR')->count();

        return response()->json([
            'message' => 'OK',
            'data' => [
                'total_dibayar_ytd' => (float) $totalDibayarYTD,
                'periode_aktif' => $periodeAktif,
                'pegawai_aktif' => $pegawaiAktif,
                'pending_approval' => $pendingApproval,
            ]
        ]);
    }

    public function showFull($id)
    {
        $periode = PenggajianPeriode::with([
            'detail.pegawai:id,kode_pegawai,nama_lengkap,nama_bank,nomor_rekening,atas_nama_rekening',
            'detail.jabatan:id,nama_jabatan',
            'detail.komponen'
        ])->withCount('detail')->findOrFail($id);

        $totalBiaya = PenggajianDetail::where('penggajian_periode_id', $id)->sum('total');

        return response()->json([
            'message' => 'OK',
            'data' => [
                'penggajian_periode' => $periode,
                'total_biaya' => (float) $totalBiaya,
            ],
        ]);
    }

    // =========================
    // FAT: AJUKAN KE DIREKTUR
    // =========================
    public function ajukanKeDirektur(Request $r, $id)
    {
        $periode = PenggajianPeriode::withCount('detail')->findOrFail($id);

        if ($periode->status !== 'DRAFT') {
            return response()->json([
                'message' => 'Tidak bisa diajukan karena status bukan DRAFT',
                'data' => $periode,
            ], 422);
        }

        if (($periode->detail_count ?? 0) < 1) {
            return response()->json([
                'message' => 'Tidak bisa diajukan karena detail penggajian kosong',
                'data' => $periode,
            ], 422);
        }

        $periode->status = 'MENUNGGU_APPROVAL_DIREKTUR';
        $periode->diajukan_pada = Carbon::now();
        $periode->diajukan_oleh = optional($r->user())->id;
        $periode->save();

        return response()->json([
            'message' => 'Penggajian diajukan ke Direktur',
            'data' => $periode,
        ]);
    }

    // =========================
    // DIREKTUR: LIST & DETAIL APPROVAL (ringkasan + total biaya)
    // =========================
    public function indexApproval()
    {
        $data = PenggajianPeriode::query()
            ->withCount('detail')
            ->orderByDesc('periode')
            ->get(['id', 'periode', 'status', 'diajukan_pada', 'catatan', 'created_at']);

        return response()->json(['message' => 'OK', 'data' => $data]);
    }

    public function showApproval($id)
    {
        $periode = PenggajianPeriode::with([
            'detail.pegawai:id,kode_pegawai,nama_lengkap',
            'detail.jabatan:id,nama_jabatan',
        ])->withCount('detail')->findOrFail($id);

        $totalBiaya = PenggajianDetail::where('penggajian_periode_id', $id)->sum('total');

        return response()->json([
            'message' => 'OK',
            'data' => [
                'penggajian_periode' => $periode,
                'total_biaya' => (float) $totalBiaya,
            ],
        ]);
    }

    // =========================
    // DIREKTUR: APPROVE / REJECT
    // =========================
    public function approveDirektur(Request $r, $id)
    {
        $periode = PenggajianPeriode::findOrFail($id);

        if ($periode->status !== 'MENUNGGU_APPROVAL_DIREKTUR') {
            return response()->json([
                'message' => 'Tidak bisa approve karena status bukan MENUNGGU_APPROVAL_DIREKTUR',
                'data' => $periode,
            ], 422);
        }

        $periode->status = 'DISETUJUI';
        $periode->disetujui_pada = Carbon::now();
        $periode->disetujui_oleh = optional($r->user())->id;
        $periode->save();

        return response()->json([
            'message' => 'Penggajian disetujui Direktur',
            'data' => $periode,
        ]);
    }

    public function rejectDirektur(Request $r, $id)
    {
        $data = $r->validate([
            'catatan' => 'required|string|min:3',
        ]);

        $periode = PenggajianPeriode::findOrFail($id);

        if ($periode->status !== 'MENUNGGU_APPROVAL_DIREKTUR') {
            return response()->json([
                'message' => 'Tidak bisa reject karena status bukan MENUNGGU_APPROVAL_DIREKTUR',
                'data' => $periode,
            ], 422);
        }

        $periode->status = 'DRAFT';
        $periode->catatan = $data['catatan'];
        $periode->save();

        return response()->json([
            'message' => 'Penggajian ditolak Direktur, dikembalikan ke DRAFT',
            'data' => $periode,
        ]);
    }

    // =========================
    // FAT: TANDAI DIBAYAR
    // =========================
    public function tandaiDibayar(Request $r, $id)
    {
        $periode = PenggajianPeriode::findOrFail($id);

        if ($periode->status !== 'DISETUJUI') {
            return response()->json([
                'message' => 'Tidak bisa dibayar karena status belum DISETUJUI',
                'data' => $periode,
            ], 422);
        }

        return DB::transaction(function () use ($r, $periode, $id) {
            $periode->status = 'DIBAYARKAN';
            $periode->dibayar_pada = Carbon::now();
            $periode->dibayar_oleh = optional($r->user())->id;
            $periode->save();

            // =========================
            // GENERATE JURNAL UMUM
            // =========================
            $totalBruto = PenggajianDetail::where('penggajian_periode_id', $id)->sum(DB::raw('gaji_pokok + tunjangan'));
            $totalPph21 = PenggajianDetail::where('penggajian_periode_id', $id)->sum('pph21');
            $totalNeto = PenggajianDetail::where('penggajian_periode_id', $id)->sum('total');

            $nomorJurnal = 'JU-' . str_replace('-', '', $periode->periode) . '-' . str_pad($periode->id, 4, '0', STR_PAD_LEFT);

            $jurnal = JurnalUmum::create([
                'nomor_jurnal' => $nomorJurnal,
                'tanggal' => Carbon::now()->format('Y-m-d'),
                'keterangan' => "Payroll Periode " . $periode->periode,
                'referensi_tipe' => 'PENGGAJIAN_PERIODE',
                'referensi_id' => $periode->id,
                'total_debet' => $totalBruto,
                'total_kredit' => $totalBruto,
                'dibuat_oleh' => optional($r->user())->id,
            ]);

            // Debet: Beban Gaji (5101)
            $coaBeban = Coa::where('kode_akun', '5101')->first();
            if ($coaBeban) {
                JurnalUmumDetail::create([
                    'jurnal_umum_id' => $jurnal->id,
                    'coa_id' => $coaBeban->id,
                    'debet' => $totalBruto,
                    'kredit' => 0,
                    'keterangan' => 'Beban Gaji Periode ' . $periode->periode
                ]);
            }

            // Kredit: Kas & Bank (1101) -> Total yang dibayar ke pegawai
            $coaKas = Coa::where('kode_akun', '1101')->first();
            if ($coaKas) {
                JurnalUmumDetail::create([
                    'jurnal_umum_id' => $jurnal->id,
                    'coa_id' => $coaKas->id,
                    'debet' => 0,
                    'kredit' => $totalNeto,
                    'keterangan' => 'Pembayaran Gaji Periode ' . $periode->periode
                ]);
            }

            // Kredit: Hutang PPh 21 (2102) -> Potongan pajak
            if ($totalPph21 > 0) {
                $coaPph = Coa::where('kode_akun', '2102')->first();
                if ($coaPph) {
                    JurnalUmumDetail::create([
                        'jurnal_umum_id' => $jurnal->id,
                        'coa_id' => $coaPph->id,
                        'debet' => 0,
                        'kredit' => $totalPph21,
                        'keterangan' => 'Potongan PPh 21 Periode ' . $periode->periode
                    ]);
                }
            }

            return response()->json([
                'message' => 'Penggajian ditandai sudah dibayar & Jurnal Umum berhasil dibuat',
                'data' => [
                    'periode' => $periode,
                    'jurnal' => $jurnal->load('details.coa'),
                ],
            ]);
        });
    }

    // =========================
    // PEGAWAI: SLIP GAJI SAYA
    // =========================
    public function slipSayaIndex(Request $r)
    {
        $userId = $r->user()->id;

        $pegawai = Pegawai::where('pengguna_id', $userId)->first();
        if (!$pegawai) {
            return response()->json([
                'message' => 'Akun ini belum terhubung ke data pegawai',
                'data' => null,
            ], 404);
        }

        $periodeFilter = trim((string) $r->query('periode', ''));

        $query = PenggajianDetail::query()
            ->with([
                'periode:id,periode,status',
                'jabatan:id,nama_jabatan',
            ])
            ->where('pegawai_id', $pegawai->id)
            ->orderByDesc('id');

        if ($periodeFilter !== '') {
            $query->whereHas('periode', function ($q) use ($periodeFilter) {
                $q->where('periode', $periodeFilter);
            });
        }

        $data = $query->get([
            'id',
            'penggajian_periode_id',
            'pegawai_id',
            'jabatan_id',
            'gaji_pokok',
            'tunjangan',
            'potongan',
            'pph21',
            'total',
            'created_at',
        ]);

        return response()->json([
            'message' => 'OK',
            'data' => [
                'pegawai' => [
                    'id' => $pegawai->id,
                    'kode_pegawai' => $pegawai->kode_pegawai,
                    'nama_lengkap' => $pegawai->nama_lengkap,
                ],
                'slip' => $data,
            ],
        ]);
    }

    public function slipSayaShow(Request $r, $penggajianPeriodeId)
    {
        $userId = $r->user()->id;

        $pegawai = Pegawai::where('pengguna_id', $userId)->first();
        if (!$pegawai) {
            return response()->json([
                'message' => 'Akun ini belum terhubung ke data pegawai',
                'data' => null,
            ], 404);
        }

        $detail = PenggajianDetail::with([
                'periode:id,periode,status,diajukan_oleh',
                'periode.pengaju:id,name', // User who submitted
                'jabatan:id,nama_jabatan',
                'komponen'
            ])
            ->where('pegawai_id', $pegawai->id)
            ->where('penggajian_periode_id', $penggajianPeriodeId)
            ->first();

        if (!$detail) {
            return response()->json([
                'message' => 'Slip gaji tidak ditemukan untuk pegawai ini pada periode tersebut',
                'data' => null,
            ], 404);
        }

        // Attach pegawai data manually since we already have it
        $detail->pegawai = $pegawai;

        return response()->json([
            'message' => 'OK',
            'data' => $detail,
        ]);
    }

    // =========================
    // FAT: HITUNG PPH21 (MINIMAL) - PER DETAIL
    public function hitungPph21Detail(Request $r, $detailId)
    {
        $detail = PenggajianDetail::with([
            'pegawai:id,npwp,status_ptkp',
            'periode:id,status', // WAJIB agar authorize tidak null
        ])->findOrFail($detailId);

        $this->authorize('update', $detail->periode);

        $hasil = $this->kalkulasiPph21Minimal($detail);

        $detail->update([
            'pph21' => $hasil['pph21_bulanan'],
            'total' => $hasil['total_bulanan_setelah_pph21'],
        ]);

        return response()->json([
            'message' => 'Hitung PPh21 berhasil',
            'data' => [
                'penggajian_detail_id' => $detail->id,
                'pph21' => (float) $detail->pph21,
                'total' => (float) $detail->total,
                'ringkasan' => $hasil,
            ],
        ]);
    }

    // =========================
    // FAT: UPLOAD BUKTI TRANSFER
    // =========================
    public function uploadBukti(Request $r, $detailId)
    {
        $r->validate([
            'bukti' => 'required|file|mimes:jpg,jpeg,png,pdf|max:2048',
        ]);

        $detail = PenggajianDetail::findOrFail($detailId);
        
        // Hapus file lama jika ada
        if ($detail->bukti_transfer) {
            Storage::disk('public')->delete($detail->bukti_transfer);
        }

        $path = $r->file('bukti')->store('bukti_transfer', 'public');
        
        $detail->bukti_transfer = $path;
        $detail->save();

        return response()->json([
            'message' => 'Bukti transfer berhasil diupload',
            'data' => [
                'id' => $detail->id,
                'bukti_url' => asset('storage/' . $path),
            ]
        ]);
    }

    // =========================
    // FAT: HITUNG PPH21 (MINIMAL) - PER PERIODE
    // =========================
    public function hitungPph21Periode(Request $r, $periodeId)
    {
        $periode = PenggajianPeriode::withCount('detail')->findOrFail($periodeId);
        $this->authorize('ubah', $periode);

        if (!in_array($periode->status, ['DRAFT'], true)) {
            return response()->json([
                'message' => 'PPh21 hanya boleh dihitung saat status DRAFT',
                'data' => $periode,
            ], 422);
        }

        $details = PenggajianDetail::with([
            'pegawai:id,npwp,status_ptkp',
        ])->where('penggajian_periode_id', $periodeId)->get();

        $updated = 0;
        $dilewati = [];

        foreach ($details as $d) {
            if (!$d->pegawai) {
                $dilewati[] = ['detail_id' => $d->id, 'alasan' => 'Pegawai tidak ditemukan'];
                continue;
            }

            $hasil = $this->kalkulasiPph21Minimal($d);

            $d->update([
                'pph21' => $hasil['pph21_bulanan'],
                'total' => $hasil['total_bulanan_setelah_pph21'],
            ]);

            $updated++;
        }

        return response()->json([
            'message' => 'Hitung PPh21 periode berhasil',
            'data' => [
                'penggajian_periode_id' => $periode->id,
                'updated' => $updated,
                'dilewati' => $dilewati,
            ],
        ]);
    }

    // =========================
    // FAT: HITUNG PPH21 TER (tabel TER bulanan)
    // =========================
    public function hitungPph21TerPeriode(Request $r, $periodeId)
    {
        $periode = PenggajianPeriode::withCount('detail')->findOrFail($periodeId);
        $this->authorize('ubah', $periode);

        if ($periode->status !== 'DRAFT') {
            return response()->json([
                'message' => 'PPh21 hanya boleh dihitung saat status DRAFT',
                'data' => $periode,
            ], 422);
        }

        $service = app(Pph21Service::class);

        $details = PenggajianDetail::with('pegawai:id,status_ptkp')
            ->where('penggajian_periode_id', $periodeId)
            ->get();

        $updated = 0;
        $dilewati = [];

        foreach ($details as $d) {
            if (!$d->pegawai) {
                $dilewati[] = ['detail_id' => $d->id, 'alasan' => 'Pegawai tidak ditemukan'];
                continue;
            }

            $bruto = (float) $d->gaji_pokok + (float) $d->tunjangan;
            $hasil = $service->hitungTerBulanan($d->pegawai->status_ptkp, $bruto);

            $pph21 = (float) $hasil['pph21'];

            $total = ((float) $d->gaji_pokok + (float) $d->tunjangan)
                - (float) $d->potongan
                - $pph21;

            $d->update([
                'pph21' => $pph21,
                'total' => $total,
            ]);

            $updated++;
        }

        return response()->json([
            'message' => 'Hitung PPh21 TER periode berhasil',
            'data' => [
                'penggajian_periode_id' => (int) $periodeId,
                'updated' => $updated,
                'dilewati' => $dilewati,
            ],
        ]);
    }

    // =========================
    // FAT: REKONSILIASI PPH21 TAHUNAN (Desember)
    // =========================
    public function rekonsiliasiPph21Tahunan(Request $r, $periodeId)
    {
        $periode = PenggajianPeriode::findOrFail($periodeId);
        $this->authorize('ubah', $periode);

        if ($periode->status !== 'DRAFT') {
            return response()->json([
                'message' => 'Rekonsiliasi hanya boleh saat status DRAFT',
                'data' => $periode,
            ], 422);
        }

        $periodeStr = (string) $periode->periode;
        if (!preg_match('/^\d{4}\-12$/', $periodeStr)) {
            return response()->json([
                'message' => 'Rekonsiliasi hanya untuk periode Desember (YYYY-12)',
                'data' => $periode,
            ], 422);
        }

        $tahun = (int) substr($periodeStr, 0, 4);

        $detailsDes = PenggajianDetail::with('pegawai:id,status_ptkp,npwp')
            ->where('penggajian_periode_id', $periodeId)
            ->get();

        $updated = 0;
        $dilewati = [];

        foreach ($detailsDes as $d) {
            if (!$d->pegawai) {
                $dilewati[] = ['detail_id' => $d->id, 'alasan' => 'Pegawai tidak ditemukan'];
                continue;
            }

            $pegawaiId = $d->pegawai_id;

            $brutoTahunan = (float) PenggajianDetail::query()
                ->join('penggajian_periode', 'penggajian_detail.penggajian_periode_id', '=', 'penggajian_periode.id')
                ->where('penggajian_detail.pegawai_id', $pegawaiId)
                ->where('penggajian_periode.periode', 'like', $tahun . '-%')
                ->sum(DB::raw('(penggajian_detail.gaji_pokok + penggajian_detail.tunjangan)'));

            $pphSudahDipungut = (float) PenggajianDetail::query()
                ->join('penggajian_periode', 'penggajian_detail.penggajian_periode_id', '=', 'penggajian_periode.id')
                ->where('penggajian_detail.pegawai_id', $pegawaiId)
                ->where('penggajian_periode.periode', 'like', $tahun . '-%')
                ->where('penggajian_periode.periode', '<', $tahun . '-12')
                ->sum('penggajian_detail.pph21');

            $statusPtkpNormal = $this->normalisasiPtkpUntukTahunan($d->pegawai->status_ptkp);
            $ptkp = $this->nilaiPtkpTahunan($statusPtkpNormal);

            $biayaJabatanTahunan = 0.05 * $brutoTahunan;
            if ($biayaJabatanTahunan > 6000000) $biayaJabatanTahunan = 6000000;

            $netoTahunan = max(0, $brutoTahunan - $biayaJabatanTahunan);
            $pkp = max(0, $netoTahunan - $ptkp);
            $pkp = floor($pkp / 1000) * 1000;

            $pphSetahun = $this->pphProgresifPasal17($pkp);

            if (empty($d->pegawai->npwp)) {
                $pphSetahun = $pphSetahun * 1.2;
            }

            $pphDesember = (float) round($pphSetahun - $pphSudahDipungut, 2);
            if ($pphDesember < 0) $pphDesember = 0;

            $total = ((float) $d->gaji_pokok + (float) $d->tunjangan)
                - (float) $d->potongan
                - (float) $pphDesember;

            $d->update([
                'pph21' => $pphDesember,
                'total' => $total,
            ]);

            $updated++;
        }

        return response()->json([
            'message' => 'Rekonsiliasi PPh21 tahunan berhasil (periode Desember)',
            'data' => [
                'penggajian_periode_id' => (int) $periodeId,
                'tahun' => $tahun,
                'updated' => $updated,
                'dilewati' => $dilewati,
            ],
        ]);
    }

    // =========================
    // PRIVATE: KALKULASI PPH21 MINIMAL (ANNUALIZED)
    // =========================
    private function kalkulasiPph21Minimal(PenggajianDetail $detail): array
    {
        $pegawai = $detail->pegawai;

        $brutoBulan = (float) $detail->gaji_pokok + (float) $detail->tunjangan;

        $biayaJabatan = 0.05 * $brutoBulan;
        if ($biayaJabatan > 500000) $biayaJabatan = 500000;

        $netoBulan = max(0, $brutoBulan - $biayaJabatan);
        $netoTahun = $netoBulan * 12;

        $ptkp = $this->nilaiPtkp($pegawai->status_ptkp ?: 'TK/0');

        $pkpTahun = max(0, $netoTahun - $ptkp);
        $pkpTahun = floor($pkpTahun / 1000) * 1000;

        $pphTahun = $this->pphProgresifPasal17($pkpTahun);

        if (empty($pegawai->npwp)) {
            $pphTahun = $pphTahun * 1.2;
        }

        $pphBulan = floor(($pphTahun / 12));

        $totalSetelah = ((float) $detail->gaji_pokok + (float) $detail->tunjangan)
            - (float) $detail->potongan
            - (float) $pphBulan;

        return [
            'bruto_bulanan' => $brutoBulan,
            'biaya_jabatan_bulanan' => $biayaJabatan,
            'neto_bulanan' => $netoBulan,
            'neto_tahunan' => $netoTahun,
            'ptkp_tahunan' => $ptkp,
            'pkp_tahunan' => $pkpTahun,
            'pph21_tahunan' => $pphTahun,
            'pph21_bulanan' => $pphBulan,
            'total_bulanan_setelah_pph21' => $totalSetelah,
            'catatan' => 'Metode annualized progresif (minimal).',
        ];
    }

    // =========================
    // MODUL: KOMPONEN (BONUS/PROJECT/POTONGAN)
    // =========================
    public function tambahKomponen(Request $r, $detailId)
    {
        $d = PenggajianDetail::with('periode')->findOrFail($detailId);
        if ($d->periode->status !== 'DRAFT') return response()->json(['message' => 'Hanya bisa edit saat DRAFT'], 422);

        $r->validate([
            'nama' => 'required|string',
            'nilai' => 'required|numeric|min:0',
            'jenis' => 'required|in:TUNJANGAN,POTONGAN'
        ]);

        \App\Models\PenggajianKomponen::create([
            'penggajian_detail_id' => $detailId,
            'nama' => $r->nama,
            'nilai' => $r->nilai,
            'jenis' => $r->jenis,
            'dibuat_oleh' => optional($r->user())->id
        ]);

        $this->rehitungTotalDetail($d->id);

        return response()->json(['message' => 'Komponen berhasil ditambahkan']);
    }

    public function hapusKomponen($id)
    {
        $komponen = \App\Models\PenggajianKomponen::findOrFail($id);
        $d = PenggajianDetail::with('periode')->findOrFail($komponen->penggajian_detail_id);
        
        if ($d->periode->status !== 'DRAFT') return response()->json(['message' => 'Hanya bisa edit saat DRAFT'], 422);

        $komponen->delete();
        $this->rehitungTotalDetail($d->id);

        return response()->json(['message' => 'Komponen berhasil dihapus']);
    }

    private function rehitungTotalDetail($detailId)
    {
        $d = PenggajianDetail::findOrFail($detailId);
        
        // Sum components
        $totalTunjangan = \App\Models\PenggajianKomponen::where('penggajian_detail_id', $detailId)
            ->where('jenis', 'TUNJANGAN')->sum('nilai');
            
        $totalPotonganLain = \App\Models\PenggajianKomponen::where('penggajian_detail_id', $detailId)
            ->where('jenis', 'POTONGAN')->sum('nilai');

        $d->tunjangan = $totalTunjangan;
        $d->potongan = $totalPotonganLain; 
        
        $d->total = $d->gaji_pokok + $totalTunjangan - $totalPotonganLain - $d->pph21;
        $d->save();
    }



    private function nilaiPtkp(string $status): float
    {
        $status = strtoupper(trim($status));

        $map = [
            'TK/0' => 54000000,
            'TK/1' => 58500000,
            'TK/2' => 63000000,
            'TK/3' => 67500000,

            'K/0'  => 58500000,
            'K/1'  => 63000000,
            'K/2'  => 67500000,
            'K/3'  => 72000000,

            'K/I/0' => 108000000,
            'K/I/1' => 112500000,
            'K/I/2' => 117000000,
            'K/I/3' => 121500000,
        ];

        return (float) ($map[$status] ?? 54000000);
    }

    private function pphProgresifPasal17(float $pkpTahun): float
    {
        $sisa = $pkpTahun;
        $pph = 0;

        $lapis = [
            [60000000, 0.05],
            [250000000, 0.15],
            [500000000, 0.25],
            [5000000000, 0.30],
            [INF, 0.35],
        ];

        $batasSebelumnya = 0;

        foreach ($lapis as [$batas, $tarif]) {
            if ($sisa <= 0) break;

            $kapasitas = $batas - $batasSebelumnya;
            $kena = min($sisa, $kapasitas);

            $pph += $kena * $tarif;

            $sisa -= $kena;
            $batasSebelumnya = $batas;
        }

        return $pph;
    }

    // =========================
    // PRIVATE: NORMALISASI PTKP UNTUK REKONSILIASI (TK0/K1 -> TK/0/K/1)
    // =========================
    private function normalisasiPtkpUntukTahunan(?string $status): string
    {
        $s = strtoupper(trim((string) $status));
        $s = preg_replace('/[^A-Z0-9\/]/', '', $s);

        if (preg_match('/^(TK|K)\/[0-3]$/', $s)) return $s;

        if (preg_match('/^(TK|K)([0-3])$/', $s, $m)) {
            return $m[1] . '/' . $m[2];
        }

        return 'TK/0';
    }

    private function nilaiPtkpTahunan(string $statusPtkpNormal): float
    {
        $map = [
            'TK/0' => 54000000,
            'TK/1' => 58500000,
            'TK/2' => 63000000,
            'TK/3' => 67500000,

            'K/0'  => 58500000,
            'K/1'  => 63000000,
            'K/2'  => 67500000,
            'K/3'  => 72000000,
        ];

        return (float) ($map[$statusPtkpNormal] ?? 54000000);
    }
    
}
