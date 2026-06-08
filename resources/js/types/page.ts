export interface FieldDefinition {
    id: number;
    name: string;
    label: string;
    type: string;
    required: boolean;
    options?: { label: string; value: string }[] | null;
    instructions?: string | null;
    default_value?: string | null;
    sub_fields?: FieldDefinition[];
}

export interface FieldGroupDef {
    id: number;
    title: string;
    slug: string;
    fields: FieldDefinition[];
}

export interface SectionData {
    [key: string]: any;
}

export interface ContentSection {
    section_id?: number;
    field_group_id: number;
    order: number;
    group_title: string;
    group_slug: string;
    data: SectionData;
}

export interface PageItem {
    id: number;
    [key: string]: any;
    slug: string;
    status: string;
    created_at: string;
    sections?: ContentSection[];
}

export interface PagesProps {
    pages: PageItem[];
    locales: string[];
    defaultLocale: string;
    availableGroups?: FieldGroupDef[];
}