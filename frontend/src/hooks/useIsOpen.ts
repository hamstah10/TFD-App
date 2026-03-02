import { useState, useEffect } from 'react';
import { getOpeningHours } from '../services/api';

interface OpeningHours {
  monday: string;
  tuesday: string;
  wednesday: string;
  thursday: string;
  friday: string;
  saturday: string;
  sunday: string;
}

export const useIsOpen = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [openingHours, setOpeningHours] = useState<OpeningHours | null>(null);

  useEffect(() => {
    const fetchOpeningHours = async () => {
      try {
        const response = await getOpeningHours();
        setOpeningHours(response);
      } catch (error) {
        console.error('Failed to fetch opening hours:', error);
      }
    };

    fetchOpeningHours();
  }, []);

  useEffect(() => {
    const checkIsOpen = () => {
      if (!openingHours) return;

      const now = new Date();
      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const currentDay = dayNames[now.getDay()] as keyof OpeningHours;
      const hoursString = openingHours[currentDay];

      if (!hoursString || hoursString.toLowerCase() === 'geschlossen' || hoursString.toLowerCase() === 'closed') {
        setIsOpen(false);
        return;
      }

      // Parse time range (e.g., "08:00-18:00")
      const match = hoursString.match(/(\d{1,2}):(\d{2})-(\d{1,2}):(\d{2})/);
      if (!match) {
        setIsOpen(false);
        return;
      }

      const [, openHour, openMin, closeHour, closeMin] = match;
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      const openMinutes = parseInt(openHour) * 60 + parseInt(openMin);
      const closeMinutes = parseInt(closeHour) * 60 + parseInt(closeMin);

      setIsOpen(currentMinutes >= openMinutes && currentMinutes < closeMinutes);
    };

    checkIsOpen();
    
    // Check every minute
    const interval = setInterval(checkIsOpen, 60000);
    return () => clearInterval(interval);
  }, [openingHours]);

  return isOpen;
};

export default useIsOpen;
