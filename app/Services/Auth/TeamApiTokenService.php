<?php

namespace App\Services\Auth;

use App\Models\Team;
use App\Models\User;
use Illuminate\Auth\Access\AuthorizationException;
use Laravel\Sanctum\NewAccessToken;

class TeamApiTokenService
{
    public function create(
        User $user,
        Team $team,
        string $name,
        array $abilities = ['*'],
    ): NewAccessToken {
        if (! $user->belongsToTeam($team)) {
            throw new AuthorizationException(
                'The user does not belong to the selected team.'
            );
        }

        $token = $user->createToken(
            $name,
            $abilities,
        );

        $token->accessToken
            ->forceFill([
                'team_id' => $team->id,
            ])
            ->save();

        return $token;
    }

    public function revoke(
        User $user,
        int $tokenId,
    ): void {
        $user->tokens()
            ->whereKey($tokenId)
            ->delete();
    }

    public function revokeForTeam(
        User $user,
        Team $team,
    ): void {
        $user->tokens()
            ->where('team_id', $team->id)
            ->delete();
    }
}
