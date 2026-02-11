import API from "./axios";

export const addSupply = (data) => API.post("/supply/intake", data);
export const getSupplies = () => API.get("/supply/all");
