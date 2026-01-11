import api from './api';

export interface ClassEnrollment {
    id: string;
    classId: string;
    status: 'pending' | 'approved' | 'rejected';
    requestedAt: string;
    reviewedAt?: string;
    offlineClass?: any;
}

export interface EnrollmentRequest {
    id: string;
    classId: string;
    className: string;
    classThumbnail?: string;
    learner: {
        accountId: string;
        email: string;
        name: string;
        avatar?: string;
        phone?: string;
    };
    note?: string;
    requestedAt: string;
}

export const classEnrollmentService = {
    // Request to join a class
    requestEnrollment: async (classId: string, note?: string) => {
        const response = await api.post('/class-enrollments/request', { classId, note });
        return response.data;
    },

    // Get my enrollment requests
    getMyRequests: async () => {
        const response = await api.get('/class-enrollments/my-requests');
        return response.data;
    },

    // Get classes I'm enrolled in (approved)
    getEnrolledClasses: async () => {
        const response = await api.get('/class-enrollments/enrolled');
        return response.data;
    },

    // Teacher: Get pending requests
    getTeacherPendingRequests: async () => {
        const response = await api.get('/class-enrollments/teacher-pending');
        return response.data;
    },

    // Teacher: Approve request
    approveEnrollment: async (enrollmentId: string) => {
        const response = await api.put(`/class-enrollments/${enrollmentId}/approve`);
        return response.data;
    },

    // Teacher: Reject request
    rejectEnrollment: async (enrollmentId: string) => {
        const response = await api.put(`/class-enrollments/${enrollmentId}/reject`);
        return response.data;
    }
};
