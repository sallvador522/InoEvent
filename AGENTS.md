# InoEvents Architecture Guidelines

## RSVP Text Dynamics
The RSVP text strings (e.g., button text, modal titles) must be dynamic based on the Event Type (`event.type`).
- **WEDDING / Default:** Use "Confirmar Presença", "RSVP", "Sua Presença"
- **BRIDAL_SHOWER:** Use variations like "Confirmar Presença no Chá", "Vou no Chá!", "RSVP Chá de Panela" to make the text fit the occasion.
- Always check the `event.type` property when rendering Call-to-Action buttons for the RSVP form.

## General Design
- Follow Apple-level design (spatial UI, glassmorphism, responsive).
- Ensure animations and components match the mood of the selected layout/theme.

## Bridal Shower Form Logic
- **Conditional Fields:** When the user selects a template corresponding to a Bridal Shower (`event.type === 'BRIDAL_SHOWER'` or the layout mode starts with `BRIDAL_`), the system must strictly request only the data relevant to that occasion.
- **Hide Wedding Fields:** Specific fields such as "Nome do Noivo", "Recepção", "Dress Code", and "Timeline" are often unnecessary for a Bridal Shower and should be hidden or made explicitly optional/alternative to streamline the user experience when creating or editing an event.
