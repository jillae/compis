
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Clinic } from '@/types/clinic';

export const useClinics = () => {
  const { session, userRole } = useAuth();
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [activeClinic, setActiveClinic] = useState<Clinic | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (session?.user) {
      fetchUserClinics();
    }
  }, [session, userRole]);

  const fetchUserClinics = async () => {
    try {
      setIsLoading(true);
      
      // Check if user is superadmin
      if (userRole === 'superadmin') {
        console.log('[useClinics] Superadmin detected, fetching all clinics');
        
        // Superadmin can access all clinics
        const { data: allClinics, error: clinicsError } = await supabase
          .from('clinics')
          .select('*')
          .order('name');

        if (clinicsError) {
          console.error('Error fetching all clinics:', clinicsError);
          return;
        }

        setClinics(allClinics || []);
        
        // Set first clinic as active by default, or restore from localStorage
        const savedActiveClinicId = localStorage.getItem('superadmin_active_clinic_id');
        const defaultActiveClinic = savedActiveClinicId 
          ? allClinics?.find(c => c.id === savedActiveClinicId) || allClinics?.[0]
          : allClinics?.[0];
          
        setActiveClinic(defaultActiveClinic || null);
        
        return;
      }
      
      // Regular user - get their own clinic
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('clinic_id, role')
        .eq('id', session?.user.id)
        .maybeSingle();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        return;
      }

      if (!profile?.clinic_id) {
        console.log('No clinic found for user');
        return;
      }

      // Then get the clinic details
      const { data: clinic, error: clinicError } = await supabase
        .from('clinics')
        .select('*')
        .eq('id', profile.clinic_id)
        .single();

      if (clinicError) {
        console.error('Error fetching clinic:', clinicError);
        return;
      }

      setClinics([clinic]);
      setActiveClinic(clinic);
    } catch (error) {
      console.error('Error in fetchUserClinics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const selectClinic = (clinicId: string) => {
    const clinic = clinics.find(c => c.id === clinicId);
    if (clinic) {
      setActiveClinic(clinic);
      
      // Save superadmin's clinic selection to localStorage
      if (userRole === 'superadmin') {
        localStorage.setItem('superadmin_active_clinic_id', clinicId);
        console.log(`[useClinics] Superadmin switched to clinic: ${clinic.name} (${clinicId})`);
      }
    }
  };

  return { 
    clinics, 
    activeClinic, 
    selectClinic, 
    isLoading,
    refetch: fetchUserClinics 
  };
};
