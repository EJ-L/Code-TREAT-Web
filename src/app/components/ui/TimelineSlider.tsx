import React, { FC, useState, useCallback, useRef, useEffect, useMemo } from 'react';

interface TimelineSliderProps {
  minDate: Date;
  maxDate: Date;
  startDate: Date;
  endDate: Date;
  onDateRangeChange: (startDate: Date, endDate: Date) => void;
  isDarkMode: boolean;
}

export const TimelineSlider: FC<TimelineSliderProps> = ({
  minDate,
  maxDate,
  startDate,
  endDate,
  onDateRangeChange,
  isDarkMode
}) => {
  const [isDragging, setIsDragging] = useState<'start' | 'end' | null>(null);
  const [tempStartDate, setTempStartDate] = useState(startDate);
  const [tempEndDate, setTempEndDate] = useState(endDate);
  const sliderRef = useRef<HTMLDivElement>(null);
  
  // Calculate total date range in milliseconds
  const totalRange = maxDate.getTime() - minDate.getTime();
  
  // Convert date to percentage position
  const dateToPercentage = useCallback((date: Date) => {
    return ((date.getTime() - minDate.getTime()) / totalRange) * 100;
  }, [minDate, totalRange]);
  
  // Convert percentage to date
  const percentageToDate = useCallback((percentage: number) => {
    const timestamp = minDate.getTime() + (percentage / 100) * totalRange;
    return new Date(timestamp);
  }, [minDate, totalRange]);
  
  // Get current positions
  const startPosition = dateToPercentage(tempStartDate);
  const endPosition = dateToPercentage(tempEndDate);
  
  // Format date for display (year and month only)
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short'
    });
  };

  // Helpers for month-level constraints
  const isSameYearMonth = (a: Date, b: Date) => (
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth()
  );

  const getPrevMonthDate = (reference: Date) => {
    // Last day of previous month
    return new Date(reference.getFullYear(), reference.getMonth(), 0);
  };

  const getNextMonthDate = (reference: Date) => {
    // First day of next month
    return new Date(reference.getFullYear(), reference.getMonth() + 1, 1);
  };
  
  // Handle mouse down on handles
  const handleMouseDown = useCallback((type: 'start' | 'end') => (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(type);
  }, []);
  
  // Handle mouse move
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !sliderRef.current) return;
    
    const rect = sliderRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    const newDate = percentageToDate(percentage);
    
    if (isDragging === 'start') {
      // Ensure start date doesn't exceed end date
      const maxStartDate = new Date(Math.min(tempEndDate.getTime(), maxDate.getTime()));
      let clampedDate = new Date(Math.max(minDate.getTime(), Math.min(newDate.getTime(), maxStartDate.getTime())));
      // Enforce at least 1-month gap (different year-month)
      if (isSameYearMonth(clampedDate, tempEndDate)) {
        const prevMonth = getPrevMonthDate(tempEndDate);
        clampedDate = new Date(Math.max(minDate.getTime(), prevMonth.getTime()));
      }
      setTempStartDate(clampedDate);
    } else if (isDragging === 'end') {
      // Ensure end date doesn't go below start date
      const minEndDate = new Date(Math.max(tempStartDate.getTime(), minDate.getTime()));
      let clampedDate = new Date(Math.max(minEndDate.getTime(), Math.min(newDate.getTime(), maxDate.getTime())));
      // Enforce at least 1-month gap (different year-month)
      if (isSameYearMonth(tempStartDate, clampedDate)) {
        const nextMonth = getNextMonthDate(tempStartDate);
        clampedDate = new Date(Math.min(maxDate.getTime(), nextMonth.getTime()));
      }
      setTempEndDate(clampedDate);
    }
  }, [isDragging, minDate, maxDate, tempStartDate, tempEndDate, percentageToDate]);
  
  // Handle mouse up - this is where we update the actual filter
  const handleMouseUp = useCallback(() => {
    if (isDragging) {
      setIsDragging(null);
      // Only call the callback when dragging ends
      onDateRangeChange(tempStartDate, tempEndDate);
    }
  }, [isDragging, tempStartDate, tempEndDate, onDateRangeChange]);
  
  // Add global event listeners
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);
  
  // Update temp dates when props change (but not during dragging)
  useEffect(() => {
    if (!isDragging) {
      setTempStartDate(startDate);
      setTempEndDate(endDate);
    }
  }, [startDate, endDate, isDragging]);
  
  // Calculate middle date positions for reference marks
  const getMiddleDates = useMemo(() => {
    const dates = [];
    const totalDays = (maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24);
    const interval = totalDays / 6; // Create 5 middle marks (7 total including min/max)
    
    for (let i = 1; i <= 5; i++) {
      const middleDate = new Date(minDate.getTime() + interval * i * 24 * 60 * 60 * 1000);
      dates.push({
        date: middleDate,
        position: dateToPercentage(middleDate)
      });
    }
    return dates;
  }, [minDate, maxDate, dateToPercentage]);

  // Create complete list of all date markers for interval detection
  const allDateMarkers = useMemo(() => {
    const markers = [
      { date: minDate, position: 0, isMin: true, isMax: false },
      ...getMiddleDates.map(d => ({ ...d, isMin: false, isMax: false })),
      { date: maxDate, position: 100, isMin: false, isMax: true }
    ];
    return markers.sort((a, b) => a.position - b.position);
  }, [minDate, maxDate, getMiddleDates]);

  // Function to find which interval start date should be bolded for LEFT ball
  const findIntervalStartForPosition = useCallback((position: number) => {
    // Find the interval that contains this position
    for (let i = 0; i < allDateMarkers.length - 1; i++) {
      const currentMarker = allDateMarkers[i];
      const nextMarker = allDateMarkers[i + 1];
      
      // If position is between current and next marker (excluding the next marker itself)
      if (position >= currentMarker.position && position < nextMarker.position) {
        return currentMarker.date.getTime();
      }
    }
    
    // If position is at the last marker, return the last marker
    if (position >= allDateMarkers[allDateMarkers.length - 1].position) {
      return allDateMarkers[allDateMarkers.length - 1].date.getTime();
    }
    
    // Fallback to first marker
    return allDateMarkers[0].date.getTime();
  }, [allDateMarkers]);

  // Function to find which interval end date should be bolded for RIGHT ball
  const findIntervalEndForPosition = useCallback((position: number) => {
    // Find the interval that contains this position
    for (let i = 0; i < allDateMarkers.length - 1; i++) {
      const currentMarker = allDateMarkers[i];
      const nextMarker = allDateMarkers[i + 1];
      
      // If position is between current and next marker (excluding the next marker itself)
      if (position >= currentMarker.position && position < nextMarker.position) {
        return nextMarker.date.getTime(); // Return the END of the interval
      }
    }
    
    // If position is at the last marker, return the last marker
    if (position >= allDateMarkers[allDateMarkers.length - 1].position) {
      return allDateMarkers[allDateMarkers.length - 1].date.getTime();
    }
    
    // Fallback to first marker's next marker (or first marker if only one)
    return allDateMarkers.length > 1 ? allDateMarkers[1].date.getTime() : allDateMarkers[0].date.getTime();
  }, [allDateMarkers]);

  // Determine which dates should be bolded based on current ball positions
  const boldedDates = useMemo(() => {
    const leftIntervalStart = findIntervalStartForPosition(startPosition);
    const rightIntervalEnd = findIntervalEndForPosition(endPosition);
    
    return new Set([leftIntervalStart, rightIntervalEnd]);
  }, [startPosition, endPosition, findIntervalStartForPosition, findIntervalEndForPosition]);

  return (
    <div className="w-[92%] mx-auto py-4">
      {/* Slider Container */}
      <div className="relative mb-6 px-6 md:px-8">
        {/* Slider Track */}
        <div
          ref={sliderRef}
          className={`relative h-3 rounded-full cursor-pointer ${
            isDarkMode ? 'bg-slate-700' : 'bg-slate-200'
          }`}
        >
          {/* Active Range */}
          <div
            className="absolute h-full bg-blue-500 rounded-full"
            style={{
              left: `${startPosition}%`,
              width: `${endPosition - startPosition}%`
            }}
          />
          
          {/* Middle Date Markers */}
          {getMiddleDates.map((middleDateInfo, index) => (
            <div
              key={index}
              className={`absolute w-0.5 h-full top-0 ${
                isDarkMode ? 'bg-slate-600' : 'bg-slate-300'
              }`}
              style={{ left: `${middleDateInfo.position}%` }}
            />
          ))}
          
          {/* Start Handle with Always-Visible Label */}
          <div className="absolute" style={{ left: `${startPosition}%`, transform: 'translateX(-50%)' }}>
            {/* Always visible date label */}
            <div className={`absolute bottom-full mb-3 left-1/2 transform -translate-x-1/2 px-4 py-2 rounded-lg text-base font-semibold whitespace-nowrap ${
              isDarkMode 
                ? 'bg-slate-800 text-slate-200 border border-slate-600' 
                : 'bg-gray-800 text-white'
            }`}>
              {formatDate(tempStartDate)}
              <div className={`absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent ${
                isDarkMode ? 'border-t-slate-800' : 'border-t-gray-800'
              }`}></div>
            </div>
            
            <div
              className={`relative w-5 h-5 rounded-full cursor-grab border-2 transform -translate-y-1.5 transition-all duration-150 ${
                isDarkMode 
                  ? 'bg-slate-800 border-blue-400 hover:border-blue-300' 
                  : 'bg-white border-blue-500 hover:border-blue-600'
              } ${isDragging === 'start' ? 'cursor-grabbing scale-125 shadow-lg' : 'hover:scale-110'}`}
              onMouseDown={handleMouseDown('start')}
            />
          </div>
          
          {/* End Handle with Always-Visible Label */}
          <div className="absolute" style={{ left: `${endPosition}%`, transform: 'translateX(-50%)' }}>
            {/* Always visible date label */}
            <div className={`absolute bottom-full mb-3 left-1/2 transform -translate-x-1/2 px-4 py-2 rounded-lg text-base font-semibold whitespace-nowrap ${
              isDarkMode 
                ? 'bg-slate-800 text-slate-200 border border-slate-600' 
                : 'bg-gray-800 text-white'
            }`}>
              {formatDate(tempEndDate)}
              <div className={`absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent ${
                isDarkMode ? 'border-t-slate-800' : 'border-t-gray-800'
              }`}></div>
            </div>
            
            <div
              className={`relative w-5 h-5 rounded-full cursor-grab border-2 transform -translate-y-1.5 transition-all duration-150 ${
                isDarkMode 
                  ? 'bg-slate-800 border-blue-400 hover:border-blue-300' 
                  : 'bg-white border-blue-500 hover:border-blue-600'
              } ${isDragging === 'end' ? 'cursor-grabbing scale-125 shadow-lg' : 'hover:scale-110'}`}
              onMouseDown={handleMouseDown('end')}
            />
          </div>
        </div>
        
        {/* Date Labels with Middle Dates */}
        <div className="relative mt-4">
          {/* Min date */}
          <span className={`absolute left-0 text-base ${
            boldedDates.has(minDate.getTime()) 
              ? `font-semibold ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}` 
              : `font-medium ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`
          }`}>
            {formatDate(minDate)}
          </span>
          
          {/* Middle dates */}
          {getMiddleDates.map((middleDateInfo, index) => (
            <span
              key={index}
              className={`absolute text-sm ${
                boldedDates.has(middleDateInfo.date.getTime())
                  ? `font-semibold ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`
                  : `font-medium ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`
              }`}
              style={{ 
                left: `${middleDateInfo.position}%`, 
                transform: 'translateX(-50%)' 
              }}
            >
              {formatDate(middleDateInfo.date)}
            </span>
          ))}
          
          {/* Max date */}
          <span className={`absolute right-0 text-base ${
            boldedDates.has(maxDate.getTime()) 
              ? `font-semibold ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}` 
              : `font-medium ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`
          }`}>
            {formatDate(maxDate)}
          </span>
        </div>
      </div>
    </div>
  );
};
