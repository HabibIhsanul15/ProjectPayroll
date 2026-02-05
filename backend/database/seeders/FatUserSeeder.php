<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class FatUserSeeder extends Seeder
{
    public function run(): void
    {
        // Cek apakah user sudah ada
        if (!User::where('email', 'finance@company.com')->exists()) {
            User::create([
                'name' => 'Finance Staff',
                'email' => 'finance@company.com',
                'password' => Hash::make('password'),
                'peran' => 'FAT',
            ]);
            $this->command->info('User FAT berhasil dibuat: finance@company.com / password');
        } else {
            $this->command->warn('User FAT sudah ada.');
        }
    }
}
