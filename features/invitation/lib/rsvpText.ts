/**
 * Helper to get dynamic RSVP text based on event type (Rule: AGENTS.md)
 */
export const getRSVPText = (
  eventType?: string,
  defaultText = "Confirmar Presença",
): string => {
  if (eventType === "BRIDAL_SHOWER") {
    if (defaultText === "Confirmar Presença")
      return "Confirmar Presença no Chá";
    if (
      defaultText === "Vou no Chá!" ||
      defaultText === "RESPONDER" ||
      defaultText === "RSVP"
    )
      return "Vou no Chá!";
    return "RSVP Chá de Panela";
  }
  return defaultText;
};
