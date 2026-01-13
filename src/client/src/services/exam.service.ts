import api from './api';

export interface Question {
    id: string;
    creator_id: string;
    skill: 'listening' | 'reading' | 'writing' | 'speaking' | 'grammar' | 'vocabulary';
    type: 'multiple_choice' | 'fill_in_blank' | 'essay' | 'recording' | 'matching' | 'ordering';
    level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
    content_text: string;
    media_url?: string;
    media_type: 'none' | 'image' | 'audio' | 'video';
    options?: Record<string, string>;
    correct_answer?: string;
    explanation?: string;
    rubric_id?: string;
}

export interface Exam {
    id: string;
    creator_id: string;
    title: string;
    description: string;
    duration_minutes: number;
    pass_score?: number;
    grading_method: 'auto' | 'manual' | 'hybrid';
    list_question_ids: string[];
    status: 'draft' | 'published' | 'archived';
    questions?: Question[];
}

export interface ExamSubmission {
    id: string;
    exam_id: string;
    learner_id: string;
    started_at: string;
    submitted_at?: string;
    total_score: number;
    status: 'in_progress' | 'submitted' | 'grading' | 'completed';
    teacher_general_feedback?: string;
}

export interface SubmissionAnswer {
    id: string;
    submission_id: string;
    question_id: string;
    answer_type: 'text' | 'audio_url' | 'file_url' | 'option_id';
    content_text?: string;
    content_url?: string;
    selected_options?: any;
    is_correct?: boolean;
    score?: number;
    teacher_feedback?: string;
}

export const examService = {
    // Get all exams
    getExams: async (params?: { page?: number; limit?: number }) => {
        const response = await api.get('/exams', { params });
        return response.data;
    },

    // Get published exams only
    getPublishedExams: async () => {
        const response = await api.get('/exams/published');
        return response.data;
    },

    // Get exam by ID with questions
    getExamById: async (id: string) => {
        const response = await api.get(`/exams/${id}`);
        return response.data;
    },

    // Create exam (teacher only)
    createExam: async (data: Partial<Exam>) => {
        const response = await api.post('/exams', data);
        return response.data;
    },

    // Update exam (teacher only)
    updateExam: async (id: string, data: Partial<Exam>) => {
        const response = await api.put(`/exams/${id}`, data);
        return response.data;
    },

    // Delete exam (teacher only)
    deleteExam: async (id: string) => {
        const response = await api.delete(`/exams/${id}`);
        return response.data;
    },

    // Start exam session (learner)
    startSession: async (examId: string) => {
        const response = await api.post('/testSessions/start', { examId });
        return response.data;
    },

    // Submit exam answers
    finishSession: async (sessionId: string, answers: SubmissionAnswer[]) => {
        const response = await api.post(`/testSessions/${sessionId}/finish`, { answers });
        return response.data;
    },

    // Get all questions (for exam creation)
    getQuestions: async (params?: { skill?: string; level?: string; type?: string }) => {
        const response = await api.get('/questions', { params });
        return response.data;
    },

    // Create question (teacher only)
    createQuestion: async (data: Partial<Question>) => {
        const response = await api.post('/questions', data);
        return response.data;
    },

    // Update question (teacher only)
    updateQuestion: async (id: string, data: Partial<Question>) => {
        const response = await api.put(`/questions/${id}`, data);
        return response.data;
    },

    // Delete question (teacher only)
    deleteQuestion: async (id: string) => {
        const response = await api.delete(`/questions/${id}`);
        return response.data;
    },

    // Submit exam and get results with correct answers
    submitExam: async (examId: string, answers: Record<string, string>, timeSpent: number) => {
        const response = await api.post(`/exams/${examId}/submit`, { answers, timeSpent });
        return response.data;
    },

    // Get user's completed exams
    getMySubmissions: async () => {
        const response = await api.get('/exams/my-submissions');
        return response.data;
    }
};
