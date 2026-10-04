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

// ---------- Dashboard ----------

export const getGamingDashboard = async () => {
    const response = await axios.get(`${API_URL}gaming-m/dashboard`, authHeaders());
    return response.data;
};

// ---------- Bookings / Payments ----------

export const getGamingBookings = async (fromDate: string, toDate: string) => {
    const query = `?fromDate=${encodeURIComponent(fromDate)}&toDate=${encodeURIComponent(toDate)}&pageNumber=1&pageSize=1000`;
    const response = await axios.get(`${API_URL}gaming-m/gaming-bookings${query}`, authHeaders());
    return response.data;
};

// ---------- Categories ----------

export const getGamingCategories = async () => {
    const response = await axios.get(`${API_URL}gaming-m/gaming-categories`, authHeaders());
    return response.data;
};

// ---------- Games ----------

export const getGames = async (isActive?: boolean) => {
    const query = typeof isActive === "boolean" ? `?isActive=${isActive}` : "";
    const response = await axios.get(`${API_URL}gaming-m/games${query}`, authHeaders());
    return response.data;
};

export const createGame = async (formData: FormData) => {
    const response = await axios.post(`${API_URL}gaming-m/games`, formData, {
        headers: {
            Authorization: `Bearer ${getToken()}`,
            "Content-Type": "multipart/form-data",
        },
    });
    return response.data;
};

export const updateGame = async (formData: FormData) => {
    const response = await axios.put(`${API_URL}gaming-m/games`, formData, {
        headers: {
            Authorization: `Bearer ${getToken()}`,
            "Content-Type": "multipart/form-data",
        },
    });
    return response.data;
};

export const activateGame = async (id: string) => {
    const response = await axios.put(`${API_URL}gaming-m/games/${id}/activate`, null, authHeaders());
    return response.data;
};

export const deactivateGame = async (id: string) => {
    const response = await axios.delete(`${API_URL}gaming-m/games/${id}`, authHeaders());
    return response.data;
};

// ---------- Gaming Stations ----------

export const getGamingStationsByCategory = async (categoryId: string) => {
    const response = await axios.get(
        `${API_URL}gaming-m/gaming-stations/by-category/${categoryId}`,
        authHeaders(),
    );
    return response.data;
};

export type GamingStationPayload = {
    gamingCategoryId: string;
    stationCode: string;
    name: string;
    isActive: boolean;
};

export const createGamingStation = async (payload: GamingStationPayload) => {
    const response = await axios.post(`${API_URL}gaming-m/gaming-stations`, payload, authHeaders());
    return response.data;
};

export const updateGamingStation = async (payload: GamingStationPayload & { id: string }) => {
    const response = await axios.put(`${API_URL}gaming-m/gaming-stations`, payload, authHeaders());
    return response.data;
};

export const activateGamingStation = async (id: string) => {
    const response = await axios.put(
        `${API_URL}gaming-m/gaming-stations/${id}/activate`,
        null,
        authHeaders(),
    );
    return response.data;
};

export const deactivateGamingStation = async (id: string) => {
    const response = await axios.put(
        `${API_URL}gaming-m/gaming-stations/${id}/deactivate`,
        null,
        authHeaders(),
    );
    return response.data;
};

export const deleteGamingStation = async (id: string) => {
    const response = await axios.delete(`${API_URL}gaming-m/gaming-stations/${id}`, authHeaders());
    return response.data;
};

// ---------- Slot Configuration (one per category) ----------

export const getSlotConfigurationByCategory = async (categoryId: string) => {
    const response = await axios.get(
        `${API_URL}gaming-m/gaming-slot-generation/configuration-by-category?categoryId=${categoryId}`,
        authHeaders(),
    );
    return response.data;
};

export type GamingSlotConfigPayload = {
    gamingCategoryId: string;
    startTime: string;
    endTime: string;
    slotDurationMinutes: number;
    slotGapMinutes: number;
    isActive: number;
    price: number;
};

export const createGamingSlotConfiguration = async (payload: GamingSlotConfigPayload) => {
    const response = await axios.post(
        `${API_URL}gaming-m/gaming-slot-generation`,
        payload,
        authHeaders(),
    );
    return response.data;
};

export const updateGamingSlotConfiguration = async (
    payload: GamingSlotConfigPayload & { id: string },
) => {
    const response = await axios.put(
        `${API_URL}gaming-m/gaming-slot-generation`,
        payload,
        authHeaders(),
    );
    return response.data;
};
