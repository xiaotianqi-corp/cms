import { useEffect } from "react";
import { useInView } from "react-intersection-observer";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { MediaItem } from "@/types/media";

interface Props {
    media: MediaItem[];
    selectedIds: number[];
    multiple?: boolean;
    hasMore: boolean;
    onSelect: (media: MediaItem) => void;
    onLoadMore: () => void;
}

export default function MediaGrid({
    media,
    selectedIds,
    multiple,
    hasMore,
    onSelect,
    onLoadMore,
}: Props) {
    const {
        ref,
        inView,
    } = useInView();

    useEffect(() => {
        if (
            inView &&
            hasMore
        ) {
            onLoadMore();
        }
    }, [
        inView,
        hasMore,
        onLoadMore,
    ]);

    return (
        <div className="h-full overflow-auto">

            <div className="grid grid-cols-2 gap-4 md:grid-cols-4 xl:grid-cols-6">

                {media.map(
                    (
                        item
                    ) => {
                        const selected =
                            selectedIds.includes(
                                item.id
                            );

                        return (
                            <button
                                key={
                                    item.id
                                }
                                type="button"
                                onClick={() =>
                                    onSelect(
                                        item
                                    )
                                }
                                className={cn(
                                    "group relative overflow-hidden rounded-lg border bg-background",
                                    selected &&
                                    "ring-2 ring-primary"
                                )}
                            >
                                <img
                                    src={
                                        item.thumb_url ??
                                        item.original_url
                                    }
                                    alt={
                                        item.name
                                    }
                                    className="aspect-square h-full w-full object-cover"
                                />

                                {selected && (
                                    <div className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
                                        <Check className="h-4 w-4" />
                                    </div>
                                )}

                                <div className="border-t p-2 text-left">

                                    <p className="truncate text-xs font-medium">
                                        {
                                            item.file_name
                                        }
                                    </p>

                                </div>

                            </button>
                        );
                    }
                )}

            </div>

            <div
                ref={ref}
                className="h-20"
            />

        </div>
    );
}