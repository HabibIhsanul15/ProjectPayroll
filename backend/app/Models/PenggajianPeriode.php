<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PenggajianPeriode extends Model
{
    protected $table = 'penggajian_periode';

    protected $fillable = [
        'periode','status','dibuat_oleh',
        'diajukan_pada','diajukan_oleh',
        'disetujui_pada','disetujui_oleh',
        'dibayar_pada','dibayar_oleh',
        'catatan',
    ];

    public function detail()
    {
        return $this->hasMany(PenggajianDetail::class, 'penggajian_periode_id');
    }
}
