<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RiwayatPenempatan extends Model
{
    protected $table = 'riwayat_penempatan';

    protected $fillable = [
        'pegawai_id','jabatan_id','gaji_pokok',
        'berlaku_mulai','berlaku_sampai','jenis_perubahan','catatan'
    ];

     public function jabatan()
    {
        return $this->belongsTo(Jabatan::class, 'jabatan_id');
    }
}
