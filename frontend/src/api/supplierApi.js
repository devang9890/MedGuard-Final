import API from "./axios";

export const getSuppliers = () => API.get("/supplier/all");
export const addSupplier = (data) => API.post("/supplier/add", data);
export const verifySupplier = (id) => API.put(`/supplier/verify/${id}`);
export const blacklistSupplier = (id) => API.put(`/supplier/blacklist/${id}`);
