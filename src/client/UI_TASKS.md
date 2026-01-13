# UI Implementation Tasks

Based on the implemented APIs and current Frontend state, here is the list of missing User Interfaces that need to be built.

## 1. Public Learning Pages (MISSING)
*   **Course List Page (`/courses`)**:
    *   **Goal**: Show all available courses with filters (Level, Price, Language).
    *   **Status**: Does not exist.
    *   **API**: `GET /api/v1/courses` (Implemented)
*   **Course Detail Page (`/courses/:slug` or `/courses/:id`)**:
    *   **Goal**: Show course syllabus, teacher info, and "Enroll" button.
    *   **Status**: Does not exist.
    *   **API**: `GET /api/v1/courses/:slug` (Implemented)

## 2. Learning Interactions (MISSING)
*   **Lesson Viewer**:
    *   **Goal**: Interface to watch videos/read content and mark progress.
    *   **Status**: Does not exist.
    *   **API**: `GET /api/v1/courses/:slug` (returns modules/lessons)
*   **Quiz/Exam Interface**:
    *   **Goal**: UI for taking quizzes (multiple choice).
    *   **Status**: Partially mocked (`TestTakingPage` exists?) but needs verification.
    *   **API**: `GET /api/v1/exams`, `POST /api/v1/exams/submit`

## 3. User Dashboard (PARTIAL)
*   **My Courses**:
    *   **Goal**: List courses the user currently owns.
    *   **Status**: `OrderHistoryPage` exists, but a dedicated learning dashboard is missing.
    *   **API**: `GET /api/v1/enrollments/my-courses` (Need to verify if implemented)

## 4. Frontend-Backend Data Sync (ISSUES)
*   **Documents**: `DocumentsPage` exists but mocks data or needs to be connected to an API (if `documents` API exists).
*   **Profile**: `ProfilePage` exists.

## Next Steps Plan
1.  **Create `CourseListPage.tsx`** (Route: `/courses`).
2.  **Create `CourseDetailPage.tsx`** (Route: `/courses/:id`).
3.  **Update `App.tsx`** to include these routes.
