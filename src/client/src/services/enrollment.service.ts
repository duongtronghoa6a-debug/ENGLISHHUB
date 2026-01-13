import api from './api';

export const enrollmentService = {
    // GET /api/v1/enrollments/check/:id
    checkEnrollment: async (courseId: number | string) => {
        try {
            const response = await api.get(`/enrollments/check/${courseId}`);
            return response.data; // { isEnrolled: boolean }
        } catch (error) {
            return { isEnrolled: false };
        }
    },

    // GET /api/v1/enrollments/my-courses
    getMyCourses: async () => {
        const response = await api.get('/enrollments/my-courses');
        return response.data;
    },

    // POST /api/v1/enrollments/enroll/:courseId
    enroll: async (courseId: number | string) => {
        const response = await api.post(`/enrollments/enroll/${courseId}`);
        return response.data;
    }
};

export const offlineService = {
    // GET /api/v1/offlineSchedule/course/:id
    getScheduleByCourse: async (courseId: number | string) => {
        const response = await api.get(`/offlineSchedule/course/${courseId}`);
        return response.data;
    }
};
