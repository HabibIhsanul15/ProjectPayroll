<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('penggajian_periode', function (Blueprint $table) {
            $table->id();

            // format: YYYY-MM
            $table->string('periode', 7)->unique();

            $table->enum('status', [
                'DRAFT',
                'MENUNGGU_APPROVAL_DIREKTUR',
                'DISETUJUI',
                'DIBAYARKAN',
            ])->default('DRAFT');

            // audit (pakai id users)
            $table->unsignedBigInteger('dibuat_oleh')->nullable();
            $table->timestamp('diajukan_pada')->nullable();
            $table->unsignedBigInteger('diajukan_oleh')->nullable();
            $table->timestamp('disetujui_pada')->nullable();
            $table->unsignedBigInteger('disetujui_oleh')->nullable();
            $table->timestamp('dibayar_pada')->nullable();
            $table->unsignedBigInteger('dibayar_oleh')->nullable();

            $table->text('catatan')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('penggajian_periode');
    }
};
