<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DirekturSeeder extends Seeder
{
    public function run(): void
    {
        // Cek apakah user sudah ada
        if (!User::where('email', 'boss@company.com')->exists()) {
            User::create([
                'name' => 'Bapak Direktur',
                'email' => 'boss@company.com',
                'password' => Hash::make('password'),
                'peran' => 'DIREKTUR',
            ]);
            $this->command->info('User DIREKTUR berhasil dibuat: boss@company.com / password');
        } else {
            $this->command->warn('User DIREKTUR sudah ada.');
        }
    }
}
