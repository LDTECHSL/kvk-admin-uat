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

export const getCarWashDashboard = async () => {
    const response = await axios.get(`${API_URL}car-service/dashboard`, authHeaders());
    return response.data;
};

export const getCarWashPayments = async (from: string, to: string) => {
    const query = `?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;
    const response = await axios.get(`${API_URL}car-service/payments${query}`, authHeaders());
    return response.data;
};

export const getCarWashServices = async () => {
    const response = await axios.get(`${API_URL}car-service/wash-service`, authHeaders());
    return response.data;
};

export const getCarWashPackages = async () => {
    const response = await axios.get(`${API_URL}car-service/package`, authHeaders());
    return response.data;
};
