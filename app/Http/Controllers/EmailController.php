<?php

namespace App\Http\Controllers;

use App\Services\EmailService;
use Illuminate\Http\Request;

class EmailController extends Controller
{
    protected $emailService;

    public function __construct(EmailService $emailService)
    {
        $this->emailService = $emailService;
    }

    public function sendTestEmail(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'name' => 'required|string',
            'template' => 'required|string|in:WelcomeEmail,PasswordResetEmail,OrderConfirmationEmail',
        ]);

        $props = ['name' => $request->name];
        if ($request->template === 'OrderConfirmationEmail') {
            $props = [
                'name' => $request->name,
                'orderId' => '10042',
                'items' => [
                    ['name' => 'CMS Premium Theme', 'price' => 59.00, 'quantity' => 1],
                    ['name' => 'SEO Analytics Plugin', 'price' => 19.00, 'quantity' => 1],
                ],
                'total' => 78.00,
            ];
        }

        $sent = $this->emailService->sendReactEmail(
            $request->email,
            "CMS - Test " . $request->template,
            $request->template,
            $props
        );

        if ($sent) {
            return redirect()->back()->with('success', 'Test email sent successfully.');
        }

        return redirect()->back()->withErrors(['error' => 'Failed to send test email. Check server logs.']);
    }
}
