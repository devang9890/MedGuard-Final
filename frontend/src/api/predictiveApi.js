import API from "./axios";

export const getUsagePriority = async () => {
  return await API.get("/predictive/usage");
};
