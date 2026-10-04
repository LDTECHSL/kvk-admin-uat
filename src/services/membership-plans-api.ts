import axios from "axios";
import { getEnv } from "@/env";

const { API_URL } = getEnv();
const PLANS_API_URL = `${API_URL}gym/membership-plans/`;

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

export type MembershipPlanPayload = {
    title: string;
    description?: string | null;
    price: number;
    durationInDays: number;
    isActive: number;
    features?: string | null;
};

export const getMembershipPlans = async () => {
    const response = await axios.get(PLANS_API_URL, authHeaders());
    return response.data;
};

export const createMembershipPlan = async (payload: MembershipPlanPayload) => {
    const response = await axios.post(PLANS_API_URL, payload, authHeaders());
    return response.data;
};

export const updateMembershipPlan = async (id: string, payload: MembershipPlanPayload) => {
    const response = await axios.put(`${PLANS_API_URL}${id}`, payload, authHeaders());
    return response.data;
};

export const deleteMembershipPlan = async (id: string) => {
    const response = await axios.delete(`${PLANS_API_URL}${id}`, authHeaders());
    return response.data;
};
