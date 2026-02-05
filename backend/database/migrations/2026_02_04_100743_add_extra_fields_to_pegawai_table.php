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
        Schema::table('pegawai', function (Blueprint $table) {
            $table->string('atas_nama_rekening')->nullable()->after('nomor_rekening');
            $table->text('alamat')->nullable()->after('aktif');
            $table->string('no_telepon')->nullable()->after('alamat');
            $table->string('email_pribadi')->nullable()->after('no_telepon');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('pegawai', function (Blueprint $table) {
            $table->dropColumn(['atas_nama_rekening', 'alamat', 'no_telepon', 'email_pribadi']);
        });
    }
};
