<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class CekPeran
{
    public function handle(Request $request, Closure $next, ...$peran)
    {
        $user = $request->user();

        if (!$user) {
            abort(401, 'Belum login');
        }



        if (!in_array($user->peran, $peran)) {
            abort(403, 'Akses ditolak');
        }

        return $next($request);
    }
}
