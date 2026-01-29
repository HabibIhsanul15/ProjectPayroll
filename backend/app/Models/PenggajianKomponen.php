<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PenggajianKomponen extends Model
{
    protected $table = 'penggajian_komponen';

    protected $fillable = [
        'penggajian_detail_id','jenis','nama','nilai','dibuat_oleh'
    ];

    public function detail()
    {
        return $this->belongsTo(PenggajianDetail::class, 'penggajian_detail_id');
    }
}
