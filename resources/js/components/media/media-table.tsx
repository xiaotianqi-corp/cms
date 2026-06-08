import { useEffect } from "react";
import { useInView } from "react-intersection-observer";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { MediaItem } from "@/types/media";

interface Props {
    media: MediaItem[];
    selectedIds: number[];
    multiple?: boolean;
    hasMore: boolean; onSelect: (media: MediaItem) => void;
    onLoadMore: () => void;
}

export default function MediaTable({
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

            <Table>

                <TableHeader>

                    <TableRow>

                        <TableHead className="w-12" />

                        <TableHead>
                            Preview
                        </TableHead>

                        <TableHead>
                            Name
                        </TableHead>

                        <TableHead>
                            Type
                        </TableHead>

                        <TableHead>
                            Size
                        </TableHead>

                    </TableRow>

                </TableHeader>

                <TableBody>

                    {media.map(
                        (
                            item
                        ) => (
                            <TableRow
                                key={
                                    item.id
                                }
                                className="cursor-pointer"
                                onClick={() =>
                                    onSelect(
                                        item
                                    )
                                }
                            >

                                <TableCell>

                                    <Checkbox
                                        checked={selectedIds.includes(
                                            item.id
                                        )}
                                    />

                                </TableCell>

                                <TableCell>

                                    <img
                                        src={
                                            item.thumb_url ??
                                            item.original_url
                                        }
                                        className="h-14 w-14 rounded-md object-cover"
                                    />

                                </TableCell>

                                <TableCell>
                                    {
                                        item.file_name
                                    }
                                </TableCell>

                                <TableCell>
                                    {
                                        item.mime_type
                                    }
                                </TableCell>

                                <TableCell>

                                    {(
                                        item.size /
                                        1024 /
                                        1024
                                    ).toFixed(
                                        2
                                    )}{" "}
                                    MB

                                </TableCell>

                            </TableRow>
                        )
                    )}

                </TableBody>

            </Table>

            <div
                ref={ref}
                className="h-20"
            />

        </div>
    );
}