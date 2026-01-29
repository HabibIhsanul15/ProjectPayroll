<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Departemen;
use App\Models\Golongan;

class Jabatan extends Model
{
    protected $table = 'jabatan';
    protected $fillable = ['departemen_id','golongan_id','nama_jabatan'];

    public function departemen()
    {
        return $this->belongsTo(Departemen::class, 'departemen_id');
    }

    public function golongan()
    {
        return $this->belongsTo(Golongan::class, 'golongan_id');
    }
}