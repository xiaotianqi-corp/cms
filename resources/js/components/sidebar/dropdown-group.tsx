import { Link } from '@inertiajs/react';
import { HugeiconsIcon } from '@hugeicons/react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn, hrefToString } from '@/lib/utils';
import type { IsActiveFn, NavItem } from '@/types';
import type { NavGroup } from './nav-group-item';

interface DropdownGroupProps {
    group: NavGroup;
    isActive: IsActiveFn;
    isGroupActive: boolean;
}

export default function DropdownGroup({
    group,
    isGroupActive,
}: DropdownGroupProps) {
    return (
        <li>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <button
                        type="button"
                        className={cn(
                            'flex size-8 items-center justify-center rounded-md transition-colors',
                            'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                            isGroupActive && 'bg-sidebar-accent text-sidebar-accent-foreground',
                        )}
                    >
                        <HugeiconsIcon icon={group.icon} size={16} />
                    </button>
                </DropdownMenuTrigger>

                <DropdownMenuContent side="right" align="start" className="min-w-56">
                    {group.children?.map((child) => {

                        if ('onClick' in child && child.onClick) {
                            return (
                                <DropdownMenuItem
                                    key={child.title}
                                    onSelect={child.onClick}
                                >
                                    {child.icon && (
                                        <HugeiconsIcon icon={child.icon} size={14} />
                                    )}
                                    {child.title}
                                </DropdownMenuItem>
                            );
                        }

                        return (
                            <DropdownMenuItem key={hrefToString(child.href!)} asChild>
                                <Link href={child.href!} prefetch>
                                    {child.icon && (
                                        <HugeiconsIcon icon={child.icon} size={14} />
                                    )}
                                    {child.title}
                                </Link>
                            </DropdownMenuItem>
                        );
                    })}
                </DropdownMenuContent>
            </DropdownMenu>
        </li>
    );
}