import { useEffect, useState } from "react";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";

import MediaGrid from "./media-grid";
import MediaUpload from "./media-upload";
import FolderTree from "./folder-tree";
import MediaToolbar from "./media-toolbar";

import {
    MediaFolder,
    MediaItem,
} from "@/types/media";

interface Props {
    open: boolean;

    onOpenChange: (
        open: boolean
    ) => void;

    onSelect: (
        media: MediaItem
    ) => void;
}

export default function MediaDialog({
    open,
    onOpenChange,
    onSelect,
}: Props) {
    const [media, setMedia] =
        useState<MediaItem[]>([]);

    const [folders, setFolders] =
        useState<MediaFolder[]>(
            []
        );

    const [selected, setSelected] =
        useState<MediaItem | null>(
            null
        );

    const [folderId, setFolderId] =
        useState<number | null>(
            null
        );

    const [search, setSearch] =
        useState("");

    const loadMedia =
        async () => {
            const params =
                new URLSearchParams();

            if (
                folderId
            ) {
                params.set(
                    "folder_id",
                    String(folderId)
                );
            }

            if (search) {
                params.set(
                    "search",
                    search
                );
            }

            const response =
                await fetch(
                    `/admin/media?${params}`
                );

            const data =
                await response.json();

            setMedia(
                data.data
            );
        };

    useEffect(() => {
        if (!open) return;

        loadMedia();

        fetch(
            "/admin/media-folders"
        )
            .then((r) =>
                r.json()
            )
            .then(setFolders);
    }, [
        open,
        folderId,
        search,
    ]);

    return (
        <Dialog
            open={open}
            onOpenChange={
                onOpenChange
            }
        >
            <DialogContent className="max-w-7xl">
                <DialogHeader>
                    <DialogTitle>
                        Media Library
                    </DialogTitle>
                </DialogHeader>

                <div className="grid h-[700px] grid-cols-[250px_1fr] gap-6">

                    <FolderTree
                        folders={
                            folders
                        }
                        current={
                            folderId
                        }
                        onSelect={
                            setFolderId
                        }
                    />

                    <div className="space-y-4">

                        <MediaToolbar
                            search={
                                search
                            }
                            onSearch={
                                setSearch
                            }
                        />

                        <MediaUpload
                            folderId={
                                folderId
                            }
                            onUploaded={
                                loadMedia
                            }
                        />

                        <MediaGrid
                            media={media}
                            selected={
                                selected?.id
                            }
                            onSelect={
                                setSelected
                            }
                        />

                        <div className="flex justify-end">
                            <Button
                                disabled={
                                    !selected
                                }
                                onClick={() => {
                                    if (
                                        selected
                                    ) {
                                        onSelect(
                                            selected
                                        );

                                        onOpenChange(
                                            false
                                        );
                                    }
                                }}
                            >
                                Select File
                            </Button>
                        </div>

                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}