<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class JurnalUmum extends Model
{
    protected $fillable = [
        'nomor_jurnal',
        'tanggal',
        'keterangan',
        'referensi_tipe',
        'referensi_id',
        'total_debet',
        'total_kredit',
        'dibuat_oleh'
    ];

    public function details()
    {
        return $this->hasMany(JurnalUmumDetail::class);
    }

    public function pembuat()
    {
        return $this->belongsTo(User::class, 'dibuat_oleh');
    }
}
