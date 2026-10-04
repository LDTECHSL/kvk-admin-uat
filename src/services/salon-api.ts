import axios from "axios";
import { getEnv } from "@/env";

const { API_URL } = getEnv();

const getToken = () => {
    const admin = localStorage.getItem("admin")
        ? JSON.parse(localStorage.getItem("admin") as string)
        : null;

    return admin ? admin.token : null;
};

const authHeaders = () => ({
    headers: {
        Authorization: `Bearer ${getToken()}`,
    },
});

export const getSalonDashboard = async () => {
    const response = await axios.get(`${API_URL}saloon/dashboard`, authHeaders());
    return response.data;
};

export const getSalonBookings = async (fromDate: string, toDate: string) => {
    const query = `?fromDate=${encodeURIComponent(fromDate)}&toDate=${encodeURIComponent(toDate)}&pageNumber=1&pageSize=1000`;
    const response = await axios.get(`${API_URL}saloon/saloons/bookings${query}`, authHeaders());
    return response.data;
};

export const getSalonServices = async () => {
    const response = await axios.get(`${API_URL}saloon/service-items`, authHeaders());
    return response.data;
};

export const createSalonService = async (formData: FormData) => {
    const response = await axios.post(`${API_URL}saloon/service-items`, formData, {
        headers: {
            Authorization: `Bearer ${getToken()}`,
            "Content-Type": "multipart/form-data",
        },
    });
    return response.data;
};

export const updateSalonService = async (id: string, formData: FormData) => {
    const response = await axios.put(`${API_URL}saloon/service-items/${id}`, formData, {
        headers: {
            Authorization: `Bearer ${getToken()}`,
            "Content-Type": "multipart/form-data",
        },
    });
    return response.data;
};

export const deleteSalonService = async (id: string) => {
    const response = await axios.delete(`${API_URL}saloon/service-items/${id}`, authHeaders());
    return response.data;
};

export const getSalonBusinessHours = async () => {
    const response = await axios.get(`${API_URL}saloon/business-hours`, authHeaders());
    return response.data;
};

export const updateSalonBusinessHours = async (data: {
    openTime: string;
    closeTime: string;
    slotIntervalMinutes: number;
}) => {
    const response = await axios.put(`${API_URL}saloon/business-hours`, data, authHeaders());
    return response.data;
};
