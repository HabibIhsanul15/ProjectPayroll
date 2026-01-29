<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AuthController extends Controller
{
    public function login(Request $r)
    {
        $cred = $r->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        if (!Auth::attempt($cred)) {
            return response()->json(['message' => 'Login gagal'], 401);
        }

        /** @var \App\Models\User $user */
        $user = $r->user(); // ini pasti instance App\Models\User

        // optional: biar token gak numpuk
        $user->tokens()->delete();

        $token = $user->createToken('api')->plainTextToken;

        return response()->json([
            'message' => 'Login berhasil',
            'token' => $token,
            'token_type' => 'Bearer',
            'peran' => $user->peran,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'peran' => $user->peran,
            ],
        ]);
    }
}
