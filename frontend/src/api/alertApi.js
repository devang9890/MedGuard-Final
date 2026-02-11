import API from "./axios";

export const getAlerts = () => API.get("/alerts/all");
