import axios from "axios";
import { getEnv } from "@/env";

const { API_URL } = getEnv();
const MEMBERS_API_URL = `${API_URL}identity/members/`;

const getToken = () => {
  const admin = localStorage.getItem("admin")
    ? JSON.parse(localStorage.getItem("admin") as string)
    : null;

  return admin ? admin.token : null;
};

export const getMembers = async () => {
    try {
        const response = await axios.get(MEMBERS_API_URL, {
            headers: {
                Authorization: `Bearer ${getToken()}`
            }
        });
        return response.data;
    } catch (error) {
        throw error;
    }
}

export const pay = async (body: any) => {
    try {
        const response = await axios.post(`${MEMBERS_API_URL}pay`, body, {
            headers: {
                Authorization: `Bearer ${getToken()}`
            }
        });
        return response.data;
    } catch (error) {
        throw error;
    }
}