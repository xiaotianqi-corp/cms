import { router, usePage } from '@inertiajs/react';
import CreateTeamModal from '@/components/create-team-modal';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useIsMobile } from '@/hooks/use-mobile';
import { switchMethod } from '@/routes/teams';
import type { Team } from '@/types';
import { HugeiconsIcon } from '@hugeicons/react';
import { Add01Icon, ArrowRight01Icon, CheckIcon, UserGroupIcon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';

type TeamSwitcherProps = {
    inHeader?: boolean;
};

export function TeamSwitcher({ inHeader = false }: TeamSwitcherProps) {
    const page = usePage();
    const isMobile = useIsMobile();
    const currentTeam = page.props.currentTeam;
    const teams = page.props.teams ?? [];

    const switchTeam = (team: Team) => {
        const previousTeamSlug = currentTeam?.slug;

        router.visit(switchMethod(team.slug), {
            onFinish: () => {
                if (!previousTeamSlug || typeof window === 'undefined') {
                    router.reload();

                    return;
                }

                const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;
                const segment = `/${previousTeamSlug}`;

                if (currentUrl.includes(segment)) {
                    router.visit(currentUrl.replace(segment, `/${team.slug}`), {
                        replace: true,
                    });

                    return;
                }

                router.reload();
            },
        });
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    data-test="team-switcher-trigger"
                    className={
                        inHeader
                            ? 'group h-8 gap-1 px-2'
                            : 'group w-full justify-start px-2 has-[>svg]:px-2 data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground'
                    }
                >
                    <HugeiconsIcon icon={UserGroupIcon}
                        className={
                            inHeader
                                ? 'hidden'
                                : 'hidden size-4 shrink-0 group-data-[collapsible=icon]:block'
                        }
                    />
                    <div
                        className={
                            inHeader
                                ? 'grid flex-1 text-left text-sm leading-tight'
                                : 'grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden'
                        }
                    >
                        <span
                            className={
                                inHeader
                                    ? 'max-w-[120px] truncate font-medium'
                                    : 'truncate font-semibold'
                            }
                        >
                            {currentTeam?.name ?? 'Select team'}
                        </span>
                    </div>
                    <HugeiconsIcon
                        icon={ArrowRight01Icon}
                        className="ml-auto size-4 transition-transform duration-200 group-data-[collapsible=icon]:hidden group-data-[state=open]:rotate-90"
                    />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                className={
                    inHeader
                        ? 'w-56'
                        : 'w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg'
                }
                side={inHeader ? undefined : isMobile ? 'bottom' : 'right'}
                align={inHeader ? 'end' : 'start'}
                sideOffset={inHeader ? undefined : 4}
            >
                <DropdownMenuLabel className="text-xs text-muted-foreground">
                    Teams
                </DropdownMenuLabel>
                {teams.map((team) => (
                    <DropdownMenuItem
                        key={team.id}
                        data-test="team-switcher-item"
                        className={
                            inHeader
                                ? 'cursor-pointer gap-2 px-2 py-0'
                                : 'cursor-pointer gap-2 px-2 py-0'
                        }
                        onSelect={() => switchTeam(team)}
                    >
                        {team.name}
                        {currentTeam?.id === team.id && (
                            <HugeiconsIcon icon={CheckIcon}
                                className={
                                    inHeader
                                        ? 'ml-auto size-4'
                                        : 'ml-auto h-4 w-4'
                                }
                            />
                        )}
                    </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <CreateTeamModal>
                    <DropdownMenuItem
                        data-test="team-switcher-new-team"
                        className={
                            inHeader
                                ? 'cursor-pointer gap-2 px-2 py-0'
                                : 'cursor-pointer gap-2 px-2 py-0 '
                        }
                        onSelect={(event) => event.preventDefault()}
                    >
                        <HugeiconsIcon icon={Add01Icon} className={inHeader ? 'size-4' : 'h-4 w-4'} />
                        <span className="text-muted-foreground">New team</span>
                    </DropdownMenuItem>
                </CreateTeamModal>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
