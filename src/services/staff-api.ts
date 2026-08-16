import axios from "axios";
import { getEnv } from "@/env";

const { API_URL } = getEnv();
const STAFF_API_URL = `${API_URL}identity-m/auth/staff`;
const STAFF_API_URL2 = `${API_URL}identity-m/staff`;

const getToken = () => {
    const admin = localStorage.getItem("admin")
        ? JSON.parse(localStorage.getItem("admin") as string)
        : null;

    return admin ? admin.token : null;
};

export const getStaffMembers = async () => {
    const token = getToken();
    try {
        const response = await axios.get(STAFF_API_URL + '/list', {
            headers: {
                Authorization: `Bearer ${token}`
            },
        });
        return response.data;
    } catch (error) {
        throw error;
    }
}

export const createStaffMember = async (staffData: any) => {
    const token = getToken();
    try {
        const response = await axios.post(STAFF_API_URL + '/register', staffData, {
            headers: {
                Authorization: `Bearer ${token}`
            },
        });
        return response.data;
    } catch (error) {
        throw error;
    }
}

export const assignModules = async (staffId: string, body: any) => {
    const token = getToken();
    try {
        const response = await axios.post(`${STAFF_API_URL2}/${staffId}/modules/assign`, body, {
            headers: {
                Authorization: `Bearer ${token}`
            },
        });
        return response.data;
    } catch (error) {
        throw error;
    }
};
