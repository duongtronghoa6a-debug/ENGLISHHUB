export const APP_INFO = {
    name: {
        first: "ENGLISH",
        last: "HUB"
    },
    contact: {
        phone: "+84 1234567890",
        address: "Hồ Chí Minh city",
        email: "abc@company.com"
    },
    socials: {
        facebook: "#",
        linkedin: "#",
        mail: "#",
        youtube: "#"
    }
};

export interface User {
    _id?: string;
    email: string;
    name: string;
    role: 'student' | 'teacher' | 'admin' | string;
    avatar?: string;
    hasTakenPlacementTest?: boolean;
}
