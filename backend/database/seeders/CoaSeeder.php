<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Coa;

class CoaSeeder extends Seeder
{
    public function run(): void
    {
        $data = [
            ['kode_akun' => '5101', 'nama_akun' => 'Beban Gaji & Upah', 'kategori' => 'BEBAN', 'posisi_normal' => 'DEBET'],
            ['kode_akun' => '2101', 'nama_akun' => 'Hutang Gaji', 'kategori' => 'LIABILITAS', 'posisi_normal' => 'KREDIT'],
            ['kode_akun' => '2102', 'nama_akun' => 'Hutang PPh 21', 'kategori' => 'LIABILITAS', 'posisi_normal' => 'KREDIT'],
            ['kode_akun' => '1101', 'nama_akun' => 'Kas & Bank', 'kategori' => 'ASET', 'posisi_normal' => 'DEBET'],
        ];

        foreach ($data as $d) {
            Coa::updateOrCreate(['kode_akun' => $d['kode_akun']], $d);
        }
    }
}
