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
        Schema::create('pph21_ter_bulanan', function (Blueprint $table) {
    $table->id();
    $table->enum('kategori', ['A','B','C']);
    $table->unsignedBigInteger('bruto_bawah'); // rupiah
    $table->unsignedBigInteger('bruto_atas')->nullable(); // null = open ended
    $table->decimal('tarif', 6, 4); // contoh 0.0700 untuk 7%
    $table->timestamps();

    $table->index(['kategori', 'bruto_bawah', 'bruto_atas']);
});

    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pph21_ter_bulanan');
    }
};
