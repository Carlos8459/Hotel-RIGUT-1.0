"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      captionLayout="dropdown-buttons"
      fromYear={new Date().getFullYear() - 80}
      toYear={new Date().getFullYear() + 10}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "flex justify-center pt-1 relative items-center",
        caption_label: "hidden",
        nav_button: "hidden",
        caption_dropdowns: "flex gap-2",
        vhidden: "hidden",
        dropdown_month: "p-1 rounded-md border bg-card cursor-pointer",
        dropdown_year: "p-1 rounded-md border bg-card cursor-pointer",
        table: "w-full border-collapse space-y-1",
        head_row: "flex",
        head_cell:
          "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
        row: "flex w-full mt-2",
        cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected])]:bg-amber-100/50 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 w-9 p-0 font-normal aria-selected:opacity-100"
        ),
        day_selected:
          "bg-amber-500 text-white rounded-full hover:bg-amber-500 hover:text-white focus:bg-amber-500 focus:text-white",
        day_today: "bg-muted text-foreground rounded-full",
        day_outside:
          "day-outside text-muted-foreground opacity-50 aria-selected:bg-amber-100/30 aria-selected:text-muted-foreground",
        day_disabled: "text-muted-foreground opacity-50",
        day_range_start: "rounded-full bg-amber-500 text-white",
        day_range_end: "rounded-full bg-amber-500 text-white",
        day_range_middle:
          "aria-selected:bg-transparent aria-selected:text-current rounded-none",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: ({ ...props }) => <ChevronLeft className="h-4 w-4" />,
        IconRight: ({ ...props }) => <ChevronRight className="h-4 w-4" />,
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
