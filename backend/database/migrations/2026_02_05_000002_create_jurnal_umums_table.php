<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('jurnal_umums', function (Blueprint $blueprint) {
            $blueprint->id();
            $blueprint->string('nomor_jurnal')->unique();
            $blueprint->date('tanggal');
            $blueprint->string('keterangan');
            $blueprint->string('referensi_tipe')->nullable(); // e.g., 'PENGGAJIAN_PERIODE'
            $blueprint->unsignedBigInteger('referensi_id')->nullable();
            $blueprint->decimal('total_debet', 15, 2)->default(0);
            $blueprint->decimal('total_kredit', 15, 2)->default(0);
            $blueprint->foreignId('dibuat_oleh')->nullable()->constrained('users');
            $blueprint->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('jurnal_umums');
    }
};
