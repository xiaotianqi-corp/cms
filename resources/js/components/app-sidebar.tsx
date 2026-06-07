import { Link, usePage } from '@inertiajs/react';
import {
    BookOpen, FolderGit2, LayoutGrid, FileText, ShoppingBag,
    CreditCard, Palette, Puzzle, Settings, BarChart3, Sparkles,
    ChevronRight, Languages, Database, Globe,
} from 'lucide-react';
import { useState } from 'react';
import AppLogo from '@/components/app-logo';
import { NavFooter } from '@/components/nav-footer';
import { NavUser } from '@/components/nav-user';
import { TeamSwitcher } from '@/components/team-switcher';
import {
    Sidebar, SidebarContent, SidebarFooter, SidebarHeader,
    SidebarMenu, SidebarMenuButton, SidebarMenuItem,
} from '@/components/ui/sidebar';
import { cn, hrefToString } from '@/lib/utils';
import { dashboard } from '@/routes';
import type { IsActiveFn, LinkHref, NavItem } from '@/types';

interface NavGroup {
    title: string;
    icon: React.ElementType;
    href?: LinkHref;
    children?: NavItem[];
}

export function AppSidebar() {
    const page = usePage();
    const currentPath = new URL(page.url, typeof window !== 'undefined' ? window.location.origin : 'http://localhost').pathname;
    const dashboardUrl = page.props.currentTeam
        ? dashboard(page.props.currentTeam.slug)
        : '/';

    const isActive = (href: LinkHref) => {
        const url = hrefToString(href);

        return currentPath === url ||
            currentPath.startsWith(url + '/');
    };
    const isGroupActive = (group: NavGroup) => {
        if (group.href && isActive(group.href)) {
            return true;
        }

        return group.children?.some(
            child => isActive(child.href)
        ) ?? false;
    };

    // Groups with submenus
    const navGroups: NavGroup[] = [
        {
            title: 'Dashboard',
            icon: LayoutGrid,
            href: dashboardUrl,
        },
        {
            title: 'Content',
            icon: FileText,
            children: [
                { title: 'Posts', href: '/admin/posts', icon: BookOpen },
                { title: 'Pages', href: '/admin/pages', icon: FileText },
                { title: 'Field Groups', href: '/admin/field-groups', icon: Database },
            ],
        },
        {
            title: 'Commerce',
            icon: ShoppingBag,
            children: [
                { title: 'Products', href: '/admin/products', icon: ShoppingBag },
                { title: 'Orders', href: '/admin/orders', icon: CreditCard },
            ],
        },
        {
            title: 'Appearance',
            icon: Palette,
            children: [
                { title: 'Themes', href: '/admin/themes', icon: Palette },
                { title: 'Plugins', href: '/admin/plugins', icon: Puzzle },
            ],
        },
        {
            title: 'AI Insights',
            icon: Sparkles,
            href: '/admin/ai-insights',
        },
        {
            title: 'Analytics',
            icon: BarChart3,
            href: '/admin/analytics',
        },
        {
            title: 'Settings',
            icon: Settings,
            children: [
                { title: 'General', href: '/admin/settings', icon: Settings },
                { title: 'Languages', href: '/admin/languages', icon: Languages },
            ],
        },
    ];

    const footerNavItems: NavItem[] = [
        { title: 'Repository', href: 'https://github.com/laravel/react-starter-kit', icon: FolderGit2 },
        { title: 'Documentation', href: 'https://laravel.com/docs/starter-kits#react', icon: BookOpen },
    ];

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboardUrl} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <TeamSwitcher />
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <div className="px-2 py-0">
                    <p className="px-2 text-xs font-medium text-neutral-500 mb-1 uppercase tracking-wider">Platform</p>
                    <ul className="flex w-full min-w-0 flex-col gap-0.5">
                        {navGroups.map((group) => (
                            <NavGroupItem
                                key={group.title}
                                group={group}
                                isActive={isActive}
                                isGroupActive={isGroupActive(group)}
                            />
                        ))}
                    </ul>
                </div>
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}

function NavGroupItem({
    group,
    isActive,
    isGroupActive,
}: {
    group: NavGroup;
    isActive: IsActiveFn;
    isGroupActive: boolean;
}) {
    const [open, setOpen] = useState(isGroupActive);
    const hasChildren = Boolean(group.children?.length);
    const Icon = group.icon;

    // Simple link (no children)
    if (!hasChildren && group.href) {
        return (
            <li className="relative group/menu-item">
                <Link
                    href={group.href}
                    prefetch
                    className={cn(
                        'flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm transition-colors',
                        'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                        isActive(group.href)
                            ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                            : 'text-sidebar-foreground',
                        // collapsed: icon only
                        'group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:p-2',
                    )}
                >
                    <Icon className="size-4 shrink-0" />
                    <span className="truncate group-data-[collapsible=icon]:hidden">{group.title}</span>
                </Link>
            </li>
        );
    }

    // Group with children (collapsible)
    return (
        <li className="relative">
            <button
                type="button"
                onClick={() => setOpen(o => !o)}
                className={cn(
                    'flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm transition-colors',
                    'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                    isGroupActive
                        ? 'text-sidebar-accent-foreground font-medium'
                        : 'text-sidebar-foreground',
                    'group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:p-2',
                )}
            >
                <Icon className="size-4 shrink-0" />
                <span className="flex-1 truncate group-data-[collapsible=icon]:hidden">{group.title}</span>
                <ChevronRight
                    className={cn(
                        'size-3.5 transition-transform group-data-[collapsible=icon]:hidden',
                        open && 'rotate-90',
                    )}
                />
            </button>

            {open && (
                <ul className="ml-4 mt-0.5 border-l border-sidebar-border pl-3 flex flex-col gap-0.5 group-data-[collapsible=icon]:hidden">
                    {group.children?.map((child) => {
                        const childHref = child.href;
                        const ChildIcon = child.icon;
                        return (
                            <li key={hrefToString(childHref)}>
                                <Link
                                    href={childHref}
                                    prefetch
                                    className={cn(
                                        'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors',
                                        'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                                        isActive(childHref)
                                            ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                                            : 'text-sidebar-foreground/80',
                                    )}
                                >
                                    {ChildIcon && <ChildIcon className="size-3.5 shrink-0" />}
                                    <span className="truncate">{child.title}</span>
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            )}
        </li>
    );
}