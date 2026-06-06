<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Spatie\Permission\PermissionRegistrar;

class SetCurrentTeamPermissions
{
    public function handle(Request $request, Closure $next)
    {
        $team = $request->user()?->currentTeam;

        if ($team) {
            app(PermissionRegistrar::class)
                ->setPermissionsTeamId($team->id);
        }

        return $next($request);
    }
}