<?php

namespace App\Http\Controllers;

use App\Models\Post;
use App\Models\Product;
use App\Models\Page;
use Inertia\Inertia;

class FrontController extends Controller
{
    public function showPost(string $slug)
    {
        $post = Post::where('slug', $slug)->firstOrFail();
        
        return Inertia::render('Front/PostShow', [
            'post' => $post
        ]);
    }

    public function showProduct(string $slug)
    {
        $product = Product::where('slug', $slug)->firstOrFail();
        
        return Inertia::render('Front/ProductShow', [
            'product' => $product
        ]);
    }

    public function checkout()
    {
        $products = Product::where('status', 'active')->get();
        
        return Inertia::render('Front/Checkout', [
            'products' => $products
        ]);
    }
}
