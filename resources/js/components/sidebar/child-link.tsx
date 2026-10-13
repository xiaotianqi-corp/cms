import { Link } from '@inertiajs/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { cn } from '@/lib/utils';
import type { IsActiveFn, NavItem } from '@/types';

interface ChildLinkProps {
    child: NavItem;
    isActive: IsActiveFn;
}

export default function ChildLink({
    child,
    isActive,
}: ChildLinkProps) {
    if (!('href' in child)) return null;
    const linkChild = child as Extract<NavItem, { href: any }>;

    const href = linkChild.href;

    return (
        <li>
            <Link
                href={href}
                prefetch
                className={cn(
                    'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors',
                    'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                    isActive(href)
                        ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                        : 'text-sidebar-foreground/80',
                )}
            >
                {linkChild.icon && (
                    <HugeiconsIcon
                        icon={linkChild.icon}
                        size={14}
                        className="shrink-0"
                    />
                )}

                <span className="truncate">
                    {linkChild.title}
                </span>
            </Link>
        </li>
    );
}