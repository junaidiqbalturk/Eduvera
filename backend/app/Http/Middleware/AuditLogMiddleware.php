<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

class AuditLogMiddleware
{
    /**
     * Handle an incoming request and capture security audit log.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        // Capture security audit details for mutation methods or admin routes
        if ($request->is('api/v1/admin/*') || in_array($request->method(), ['POST', 'PUT', 'DELETE', 'PATCH'])) {
            $auditData = [
                'timestamp' => now()->toIso8601String(),
                'user_id' => $request->user()?->id ?? 'Anonymous/API',
                'user_role' => $request->user()?->role ?? $request->header('X-User-Role') ?? 'Guest',
                'ip_address' => $request->ip(),
                'user_agent' => substr($request->userAgent() ?? '', 0, 100),
                'method' => $request->method(),
                'endpoint' => $request->fullUrl(),
                'status_code' => $response->getStatusCode(),
            ];

            Log::channel('daily')->info('SECURITY_AUDIT_LOG', $auditData);
        }

        return $response;
    }
}
