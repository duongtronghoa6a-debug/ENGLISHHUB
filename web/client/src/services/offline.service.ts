import api from './api';

export interface OfflineClass {
    id: string;
    teacher_id: string;
    class_name: string;
    organizer_name: string;
    address: string;
    schedule_text: string;
    syllabus_json: any[];
    commitment_text: string;
    price: number;
    capacity: number;
    current_enrolled: number;
    thumbnail_url: string;
    status: 'open' | 'closed' | 'completed';
}

export interface OfflineClassWithTeacher extends OfflineClass {
    teacher?: {
        id: string;
        full_name: string;
        email: string;
    };
}

export const offlineService = {
    // Get all offline classes
    getClasses: async (params?: { page?: number; limit?: number }) => {
        const response = await api.get('/offline-classes', { params });
        return response.data;
    },

    // Get only open (enrollable) classes
    getOpenClasses: async () => {
        const response = await api.get('/offline-classes/open');
        return response.data;
    },

    // Get class by ID with details
    getClassById: async (id: string) => {
        const response = await api.get(`/offline-classes/${id}`);
        return response.data;
    },

    // Enroll in a class
    enroll: async (classId: string) => {
        const response = await api.post(`/offline-classes/${classId}/enroll`);
        return response.data;
    },

    // Create new class (teacher only)
    createClass: async (data: Partial<OfflineClass>) => {
        const response = await api.post('/offline-classes', data);
        return response.data;
    },

    // Update class (teacher only)
    updateClass: async (id: string, data: Partial<OfflineClass>) => {
        const response = await api.put(`/offline-classes/${id}`, data);
        return response.data;
    },

    // Delete class (teacher only)
    deleteClass: async (id: string) => {
        const response = await api.delete(`/offline-classes/${id}`);
        return response.data;
    },

    // Get my registrations (learner)
    getMyRegistrations: async () => {
        const response = await api.get('/offline-classes/my-registrations');
        return response.data;
    }
};
