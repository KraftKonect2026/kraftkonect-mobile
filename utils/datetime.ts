// Combines a calendar date with a 12-hour time slot label ("09:00 AM") into a
// single ISO timestamp. The booking flow keeps the chosen date and time as
// separate params, so they only need to be merged when creating the booking.
export const combineDateAndTime = (dateIso: string, timeLabel: string): string => {
  const base = new Date(dateIso);
  const match = timeLabel.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return base.toISOString();

  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const period = match[3].toUpperCase();

  if (period === "PM" && hours !== 12) hours += 12;
  if (period === "AM" && hours === 12) hours = 0;

  base.setHours(hours, minutes, 0, 0);
  return base.toISOString();
};

// Friendly, consistent date label used across the booking screens.
export const formatBookingDate = (dateIso: string): string =>
  new Date(dateIso).toLocaleDateString("en-NG", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
