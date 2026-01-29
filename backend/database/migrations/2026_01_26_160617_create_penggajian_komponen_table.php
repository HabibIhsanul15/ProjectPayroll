<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('penggajian_komponen', function (Blueprint $table) {
            $table->id();

            $table->foreignId('penggajian_detail_id')
                ->constrained('penggajian_detail')
                ->cascadeOnDelete();

            $table->enum('jenis', ['TUNJANGAN','POTONGAN']);
            $table->string('nama', 100);
            $table->decimal('nilai', 15, 2);

            $table->unsignedBigInteger('dibuat_oleh')->nullable();

            $table->timestamps();

            $table->index(['penggajian_detail_id','jenis']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('penggajian_komponen');
    }
};
