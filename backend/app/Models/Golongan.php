<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Golongan extends Model
{
    protected $table = 'golongan';
    protected $fillable = ['kode_golongan','nama_golongan','gaji_pokok_min','gaji_pokok_maks'];
}
