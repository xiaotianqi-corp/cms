import { Folder } from "lucide-react";

import { MediaFolder } from "@/types/media";

interface Props {
    folders: MediaFolder[];

    current: number | null;

    onSelect: (
        folderId: number | null
    ) => void;
}

export default function FolderTree({
    folders,
    current,
    onSelect,
}: Props) {
    return (
        <div className="space-y-1">
            <button
                className="w-full rounded-md p-2 text-left hover:bg-muted"
                onClick={() =>
                    onSelect(null)
                }
            >
                All Media
            </button>

            {folders.map(
                (folder) => (
                    <button
                        key={
                            folder.id
                        }
                        onClick={() =>
                            onSelect(
                                folder.id
                            )
                        }
                        className={`flex w-full items-center gap-2 rounded-md p-2 text-left hover:bg-muted ${current ===
                            folder.id
                            ? "bg-muted"
                            : ""
                            }`}
                    >
                        <Folder className="h-4 w-4" />

                        {
                            folder.name
                        }
                    </button>
                )
            )}
        </div>
    );
}