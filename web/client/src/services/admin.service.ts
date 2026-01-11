import api from './api';

export const adminService = {
    // GET /api/v1/admin/dashboard-stats
    getDashboardStats: async () => {
        const response = await api.get('/admin/dashboard-stats');
        return response.data;
    },

    // GET /api/v1/admin/pending-actions
    getPendingActions: async () => {
        const response = await api.get('/admin/pending-actions');
        return response.data;
    },

    // GET /api/v1/admin/users
    getUsers: async (params?: { role?: string; page?: number; limit?: number }) => {
        const response = await api.get('/admin/users', { params });
        return response.data;
    },

    // GET /api/v1/courses (all courses for admin)
    getAllCourses: async (params?: { status?: string; page?: number; limit?: number }) => {
        const response = await api.get('/courses', { params });
        return response.data;
    },

    // PUT /api/v1/courses/:id (admin can update any course status)
    updateCourseStatus: async (id: string, status: string) => {
        const response = await api.put(`/courses/${id}`, { status });
        return response.data;
    }
};
