import { useState, useEffect, useCallback } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../services/supabaseClient';
import { UserProfile, Household } from '../types';
import { useTranslation } from '../i18n/index';

export const useHousehold = (user: User | null) => {
  const { t } = useTranslation();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [household, setHousehold] = useState<Household | null>(null);
  const [householdMembers, setHouseholdMembers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Helper to fetch household details and members
  const fetchHouseholdDetails = useCallback(async (householdId: string) => {
    if (!householdId) {
      setHousehold(null);
      setHouseholdMembers([]);
      return;
    }

    try {
      const { data: hhData, error: hhError } = await supabase
        .from('households')
        .select('*')
        .eq('id', householdId)
        .single();
      
      if (hhError) throw hhError;
      setHousehold(hhData);

      const { data: membersData, error: membersError } = await supabase
        .from('profiles')
        .select('*')
        .eq('household_id', householdId);

      if (membersError) throw membersError;
      setHouseholdMembers(membersData || []);

    } catch (err: any) {
      console.error("Error fetching household details:", err);
      // Don't set global error here to avoid blocking UI, just log
    }
  }, []);

  // Initial Profile Load
  useEffect(() => {
    let mounted = true;
    const loadProfile = async () => {
      if (!user) {
        setUserProfile(null);
        setHousehold(null);
        setHouseholdMembers([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (error) throw error;
        
        if (mounted) {
          setUserProfile(data);
          if (data?.household_id) {
            await fetchHouseholdDetails(data.household_id);
          }
        }
      } catch (err: any) {
        console.error("Error loading profile:", err);
        if (mounted) setError(err.message);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadProfile();
    return () => { mounted = false; };
  }, [user, fetchHouseholdDetails]);

  // Actions
  const createHousehold = useCallback(async (name: string) => {
    if (!user) return;
    setError(null);
    try {
      // 1. Create Household
      const { data: newHousehold, error: insertError } = await supabase
        .from('households')
        .insert({ name: name, owner_id: user.id })
        .select()
        .single();

      if (insertError) {
         if (insertError.message.includes('violates row-level security policy')) {
            throw new Error('RLS_INSERT_VIOLATION');
         }
         throw insertError;
      }

      // 2. Update Profile
      const { data: updatedProfile, error: updateError } = await supabase
        .from('profiles')
        .update({ household_id: newHousehold.id })
        .eq('id', user.id)
        .select()
        .single();

      if (updateError) throw updateError;

      setUserProfile(updatedProfile);
      setHousehold(newHousehold);
      // Fetch members (just current user initially)
      await fetchHouseholdDetails(newHousehold.id);

    } catch (err: any) {
      console.error("Create household error:", err);
      if (err.message === 'RLS_INSERT_VIOLATION') {
          setError(t('household.error.rls.insert'));
      } else {
          setError(t('household.error.generic', { message: err.message }));
      }
      throw err; // Re-throw to let UI handle specific success/fail actions if needed
    }
  }, [user, fetchHouseholdDetails, t]);

  const joinHousehold = useCallback(async (householdId: string) => {
    if (!user) return;
    setError(null);
    try {
        const { data, error } = await supabase
            .from('profiles')
            .update({ household_id: householdId })
            .eq('id', user.id)
            .select()
            .single();
        
        if (error) throw error;

        setUserProfile(data);
        await fetchHouseholdDetails(householdId);
        return data?.name; // Return household name if possible (requires extra fetch or heuristic)
    } catch (err: any) {
        console.error("Join household error:", err);
        setError(err.message);
        throw err;
    }
  }, [user, fetchHouseholdDetails]);

  const leaveHousehold = useCallback(async () => {
    if (!user) return;
    setError(null);
    try {
        const { data, error } = await supabase
            .from('profiles')
            .update({ household_id: null })
            .eq('id', user.id)
            .select()
            .single();
        
        if (error) throw error;
        
        setUserProfile(data);
        setHousehold(null);
        setHouseholdMembers([]);
    } catch (err: any) {
        console.error("Leave household error:", err);
        setError(err.message);
    }
  }, [user]);

  const deleteHousehold = useCallback(async () => {
    if (!user || !household) return;
    setError(null);
    try {
        const { error } = await supabase
            .from('households')
            .delete()
            .eq('id', household.id);
        
        if (error) throw error;
        
        // Profile update happens automatically or we refresh
        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        setUserProfile(data);
        setHousehold(null);
        setHouseholdMembers([]);
    } catch (err: any) {
        console.error("Delete household error:", err);
        setError(err.message);
    }
  }, [user, household]);
  
  // Allow manual refresh
  const refreshHousehold = useCallback(async () => {
      if (userProfile?.household_id) {
          await fetchHouseholdDetails(userProfile.household_id);
      }
  }, [userProfile, fetchHouseholdDetails]);

  return {
    userProfile,
    household,
    householdMembers,
    loading,
    error,
    createHousehold,
    joinHousehold,
    leaveHousehold,
    deleteHousehold,
    refreshHousehold
  };
};
