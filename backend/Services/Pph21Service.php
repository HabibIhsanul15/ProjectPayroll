<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;

class Pph21Service
{
    /**
     * Normalisasi format PTKP user kamu:
     * "TK0" -> "TK/0", "K1" -> "K/1"
     */
    public function normalisasiStatusPtkp(?string $status): string
    {
        $s = strtoupper(trim((string) $status));
        if ($s === '') return 'TK/0';

        // buang karakter aneh (spasi, titik, dsb)
        $s = preg_replace('/[^A-Z0-9\/]/', '', $s);

        // kalau sudah format TK/0 atau K/1, biarin
        if (preg_match('/^(TK|K)\/[0-3]$/', $s)) {
            return $s;
        }

        // format TK0 / K1
        if (preg_match('/^(TK|K)([0-3])$/', $s, $m)) {
            return $m[1] . '/' . $m[2];
        }

        // fallback aman
        return 'TK/0';
    }

    public function kategoriTer(string $statusPtkp): string
    {
        return match ($statusPtkp) {
            'TK/0', 'TK/1', 'K/0' => 'A',
            'TK/2', 'TK/3', 'K/1', 'K/2' => 'B',
            'K/3' => 'C',
            default => 'A',
        };
    }

    /**
     * Hitung PPh21 TER bulanan:
     * pph21 = tarif * bruto_bulanan
     */
    public function hitungTerBulanan(?string $statusPtkpRaw, float $brutoBulanan): array
    {
        $status = $this->normalisasiStatusPtkp($statusPtkpRaw);
        $kategori = $this->kategoriTer($status);

        $bruto = (int) round(max(0, $brutoBulanan));

        $row = DB::table('pph21_ter_bulanan')
            ->where('kategori', $kategori)
            ->where('bruto_bawah', '<=', $bruto)
            ->where(function ($q) use ($bruto) {
                $q->whereNull('bruto_atas')->orWhere('bruto_atas', '>=', $bruto);
            })
            ->orderByDesc('bruto_bawah')
            ->first();

        if (!$row) {
            // fallback aman: 0
            return [
                'status_ptkp_normal' => $status,
                'kategori' => $kategori,
                'tarif' => 0.0,
                'pph21' => 0.0,
            ];
        }

        $tarif = (float) $row->tarif; // contoh 0.0700
        $pph21 = round($bruto * $tarif, 2);

        return [
            'status_ptkp_normal' => $status,
            'kategori' => $kategori,
            'tarif' => $tarif,
            'pph21' => $pph21,
        ];
    }
}
