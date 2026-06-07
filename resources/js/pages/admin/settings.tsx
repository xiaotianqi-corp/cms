import { Head, useForm } from "@inertiajs/react";
import { useState } from "react";

import Heading from "@/components/heading";

import SettingsNavigation from "@/components/settings/settings-navigation";
import GeneralSettings from "@/components/settings/general-settings";
import CompanySettings from "@/components/settings/company-settings";
import SocialSettings from "@/components/settings/social-settings";
import TrackingSettings from "@/components/settings/tracking-settings";
import { index, update } from "@/routes/admin/settings";

interface SettingsPageProps {
    settings: Record<string, any>;
}

type SettingsSection =
    | "general"
    | "company"
    | "seo"
    | "social"
    | "tracking"
    | "languages"
    | "scripts";

export default function SettingsPage({
    settings,
}: SettingsPageProps) {
    const [section, setSection] =
        useState<SettingsSection>("general");

    const form = useForm({
        settings: {
            general: settings.general ?? {
                site_name: "",
                tagline: "",
                logo: "",
                favicon: "",
            },

            company: settings.company ?? {},

            seo: settings.seo ?? {},

            social: settings.social ?? {},

            tracking: settings.tracking ?? {},

            locales: settings.locales ?? ["en"],

            default_locale:
                settings.default_locale ?? "en",

            scripts: settings.scripts ?? {},
        },
    });

    const save = () => {
        form.post(update().url);
    };

    return (
        <>
            <Head title="Settings" />

            <div className="space-y-6">
                <Heading
                    variant="small"
                    title="Settings"
                    description="Manage CMS settings, SEO, company information, languages and integrations."
                />

                <div className="grid gap-6 lg:grid-cols-[250px_1fr]">
                    <SettingsNavigation
                        current={section}
                        onChange={setSection}
                    />

                    <div>
                        {section === "general" && (
                            <GeneralSettings
                                form={form}
                                onSave={save}
                            />
                        )}

                        {section === "company" && (
                            <CompanySettings
                                form={form}
                                onSave={save}
                            />
                        )}

                        {section === "social" && (
                            <SocialSettings
                                form={form}
                                onSave={save}
                            />
                        )}

                        {section === "tracking" && (
                            <TrackingSettings
                                form={form}
                                onSave={save}
                            />
                        )}

                        {["seo", "languages", "scripts"].includes(section) && (
                            <div className="rounded-lg border bg-card p-6">
                                <p className="text-sm text-muted-foreground">
                                    This section will be implemented
                                    in the next phase.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}

SettingsPage.layout = {
    breadcrumbs: [
        {
            title: "Settings",
            href: index(),
        },
    ],
};