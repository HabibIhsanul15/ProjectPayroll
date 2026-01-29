<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Pegawai extends Model
{
    protected $table = 'pegawai';

    protected $fillable = [
        'pengguna_id',
        'kode_pegawai',
        'nama_lengkap',
        'tanggal_masuk',
        'status_kerja',
        'jenis_penggajian',
        'nama_bank',
        'nomor_rekening',
        'npwp',
        'status_ptkp',
        'aktif'
    ];
    public function penempatan()
{
    return $this->hasMany(RiwayatPenempatan::class, 'pegawai_id');
}

public function user()
{
    return $this->belongsTo(User::class, 'pengguna_id');
}

}
