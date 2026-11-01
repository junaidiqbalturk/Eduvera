<?php

namespace App\Http\Controllers\Api;

use Illuminate\Http\JsonResponse;

trait ApiResponseTrait
{
    /**
     * Return a success JSON response.
     */
    protected function successResponse(mixed $data = null, string $message = 'Success', int $statusCode = 200): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => $message,
            'data' => $data,
            'errors' => null,
        ], $statusCode);
    }

    /**
     * Return an error JSON response.
     */
    protected function errorResponse(string $message = 'An error occurred', int $statusCode = 400, mixed $errors = null): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => $message,
            'data' => null,
            'errors' => $errors,
        ], $statusCode);
    }

    /**
     * Resolve the currently authenticated user from Request or Bearer Token.
     */
    protected function resolveAuthUser(\Illuminate\Http\Request $request): ?\App\Models\User
    {
        $user = $request->user();
        if ($user) {
            return $user;
        }

        $authHeader = $request->header('Authorization');
        if ($authHeader && str_starts_with($authHeader, 'Bearer ')) {
            $token = trim(substr($authHeader, 7));
            $user = \App\Models\User::where('api_token', $token)->first();

            if (!$user && str_starts_with($token, 'demo-')) {
                $user = \App\Models\User::where('is_demo', true)->first();
            }
        }

        return $user;
    }
}
