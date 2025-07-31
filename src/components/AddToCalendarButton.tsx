import React from 'react';
import { atcb_action } from 'add-to-calendar-button';
import { Button } from './ui/button';
import { CalendarPlus } from 'lucide-react';

interface AddToCalendarButtonProps {
  name: string;
  description?: string;
  startDate: string; // Format: 'YYYY-MM-DD'
  startTime: string; // Format: 'HH:MM'
  endTime?: string; // Format: 'HH:MM'
  location?: string;
  options?: string[]; // Calendar options: 'Apple', 'Google', 'Outlook.com', 'Microsoft365', etc.
}

/**
 * A button component that allows users to add events to their calendar
 * Uses the add-to-calendar-button library for cross-platform calendar integration
 */
const AddToCalendarButton: React.FC<AddToCalendarButtonProps> = ({
  name,
  description = '',
  startDate,
  startTime,
  endTime,
  location = '',
  options = ['Apple', 'Google', 'iCal', 'Microsoft365', 'Outlook.com', 'Yahoo']
}) => {
  // Calculate end time if not provided (default to 1 hour duration)
  const calculateEndTime = () => {
    if (endTime) return endTime;
    
    // Parse the start time and add 1 hour
    const [hours, minutes] = startTime.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0);
    date.setTime(date.getTime() + 60 * 60 * 1000); // Add 1 hour
    
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  const handleAddToCalendar = () => {
    const calculatedEndTime = calculateEndTime();
    
    atcb_action({
      name,
      description,
      startDate,
      startTime,
      endDate: startDate, // Assume same day
      endTime: calculatedEndTime,
      location,
      options,
      timeZone: "currentBrowser",
      trigger: "click",
      iCalFileName: "legal-consultation",
    });
  };

  return (
    <Button
      onClick={handleAddToCalendar}
      variant="outline"
      className="flex items-center gap-2"
    >
      <CalendarPlus className="h-4 w-4" />
      Add to Calendar
    </Button>
  );
};

export default AddToCalendarButton;
