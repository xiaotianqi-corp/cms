<?php

namespace Database\Seeders;

use App\Models\Team;
use App\Models\User;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class RolesAndPermissionsSeeder extends Seeder
{
    /**
     * All permissions available in the application.
     */
    protected array $permissions = [
        'update-team',
        'delete-team',
        'add-member',
        'update-member',
        'remove-member',
        'create-invitation',
        'cancel-invitation',
    ];

    /**
     * Role definitions with their permissions.
     * Owner gets all permissions; adjust others as needed.
     */
    protected array $roles = [
        'Owner' => [
            'update-team',
            'delete-team',
            'add-member',
            'update-member',
            'remove-member',
            'create-invitation',
            'cancel-invitation',
        ],
        'Admin' => [
            'update-team',
            'add-member',
            'update-member',
            'remove-member',
            'create-invitation',
            'cancel-invitation',
        ],
        'Member' => [],
    ];

    public function run(): void
    {
        // Reset cached roles and permissions
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        // Create global (non-team) permissions first
        foreach ($this->permissions as $permission) {
            Permission::firstOrCreate([
                'name' => $permission,
                'guard_name' => 'web',
            ]);
        }

        // Create roles and assign permissions per team
        Team::each(function (Team $team) {
            $this->seedTeamRoles($team);
        });
    }

    protected function seedTeamRoles(Team $team): void
    {
        // Spatie team feature: set the team context
        app(PermissionRegistrar::class)->setPermissionsTeamId($team->id);

        foreach ($this->roles as $roleName => $permissionNames) {
            $role = Role::firstOrCreate([
                'name' => $roleName,
                'team_id' => $team->id,
                'guard_name' => 'web',
            ]);

            $permissions = Permission::whereIn('name', $permissionNames)->get();
            $role->syncPermissions($permissions);
        }

        // Assign Owner role to the team owner user
        $owner = $team->owner();
        if ($owner) {
            $owner->assignRole(
                Role::where('name', 'Owner')->where('team_id', $team->id)->first()
            );
        }
    }
}