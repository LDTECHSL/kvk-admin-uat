// src/env.ts
export const getEnv = () => {
  const env = (window as any).env;
  return {
    API_URL: env?.API_URL ?? "",
    COUPON_CODE_ID: env?.COUPON_CODE_ID ?? "",
  };
};
