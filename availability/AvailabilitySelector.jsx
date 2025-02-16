import React, { useState, useRef } from 'react';
import { Copy, Trash2, RotateCcw } from 'lucide-react';
import './AvailabilitySelector.css';

// We have to import lucide-react  SS
// npm install lucide-react     SS

const TimeBlock = ({ hour, selected, selecting, onMouseDown, onMouseEnter, onMouseUp }) => {
  const displayHour = hour % 12 || 12;
  const ampm = hour < 12 ? 'am' : 'pm';
  
  const className = `time-block ${selected ? 'selected' : ''} ${selecting ? 'selecting' : ''}`;
  
  return (
    <div 
      onMouseDown={() => onMouseDown(hour)}
      onMouseEnter={() => onMouseEnter(hour)}
      onMouseUp={onMouseUp}
      className={className}
    >
      {displayHour}{ampm}
    </div>
  );
};

const AvailabilitySelector = () => {
  const [availability, setAvailability] = useState({
    monday: { enabled: false, hours: new Set() },
    tuesday: { enabled: false, hours: new Set() },
    wednesday: { enabled: false, hours: new Set() },
    thursday: { enabled: false, hours: new Set() },
    friday: { enabled: false, hours: new Set() },
    saturday: { enabled: false, hours: new Set() },
    sunday: { enabled: false, hours: new Set() }
  });

  // Drag selection state
  const [isDragging, setIsDragging] = useState(false);
  const [selectionStart, setSelectionStart] = useState(null);
  const [selectingHours, setSelectingHours] = useState(new Set());
  const [isAddMode, setIsAddMode] = useState(true);
  const currentDay = useRef(null);

  const days = [
    { id: 'monday', label: 'Monday' },
    { id: 'tuesday', label: 'Tuesday' },
    { id: 'wednesday', label: 'Wednesday' },
    { id: 'thursday', label: 'Thursday' },
    { id: 'friday', label: 'Friday' },
    { id: 'saturday', label: 'Saturday' },
    { id: 'sunday', label: 'Sunday' }
  ];

  const handleDayToggle = (day) => {
    setAvailability(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        enabled: !prev[day].enabled
      }
    }));
  };

  const handleMouseDown = (day, hour) => {
    setIsDragging(true);
    setSelectionStart(hour);
    currentDay.current = day;
    setIsAddMode(!availability[day].hours.has(hour));
    setSelectingHours(new Set([hour]));
  };

  const handleMouseEnter = (hour) => {
    if (isDragging && selectionStart !== null) {
      const start = Math.min(selectionStart, hour);
      const end = Math.max(selectionStart, hour);
      const newSelection = new Set();
      
      for (let i = start; i <= end; i++) {
        newSelection.add(i);
      }
      
      setSelectingHours(newSelection);
    }
  };

  const handleMouseUp = () => {
    if (isDragging) {
      setAvailability(prev => ({
        ...prev,
        [currentDay.current]: {
          ...prev[currentDay.current],
          hours: new Set(
            isAddMode
              ? new Set([...prev[currentDay.current].hours, ...selectingHours])
              : new Set([...prev[currentDay.current].hours].filter(h => !selectingHours.has(h)))
          )
        }
      }));
      
      setIsDragging(false);
      setSelectionStart(null);
      setSelectingHours(new Set());
      currentDay.current = null;
    }
  };

  const copyToAllDays = (fromDay) => {
    setAvailability(prev => {
      const newAvailability = { ...prev };
      days.forEach(day => {
        if (day.id !== fromDay) {
          newAvailability[day.id] = {
            enabled: true,
            hours: new Set(prev[fromDay].hours)
          };
        }
      });
      return newAvailability;
    });
  };

  const clearDay = (day) => {
    setAvailability(prev => ({
      ...prev,
      [day]: {
        enabled: prev[day].enabled,
        hours: new Set()
      }
    }));
  };

  const clearAllDays = () => {
    setAvailability(prev => {
      const newAvailability = {};
      Object.keys(prev).forEach(day => {
        newAvailability[day] = {
          enabled: prev[day].enabled,
          hours: new Set()
        };
      });
      return newAvailability;
    });
  };

  const getTimeRanges = (hours) => {
    const sortedHours = Array.from(hours).sort((a, b) => a - b);
    const ranges = [];
    let start = null;
    let prev = null;

    sortedHours.forEach(hour => {
      if (start === null) {
        start = hour;
      } else if (hour !== prev + 1) {
        ranges.push(`${start}:00-${prev + 1}:00`);
        start = hour;
      }
      prev = hour;
    });

    if (start !== null) {
      ranges.push(`${start}:00-${prev + 1}:00`);
    }

    return ranges;
  };

  const formatTimeRange = (range) => {
    const [start, end] = range.split('-');
    const formatHour = (time) => {
      const hour = parseInt(time);
      const ampm = hour < 12 ? 'am' : 'pm';
      const hour12 = hour % 12 || 12;
      return `${hour12}${ampm}`;
    };
    return `${formatHour(start)} - ${formatHour(end)}`;
  };

  return (
    <div className="availability-card">
      <div className="card-header">
        <h2 className="card-title">Set Your Weekly Availability</h2>
        <div className="bulk-actions">
          <button 
            className="button button-danger"
            onClick={clearAllDays}
          >
            <RotateCcw size={16} />
            Clear All Days
          </button>
        </div>
      </div>
      <div className="card-content">
        {days.map((day) => (
          <div key={day.id} className="day-container">
            <div className="day-header">
              <div className="checkbox-wrapper">
                <input
                  type="checkbox"
                  id={day.id}
                  checked={availability[day.id].enabled}
                  onChange={() => handleDayToggle(day.id)}
                />
                <label htmlFor={day.id}>{day.label}</label>
              </div>
              
              {availability[day.id].enabled && (
                <div className="day-controls">
                  <button 
                    className="button button-secondary"
                    onClick={() => copyToAllDays(day.id)}
                  >
                    <Copy size={16} />
                    Copy to All Days
                  </button>
                  <button 
                    className="button button-danger"
                    onClick={() => clearDay(day.id)}
                  >
                    <Trash2 size={16} />
                    Clear
                  </button>
                </div>
              )}
            </div>

            {availability[day.id].enabled && (
              <div>
                <div 
                  className="time-grid"
                  onMouseLeave={handleMouseUp}
                >
                  {Array.from({ length: 24 }, (_, i) => (
                    <TimeBlock
                      key={i}
                      hour={i}
                      selected={availability[day.id].hours.has(i)}
                      selecting={isDragging && currentDay.current === day.id && selectingHours.has(i)}
                      onMouseDown={() => handleMouseDown(day.id, i)}
                      onMouseEnter={() => handleMouseEnter(i)}
                      onMouseUp={handleMouseUp}
                    />
                  ))}
                </div>
                
                <div className="time-ranges">
                  Selected ranges: {getTimeRanges(availability[day.id].hours).map(formatTimeRange).join(', ') || 'None'}
                </div>
              </div>
            )}
          </div>
        ))}

        <button 
          className="button button-primary save-button"
          onClick={() => {
            const formattedAvailability = Object.entries(availability).reduce((acc, [day, value]) => {
              if (value.enabled) {
                acc[day] = getTimeRanges(value.hours);
              }
              return acc;
            }, {});
            console.log('Saved availability:', formattedAvailability);
          }}
        >
          Save Availability
        </button>
      </div>
    </div>
  );
};

export default AvailabilitySelector;