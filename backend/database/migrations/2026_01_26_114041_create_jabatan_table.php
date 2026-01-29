<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('riwayat_penempatan', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pegawai_id')->constrained('pegawai');
            $table->foreignId('jabatan_id')->constrained('jabatan');
            $table->decimal('gaji_pokok', 15, 2);
            $table->date('berlaku_mulai');
            $table->date('berlaku_sampai')->nullable();
            $table->enum('jenis_perubahan', [
                'MASUK','PROMOSI','MUTASI','DEMOSI','PENYESUAIAN'
            ]);
            $table->text('catatan')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('jabatan');
    }
};
