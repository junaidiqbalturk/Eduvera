<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Notice;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class NoticeboardController extends Controller
{
    use ApiResponseTrait;

    /**
     * Get school notices and announcements
     */
    public function index(Request $request): JsonResponse
    {
        $user = $this->resolveAuthUser($request);
        $isDemo = $user && $user->is_demo;

        if (!$isDemo) {
            return $this->successResponse([
                [
                    'id' => 1,
                    'title' => 'Welcome to your Eduvera Workspace',
                    'content' => 'Your institutional portal has been initialized. You can now configure your classes, enroll students, invite teachers, and manage fee structures.',
                    'category' => 'Administrative',
                    'target_audience' => 'All Staff & Students',
                    'date' => date('Y-m-d'),
                    'posted_by' => 'Eduvera System',
                    'is_urgent' => false,
                    'status' => 'Published',
                ],
            ], 'Notices retrieved successfully');
        }

        $category = $request->query('category');
        $audience = $request->query('target_audience');
        $search = $request->query('search');

        $query = Notice::active()->orderBy('is_urgent', 'desc')->orderBy('date', 'desc');

        if (!empty($category) && $category !== 'All') {
            $query->where('category', $category);
        }

        if (!empty($audience) && $audience !== 'All') {
            $query->where('target_audience', 'like', "%{$audience}%");
        }

        if (!empty($search)) {
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhere('content', 'like', "%{$search}%")
                    ->orWhere('posted_by', 'like', "%{$search}%");
            });
        }

        $notices = $query->get()->map(function ($nt) {
            return [
                'id' => $nt->id,
                'title' => $nt->title,
                'category' => $nt->category,
                'posted_by' => $nt->posted_by,
                'date' => $nt->date ? $nt->date->format('Y-m-d') : null,
                'target_audience' => $nt->target_audience,
                'content' => $nt->content,
                'is_urgent' => (bool) $nt->is_urgent,
                'expiry_date' => $nt->expiry_date ? $nt->expiry_date->format('Y-m-d') : null,
            ];
        });

        return $this->successResponse($notices, 'Noticeboard items loaded');
    }

    /**
     * Publish a new campus notice
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:200',
            'category' => 'required|string|max:50',
            'posted_by' => 'nullable|string|max:100',
            'date' => 'nullable|date',
            'target_audience' => 'required|string|max:100',
            'content' => 'required|string',
            'is_urgent' => 'nullable|boolean',
            'expiry_date' => 'nullable|date',
        ]);

        if ($validator->fails()) {
            return $this->errorResponse('Validation failed', 422, $validator->errors());
        }

        $validated = $validator->validated();

        $notice = Notice::create([
            'title' => $validated['title'],
            'category' => $validated['category'],
            'posted_by' => $validated['posted_by'] ?? 'Administration',
            'date' => $validated['date'] ?? date('Y-m-d'),
            'target_audience' => $validated['target_audience'],
            'content' => $validated['content'],
            'is_urgent' => $request->boolean('is_urgent', false),
            'is_active' => true,
            'expiry_date' => $validated['expiry_date'] ?? null,
        ]);

        $responseData = [
            'id' => $notice->id,
            'title' => $notice->title,
            'category' => $notice->category,
            'posted_by' => $notice->posted_by,
            'date' => $notice->date ? $notice->date->format('Y-m-d') : null,
            'target_audience' => $notice->target_audience,
            'content' => $notice->content,
            'is_urgent' => (bool) $notice->is_urgent,
        ];

        return $this->successResponse($responseData, 'Campus notice published successfully', 201);
    }

    /**
     * Delete / archive notice
     */
    public function destroy(int $id): JsonResponse
    {
        $notice = Notice::find($id);

        if (!$notice) {
            return $this->errorResponse('Notice record not found.', 404);
        }

        $notice->delete();

        return $this->successResponse(null, 'Notice deleted successfully');
    }
}
