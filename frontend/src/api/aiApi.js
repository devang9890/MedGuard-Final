import API from "./axios";

export const getAnomalies = async () => {
  return await API.get("/ai/anomaly");
};
