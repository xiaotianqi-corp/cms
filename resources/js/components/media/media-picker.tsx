import { useState } from "react";

import { Button } from "@/components/ui/button";

import MediaDialog from "./media-dialog";

import MediaPreview from "./media-preview";

import { MediaItem } from "@/types/media";

interface Props {
    value?: MediaItem | null;

    onChange: (
        media: MediaItem
    ) => void;
}

export default function MediaPicker({
    value,
    onChange,
}: Props) {
    const [open, setOpen] =
        useState(false);

    return (
        <>
            <div className="space-y-4">
                <MediaPreview
                    media={value}
                />

                <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                        setOpen(true)
                    }
                >
                    Select Media
                </Button>
            </div>

            <MediaDialog
                open={open}
                onOpenChange={
                    setOpen
                }
                onSelect={onChange}
            />
        </>
    );
}