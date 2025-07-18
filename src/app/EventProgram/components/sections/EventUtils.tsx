

export const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date);
};

export const formatTime = (time: string) => {
  return new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
};

export const getEventTypeIcon = (type: string) => {
  const icons = {
    bachelor: "🕺",
    theme: "🎭",
    house: "🍻",
    roast: "🎂",
    prom: "👑",
    trivia: "🧠",
    glowup: "🔥",
    breakup: "💔"
  };
  return icons[type as keyof typeof icons] || "🎊";
};

export const getEventTypeLabel = (type: string) => {
  const labels = {
    bachelor: "Bachelor(ette) Party",
    theme: "Theme Party",
    house: "House Party",
    roast: "Roast Night",
    prom: "Prom or Formal",
    trivia: "Trivia Night",
    glowup: "Glow-Up Party",
    breakup: "Breakup Bash"
  };
  return labels[type as keyof typeof labels] || "Event";
};

export const getToneLabel = (tone: string) => {
  const labels = {
    formal: "Formal & Elegant",
    casual: "Casual & Relaxed",
    party: "High Energy Party",
    professional: "Professional",
    wholesome: "Family-Friendly",
    roast: "Playful & Humorous"
  };
  return labels[tone as keyof typeof labels] || tone;
};

// Utility function to remove undefined values from objects
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const cleanUndefinedValues = (obj: any): any => {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== 'object') return obj;
  if (obj instanceof Date) return obj; // Preserve Date objects
  if (Array.isArray(obj)) return obj.map(cleanUndefinedValues);
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cleaned: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      cleaned[key] = cleanUndefinedValues(value);
    }
  }
  return cleaned;
}; 