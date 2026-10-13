import { Link } from '@inertiajs/react';
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react';
import { useSidebar } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import type { IsActiveFn, LinkHref, NavItem } from '@/types';
import CollapsibleGroup from './collapsible-group';
import DropdownGroup from './dropdown-group';

export interface NavGroup {
    title: string;
    icon: IconSvgElement;
    href?: LinkHref;
    children?: NavItem[];
}

interface NavGroupItemProps {
    group: NavGroup;
    isActive: IsActiveFn;
    isGroupActive: boolean;
}

export default function NavGroupItem({
    group,
    isActive,
    isGroupActive,
}: NavGroupItemProps) {
    const { state } = useSidebar();

    const hasChildren = Boolean(group.children?.length);

    // Plain item with no children — either a link or an onClick button.
    if (!hasChildren) {
        const baseClass = cn(
            'flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm transition-colors',
            'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
            'text-sidebar-foreground',
            'group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:p-2',
        );

        // onClick-only item (no href) — dialog trigger, modal opener, etc.
        if ((group as any).onClick && !group.href) {
            return (
                <li className="relative group/menu-item">
                    <button
                        type="button"
                        onClick={(group as any).onClick}
                        className={baseClass}
                    >
                        <HugeiconsIcon icon={group.icon} size={16} />
                        <span className="truncate group-data-[collapsible=icon]:hidden">
                            {group.title}
                        </span>
                    </button>
                </li>
            );
        }

        if (group.href) {
            return (
                <li className="relative group/menu-item">
                    <Link
                        href={group.href}
                        prefetch
                        className={cn(
                            baseClass,
                            isActive(group.href)
                                ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                                : '',
                        )}
                    >
                        <HugeiconsIcon icon={group.icon} size={16} />
                        <span className="truncate group-data-[collapsible=icon]:hidden">
                            {group.title}
                        </span>
                    </Link>
                </li>
            );
        }
    }

    if (state === 'collapsed') {
        return (
            <DropdownGroup
                group={group}
                isActive={isActive}
                isGroupActive={isGroupActive}
            />
        );
    }

    return (
        <CollapsibleGroup
            group={group}
            isActive={isActive}
            isGroupActive={isGroupActive}
        />
    );
}