import API from "./axios";

export const getTrustScore = async (supplierId) => {
  return await API.get(`/trust/${supplierId}`);
};
