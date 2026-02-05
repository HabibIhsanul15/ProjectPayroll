<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class JurnalUmumDetail extends Model
{
    protected $fillable = [
        'jurnal_umum_id',
        'coa_id',
        'debet',
        'kredit',
        'keterangan'
    ];

    public function jurnal()
    {
        return $this->belongsTo(JurnalUmum::class, 'jurnal_umum_id');
    }

    public function coa()
    {
        return $this->belongsTo(Coa::class);
    }
}
