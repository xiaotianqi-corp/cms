<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\PluginService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PluginController extends Controller
{
    protected $pluginService;

    public function __construct(PluginService $pluginService)
    {
        $this->pluginService = $pluginService;
    }

    public function index()
    {
        $plugins = $this->pluginService->getPlugins();
        return Inertia::render('admin/plugins', [
            'plugins' => $plugins
        ]);
    }

    public function toggle(Request $request, $slug)
    {
        $request->validate([
            'is_active' => 'required|boolean',
        ]);

        if ($request->is_active) {
            $this->pluginService->activatePlugin($slug);
            $msg = "Plugin '{$slug}' activated.";
        } else {
            $this->pluginService->deactivatePlugin($slug);
            $msg = "Plugin '{$slug}' deactivated.";
        }

        return redirect()->back()->with('success', $msg);
    }
}
