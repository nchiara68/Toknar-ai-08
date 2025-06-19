// src/hooks/useUserProfile.ts - User profile management

import { useState, useCallback } from 'react';
import { generateClient } from 'aws-amplify/api';
import type { Schema } from '../../amplify/data/resource';
import { UserProfileType } from '../types';

const client = generateClient<Schema>();

export const useUserProfile = (username: string, userEmail: string) => {
  const [userProfile, setUserProfile] = useState<UserProfileType | null>(null);

  const loadProfile = useCallback(async () => {
    try {
      const { data: profiles } = await client.models.UserProfile.list({
        filter: { owner: { eq: username } }
      });
      
      if (profiles.length > 0) {
        setUserProfile(profiles[0] as UserProfileType);
      } else {
        const newProfile = await client.models.UserProfile.create({
          email: userEmail,
          totalDocuments: 0,
          totalEmbeddings: 0,
          storageUsed: 0,
          lastActiveAt: new Date().toISOString(),
          owner: username
        });
        setUserProfile(newProfile.data as UserProfileType);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  }, [username, userEmail]);

  const updateProfile = useCallback(async (updates: Partial<UserProfileType>) => {
    if (!userProfile) return;
    
    try {
      await client.models.UserProfile.update({
        id: userProfile.id,
        ...updates
      });
      
      setUserProfile(prev => prev ? { ...prev, ...updates } : null);
    } catch (error) {
      console.error('Error updating user profile:', error);
    }
  }, [userProfile]);

  return {
    userProfile,
    loadProfile,
    updateProfile
  };
};