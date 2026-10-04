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

export const getBadmintonDashboard = async () => {
    const response = await axios.get(`${API_URL}badminton/dashboard`, authHeaders());
    return response.data;
};

export const getBadmintonBookings = async (fromDate: string, toDate: string) => {
    const query = `?fromDate=${encodeURIComponent(fromDate)}&toDate=${encodeURIComponent(toDate)}&pageNumber=1&pageSize=1000`;
    const response = await axios.get(`${API_URL}badminton/bookings${query}`, authHeaders());
    return response.data;
};

export const getCourts = async () => {
    const response = await axios.get(`${API_URL}badminton/courts`, authHeaders());
    return response.data;
};

export type CourtPayload = {
    name: string;
    pricePerSlot: number;
};

export const createCourt = async (payload: CourtPayload) => {
    const response = await axios.post(`${API_URL}badminton/courts`, payload, authHeaders());
    return response.data;
};

export const updateCourt = async (
    id: string,
    payload: CourtPayload & { status: number },
) => {
    const response = await axios.put(
        `${API_URL}badminton/courts/${id}`,
        { id, ...payload },
        authHeaders(),
    );
    return response.data;
};

export const getSlotConfigurationByCourt = async (courtId: string) => {
    const response = await axios.get(
        `${API_URL}badminton/court-slot-configurations/court/${courtId}`,
        authHeaders(),
    );
    return response.data;
};

export type SlotConfigurationPayload = {
    courtId: string;
    startTime: string;
    endTime: string;
    slotDurationMinutes: number;
    slotGapMinutes: number;
    isActive: number;
};

export const createSlotConfiguration = async (payload: SlotConfigurationPayload) => {
    const response = await axios.post(
        `${API_URL}badminton/court-slot-configurations`,
        payload,
        authHeaders(),
    );
    return response.data;
};

export const updateSlotConfiguration = async (
    id: string,
    payload: SlotConfigurationPayload & { id: string },
) => {
    const response = await axios.put(
        `${API_URL}badminton/court-slot-configurations/${id}`,
        payload,
        authHeaders(),
    );
    return response.data;
};
