import axios from "axios";
import { getEnv } from "@/env";

const { API_URL } = getEnv();
const MEMBERS_API_URL = `${API_URL}gym/members/`;

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

export const getMembers = async (includeDeleted = false) => {
    const response = await axios.get(
        `${MEMBERS_API_URL}?includeDeleted=${includeDeleted}`,
        authHeaders(),
    );
    return response.data;
};

export const reactivateMember = async (id: string) => {
    const response = await axios.post(
        `${MEMBERS_API_URL}${id}/reverse-soft-delete`,
        {},
        authHeaders(),
    );
    return response.data;
};

export const permanentlyDeleteMember = async (id: string) => {
    const response = await axios.delete(
        `${MEMBERS_API_URL}${id}`,
        authHeaders(),
    );
    return response.data;
};
