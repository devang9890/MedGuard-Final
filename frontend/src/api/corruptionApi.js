import API from "./axios";

export const detectCorruption = async () => {
  return await API.get("/corruption/detect");
};
