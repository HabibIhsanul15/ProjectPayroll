<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PenggajianDetail extends Model
{
    protected $table = 'penggajian_detail';

    protected $fillable = [
        'penggajian_periode_id','pegawai_id','jabatan_id',
        'gaji_pokok','tunjangan','potongan','pph21','total'
    ];

    public function periode()
    {
        return $this->belongsTo(PenggajianPeriode::class, 'penggajian_periode_id');
    }

    public function pegawai()
    {
        return $this->belongsTo(Pegawai::class, 'pegawai_id');
    }

    public function jabatan()
    {
        return $this->belongsTo(Jabatan::class, 'jabatan_id');
    }

public function komponen()
{
    return $this->hasMany(PenggajianKomponen::class, 'penggajian_detail_id');
}

    protected static function booted()
    {
        static::updating(function ($detail) {
            $detail->loadMissing('periode:id,status');
            
            if ($detail->periode && $detail->periode->status !== 'DRAFT') {
                // Pengecualian: Upload Bukti Transfer boleh dilakukan saat status DISETUJUI
                if ($detail->periode->status === 'DISETUJUI' && $detail->isDirty('bukti_transfer')) {
                    return;
                }

                throw new \Exception('Detail terkunci: periode bukan DRAFT');
            }
        });
    }


}
