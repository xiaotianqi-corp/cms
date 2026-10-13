import AppLogoIcon from '@/components/app-logo-icon';

export default function AppLogo() {
    return (
        <div className='flex items-center justify-center w-full'>
            <div
                className="
                        flex aspect-square size-8 items-center justify-center
                        rounded-md bg-sidebar-primary text-sidebar-primary-foreground
                        transition-opacity duration-200
                        group-hover/logo:in-data-[collapsible=icon]:opacity-0
                    "
            >
                <AppLogoIcon className="size-5 fill-current text-white dark:text-black" />
            </div>
            <div className="ml-1 grid flex-1 text-left text-sm group-data-[collapsible=icon]:hidden">
                <span className="mb-0.5 truncate leading-tight font-semibold">
                    Laravel Starter Kit
                </span>
            </div>
        </div>
    );
}
