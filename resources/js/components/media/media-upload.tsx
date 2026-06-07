import { useCallback } from "react";

import { useDropzone } from "react-dropzone";

import { UploadCloud } from "lucide-react";

interface Props {
    folderId?: number | null;

    onUploaded: () => void;
}

export default function MediaUpload({
    folderId,
    onUploaded,
}: Props) {
    const onDrop =
        useCallback(
            async (
                acceptedFiles: File[]
            ) => {
                for (const file of acceptedFiles) {
                    const formData =
                        new FormData();

                    formData.append(
                        "file",
                        file
                    );

                    if (
                        folderId
                    ) {
                        formData.append(
                            "folder_id",
                            folderId.toString()
                        );
                    }

                    await fetch(
                        "/admin/media",
                        {
                            method:
                                "POST",

                            body: formData,

                            headers: {
                                Accept:
                                    "application/json",
                            },
                        }
                    );
                }

                onUploaded();
            },
            [
                folderId,
                onUploaded,
            ]
        );

    const {
        getRootProps,
        getInputProps,
    } = useDropzone({
        onDrop,
    });

    return (
        <div
            {...getRootProps()}
            className="flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed p-8"
        >
            <input
                {...getInputProps()}
            />

            <UploadCloud className="mb-3 h-8 w-8" />

            <p className="text-sm">
                Drop files here or click
                to upload
            </p>
        </div>
    );
}