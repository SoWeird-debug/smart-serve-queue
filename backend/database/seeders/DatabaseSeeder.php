<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Reference configuration only. No patient, staff, appointment, or
        // clinical data is seeded into the production database.
        $now = now();
        $provinceId = DB::table('provinces')->updateOrInsert(
            ['name' => 'Isabela'],
            ['updated_at' => $now, 'created_at' => $now],
        )
            ? DB::table('provinces')->where('name', 'Isabela')->value('id')
            : null;

        foreach ([
            'Alicia', 'Angadanan', 'Aurora', 'Benito Soliven', 'Burgos',
            'Cabagan', 'Cabatuan', 'Cauayan City', 'Cordon', 'Delfin Albano',
            'Dinapigue', 'Divilacan', 'Echague', 'Gamu', 'Ilagan City',
            'Jones', 'Luna', 'Maconacon', 'Mallig', 'Naguilian', 'Palanan',
            'Quezon', 'Quirino', 'Ramon', 'Reina Mercedes', 'Roxas',
            'San Agustin', 'San Guillermo', 'San Isidro', 'San Manuel',
            'San Mariano', 'San Mateo', 'San Pablo', 'Santa Maria',
            'Santiago City', 'Santo Tomas', 'Tumauini',
        ] as $municipality) {
            DB::table('municipalities')->updateOrInsert(
                ['province_id' => $provinceId, 'name' => $municipality],
                ['updated_at' => $now, 'created_at' => $now],
            );
        }

        // Verified reference choices already used by the registration UI. The
        // remaining Isabela barangays will be imported from the PSGC source in
        // the dedicated directory-sync step; no patient address is invented.
        $barangaysByMunicipality = [
            'Jones' => [
                'Abulan', 'Addalam', 'Arubub', 'Bannawag', 'Bantay',
                'Barangay I', 'Barangay II', 'Barangcuag', 'Dalibubon',
                'Daligan', 'Diarao', 'Dibuluan', 'Dicamay I', 'Dicamay II',
                'Dipangit', 'Disimpit', 'Divinan', 'Dumawing', 'Fugu',
                'Lacab', 'Linamanan', 'Linomot', 'Malannit', 'Minuri',
                'Namnama', 'Napaliong', 'Palagao', 'Papan Este',
                'Papan Weste', 'Payac', 'Pungpongan', 'San Antonio',
                'San Isidro', 'San Jose', 'San Roque', 'San Sebastian',
                'San Vicente', 'Santa Isabel', 'Santo Domingo', 'Tupax',
                'Usol', 'Villa Bello',
            ],
            'Santiago City' => [
                'Abra', 'Ambalatungan', 'Balintocatoc', 'Baluarte',
                'Bannawag Norte', 'Batal', 'Buenavista', 'Cabulay',
                'Calao East', 'Calao West', 'Calaocan', 'Villa Gonzaga',
                'Centro East', 'Centro West', 'Divisoria', 'Dubinan East',
                'Dubinan West', 'Luna', 'Mabini', 'Malvar', 'Nabbuan',
                'Naggasican', 'Patul', 'Plaridel', 'Rizal', 'Rosario',
                'Sagana', 'Salvador', 'San Andres', 'San Isidro', 'San Jose',
                'Sinili', 'Sinsayon', 'Santa Rosa', 'Victory Norte',
                'Victory Sur', 'Villasis',
            ],
        ];
        foreach ($barangaysByMunicipality as $municipality => $barangays) {
            $municipalityId = DB::table('municipalities')
                ->where('province_id', $provinceId)
                ->where('name', $municipality)
                ->value('id');
            foreach ($barangays as $barangay) {
                DB::table('barangays')->updateOrInsert(
                    ['municipality_id' => $municipalityId, 'name' => $barangay],
                    ['updated_at' => $now, 'created_at' => $now],
                );
            }
        }

        foreach ([
            ['name' => 'General Clinic', 'building' => 'Super Health Center'],
            ['name' => 'Animal Bite Center', 'building' => 'Animal Bite Center building'],
            ['name' => 'General Pharmacy', 'building' => 'Super Health Center'],
        ] as $area) {
            DB::table('care_areas')->updateOrInsert(
                ['name' => $area['name']],
                [...$area, 'is_active' => true, 'updated_at' => $now, 'created_at' => $now],
            );
        }

        $generalClinicId = DB::table('care_areas')->where('name', 'General Clinic')->value('id');
        $animalBiteId = DB::table('care_areas')->where('name', 'Animal Bite Center')->value('id');
        foreach ([
            ['name' => 'General Consultation', 'description' => 'Doctor consultation for common illnesses', 'duration_minutes' => 20, 'daily_capacity' => 60, 'care_area_id' => $generalClinicId, 'follow_up_eligible' => false],
            ['name' => 'Prenatal Check-up', 'description' => 'Maternal health monitoring', 'duration_minutes' => 30, 'daily_capacity' => 25, 'care_area_id' => $generalClinicId, 'follow_up_eligible' => false],
            ['name' => 'Family Planning', 'description' => 'Private counseling and family planning services', 'duration_minutes' => 25, 'daily_capacity' => 30, 'care_area_id' => $generalClinicId, 'follow_up_eligible' => false],
            ['name' => 'Mental Health', 'description' => 'Confidential mental health assessment and support', 'duration_minutes' => 30, 'daily_capacity' => 18, 'care_area_id' => $generalClinicId, 'follow_up_eligible' => false],
            ['name' => 'Animal Bite', 'description' => 'Animal bite assessment, wound care, and vaccination referral', 'duration_minutes' => 30, 'daily_capacity' => 20, 'care_area_id' => $animalBiteId, 'follow_up_eligible' => true],
            ['name' => 'Child Immunization', 'description' => 'Routine childhood vaccines and immunization follow-up', 'duration_minutes' => 15, 'daily_capacity' => 40, 'care_area_id' => $generalClinicId, 'follow_up_eligible' => false],
            ['name' => 'Dental Care', 'description' => 'Oral check-up, dental care, and tooth extraction', 'duration_minutes' => 25, 'daily_capacity' => 20, 'care_area_id' => $generalClinicId, 'follow_up_eligible' => false],
            ['name' => 'Laboratory', 'description' => 'Blood, urine, and screening tests', 'duration_minutes' => 20, 'daily_capacity' => 35, 'care_area_id' => $generalClinicId, 'follow_up_eligible' => false],
            ['name' => 'Tuberculosis', 'description' => 'Tuberculosis screening, treatment, and DOTS follow-up', 'duration_minutes' => 15, 'daily_capacity' => 30, 'care_area_id' => $generalClinicId, 'follow_up_eligible' => false],
        ] as $service) {
            DB::table('services')->updateOrInsert(
                ['name' => $service['name']],
                [...$service, 'is_active' => true, 'updated_at' => $now, 'created_at' => $now],
            );
        }
    }
}
