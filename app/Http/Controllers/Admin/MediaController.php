<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\TemporaryUpload;
use App\Models\Media;
use Illuminate\Http\Request;

class MediaController extends Controller
{
    public function index(
        Request $request
    ) {

        $query = Media::query();

        if ($request->filled('folder_id')) {

            $query->where(
                'folder_id',
                $request->integer(
                    'folder_id'
                )
            );
        }

        if ($request->filled('search')) {

            $query->where(
                'file_name',
                'like',
                '%' .
                $request->search .
                '%'
            );
        }

        return $query
            ->latest()
            ->paginate(48)
            ->through(
                fn(Media $media) => [
                    'id' => $media->id,

                    'folder_id' => $media->folder_id,

                    'name' => $media->name,

                    'file_name' => $media->file_name,

                    'mime_type' => $media->mime_type,

                    'size' => $media->size,

                    'original_url' => $media->getUrl(),

                    'thumb_url' => $media->hasGeneratedConversion(
                        'thumb'
                    )
                        ? $media->getUrl(
                            'thumb'
                        )
                        : $media->getUrl(),

                    'large_url' => $media->hasGeneratedConversion(
                        'large'
                    )
                        ? $media->getUrl(
                            'large'
                        )
                        : null,

                    'webp_url' => $media->hasGeneratedConversion(
                        'webp'
                    )
                        ? $media->getUrl(
                            'webp'
                        )
                        : null,
                ]
            );
    }

    public function store(
        Request $request
    ) {

        $request->validate([
            'file' => [
                'required',
                'file',
                'max:10240',
            ],

            'folder_id' => [
                'nullable',
                'exists:media_folders,id',
            ],
        ]);

        $upload =
            TemporaryUpload::create();

        $media = $upload
            ->addMediaFromRequest(
                'file'
            )
            ->toMediaCollection(
                'uploads'
            );

        $media->update([
            'folder_id' =>
                $request->folder_id,
        ]);

        return response()->json([
            'id' => $media->id,

            'name' => $media->name,

            'file_name' =>
                $media->file_name,

            'mime_type' =>
                $media->mime_type,

            'size' => $media->size,

            'original_url' =>
                $media->getUrl(),

            'thumb_url' =>
                $media->getUrl(
                    'thumb'
                ),
        ]);
    }

    public function update(
        Request $request,
        Media $media
    ) {

        $request->validate([
            'folder_id' => [
                'nullable',
                'exists:media_folders,id',
            ],
        ]);

        $media->update([
            'folder_id' =>
                $request->folder_id,
        ]);

        return response()->json([
            'success' => true,
        ]);
    }

    public function destroy(
        Media $media
    ) {

        $media->delete();

        return response()
            ->noContent();
    }
}