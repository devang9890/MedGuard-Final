import API from "./axios";

export const getDashboardAnalytics = () => API.get("/analytics/dashboard");

