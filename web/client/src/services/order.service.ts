import api from './api';

export interface Order {
    id: string;
    total_amount: number;
    status: string;
    created_at: string;
    items_json: any;
}

export const orderService = {
    getMyOrders: async () => {
        const response = await api.get('/orders');
        return response.data;
    },

    checkout: async (courseIds: string[], amount: number, paymentMethod: string) => {
        const response = await api.post('/orders/checkout', { courseIds, amount, paymentMethod });
        return response.data;
    }
};
