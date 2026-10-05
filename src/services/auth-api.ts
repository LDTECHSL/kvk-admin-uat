import { ADMIN_ACCESS_ERROR, hasAllModuleAccess } from '@/lib/admin-access';
import { getEnv } from "@/env";
import axios from "axios";

const { API_URL } = getEnv();
const AUTH_API_URL = `${API_URL}identity-m/auth/`;
const COUPON_API_URL = `${API_URL}identity/offer-rate/`;

const getToken = () => {
    const admin = localStorage.getItem("admin")
        ? JSON.parse(localStorage.getItem("admin") as string)
        : null;

    return admin ? admin.token : null;
};


export const login = async (username: string, password: string) => {
  try {
    const response = await axios.post(`${AUTH_API_URL}staff/login`, { username, password, moduleName: 'Admin' });
    if (!hasAllModuleAccess(response.data.modules)) {
      throw new Error(ADMIN_ACCESS_ERROR);
    }
    return response.data;
  } catch (error) {
    console.error("Login failed:", error);
    throw error;
  }
};

export const changePassword = async (body: any) => {
  try {
    const response = await axios.post(`${AUTH_API_URL}staff/change-password`, body, {
      headers: {
        Authorization: `Bearer ${getToken()}`
      }
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const generateCouponCodes = async (body: FormData) => {
  try {
    const response = await axios.post(`${COUPON_API_URL}assign-and-generate-coupons`, body, {
      headers: {
        Authorization: `Bearer ${getToken()}`
      }
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getCouponCodes = async () => {
  try {
    const response = await axios.get(`${COUPON_API_URL}eligible-members`, {
      headers: {
        Authorization: `Bearer ${getToken()}`
      }
    });
    return response.data;
  } catch (error) {
    throw error;
  }
}