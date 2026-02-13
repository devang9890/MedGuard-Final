import API from "./axios";

export const scanMedicine = (imageFile) => {
  const formData = new FormData();
  formData.append("file", imageFile);
  
  return API.post("/scan/medicine", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

export const verifyBatchManual = (batchNumber, manufacturer = null) => {
  return API.post("/scan/verify-batch", {
    batch_number: batchNumber,
    manufacturer: manufacturer,
  });
};

export const testScanService = () => API.get("/scan/test");
