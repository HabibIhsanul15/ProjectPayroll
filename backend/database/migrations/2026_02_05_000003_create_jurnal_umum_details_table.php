<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('jurnal_umum_details', function (Blueprint $blueprint) {
            $blueprint->id();
            $blueprint->foreignId('jurnal_umum_id')->constrained('jurnal_umums')->onDelete('cascade');
            $blueprint->foreignId('coa_id')->constrained('coas');
            $blueprint->decimal('debet', 15, 2)->default(0);
            $blueprint->decimal('kredit', 15, 2)->default(0);
            $blueprint->string('keterangan')->nullable();
            $blueprint->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('jurnal_umum_details');
    }
};
