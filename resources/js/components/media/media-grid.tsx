import { ScrollArea } from "@/components/ui/scroll-area";

import { cn } from "@/lib/utils";

import { MediaItem } from "@/types/media";

interface Props {
    media: MediaItem[];

    selected?: number | null;

    onSelect: (
        media: MediaItem
    ) => void;
}

export default function MediaGrid({
    media,
    selected,
    onSelect,
}: Props) {
    return (
        <ScrollArea className="h-[550px]">
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4 xl:grid-cols-6">
                {media.map((item) => (
                    <button
                        key={item.id}
                        type="button"
                        onClick={() =>
                            onSelect(item)
                        }
                        className={cn(
                            "overflow-hidden rounded-lg border transition-all",
                            selected ===
                            item.id &&
                            "ring-2 ring-primary"
                        )}
                    >
                        <img
                            src={
                                item.thumb_url ??
                                item.original_url
                            }
                            alt={
                                item.file_name
                            }
                            className="aspect-square h-full w-full object-cover"
                        />

                        <div className="truncate border-t p-2 text-xs">
                            {
                                item.file_name
                            }
                        </div>
                    </button>
                ))}
            </div>
        </ScrollArea>
    );
}