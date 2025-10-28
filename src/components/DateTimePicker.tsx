'use client'

import { useState, useRef, useEffect } from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { CalendarIcon, ClockIcon, XMarkIcon } from '@heroicons/react/24/outline'

interface DateTimePickerProps {
  value?: Date | null
  onChange: (date: Date | null) => void
  placeholder?: string
}

export default function DateTimePicker({ value, onChange, placeholder = 'Select date and time' }: DateTimePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(value || null)
  const [selectedTime, setSelectedTime] = useState<string>(
    value ? `${value.getHours().toString().padStart(2, '0')}:${value.getMinutes().toString().padStart(2, '0')}` : '12:00'
  )
  const wrapperRef = useRef<HTMLDivElement>(null)

  // Generate time options in 15-minute intervals
  const timeOptions: string[] = []
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
      timeOptions.push(timeStr)
    }
  }

  // Close picker when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }
  }, [isOpen])

  const handleDateChange = (date: Date | null) => {
    setSelectedDate(date)
    if (date && selectedTime) {
      const [hours, minutes] = selectedTime.split(':').map(Number)
      const newDate = new Date(date)
      newDate.setHours(hours, minutes, 0, 0)
      onChange(newDate)
    }
  }

  const handleTimeChange = (time: string) => {
    setSelectedTime(time)
    if (selectedDate) {
      const [hours, minutes] = time.split(':').map(Number)
      const newDate = new Date(selectedDate)
      newDate.setHours(hours, minutes, 0, 0)
      onChange(newDate)
    }
  }

  const handleClear = () => {
    setSelectedDate(null)
    setSelectedTime('12:00')
    onChange(null)
    setIsOpen(false)
  }

  const formatDisplayValue = () => {
    if (!selectedDate) return ''
    const date = new Date(selectedDate)
    if (selectedTime) {
      const [hours, minutes] = selectedTime.split(':').map(Number)
      date.setHours(hours, minutes)
    }
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  return (
    <div className="relative" ref={wrapperRef}>
      {/* Input Field */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="w-full rounded-md border border-theme-border bg-theme-bg text-gray-200 shadow-sm focus-within:border-theme-accent focus-within:ring-1 focus-within:ring-theme-accent px-3 py-2 cursor-pointer flex items-center justify-between"
      >
        <span className={selectedDate ? 'text-gray-200' : 'text-gray-500'}>
          {selectedDate ? formatDisplayValue() : placeholder}
        </span>
        <div className="flex items-center space-x-2">
          {selectedDate && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleClear()
              }}
              className="text-gray-400 hover:text-gray-200"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          )}
          <CalendarIcon className="h-5 w-5 text-gray-400" />
        </div>
      </div>

      {/* Picker Popup */}
      {isOpen && (
        <div className="absolute z-50 mt-2 bg-theme-card border border-theme-border rounded-lg shadow-2xl overflow-hidden right-0">
          <div className="flex">
            {/* Calendar Section */}
            <div className="p-2 border-r border-theme-border">
              <DatePicker
                selected={selectedDate}
                onChange={handleDateChange}
                inline
                calendarClassName="compact-calendar"
              />
            </div>

            {/* Time Section */}
            <div className="w-24 bg-theme-bg">
              <div className="p-2 border-b border-theme-border">
                <div className="flex items-center space-x-1 text-gray-300">
                  <ClockIcon className="h-3 w-3" />
                  <span className="text-xs font-medium">Time</span>
                </div>
              </div>
              <div className="overflow-y-auto max-h-48 custom-scrollbar">
                {timeOptions.map((time) => (
                  <button
                    key={time}
                    onClick={() => handleTimeChange(time)}
                    className={`w-full px-2 py-1 text-xs text-left hover:bg-theme-card transition-colors ${
                      selectedTime === time
                        ? 'bg-theme-accent text-white font-medium'
                        : 'text-gray-300'
                    }`}
                  >
                    {time}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
