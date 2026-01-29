<?php

namespace App\Policies;

use App\Models\PenggajianPeriode;
use App\Models\User;

class PenggajianPeriodePolicy
{
    public function ubah(User $user, PenggajianPeriode $periode): bool
    {
        $peran = strtoupper((string) ($user->peran ?? ''));
        if ($peran !== 'FAT') return false;

        return $periode->status === 'DRAFT';
    }

    // Laravel native ability
    public function update(User $user, PenggajianPeriode $periode): bool
    {
        return $this->ubah($user, $periode);
    }
}
