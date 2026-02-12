import API from "./axios";

export const getNationalRiskMap = async () => {
  return await API.get("/map/national");
};
