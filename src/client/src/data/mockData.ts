export const ROLES = [
    { id: 'student', label: 'Student' },
    { id: 'teacher', label: 'Teacher' }
];

export const MOCK_USERS = [
    {
        email: '01@gmail.com',
        password: '1',
        name: 'Nguyễn Văn A',
        role: 'student',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100'
    },
    {
        email: 'teacher@gmail.com',
        password: '1',
        name: 'Mr. Simon',
        role: 'teacher',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=100'
    }
];

export const MOCK_DOCUMENTS = [
    // FREE DOCUMENTS (Blog/Articles)
    {
        id: 1,
        title: "1000 từ vựng TOEIC thông dụng",
        description: "Tổng hợp các từ vựng thường gặp nhất trong bài thi TOEIC, kèm ví dụ minh họa và âm thanh.",
        image: "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&q=80&w=2400",
        type: "free",
        author: "Ms. Hoa",
        rating: 4.8,
        progress: 0,
        isCompleted: false
    },
    {
        id: 2,
        title: "Cấu trúc ngữ pháp B1",
        description: "Hệ thống toàn bộ kiến thức ngữ pháp trình độ Intermediate.",
        image: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&q=80&w=2400",
        type: "free",
        author: "Mr. John",
        rating: 4.5,
        progress: 30,
        isCompleted: false
    },
    {
        id: 3,
        title: "Luyện nghe TED Talks",
        description: "Phương pháp luyện nghe thụ động hiệu quả qua các bài diễn thuyết.",
        image: "https://images.unsplash.com/photo-1478720568477-152d9b164e63?auto=format&fit=crop&q=80&w=2400",
        type: "free",
        author: "English Hub",
        rating: 4.9,
        progress: 0,
        isCompleted: false
    },

    // PAID COURSES (Video Series, Full Curriculum)
    {
        id: 101,
        title: "IELTS Intensive Speaking",
        description: "Khóa học chuyên sâu kỹ năng Speaking cho mục tiêu 7.0+.",
        image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=2400",
        type: "paid",
        price: 49.99,
        author: "Mr. Simon",
        rating: 5.0,
        progress: 0,
        isCompleted: false
    },
    {
        id: 102,
        title: "Advanced Business English",
        description: "Tiếng Anh thương mại cho người đi làm, viết email và đàm phán.",
        image: "https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&q=80&w=2400",
        type: "paid",
        price: 79.99,
        author: "Harvard Biz Review",
        rating: 4.7,
        progress: 15,
        isCompleted: false
    },
    {
        id: 103,
        title: "Mastering English Pronunciation",
        description: "Làm chủ phát âm Anh-Mỹ trong 30 ngày.",
        image: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&q=80&w=2400",
        type: "paid",
        price: 29.99,
        author: "Lisa Mojsin",
        rating: 4.6,
        progress: 0,
        isCompleted: false
    },

    // OFFLINE COURSES (Center based)
    {
        id: 201,
        title: "Lớp Giao Tiếp Cơ Bản - Hà Nội",
        description: "Học trực tiếp với giáo viên bản ngữ tại cơ sở Cầu Giấy. Lớp tối 2-4-6.",
        image: "https://images.unsplash.com/photo-1571260899304-425eee4c7efc?auto=format&fit=crop&q=80&w=2400",
        type: "offline",
        author: "English Hub Center",
        rating: 4.9,
        progress: 0,
        isCompleted: false,
        // New Fields for Offline Tabs
        offlineDetails: {
            schedule: {
                days: ["Mon", "Wed", "Fri"],
                time: "19:30 - 21:00",
                startDate: "15/05/2026",
                location: "Tầng 4, Tòa nhà ABC, Cầu Giấy, Hà Nội"
            },
            curriculum: [
                { title: "Giai đoạn 1: Chuẩn hóa phát âm", duration: "1 tháng", items: ["44 âm IPA", "Trọng âm từ & câu", "Ngữ điệu cảm xúc"] },
                { title: "Giai đoạn 2: Phản xạ giao tiếp", duration: "1.5 tháng", items: ["Chủ đề Daily Life", "Chủ đề Work & Travel", "Thuyết trình cơ bản"] },
                { title: "Giai đoạn 3: Thực hành chuyên sâu", duration: "0.5 tháng", items: ["Săn Tây Bờ Hồ", "Debate Club", "Final Project"] }
            ],
            commitment: [
                "Cam kết đầu ra giao tiếp trôi chảy các chủ đề thông dụng.",
                "Hoàn lại 100% học phí nếu không đạt yêu cầu.",
                "Hỗ trợ học lại miễn phí trọn đời.",
                "Tặng kèm khóa học Online trị giá 2.000.000đ."
            ]
        }
    },
    {
        id: 202,
        title: "Luyện thi IELTS Offline (Cam kết 6.5)",
        description: "Khóa học 3 tháng tại cơ sở Quận 1, TP.HCM. Kèm 1-1.",
        image: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&q=80&w=2400",
        type: "offline",
        author: "IELTS Master",
        rating: 4.8,
        progress: 0,
        isCompleted: false,
        offlineDetails: {
            schedule: {
                days: ["Tue", "Thu", "Sat"],
                time: "18:00 - 20:00",
                startDate: "20/05/2026",
                location: "CS2: Quận 1, TP.HCM"
            },
            curriculum: [
                { title: "Foundation", duration: "1 tháng", items: ["Grammar & Vocab for IELTS", "Basic Writing"] },
                { title: "Skill Building", duration: "1.5 tháng", items: ["4 Skills Intensive", "Mock Test hàng tuần"] },
                { title: "Advanced Strategies", duration: "0.5 tháng", items: ["Mẹo làm bài nhanh", "Quản lý thời gian", "Dự đoán đề"] }
            ],
            commitment: [
                "Cam kết văn bản đầu ra 6.5+.",
                "Giáo viên 8.5+ trực tiếp giảng dạy.",
                "Chấm chữa bài Writing/Speaking không giới hạn."
            ]
        }
    },

    // TESTS
    {
        id: 301,
        title: "Test trình độ đầu vào",
        description: "Kiểm tra toàn diện 4 kỹ năng Nghe - Nói - Đọc - Viết để xếp lớp.",
        image: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&q=80&w=2400",
        type: "test",
        author: "System",
        rating: 0,
        progress: 0,
        isCompleted: false,
        // Mock Questions for Placement Test
        duration: 45, // minutes
        questions: [
            {
                id: 1,
                text: "She _____ to the gym three times a week.",
                options: ["go", "goes", "going", "gone"],
                correctAnswer: 1
            },
            {
                id: 2,
                text: "I haven't seen him _____ last year.",
                options: ["since", "for", "from", "in"],
                correctAnswer: 0
            },
            {
                id: 3,
                text: "If I _____ you, I would study harder.",
                options: ["am", "was", "were", "been"],
                correctAnswer: 2
            },
            {
                id: 4,
                text: "Choose the correct sentence.",
                options: ["Where represents the data?", "Where does the data represent?", "What does the data represent?", "What represents the data?"],
                correctAnswer: 2
            }
        ]
    },
    {
        id: 302,
        title: "Mini-Test: Past Simple",
        description: "Bài kiểm tra nhanh ngữ pháp thì quá khứ đơn. 15 phút.",
        image: "https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?auto=format&fit=crop&q=80&w=2400",
        type: "test",
        author: "Grammar Bot",
        rating: 4.5,
        progress: 100,
        isCompleted: true,
        duration: 15,
        questions: [
            { id: 1, text: "They _____ football yesterday.", options: ["play", "played", "playing", "plays"], correctAnswer: 1 },
            { id: 2, text: "_____ you go to school yesterday?", options: ["Do", "Did", "Does", "Done"], correctAnswer: 1 }
        ]
    }
];

export const MOCK_BANNERS = {
    free: {
        title: "Tài liệu miễn phí",
        description: "Kho tàng kiến thức chất lượng cao được cộng đồng đóng góp",
        image: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&q=80&w=2400"
    },
    paid: {
        title: "Khóa học trả phí",
        description: "Đầu tư cho tương lai với các khóa học bài bản từ chuyên gia",
        image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=2400"
    },
    offline: {
        title: "Khóa học Offline",
        description: "Trải nghiệm môi trường học tập chuyên nghiệp tại các cơ sở",
        image: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&q=80&w=2400"
    },
    test: {
        title: "Ngân hàng đề thi",
        description: "Đánh giá năng lực chính xác với hệ thống bài thi chuẩn hóa",
        image: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&q=80&w=2400"
    }
};
