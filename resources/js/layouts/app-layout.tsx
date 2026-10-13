import { ChatAdapter, ContactWidgetProvider } from '@/components/widget/contact-widget';
import AppLayoutTemplate from '@/layouts/app/app-sidebar-layout';
import type { BreadcrumbItem } from '@/types';

export default function AppLayout({
    breadcrumbs = [],
    children,
}: {
    breadcrumbs?: BreadcrumbItem[];
    children: React.ReactNode;
}) {
    const chat: ChatAdapter = {
        async send(text, history) {
            // aquí llamas a tu módulo de soporte (crear ticket, responder, etc.)
            return 'Respuesta del soporte';
        },
    };
    return (
        <ContactWidgetProvider
            config={{
                email: 'support@stuvvion.com',
                phone: '+593992037474',
                chatUrl: 'https://stuvvion.com/chat',
                userName: 'Stuvvion',
                accentColor: '#6d45e8',
                quickReplies: ['📅 Book a demo', '🚀 Get started free'],
                poweredBy: 'Powered by Stuvvion',
                chat: chat
            }}>
            <AppLayoutTemplate breadcrumbs={breadcrumbs}>
                {children}
            </AppLayoutTemplate>
        </ContactWidgetProvider>
    );
}
