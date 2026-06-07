export interface MediaItem {
    id: number;
    folder_id: number | null;
    name: string;
    file_name: string;
    mime_type: string;
    size: number;
    original_url: string;
    thumb_url?: string;
    large_url?: string;
    webp_url?: string;
}

export interface MediaFolder {
    id: number;
    parent_id: number | null;
    name: string;
    slug: string;
    children?: MediaFolder[];
}

export interface MediaPaginated {
    data: MediaItem[];
    current_page: number;
    last_page: number;
    total: number;
}