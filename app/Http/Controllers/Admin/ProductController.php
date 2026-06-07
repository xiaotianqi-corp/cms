<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Product;
use App\Models\Setting;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ProductController extends Controller
{
    private function getLocales(): array
    {
        return json_decode(Setting::get('locales', '["en","es"]'), true) ?? ['en'];
    }

    private function getDefaultLocale(): string
    {
        return Setting::get('default_locale', 'en');
    }

    public function index()
    {
        return Inertia::render('admin/products', [
            'products' => Product::with('category')->orderBy('created_at', 'desc')->get(),
            'categories' => Category::all(),
            'locales' => $this->getLocales(),
            'defaultLocale' => $this->getDefaultLocale(),
        ]);
    }

    public function store(Request $request)
    {
        $locales = $this->getLocales();
        $defaultLocale = $this->getDefaultLocale();

        $rules = [
            'price' => 'required|numeric|min:0',
            'stock' => 'required|integer|min:0',
            'status' => 'required|string',
            'category_id' => 'nullable|exists:categories,id',
        ];
        foreach ($locales as $locale) {
            $rules["name_{$locale}"] = $locale === $defaultLocale ? 'required|string' : 'nullable|string';
            $rules["description_{$locale}"] = $locale === $defaultLocale ? 'required|string' : 'nullable|string';
        }
        $request->validate($rules);

        $name = [];
        $description = [];
        foreach ($locales as $locale) {
            $name[$locale] = $request->input("name_{$locale}", $request->input("name_{$defaultLocale}", ''));
            $description[$locale] = $request->input("description_{$locale}", $request->input("description_{$defaultLocale}", ''));
        }

        $product = new Product();
        $product->name = $name;
        $product->description = $description;
        $product->price = $request->price;
        $product->stock = $request->stock;
        $product->status = $request->status;
        $product->category_id = $request->category_id;
        $product->save();

        return redirect()->back()->with('success', 'Product created successfully.');
    }

    public function update(Request $request, Product $product)
    {
        $locales = $this->getLocales();
        $defaultLocale = $this->getDefaultLocale();

        $rules = [
            'price' => 'required|numeric|min:0',
            'stock' => 'required|integer|min:0',
            'status' => 'required|string',
            'category_id' => 'nullable|exists:categories,id',
        ];
        foreach ($locales as $locale) {
            $rules["name_{$locale}"] = $locale === $defaultLocale ? 'required|string' : 'nullable|string';
            $rules["description_{$locale}"] = $locale === $defaultLocale ? 'required|string' : 'nullable|string';
        }
        $request->validate($rules);

        $name = [];
        $description = [];
        foreach ($locales as $locale) {
            $name[$locale] = $request->input("name_{$locale}", $product->getTranslation('name', $locale));
            $description[$locale] = $request->input("description_{$locale}", $product->getTranslation('description', $locale));
        }

        $product->name = $name;
        $product->description = $description;
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