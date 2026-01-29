<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('penggajian_detail', function (Blueprint $table) {
            $table->id();

            $table->foreignId('penggajian_periode_id')
                ->constrained('penggajian_periode')
                ->cascadeOnDelete();

            $table->foreignId('pegawai_id')->constrained('pegawai')->cascadeOnDelete();
            $table->foreignId('jabatan_id')->constrained('jabatan');

            // snapshot nilai periode tsb
            $table->decimal('gaji_pokok', 15, 2);

            // komponen sederhana dulu
            $table->decimal('tunjangan', 15, 2)->default(0);
            $table->decimal('potongan', 15, 2)->default(0);
            $table->decimal('pph21', 15, 2)->default(0);

            $table->decimal('total', 15, 2)->default(0);

            $table->timestamps();

            // 1 pegawai 1 slip per periode
            $table->unique(['penggajian_periode_id', 'pegawai_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('penggajian_detail');
    }
};
