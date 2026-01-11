import api from './api';
import type { Exam, Question } from './exam.service';
import type { OfflineClass } from './offline.service';

export interface TeacherStats {
    totalCourses: number;
    totalStudents: number;
    totalExams: number;
    totalOfflineClasses: number;
    pendingSubmissions: number;
    avgRating: number;
}

export interface RecentActivity {
    type: 'enrollment' | 'submission' | 'review' | 'registration';
    message: string;
    timestamp: string;
}

export const teacherService = {
    // ============ DASHBOARD ============
    getDashboardStats: async (): Promise<TeacherStats> => {
        const response = await api.get('/teacher/dashboard-stats');
        return response.data;
    },

    getRecentActivity: async (): Promise<RecentActivity[]> => {
        const response = await api.get('/teacher/recent-activity');
        return response.data;
    },

    // ============ COURSES ============
    getMyCourses: async (params?: { status?: string; page?: number; limit?: number }) => {
        const response = await api.get('/teacher/my-courses', { params });
        return response.data;
    },

    createCourse: async (data: {
        title: string;
        description?: string;
        price?: number;
        level?: string;
        category?: string;
        thumbnail_url?: string;
        is_published?: boolean;
    }) => {
        const response = await api.post('/teacher/courses', data);
        return response.data;
    },

    updateCourse: async (id: string, data: Partial<{
        title: string;
        description: string;
        price: number;
        level: string;
        category: string;
        thumbnail_url: string;
        is_published: boolean;
    }>) => {
        const response = await api.put(`/teacher/courses/${id}`, data);
        return response.data;
    },

    deleteCourse: async (id: string) => {
        const response = await api.delete(`/teacher/courses/${id}`);
        return response.data;
    },

    // ============ LESSONS ============
    getCourseLessons: async (courseId: string) => {
        const response = await api.get(`/teacher/courses/${courseId}/lessons`);
        return response.data;
    },

    createLesson: async (data: {
        course_id: string;
        title: string;
        content_type?: string;
        content_url?: string;
        duration_minutes?: number;
        order_index?: number;
        is_free?: boolean;
    }) => {
        const response = await api.post('/teacher/lessons', data);
        return response.data;
    },

    updateLesson: async (id: string, data: Partial<{
        title: string;
        content_type: string;
        content_url: string;
        duration_minutes: number;
        order_index: number;
        is_free: boolean;
    }>) => {
        const response = await api.put(`/teacher/lessons/${id}`, data);
        return response.data;
    },

    deleteLesson: async (id: string) => {
        const response = await api.delete(`/teacher/lessons/${id}`);
        return response.data;
    },

    // ============ EXAMS ============
    getMyExams: async (params?: { status?: string; page?: number; limit?: number }) => {
        const response = await api.get('/exams', { params });
        return response.data;
    },

    createExam: async (data: Partial<Exam>) => {
        const response = await api.post('/exams', data);
        return response.data;
    },

    updateExam: async (id: string, data: Partial<Exam>) => {
        const response = await api.put(`/exams/${id}`, data);
        return response.data;
    },

    deleteExam: async (id: string) => {
        const response = await api.delete(`/exams/${id}`);
        return response.data;
    },

    getExamSubmissions: async (examId: string) => {
        const response = await api.get(`/exams/${examId}/submissions`);
        return response.data;
    },

    gradeSubmission: async (submissionId: string, data: {
        total_score: number;
        teacher_general_feedback?: string;
        answers?: Array<{
            question_id: string;
            score: number;
            teacher_feedback?: string;
        }>;
    }) => {
        const response = await api.post(`/submissions/${submissionId}/grade`, data);
        return response.data;
    },

    // ============ QUESTIONS ============
    getMyQuestions: async (params?: { skill?: string; level?: string; type?: string }) => {
        const response = await api.get('/questions', { params });
        return response.data;
    },

    createQuestion: async (data: Partial<Question>) => {
        const response = await api.post('/questions', data);
        return response.data;
    },

    updateQuestion: async (id: string, data: Partial<Question>) => {
        const response = await api.put(`/questions/${id}`, data);
        return response.data;
    },

    deleteQuestion: async (id: string) => {
        const response = await api.delete(`/questions/${id}`);
        return response.data;
    },

    // ============ OFFLINE CLASSES ============
    getMyOfflineClasses: async () => {
        const response = await api.get('/offline-classes');
        return response.data;
    },

    createOfflineClass: async (data: Partial<OfflineClass>) => {
        const response = await api.post('/offline-classes', data);
        return response.data;
    },

    updateOfflineClass: async (id: string, data: Partial<OfflineClass>) => {
        const response = await api.put(`/offline-classes/${id}`, data);
        return response.data;
    },

    deleteOfflineClass: async (id: string) => {
        const response = await api.delete(`/offline-classes/${id}`);
        return response.data;
    },

    getOfflineClassAttendees: async (classId: string) => {
        const response = await api.get(`/offline-classes/${classId}/attendees`);
        return response.data;
    }
};
