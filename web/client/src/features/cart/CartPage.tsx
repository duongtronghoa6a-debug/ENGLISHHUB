import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/common/Sidebar';
import { useTheme } from '../../context/ThemeContext';
import { useCart } from '../../context/CartContext';
import { Trash2, CreditCard } from 'lucide-react';

const CartPage = () => {
    const { isDarkMode } = useTheme();
    const { cart, removeFromCart, cartTotal } = useCart();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const navigate = useNavigate();

    return (
        <div className={`min-h-screen transition-all duration-500 font-sans ${isDarkMode ? 'bg-[#0B1120] text-gray-100' : 'bg-gray-50 text-gray-800'
            }`}>
            <div className="flex relative">
                <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

                <div className="flex-1 md:ml-64 p-6 md:p-10 transition-all duration-300">

                    <h1 className="text-3xl font-bold mb-8 text-center font-serif">Giỏ Hàng</h1>
                    <div className="text-center mb-10 text-sm text-gray-500">
                        Home <span className="mx-2">\</span> Giỏ hàng của bạn
                    </div>

                    {cart.length === 0 ? (
                        <div className="text-center py-20">
                            <p className="text-xl opacity-60">Giỏ hàng đang trống</p>
                            <button onClick={() => navigate('/documents/paid')} className="mt-4 text-cyan-500 hover:underline">
                                Xem tài liệu trả phí
                            </button>
                        </div>
                    ) : (
                        <div className="max-w-5xl mx-auto bg-white dark:bg-[#151e32] shadow-2xl rounded-3xl p-8">
                            {/* Table Header */}
                            <div className="grid grid-cols-12 gap-4 pb-4 border-b border-gray-200 dark:border-white/10 font-bold opacity-70 mb-4">
                                <div className="col-span-6">Sản Phẩm</div>
                                <div className="col-span-2 text-center">Đơn Giá</div>
                                <div className="col-span-2 text-center">Số Lượng</div>
                                <div className="col-span-2 text-right">Thành Tiền</div>
                            </div>

                            {/* Cart Items */}
                            <div className="space-y-6">
                                {cart.map(item => (
                                    <div key={item.id} className="grid grid-cols-12 gap-4 items-center pb-6 border-b border-gray-100 dark:border-white/5 last:border-0 last:pb-0">

                                        {/* Product Info */}
                                        <div className="col-span-6 flex gap-4">
                                            <div className="w-24 h-24 rounded-xl overflow-hidden shadow-md shrink-0">
                                                <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                                            </div>
                                            <div className="flex flex-col justify-center">
                                                <h3 className="font-bold text-lg">{item.title}</h3>
                                                <p className="text-sm opacity-60">Giảng viên: {item.author}</p>
                                                <button
                                                    onClick={() => removeFromCart(item.id)}
                                                    className="text-red-500 text-sm flex items-center gap-1 mt-2 hover:underline w-fit"
                                                >
                                                    <Trash2 size={14} /> Xóa
                                                </button>
                                            </div>
                                        </div>

                                        {/* Price */}
                                        <div className="col-span-2 text-center font-medium">
                                            {item.price.toLocaleString()} $
                                        </div>

                                        {/* Quantity */}
                                        <div className="col-span-2 flex justify-center">
                                            <div className="border border-gray-300 dark:border-gray-600 rounded px-3 py-1">
                                                01
                                            </div>
                                        </div>

                                        {/* Total */}
                                        <div className="col-span-2 text-right font-bold text-lg">
                                            {(item.price * item.quantity).toLocaleString()} $
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Summary Footer */}
                            <div className="mt-10 pt-6 border-t border-gray-200 dark:border-white/10 flex flex-col items-end gap-6">
                                <div className="flex items-center gap-8">
                                    <span className="text-xl font-bold opacity-70">Tạm Tính</span>
                                    <span className="text-2xl font-bold">{cartTotal.toLocaleString()} $</span>
                                </div>
                                <button
                                    onClick={() => navigate('/checkout')}
                                    className="bg-black dark:bg-white dark:text-black text-white px-10 py-3 rounded-xl font-bold shadow-lg hover:opacity-90 transition-all flex items-center gap-2"
                                >
                                    Thực hiện thanh toán
                                </button>
                            </div>

                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};

export default CartPage;
