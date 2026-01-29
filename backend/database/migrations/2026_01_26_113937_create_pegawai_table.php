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
        Schema::create('pegawai', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pengguna_id')->nullable()->constrained('users');
            $table->string('kode_pegawai')->unique();
            $table->string('nama_lengkap');
            $table->date('tanggal_masuk');
            $table->enum('status_kerja', ['PERMANEN','KONTRAK','PROBATION']);
            $table->enum('jenis_penggajian', ['BULANAN','PROYEK','CAMPURAN']);
            $table->string('nama_bank')->nullable();
            $table->string('nomor_rekening')->nullable();
            $table->string('npwp')->nullable();
            $table->string('status_ptkp')->nullable();
            $table->boolean('aktif')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pegawai');
    }
};
