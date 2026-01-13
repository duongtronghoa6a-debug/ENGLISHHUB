import api from './api';

export const cartService = {
    // GET /api/v1/cart
    getCart: async () => {
        const response = await api.get('/cart');
        return response.data;
    },

    // POST /api/v1/cart - Add item
    addToCart: async (courseId: number) => {
        const response = await api.post('/cart', { courseId });
        return response.data;
    },

    // DELETE /api/v1/cart/:id - Remove item (id is idCART_ITEM)
    removeFromCart: async (id: number | string) => {
        const response = await api.delete(`/cart/${id}`);
        return response.data; // expect { message: '...' }
    },

    // PATCH /api/v1/cart/:id/select - Select/Deselect for payment
    selectCartItem: async (id: number | string, isSelected: boolean) => {
        const response = await api.patch(`/cart/${id}/select`, { isSelected });
        return response.data;
    }
};

export const orderService = {
    // GET /api/v1/orders
    getOrders: async () => {
        const response = await api.get('/orders');
        return response.data;
    },

    // POST /api/v1/orders
    createOrder: async (courseIds: number[], paymentMethod: string) => {
        // paymentMethod: 'MOMO' | 'BANKING' | ...
        const response = await api.post('/orders', { courseIds, paymentMethod });
        return response.data;
    },

    // PUT /api/v1/orders/:id/pay
    confirmPayment: async (id: number | string) => {
        const response = await api.put(`/orders/${id}/pay`);
        return response.data;
    }
};
