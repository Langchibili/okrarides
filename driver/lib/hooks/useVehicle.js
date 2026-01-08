'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  getVehicleDetails, 
  getVehicles, 
  addVehicle, 
  updateVehicle, 
  updateVehicleDetails,
  saveVehicleDetails,
  getVehicleMakesAndModels,
  getAllowedVehicleYears
} from '@/lib/api/vehicle';

export const useVehicle = () => {
  const [vehicleData, setVehicleData] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState(false);

  // Fetch current vehicle details
  const fetchVehicleDetails = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await getVehicleDetails();
      if (response.success) {
        setVehicleData(response.vehicle || null);
      } else {
        setError(response.error || 'Failed to fetch vehicle details');
      }
    } catch (err) {
      setError(err.message || 'An error occurred while fetching vehicle details');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch all vehicles
  const fetchVehicles = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await getVehicles();
      if (response.success) {
        setVehicles(response.vehicles || []);
      } else {
        setError(response.error || 'Failed to fetch vehicles');
      }
    } catch (err) {
      setError(err.message || 'An error occurred while fetching vehicles');
    } finally {
      setLoading(false);
    }
  }, []);

  // Add a new vehicle
  const addNewVehicle = useCallback(async (vehicleData) => {
    setUpdating(true);
    setError(null);
    
    try {
      const response = await addVehicle(vehicleData);
      if (response.success) {
        await fetchVehicles(); // Refresh the list
        return { success: true, vehicle: response.vehicle };
      } else {
        setError(response.error || 'Failed to add vehicle');
        return { success: false, error: response.error };
      }
    } catch (err) {
      const errorMsg = err.message || 'An error occurred while adding vehicle';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setUpdating(false);
    }
  }, [fetchVehicles]);

  // Update vehicle details
  const updateVehicleData = useCallback(async (vehicleId, updateData) => {
    setUpdating(true);
    setError(null);
    
    try {
      const response = await updateVehicle(vehicleId, updateData);
      if (response.success) {
        await fetchVehicleDetails(); // Refresh vehicle details
        return { success: true, vehicle: response.vehicle };
      } else {
        setError(response.error || 'Failed to update vehicle');
        return { success: false, error: response.error };
      }
    } catch (err) {
      const errorMsg = err.message || 'An error occurred while updating vehicle';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setUpdating(false);
    }
  }, [fetchVehicleDetails]);

  // Update vehicle details using the driver controller endpoint
  const updateCurrentVehicleDetails = useCallback(async (updateData) => {
    setUpdating(true);
    setError(null);
    
    try {
      const response = await updateVehicleDetails(updateData);
      if (response.success) {
        await fetchVehicleDetails(); // Refresh vehicle details
        return { success: true, vehicle: response.vehicle };
      } else {
        setError(response.error || 'Failed to update vehicle details');
        return { success: false, error: response.error };
      }
    } catch (err) {
      const errorMsg = err.message || 'An error occurred while updating vehicle details';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setUpdating(false);
    }
  }, [fetchVehicleDetails]);

  // Save vehicle details during onboarding
  const saveVehicleData = useCallback(async (vehicleData) => {
    setUpdating(true);
    setError(null);
    
    try {
      const response = await saveVehicleDetails(vehicleData);
      if (response.success) {
        return { success: true, vehicle: response.vehicle };
      } else {
        setError(response.error || 'Failed to save vehicle details');
        return { success: false, error: response.error };
      }
    } catch (err) {
      const errorMsg = err.message || 'An error occurred while saving vehicle details';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setUpdating(false);
    }
  }, []);

  // Check if vehicle has valid insurance
  const isInsuranceValid = useCallback(() => {
    if (!vehicleData?.insuranceExpiryDate) return false;
    
    const expiryDate = new Date(vehicleData.insuranceExpiryDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Compare date only
    
    return expiryDate >= today;
  }, [vehicleData]);

  // Check if insurance is expiring soon (within 30 days)
  const isInsuranceExpiringSoon = useCallback(() => {
    if (!vehicleData?.insuranceExpiryDate) return false;
    
    const expiryDate = new Date(vehicleData.insuranceExpiryDate);
    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);
    
    return expiryDate >= today && expiryDate <= thirtyDaysFromNow;
  }, [vehicleData]);

  // Get days until insurance expiry
  const getDaysUntilInsuranceExpiry = useCallback(() => {
    if (!vehicleData?.insuranceExpiryDate) return null;
    
    const expiryDate = new Date(vehicleData.insuranceExpiryDate);
    const today = new Date();
    const diffTime = expiryDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  }, [vehicleData]);

  // Format insurance expiry date
  const formatInsuranceExpiryDate = useCallback(() => {
    if (!vehicleData?.insuranceExpiryDate) return 'Not set';
    
    const date = new Date(vehicleData.insuranceExpiryDate);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }, [vehicleData]);

  // Get vehicle type display name
  const getVehicleTypeDisplay = useCallback(() => {
    if (!vehicleData?.vehicleType) return 'Unknown';
    
    const typeMap = {
      'taxi': 'Taxi',
      'bus': 'Bus',
      'motorcycle': 'Motorcycle',
      'car': 'Car',
      'van': 'Van',
      'truck': 'Truck',
    };
    
    return typeMap[vehicleData.vehicleType] || vehicleData.vehicleType;
  }, [vehicleData]);

  // Initialize on mount
  useEffect(() => {
    fetchVehicleDetails();
  }, [fetchVehicleDetails]);

  return {
    // State
    vehicleData,
    vehicles,
    loading,
    updating,
    error,
    
    // Getters
    hasVehicle: !!vehicleData?.id,
    isInsuranceValid,
    isInsuranceExpiringSoon,
    getDaysUntilInsuranceExpiry,
    formatInsuranceExpiryDate,
    getVehicleTypeDisplay,
    getVehicleMakesAndModels,
    getAllowedVehicleYears,
    
    // Actions
    fetchVehicleDetails,
    fetchVehicles,
    addNewVehicle,
    updateVehicleData,
    updateCurrentVehicleDetails,
    saveVehicleData,
    
    // Reset error
    clearError: () => setError(null),
    
    // Refresh all data
    refresh: async () => {
      await Promise.all([fetchVehicleDetails(), fetchVehicles()]);
    },
  };
};

export default useVehicle;