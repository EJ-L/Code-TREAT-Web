import React, { useState, useEffect, useRef, useMemo } from 'react';

const ONE_DAY = 86_400_000; // 1 day in milliseconds
const ONE_MONTH = 30 * ONE_DAY; // Approximate one month in milliseconds

type DateRangeSliderProps = {
  min: number; // Min timestamp in ms
  max: number; // Max timestamp in ms
  initialStart?: number; // Initial start timestamp in ms
  initialEnd?: number; // Initial end timestamp in ms
  onChange: (range: { start: number; end: number }) => void;
  isDarkMode?: boolean;
};

/**
 * Generate monthly ticks between min and max timestamps
 */
function getMonthlyTicks(min: number, max: number): number[] {
  const ticks: number[] = [];
  const minDate = new Date(min);
  const maxDate = new Date(max);
  
  // Start with the beginning of the month after min
  const currentDate = new Date(minDate.getFullYear(), minDate.getMonth() + 1, 1);
  
  while (currentDate < maxDate) {
    ticks.push(currentDate.getTime());
    // Move to next month
    currentDate.setMonth(currentDate.getMonth() + 1);
  }
  
  return ticks;
}

/**
 * Format date to MM/DD/YYYY
 */
function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
}

export default function DateRangeSlider({
  min,
  max,
  initialStart = min,
  initialEnd = max,
  onChange,
  isDarkMode = false
}: DateRangeSliderProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [trackWidth, setTrackWidth] = useState(0);
  const [startPos, setStartPos] = useState(0); // Position as percentage
  const [endPos, setEndPos] = useState(100); // Position as percentage
  const [activeHandle, setActiveHandle] = useState<'start' | 'end' | null>(null);
  const [showTooltip, setShowTooltip] = useState({ start: false, end: false });
  
  // Calculate actual timestamps from positions
  const startTimestamp = useMemo(() => {
    return min + (max - min) * (startPos / 100);
  }, [min, max, startPos]);
  
  const endTimestamp = useMemo(() => {
    return min + (max - min) * (endPos / 100);
  }, [min, max, endPos]);
  
  // Generate monthly tick marks
  const ticks = useMemo(() => {
    return getMonthlyTicks(min, max);
  }, [min, max]);
  
  // Calculate tick positions as percentages
  const tickPositions = useMemo(() => {
    return ticks.map(tick => {
      const percent = ((tick - min) / (max - min)) * 100;
      return {
        position: percent,
        timestamp: tick,
        label: new Date(tick).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })
      };
    });
  }, [ticks, min, max]);
  
  // Initialize positions based on props
  useEffect(() => {
    const startPct = ((initialStart - min) / (max - min)) * 100;
    const endPct = ((initialEnd - min) / (max - min)) * 100;
    setStartPos(startPct);
    setEndPos(endPct);
  }, [initialStart, initialEnd, min, max]);
  
  // Update track width on resize
  useEffect(() => {
    const updateWidth = () => {
      if (trackRef.current) {
        setTrackWidth(trackRef.current.clientWidth);
      }
    };
    
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);
  
  // Convert pixel position to percentage
  const posToPercent = (posX: number): number => {
    if (!trackRef.current) return 0;
    const trackRect = trackRef.current.getBoundingClientRect();
    let percent = ((posX - trackRect.left) / trackRect.width) * 100;
    return Math.max(0, Math.min(100, percent));
  };
  
  // Snap timestamp to day
  const snapToDay = (timestamp: number): number => {
    return Math.round(timestamp / ONE_DAY) * ONE_DAY;
  };
  
  // Handle pointer move
  const handlePointerMove = (event: PointerEvent) => {
    if (!activeHandle) return;
    
    const percent = posToPercent(event.clientX);
    
    if (activeHandle === 'start') {
      const newStartPos = Math.min(percent, endPos - 1);
      setStartPos(newStartPos);
      onChange({
        start: snapToDay(min + (max - min) * (newStartPos / 100)),
        end: snapToDay(endTimestamp)
      });
    } else {
      const newEndPos = Math.max(percent, startPos + 1);
      setEndPos(newEndPos);
      onChange({
        start: snapToDay(startTimestamp),
        end: snapToDay(min + (max - min) * (newEndPos / 100))
      });
    }
  };
  
  // Handle pointer up
  const handlePointerUp = () => {
    setActiveHandle(null);
    setShowTooltip({ start: false, end: false });
    document.removeEventListener('pointermove', handlePointerMove);
    document.removeEventListener('pointerup', handlePointerUp);
  };
  
  // Handle start handle pointer down
  const handleStartPointerDown = (event: React.PointerEvent) => {
    event.preventDefault();
    setActiveHandle('start');
    setShowTooltip(prev => ({ ...prev, start: true }));
    document.addEventListener('pointermove', handlePointerMove);
    document.addEventListener('pointerup', handlePointerUp);
  };
  
  // Handle end handle pointer down
  const handleEndPointerDown = (event: React.PointerEvent) => {
    event.preventDefault();
    setActiveHandle('end');
    setShowTooltip(prev => ({ ...prev, end: true }));
    document.addEventListener('pointermove', handlePointerMove);
    document.addEventListener('pointerup', handlePointerUp);
  };
  
  // Handle key navigation
  const handleKeyDown = (event: React.KeyboardEvent, handle: 'start' | 'end') => {
    const step = ONE_DAY / (max - min) * 100; // One day as percentage
    let newPos;
    
    if (handle === 'start') {
      newPos = startPos;
      switch (event.key) {
        case 'ArrowLeft':
        case 'ArrowDown':
          newPos = Math.max(0, startPos - (event.shiftKey ? step * 10 : step));
          break;
        case 'ArrowRight':
        case 'ArrowUp':
          newPos = Math.min(endPos - 1, startPos + (event.shiftKey ? step * 10 : step));
          break;
        default:
          return;
      }
      setStartPos(newPos);
    } else {
      newPos = endPos;
      switch (event.key) {
        case 'ArrowLeft':
        case 'ArrowDown':
          newPos = Math.max(startPos + 1, endPos - (event.shiftKey ? step * 10 : step));
          break;
        case 'ArrowRight':
        case 'ArrowUp':
          newPos = Math.min(100, endPos + (event.shiftKey ? step * 10 : step));
          break;
        default:
          return;
      }
      setEndPos(newPos);
    }
    
    onChange({
      start: snapToDay(min + (max - min) * (handle === 'start' ? newPos / 100 : startPos / 100)),
      end: snapToDay(min + (max - min) * (handle === 'end' ? newPos / 100 : endPos / 100))
    });
    
    event.preventDefault();
  };
  
  return (
    <div className="w-full px-4 py-6">
      <div className="mb-1 flex justify-between text-sm text-gray-500">
        <span>{formatDate(min)}</span>
        <span>{formatDate(max)}</span>
      </div>
      
      {/* Track */}
      <div 
        ref={trackRef}
        className={`relative h-2 w-full rounded-full ${
          isDarkMode ? 'bg-blue-900/40' : 'bg-blue-100'
        }`}
      >
        {/* Month ticks */}
        {tickPositions.map((tick, i) => (
          <div 
            key={i}
            className={`absolute top-0 h-2 w-px ${
              isDarkMode ? 'bg-blue-300/40' : 'bg-blue-300/70'
            }`}
            style={{
              left: `${tick.position}%`,
              height: new Date(tick.timestamp).getMonth() === 0 ? '12px' : '8px',
              marginTop: new Date(tick.timestamp).getMonth() === 0 ? '-2px' : '0'
            }}
          />
        ))}
        
        {/* Selected range */}
        <div
          className={`absolute h-2 rounded-full ${
            isDarkMode ? 'bg-blue-500/80' : 'bg-blue-500'
          }`}
          style={{
            left: `${startPos}%`,
            width: `${endPos - startPos}%`
          }}
        />
        
        {/* Start handle */}
        <div 
          role="slider"
          tabIndex={0}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={startTimestamp}
          aria-valuetext={formatDate(startTimestamp)}
          className={`absolute top-1/2 -ml-3 -mt-3 h-6 w-6 cursor-grab rounded-full border-2 ${
            isDarkMode 
              ? 'border-blue-400 bg-gray-800 shadow-lg' 
              : 'border-blue-500 bg-white shadow-md'
          } ${
            activeHandle === 'start' ? 'z-20 ring-2 ring-blue-300' : 'z-10'
          }`}
          style={{ left: `${startPos}%` }}
          onPointerDown={handleStartPointerDown}
          onKeyDown={(e) => handleKeyDown(e, 'start')}
          onMouseOver={() => setShowTooltip(prev => ({ ...prev, start: true }))}
          onMouseOut={() => !activeHandle && setShowTooltip(prev => ({ ...prev, start: false }))}
          onFocus={() => setShowTooltip(prev => ({ ...prev, start: true }))}
          onBlur={() => !activeHandle && setShowTooltip(prev => ({ ...prev, start: false }))}
        >
          {/* Start tooltip */}
          {showTooltip.start && (
            <div 
              className={`absolute bottom-full left-1/2 mb-2 -translate-x-1/2 rounded px-2 py-1 text-xs ${
                isDarkMode 
                  ? 'bg-gray-800 text-gray-200' 
                  : 'bg-white text-gray-900 shadow-md'
              }`}
            >
              {formatDate(startTimestamp)}
            </div>
          )}
        </div>
        
        {/* End handle */}
        <div 
          role="slider"
          tabIndex={0}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={endTimestamp}
          aria-valuetext={formatDate(endTimestamp)}
          className={`absolute top-1/2 -ml-3 -mt-3 h-6 w-6 cursor-grab rounded-full border-2 ${
            isDarkMode 
              ? 'border-blue-400 bg-gray-800 shadow-lg' 
              : 'border-blue-500 bg-white shadow-md'
          } ${
            activeHandle === 'end' ? 'z-20 ring-2 ring-blue-300' : 'z-10'
          }`}
          style={{ left: `${endPos}%` }}
          onPointerDown={handleEndPointerDown}
          onKeyDown={(e) => handleKeyDown(e, 'end')}
          onMouseOver={() => setShowTooltip(prev => ({ ...prev, end: true }))}
          onMouseOut={() => !activeHandle && setShowTooltip(prev => ({ ...prev, end: false }))}
          onFocus={() => setShowTooltip(prev => ({ ...prev, end: true }))}
          onBlur={() => !activeHandle && setShowTooltip(prev => ({ ...prev, end: false }))}
        >
          {/* End tooltip */}
          {showTooltip.end && (
            <div 
              className={`absolute bottom-full left-1/2 mb-2 -translate-x-1/2 rounded px-2 py-1 text-xs ${
                isDarkMode 
                  ? 'bg-gray-800 text-gray-200' 
                  : 'bg-white text-gray-900 shadow-md'
              }`}
            >
              {formatDate(endTimestamp)}
            </div>
          )}
        </div>
      </div>
      
      {/* Year labels for selected ticks */}
      <div className="relative mt-3 h-4">
        {tickPositions
          .filter(tick => new Date(tick.timestamp).getMonth() === 0) // Only show years
          .map((tick, i) => (
            <div 
              key={i}
              className={`absolute text-xs ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`}
              style={{
                left: `${tick.position}%`,
                transform: 'translateX(-50%)'
              }}
            >
              {new Date(tick.timestamp).getFullYear()}
            </div>
          ))
        }
      </div>
    </div>
  );
} 