import api from "@/lib/axios";

/**
 * VENDOR REQUESTS
 */
export const getVendorRequests = async () => {
  const res = await api.get("/requests/vendor");
  return res.data;
};

/**
 * ACCEPT REQUEST
 */
export const acceptRequest = async (requestId) => {
  const res = await api.patch(`/requests/${requestId}/accept`);
  return res.data;
};

/**
 * REJECT REQUEST
 */
export const rejectRequest = async (requestId) => {
  const res = await api.patch(`/requests/${requestId}/reject`);
  return res.data;
};

/**
 * COMPLETE REQUEST
 */
export const completeRequest = async (requestId) => {
  const res = await api.patch(`/requests/${requestId}/complete`);
  return res.data;
};
