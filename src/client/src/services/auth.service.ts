import api from './api';

export const authService = {
    // POST /api/v1/auth/login
    login: async (email: string, password: string) => {
        const response = await api.post('/auth/login', { email, password });
        return response.data;
    },

    // POST /api/v1/auth/register
    // role: 'LEARNER' | 'TEACHER' | 'ADMIN'
    register: async (email: string, password: string, role: string = 'LEARNER') => {
        const response = await api.post('/auth/register', { email, password, role });
        return response.data;
    },

    // GET /api/v1/auth/me
    getMe: async () => {
        const response = await api.get('/auth/me');
        return response.data;
    },

    // POST /api/v1/auth/logout
    logout: async () => {
        try {
            await api.post('/auth/logout');
        } catch (error) {
            console.error('Logout failed on server', error);
        }
    }
};
