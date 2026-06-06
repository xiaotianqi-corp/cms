<?php

namespace App\Actions\Teams;

use App\Models\Team;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class CreateTeam
{
    public function handle(User $user, string $name, bool $isPersonal = false): Team
    {
        return DB::transaction(function () use ($user, $name, $isPersonal) {
            $team = Team::create([
                'name' => $name,
                'is_personal' => $isPersonal,
            ]);

            $team->memberships()->create([
                'user_id' => $user->id,
                'role' => 'Owner',
            ]);

            app(PermissionRegistrar::class)->setPermissionsTeamId($team->id);

            $ownerRole = Role::firstOrCreate(
                ['name' => 'Owner', 'team_id' => $team->id],
                ['guard_name' => 'web']
            );

            $user->assignRole($ownerRole);
            $user->switchTeam($team);

            return $team;
        });
    }
}