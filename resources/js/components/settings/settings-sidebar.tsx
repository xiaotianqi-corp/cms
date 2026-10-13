import { Link, router, usePage } from '@inertiajs/react';
import { ArrowLeft, Lock, User } from 'lucide-react';
import { NavUser } from '@/components/nav-user';
import { TeamSwitcher } from '@/components/team-switcher';
import {
    Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
    SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
} from '@/components/ui/sidebar';
import { useSettingsTab } from '@/hooks/use-settings-tab';
import { settingsTabs, type SettingsTabKey } from '@/layouts/settings/nav';
import { hrefToString } from '@/lib/utils';
import { edit as profileEdit } from '@/routes/settings/profile';
import { edit as securityEdit } from '@/routes/settings/security';
import { index as settingsIndex } from '@/routes/admin/settings';
import type { LinkHref } from '@/types';

/** ¿La URL actual pertenece a Settings del team? */
export function isSettingsPath(path: string, teamSlug: string): boolean {
    const base = `/${teamSlug}/settings`;
    return path === base || path.startsWith(`${base}/`);
}

const trim = (p: string) => (p.length > 1 ? p.replace(/\/$/, '') : p);

/**
 * Sidebar en "modo settings" (como Nightwatch): reemplaza al menú principal
 * mientras estás en Settings. Cuenta -> Profile/Security; Workspace -> pestañas.
 */
export default function SettingsSidebar({ teamSlug, dashboardUrl }: { teamSlug: string; dashboardUrl: LinkHref }) {
    const page = usePage();
    const user = (page.props as { auth?: { user?: { name?: string } } }).auth?.user;
    const [tab, setTab] = useSettingsTab();

    const currentPath = trim(new URL(page.url, window.location.origin).pathname);
    const indexUrl = hrefToString(settingsIndex(teamSlug)) ?? `/${teamSlug}/settings`;
    const onIndex = currentPath === trim(indexUrl);

    const isPage = (href: LinkHref) => currentPath === trim(hrefToString(href) ?? '');

    function goToTab(key: SettingsTabKey) {
        if (onIndex) setTab(key);
        else router.visit(`${indexUrl}?tab=${key}`);
    }

    const accountItems = [
        { title: 'Profile', href: profileEdit(teamSlug) as LinkHref, icon: User },
        { title: 'Security', href: securityEdit(teamSlug) as LinkHref, icon: Lock },
    ];

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton asChild tooltip="Back">
                            <Link href={dashboardUrl}>
                                <ArrowLeft />
                                <span>Back</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>{user?.name ?? 'Account'}</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {accountItems.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton asChild isActive={isPage(item.href)} tooltip={item.title}>
                                        <Link href={item.href} prefetch>
                                            <item.icon />
                                            <span>{item.title}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>

                <SidebarGroup>
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <TeamSwitcher />
                        </SidebarMenuItem>
                    </SidebarMenu>
                    <SidebarGroupContent className="mt-1">
                        <SidebarMenu>
                            {settingsTabs.map((item) => (
                                <SidebarMenuItem key={item.key}>
                                    <SidebarMenuButton
                                        isActive={onIndex && tab === item.key}
                                        tooltip={item.label}
                                        onClick={() => goToTab(item.key)}
                                    >
                                        <item.icon />
                                        <span>{item.label}</span>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
