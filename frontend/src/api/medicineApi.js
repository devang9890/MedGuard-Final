import API from "./axios";

export const getMedicines = () => API.get("/medicine/all");
export const addMedicine = (data) => API.post("/medicine/add", data);
