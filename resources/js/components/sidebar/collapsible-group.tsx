import { useState } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowRight01Icon } from '@hugeicons/core-free-icons';
import { cn, hrefToString } from '@/lib/utils';
import type { IsActiveFn, NavItem } from '@/types';
import ChildLink from './child-link';
import type { NavGroup } from './nav-group-item';

interface CollapsibleGroupProps {
    group: NavGroup;
    isActive: IsActiveFn;
    isGroupActive: boolean;
}

export default function CollapsibleGroup({
    group,
    isActive,
    isGroupActive,
}: CollapsibleGroupProps) {
    const [open, setOpen] = useState(isGroupActive);

    const childItemClass = cn(
        'flex w-full items-center gap-2 overflow-hidden rounded-md px-2 py-1.5 text-left text-sm transition-colors',
        'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-sidebar-foreground',
    );

    const renderChild = (child: NavItem) => {

        if ('onClick' in child && child.onClick) {
            return (
                <li key={child.title}>
                    <button
                        type="button"
                        onClick={child.onClick}
                        className={childItemClass}
                    >
                        {child.icon && (
                            <HugeiconsIcon icon={child.icon} size={14} />
                        )}
                        <span className="truncate">{child.title}</span>
                    </button>
                </li>
            );
        }

        return (
            <ChildLink
                key={hrefToString(child.href!)}
                child={child as NavItem & { href: string }}
                isActive={isActive}
            />
        );
    };

    return (
        <li className="relative">
            <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                className={cn(
                    'flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm transition-colors',
                    'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                    isGroupActive
                        ? 'text-sidebar-accent-foreground font-medium'
                        : 'text-sidebar-foreground',
                )}
            >
                <HugeiconsIcon icon={group.icon} size={16} />
                <span className="flex-1 truncate">{group.title}</span>
                <HugeiconsIcon
                    icon={ArrowRight01Icon}
                    size={14}
                    className={cn('size-3.5 transition-transform', open && 'rotate-90')}
                />
            </button>

            {open && (
                <ul className="ml-4 mt-0.5 flex flex-col gap-0.5 border-l border-sidebar-border pl-3">
                    {group.children?.map((child) => renderChild(child))}
                </ul>
            )}
        </li>
    );
}