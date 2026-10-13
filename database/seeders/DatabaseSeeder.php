<?php

namespace Database\Seeders;

use App\Models\Team;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\PermissionRegistrar;
use Spatie\Permission\Models\Role;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        /*
         * -------------------------------------------------------------
         * 1. CORE DATA
         * -------------------------------------------------------------
         */

        $this->call([
            CurrenciesTableSeeder::class,
            CountriesTableSeeder::class,
            ChannelSeeder::class,
            CarrierSeeder::class,
            LegalsPageTableSeeder::class,
        ]);

        /*
         * -------------------------------------------------------------
         * 2. PLATFORM USER
         * -------------------------------------------------------------
         *
         * is_super_admin is the authoritative platform flag.
         * The Spatie SuperAdmin role is an internal authorization role.
         */

        $admin = User::query()->firstOrCreate(
            [
                'email' => 'avelez65@icloud.com',
            ],
            [
                'name' => 'Allan Velez',
                'password' => Hash::make('password'),
                'is_super_admin' => true,
            ],
        );

        if (! $admin->is_super_admin) {
            $admin->forceFill(['is_super_admin' => true])->save();
        }

        /*
         * -------------------------------------------------------------
         * 3. TENANT
         * -------------------------------------------------------------
         */

        $team = Team::query()->firstOrCreate(
            [
                'slug' => 'zx-hub',
            ],
            [
                'name' => 'ZX Hub',
                'is_personal' => false,
            ],
        );

        /*
         * -------------------------------------------------------------
         * 4. TEAM MEMBERSHIP
         * -------------------------------------------------------------
         */

        if (! $team->members()->where('user_id', $admin->id)->exists()) {
            $team->members()->attach($admin->id, ['role' => 'Owner',]);
        }

        if (! $admin->current_team_id) {
            $admin->forceFill(['current_team_id' => $team->id,])->save();
        }

        /*
         * -------------------------------------------------------------
         * 5. ROLES + PERMISSIONS
         * -------------------------------------------------------------
         */

        $this->call(RolesAndPermissionsSeeder::class);

        /*
         * -------------------------------------------------------------
         * 6. SUPERADMIN ROLE
         * -------------------------------------------------------------
         */

        app(PermissionRegistrar::class)->setPermissionsTeamId(null);

        $superAdminRole = Role::query()
            ->where('name', 'SuperAdmin')
            ->where('guard_name', 'web')
            ->firstOrFail();

        if (! $admin->hasRole($superAdminRole)) {
            
            app(PermissionRegistrar::class)->setPermissionsTeamId($team->id);
            
            $admin->unsetRelation('roles');
            $admin->unsetRelation('permissions');
            $admin->roles()->syncWithoutDetaching([
                $superAdminRole->id => ['team_id' => $team->id]
            ]);
            
            $admin->unsetRelation('roles');
            $admin->unsetRelation('permissions');
        }

        /*
         * -------------------------------------------------------------
         * 7. OWNER ROLE
         * -------------------------------------------------------------
         */

        app(PermissionRegistrar::class)->setPermissionsTeamId($team->id);

        $ownerRole = Role::query()
            ->where('name', 'Owner')
            ->where('team_id', $team->id)
            ->where('guard_name', 'web')
            ->firstOrFail();

        if (! $admin->hasRole($ownerRole)) {
            app(PermissionRegistrar::class)->setPermissionsTeamId($team->id);
            
            $admin->unsetRelation('roles');
            $admin->unsetRelation('permissions');
            $admin->assignRole($ownerRole);
        }

        /*
         * -------------------------------------------------------------
         * 8. STAFF USER
         * -------------------------------------------------------------
         *
         * This user is NOT a SuperAdmin.
         */

        $staff = User::query()->firstOrCreate(
            [
                'email' => 'staff@zx-hub.com',
            ],
            [
                'name' => 'Admin',
                'password' => Hash::make('password'),
                'is_super_admin' => false,
            ],
        );

        if ($staff->is_super_admin) {
            $staff->forceFill(['is_super_admin' => false,])->save();
        }

        if (! $team->members()->where('user_id', $staff->id)->exists()) {
            $team->members()->attach($staff->id,['role' => 'Member',],);
        }

        if (! $staff->current_team_id) {
            $staff->forceFill(['current_team_id' => $team->id,])->save();
        }

        /*
         * -------------------------------------------------------------
         * 9. STAFF TEAM ROLE
         * -------------------------------------------------------------
         */

        app(PermissionRegistrar::class)->setPermissionsTeamId($team->id);

        $memberRole = Role::query()
            ->where('name', 'Member')
            ->where('team_id', $team->id)
            ->where('guard_name', 'web')
            ->firstOrFail();

        $staff->syncRoles([
            $memberRole,
        ]);

        /*
         * -------------------------------------------------------------
         * 10. PLANS
         * -------------------------------------------------------------
         */

        $this->call(PlanSeeder::class);

        /*
         * Restore a neutral permission context.
         */

        app(PermissionRegistrar::class)->setPermissionsTeamId(null);

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }
}