<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\User;

class SuperAdminSeeder extends Seeder
{
    public function run(): void
    {
        // Gunakan role HCGA sebagai placeholder, tapi punya akses ke semua karena emailnya sakti
        User::updateOrCreate(
            ['email' => 'super@test.com'],
            [
                'name' => 'Super Admin',
                'password' => Hash::make('password'),
                'peran' => 'HCGA', 
            ]
        );
    }
}
