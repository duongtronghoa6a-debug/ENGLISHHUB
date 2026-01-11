import api from './api';

export interface UserProfile {
    id: string;
    email: string;
    role: string;
    status: string;
    profile?: {
        full_name?: string;
        phone?: string;
        address?: string;
        avatar_url?: string;
        bio_html?: string;
    };
    stats?: {
        total_xp: number;
        current_streak: number;
        longest_streak: number;
    };
}

export interface UpdateProfileData {
    full_name?: string;
    phone?: string;
    address?: string;
    bio_html?: string;
}

export const userService = {
    async getProfile(): Promise<{ success: boolean; data: UserProfile }> {
        const response = await api.get('/users/profile');
        return response.data;
    },

    async updateProfile(data: UpdateProfileData): Promise<{ success: boolean; message: string; data: any }> {
        const response = await api.put('/users/profile', data);
        return response.data;
    },

    async changePassword(currentPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> {
        const response = await api.put('/users/change-password', {
            currentPassword,
            newPassword
        });
        return response.data;
    }
};
