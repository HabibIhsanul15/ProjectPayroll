<?php

namespace App\Providers;

use App\Models\PenggajianPeriode;
use App\Policies\PenggajianPeriodePolicy;
use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;

class AuthServiceProvider extends ServiceProvider
{
    protected $policies = [
        PenggajianPeriode::class => PenggajianPeriodePolicy::class,
    ];

    public function boot(): void
    {
        //
    }
}
