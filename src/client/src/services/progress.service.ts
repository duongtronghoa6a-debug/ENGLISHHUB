import api from './api';

export const progressService = {
    /**
     * Update progress for a lesson in a course
     * @param courseId 
     * @param lessonId 
     */
    updateProgress: async (courseId: number | string, lessonId: number | string) => {
        const response = await api.post('/progress/update', { courseId, lessonId });
        return response.data;
    },

    /**
     * Get progress for a specific course
     * @param courseId 
     */
    getCourseProgress: async (courseId: number | string) => {
        const response = await api.get(`/progress/${courseId}`);
        return response.data;
    }
};
