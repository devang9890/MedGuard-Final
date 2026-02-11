import API from "./axios";

export const getDashboardStats = () => API.get("/dashboard");
export const getNearExpiry = () => API.get("/dashboard/near-expiry");
export const getSupplierRisk = () => API.get("/dashboard/supplier-risk");
export const getComplianceTrend = () => API.get("/dashboard/compliance-trend");

