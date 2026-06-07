import type { InertiaLinkProps } from '@inertiajs/react';
import type { LucideIcon } from 'lucide-react';

export type IsActiveFn = (href: LinkHref) => boolean;

export type LinkHref = NonNullable<InertiaLinkProps['href']>;

export type BreadcrumbItem = {
    title: string;
    href: NonNullable<InertiaLinkProps['href']>;
};

export type NavItem = {
    title: string;
    href: LinkHref;
    icon?: LucideIcon | null;
    isActive?: boolean;
};
