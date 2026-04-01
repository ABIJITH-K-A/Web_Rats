import { apiRequest } from './apiClient';

/**
 * Fetch available orders from the pool (backend API)
 */
export const fetchOrderPool = async () => {
  try {
    const response = await apiRequest('/pool/available', {
      authMode: 'required',
    });
    return response.orders || [];
  } catch (error) {
    console.error('Failed to fetch order pool:', error);
    throw error;
  }
};

/**
 * Claim an order from the pool via backend
 */
export const claimOrderFromPool = async (orderId) => {
  try {
    const response = await apiRequest(`/pool/claim/${orderId}`, {
      method: 'POST',
      authMode: 'required',
    });
    return response;
  } catch (error) {
    console.error('Failed to claim order:', error);
    throw error;
  }
};
