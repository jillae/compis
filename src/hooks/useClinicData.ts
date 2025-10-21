
import { useState, useEffect } from "react";
import { useClinics } from "@/hooks/useClinics";
import { useClinicServices } from "@/hooks/useClinicServices";
import { useBookedCustomers } from "@/hooks/useBookedCustomers";
import { useClinicSettings } from "@/hooks/useClinicSettings";
import { useDemoData } from "@/hooks/useDemoData";
import { ClinicSettings } from "@/types/clinic";

const useClinicData = () => {
  // Get demo data if in demo mode
  const { isDemoMode, demoSettings, demoClinic } = useDemoData();
  
  // Get clinics and active clinic
  const { clinics, activeClinic, selectClinic, isLoading: clinicsLoading } = useClinics();
  const clinicId = isDemoMode ? demoClinic?.id : activeClinic?.id;

  // Use the new clinic settings hook (skip if in demo mode)
  const { 
    settings: realSettings, 
    isLoading: settingsLoading, 
    error: settingsError, 
    updateSettings,
    settingsCompleted: realSettingsCompleted,
    isSaving,
    saveError
  } = useClinicSettings(isDemoMode ? undefined : clinicId);

  // Use demo settings if in demo mode
  const settings = isDemoMode ? demoSettings : realSettings;
  const settingsCompleted = isDemoMode ? true : realSettingsCompleted;

  // These hooks now use the clinicId to get clinic-specific data
  const { clinicServices, setClinicServices } = useClinicServices(clinicId);
  const { bookedCustomers, setBookedCustomers } = useBookedCustomers(clinicId);

  // Calculate active customers from booked customers - no longer manual input
  const calculatedActiveCustomers = bookedCustomers.length;

  // Initialize state for other values needed in the component
  const [calculatedProfit, setCalculatedProfit] = useState(0);
  const [newCustomersPerWeek, setNewCustomersPerWeek] = useState(5);
  const [showActiveCustomers, setShowActiveCustomers] = useState(true);
  const [suggestedIntake, setSuggestedIntake] = useState(3);

  // Update active customers in settings when it changes
  useEffect(() => {
    if (settings && calculatedActiveCustomers !== settings.activeCustomers) {
      updateSettings({ 
        activeCustomers: calculatedActiveCustomers,
        clinicServices 
      }).catch(console.error);
    }
  }, [calculatedActiveCustomers, clinicServices, settings, updateSettings]);

  // Calculate monthly customers
  const monthlyCustomers = Math.round(newCustomersPerWeek * 4.33);

  // Function to handle settings updates - now saves to database
  const handleUpdateSettings = async (newSettings: Partial<ClinicSettings>) => {
    try {
      await updateSettings(newSettings);
    } catch (error) {
      console.error('Failed to update settings:', error);
    }
  };

  return {
    clinics: isDemoMode ? [demoClinic] : clinics,
    activeClinic: isDemoMode ? demoClinic : activeClinic,
    selectClinic,
    settings,
    handleUpdateSettings,
    monthlyCustomers,
    calculatedProfit,
    clinicId,
    clinicServices,
    setClinicServices,
    bookedCustomers,
    setBookedCustomers,
    newCustomersPerWeek,
    setNewCustomersPerWeek,
    showActiveCustomers,
    setShowActiveCustomers,
    suggestedIntake,
    calculatedActiveCustomers,
    // Expose settings state (demo mode shows no loading)
    settingsLoading: isDemoMode ? false : settingsLoading,
    settingsError: isDemoMode ? null : settingsError,
    settingsCompleted,
    isSaving: isDemoMode ? false : isSaving,
    saveError: isDemoMode ? null : saveError,
    // Demo mode indicator
    isDemoMode
  };
};

export default useClinicData;
