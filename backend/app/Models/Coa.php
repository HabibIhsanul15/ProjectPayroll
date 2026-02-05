<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Coa extends Model
{
    protected $fillable = ['kode_akun', 'nama_akun', 'kategori', 'posisi_normal'];
}
