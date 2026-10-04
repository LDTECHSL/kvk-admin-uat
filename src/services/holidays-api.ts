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

export const getHolidays = async (year: number) => {
    const response = await axios.get(`${API_URL}identity/holidays?year=${year}`, authHeaders());
    return response.data;
};

export type HolidayPayload = {
    id: string;
    year: string;
    month: string;
    day: string;
    description: string;
    isActive: boolean;
    isImported: boolean;
    source: string;
    durationDays: number;
};

export const createHoliday = async (payload: HolidayPayload) => {
    const response = await axios.post(`${API_URL}identity/holidays`, payload, authHeaders());
    return response.data;
};

export const updateHoliday = async (id: string, payload: HolidayPayload) => {
    const response = await axios.put(`${API_URL}identity/holidays/${id}`, payload, authHeaders());
    return response.data;
};

export const deleteHoliday = async (id: string) => {
    const response = await axios.delete(`${API_URL}identity/holidays/${id}`, authHeaders());
    return response.data;
};
