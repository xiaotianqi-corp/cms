<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\Order;
use App\Models\OrderItem;
use Illuminate\Http\Request;
use Stripe\Stripe;
use Stripe\Checkout\Session;

class PaymentController extends Controller
{
    public function checkout(Request $request)
    {
        $request->validate([
            'items' => 'required|array',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|integer|min:1',
            'billing_name' => 'required|string',
            'billing_email' => 'required|email',
            'billing_address' => 'required|string',
        ]);

        $stripeSecret = env('STRIPE_SECRET');
        if (empty($stripeSecret)) {
            return response()->json(['error' => 'Stripe is not configured.'], 500);
        }

        $total = 0;
        $orderItems = [];
        foreach ($request->items as $item) {
            $product = Product::findOrFail($item['product_id']);
            $price = $product->price;
            $quantity = $item['quantity'];
            $total += $price * $quantity;
            $orderItems[] = [
                'product' => $product,
                'quantity' => $quantity,
                'price' => $price,
            ];
        }

        $order = Order::create([
            'user_id' => auth()->id(),
            'status' => 'pending',
            'total' => $total,
            'currency' => 'USD',
            'billing_name' => $request->billing_name,
            'billing_email' => $request->billing_email,
            'billing_address' => $request->billing_address,
        ]);

        foreach ($orderItems as $oItem) {
            OrderItem::create([
                'order_id' => $order->id,
                'product_id' => $oItem['product']->id,
                'quantity' => $oItem['quantity'],
                'price' => $oItem['price'],
            ]);
        }

        Stripe::setApiKey($stripeSecret);
        
        $lineItems = [];
        foreach ($orderItems as $oItem) {
            $lineItems[] = [
                'price_data' => [
                    'currency' => 'usd',
                    'product_data' => [
                        'name' => $oItem['product']->name,
                    ],
                    'unit_amount' => (int) ($oItem['price'] * 100),
                ],
                'quantity' => $oItem['quantity'],
            ];
        }

        $session = Session::create([
            'payment_method_types' => ['card'],
            'line_items' => $lineItems,
            'mode' => 'payment',
            'success_url' => url('/') . '/checkout/success?session_id={CHECKOUT_SESSION_ID}',
            'cancel_url' => url('/') . '/checkout/cancel',
            'metadata' => [
                'order_id' => $order->id,
            ],
        ]);

        $order->update(['stripe_payment_id' => $session->id]);

        return response()->json(['url' => $session->url]);
    }
}
