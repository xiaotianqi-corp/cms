<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\Category;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ProductController extends Controller
{
    public function index()
    {
        $products = Product::with('category')->orderBy('created_at', 'desc')->get();
        $categories = Category::all();

        return Inertia::render('admin/products', [
            'products' => $products,
            'categories' => $categories
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name_en' => 'required|string',
            'name_es' => 'nullable|string',
            'description_en' => 'required|string',
            'description_es' => 'nullable|string',
            'price' => 'required|numeric|min:0',
            'stock' => 'required|integer|min:0',
            'status' => 'required|string',
            'category_id' => 'nullable|exists:categories,id',
        ]);

        $product = new Product();
        $product->name = [
            'en' => $request->name_en,
            'es' => $request->name_es ?? $request->name_en
        ];
        $product->description = [
            'en' => $request->description_en,
            'es' => $request->description_es ?? $request->description_en
        ];
        $product->price = $request->price;
        $product->stock = $request->stock;
        $product->status = $request->status;
        $product->category_id = $request->category_id;
        $product->save();

        return redirect()->back()->with('success', 'Product created successfully.');
    }

    public function update(Request $request, Product $product)
    {
        $request->validate([
            'name_en' => 'required|string',
            'name_es' => 'nullable|string',
            'description_en' => 'required|string',
            'description_es' => 'nullable|string',
            'price' => 'required|numeric|min:0',
            'stock' => 'required|integer|min:0',
            'status' => 'required|string',
            'category_id' => 'nullable|exists:categories,id',
        ]);

        $product->name = [
            'en' => $request->name_en,
            'es' => $request->name_es ?? $request->name_en
        ];
        $product->description = [
            'en' => $request->description_en,
            'es' => $request->description_es ?? $request->description_en
        ];
        $product->price = $request->price;
        $product->stock = $request->stock;
        $product->status = $request->status;
        $product->category_id = $request->category_id;
        $product->save();

        return redirect()->back()->with('success', 'Product updated successfully.');
    }

    public function destroy(Product $product)
    {
        $product->delete();
        return redirect()->back()->with('success', 'Product deleted successfully.');
    }
}
