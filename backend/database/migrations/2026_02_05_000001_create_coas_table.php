<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('coas', function (Blueprint $blueprint) {
            $blueprint->id();
            $blueprint->string('kode_akun')->unique();
            $blueprint->string('nama_akun');
            $blueprint->enum('kategori', ['ASET', 'LIABILITAS', 'EKUITAS', 'PENDAPATAN', 'BEBAN']);
            $blueprint->enum('posisi_normal', ['DEBET', 'KREDIT']);
            $blueprint->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('coas');
    }
};
