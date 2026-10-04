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

export const getCafeDashboard = async () => {
    const response = await axios.get(`${API_URL}cafe/dashboard`, authHeaders());
    return response.data;
};

export const getCafePayments = async (from: string, to: string) => {
    const query = `?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;
    const response = await axios.get(`${API_URL}cafe/payments${query}`, authHeaders());
    return response.data;
};

export const getCafeMenu = async () => {
    const response = await axios.get(`${API_URL}cafe/menu`, authHeaders());
    return response.data;
};
