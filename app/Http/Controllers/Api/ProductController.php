<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\JsonResponse;

class ProductController extends Controller
{
    public function index(): JsonResponse
    {
        $locale = app()->getLocale();

        $products = Product::where('status', 'active')
            ->orderBy('created_at', 'desc')
            ->paginate(10)
            ->through(fn($p) => $this->formatProduct($p, $locale));

        return response()->json($products);
    }

    public function show(string $slug): JsonResponse
    {
        $locale = app()->getLocale();

        $product = Product::where('slug', $slug)
            ->where('status', 'active')
            ->firstOrFail();

        return response()->json($this->formatProduct($product, $locale));
    }

    private function formatProduct(Product $product, string $locale): array
    {
        return [
            'id' => $product->id,
            'name' => $product->getTranslation('name', $locale),
            'description' => $product->getTranslation('description', $locale),
            'price' => $product->price,
            'stock' => $product->stock,
            'slug' => $product->slug,
            'status' => $product->status,
            'locale' => $locale,
            'category_id' => $product->category_id,
            'created_at' => $product->created_at,
            'updated_at' => $product->updated_at,
        ];
    }
}