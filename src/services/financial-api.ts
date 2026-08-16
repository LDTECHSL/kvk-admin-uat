import axios from "axios";
import { getEnv } from "@/env";

const { API_URL } = getEnv();
const FINANCIAL_API_URL = `${API_URL}financial/`;

const getToken = () => {
    const admin = localStorage.getItem("admin")
        ? JSON.parse(localStorage.getItem("admin") as string)
        : null;

    return admin ? admin.token : null;
};

export const getFinancialSummary = async (startDate: string, endDate: string) => {
    const token = getToken();
    const response = await axios.get(`${FINANCIAL_API_URL}gym-analytics?StartDate=${startDate}&EndDate=${endDate}`, {
        headers: {
            Authorization: `Bearer ${token}`
        },
    });
    return response.data;
};