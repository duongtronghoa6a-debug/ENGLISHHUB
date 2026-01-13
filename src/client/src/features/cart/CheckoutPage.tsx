import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/common/Sidebar';
import { useTheme } from '../../context/ThemeContext';
import { useCart } from '../../context/CartContext';
import { CheckCircle } from 'lucide-react';
import { enrollmentService } from '../../services/enrollment.service';

const CheckoutPage = () => {
    const { isDarkMode } = useTheme();
    const { cart, cartTotal, clearCart } = useCart();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [success, setSuccess] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const navigate = useNavigate();

    const handlePayment = async () => {
        setIsProcessing(true);
        try {
            // Enroll user in each course from cart
            for (const item of cart) {
                await enrollmentService.enroll(item.id);
            }

            setSuccess(true);
            setTimeout(() => {
                clearCart();
                // Redirect to "Đang học" tab after successful payment
                navigate('/documents/paid?tab=learning');
            }, 2000);
        } catch (error) {
            console.error('Enrollment failed:', error);
            alert('Có lỗi xảy ra khi đăng ký khóa học. Vui lòng thử lại.');
        } finally {
            setIsProcessing(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0B1120]">
                <div className="bg-white dark:bg-[#151e32] p-10 rounded-3xl shadow-2xl text-center animate-in fade-in zoom-in duration-300">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle size={40} className="text-green-600" />
                    </div>
                    <h2 className="text-2xl font-bold mb-2 dark:text-white">Thanh toán thành công!</h2>
                    <p className="text-gray-500 mb-6">Bạn sẽ được chuyển hướng trong giây lát...</p>
                </div>
            </div>
        );
    }

    return (
        <div className={`min-h-screen transition-all duration-500 font-sans ${isDarkMode ? 'bg-[#0B1120] text-gray-100' : 'bg-gray-50 text-gray-800'
            }`}>
            <div className="flex relative">
                <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

                <div className="flex-1 md:ml-64 p-6 md:p-10 transition-all duration-300">

                    {/* Reuse Banner Idea from Image */}
                    <div className="relative w-full h-48 rounded-[32px] overflow-hidden mb-10 shadow-lg group">
                        <img
                            src="https://images.unsplash.com/photo-1556742049-0cfed4f7a07d?q=80&w=2670&auto=format&fit=crop"
                            alt="Checkout Banner"
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 flex items-center pl-10">
                            <div className="text-white">
                                <h1 className="text-3xl font-bold">Thanh toán</h1>
                                <p className="opacity-90">Hoàn tất đơn hàng của bạn</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                        {/* Left: Payment Methods */}
                        <div>
                            <h2 className="text-3xl font-serif font-bold mb-8">Phương thức thanh toán</h2>
                            <div className="space-y-6">
                                <div className="border border-gray-300 dark:border-gray-600 p-6 rounded-xl flex items-center gap-4 cursor-pointer hover:border-cyan-500 transition-colors bg-white dark:bg-[#151e32]">
                                    <div className="w-6 h-6 rounded-full border-2 border-cyan-500 flex items-center justify-center">
                                        <div className="w-3 h-3 bg-cyan-500 rounded-full"></div>
                                    </div>
                                    <span className="font-medium">Thanh toán qua VNPAY</span>
                                </div>
                                <div className="border border-gray-300 dark:border-gray-600 p-6 rounded-xl flex items-center gap-4 opacity-50 cursor-not-allowed">
                                    <div className="w-6 h-6 rounded-full border-2 border-gray-400"></div>
                                    <span className="font-medium">Thẻ tín dụng (Đang bảo trì)</span>
                                </div>
                            </div>

                            <button
                                onClick={handlePayment}
                                disabled={isProcessing || cart.length === 0}
                                className={`w-full py-4 rounded-xl font-bold shadow-lg transition-all mt-8 text-lg ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90'} bg-black dark:bg-white dark:text-black text-white`}
                            >
                                {isProcessing ? 'Đang xử lý...' : 'Thanh toán ngay'}
                            </button>
                            <p className="text-xs text-center mt-4 text-gray-500">Copyright © 2024. All Rights Reserved.</p>
                        </div>

                        {/* Right: Order Summary */}
                        <div className="bg-white dark:bg-[#151e32] p-8 rounded-3xl shadow-xl h-fit">
                            <h3 className="font-bold text-xl mb-6 flex items-center gap-2">
                                <span className="bg-red-500 w-6 h-6 rounded-full text-white text-xs flex items-center justify-center">{cart.length}</span>
                                Đơn hàng của bạn
                            </h3>

                            <div className="space-y-6 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                {cart.map(item => (
                                    <div key={item.id} className="flex gap-4">
                                        <img src={item.image} alt="" className="w-20 h-20 rounded-lg object-cover bg-gray-100" />
                                        <div className="flex-1">
                                            <h4 className="font-bold text-sm line-clamp-2">{item.title}</h4>
                                            <p className="text-xs text-gray-500 mt-1">Giảng viên: {item.author}</p>
                                            <div className="flex justify-between items-center mt-2">
                                                <span className="font-bold text-cyan-600">{item.price.toLocaleString()} $</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-white/10 space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="opacity-70">Tạm tính</span>
                                    <span className="font-medium">{cartTotal.toLocaleString()} $</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="opacity-70">Phí vận chuyển</span>
                                    <span className="font-medium">0 $</span>
                                </div>
                                <div className="flex justify-between items-center text-xl font-bold pt-3">
                                    <span>Tổng cộng</span>
                                    <span>{cartTotal.toLocaleString()} $</span>
                                </div>
                            </div>

                            <div className="mt-6 flex gap-2">
                                <input
                                    type="text"
                                    placeholder="Mã giảm giá"
                                    className="flex-1 border border-gray-300 dark:border-gray-600 bg-transparent rounded-lg px-4 py-2 outline-none focus:border-cyan-500"
                                />
                                <button className="bg-black dark:bg-white dark:text-black text-white px-4 py-2 rounded-lg font-bold text-sm">
                                    Sử dụng
                                </button>
                            </div>

                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default CheckoutPage;
