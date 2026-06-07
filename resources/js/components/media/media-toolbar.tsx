import { Input } from "@/components/ui/input";

interface Props {
    search: string;

    onSearch: (
        value: string
    ) => void;
}

export default function MediaToolbar({
    search,
    onSearch,
}: Props) {
    return (
        <div className="flex gap-4">
            <Input
                placeholder="Search media..."
                value={search}
                onChange={(e) =>
                    onSearch(
                        e.target.value
                    )
                }
            />
        </div>
    );
}