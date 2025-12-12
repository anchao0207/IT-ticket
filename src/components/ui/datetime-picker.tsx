"use client";

import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";

interface DateTimePickerProps {
  value: Date | undefined;
  onChange: (date: Date | undefined) => void;
  disabled?: boolean;
  datePlaceholder?: string;
}

export function DateTimePicker({
  value,
  onChange,
  disabled = false,
  datePlaceholder = "Pick a date",
}: DateTimePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [timeValue, setTimeValue] = React.useState<string>(
    value ? format(value, "HH:mm") : "00:00"
  );

  React.useEffect(() => {
    if (value) {
      setTimeValue(format(value, "HH:mm"));
    }
  }, [value]);

  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (!selectedDate) {
      onChange(undefined);
      setIsOpen(false);
      return;
    }

    // Preserve the existing time or use the current time value
    const [hours, minutes] = timeValue.split(":").map(Number);
    const newDate = new Date(selectedDate);
    newDate.setHours(hours, minutes, 0, 0);
    onChange(newDate);
    setIsOpen(false);
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = e.target.value;
    setTimeValue(newTime);

    if (!value) {
      // If no date is set, create one with today's date
      const [hours, minutes] = newTime.split(":").map(Number);
      const newDate = new Date();
      newDate.setHours(hours, minutes, 0, 0);
      onChange(newDate);
      return;
    }

    // Update the time on the existing date
    const [hours, minutes] = newTime.split(":").map(Number);
    const newDate = new Date(value);
    newDate.setHours(hours, minutes, 0, 0);
    onChange(newDate);
  };

  value && console.log(format(value, "P"));

  return (
    <div className="flex gap-2">
      {/* Date Picker */}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            disabled={disabled}
            className={cn(
              "flex-1 justify-start text-left font-normal bg-transparent",
              !value && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {value ? format(value, "P") : <span>{datePlaceholder}</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={value}
            onSelect={handleDateSelect}
            disabled={disabled}
          />
        </PopoverContent>
      </Popover>

      {/* Time Picker */}
      <div className="relative flex items-center">
        <Clock className="absolute left-3 h-4 w-4 text-muted-foreground" />
        <Input
          type="time"
          value={timeValue}
          onChange={handleTimeChange}
          disabled={disabled}
          className="w-[140px] pl-9 appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
        />
      </div>
    </div>
  );
}
