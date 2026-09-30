/**
 * inviteShare — mensagem bonita de partilha do convite no WhatsApp.
 * Calorosa e adaptada ao tipo de evento (casamento, chá, aniversário...).
 * Usada no painel principal e no painel do parceiro(a).
 */

interface ShareEvent {
  id?: string;
  title?: string;
  type?: string;
  date?: string | null;
  time?: string | null;
  locationName?: string | null;
}

function occasionOf(type?: string): string {
  switch (type) {
    case 'BRIDAL_SHOWER':
      return 'o meu chá de panela';
    case 'BABY_SHOWER':
      return 'o meu chá de bebé';
    case 'BIRTHDAY':
      return 'o meu aniversário';
    case 'CORPORATE':
      return 'o nosso evento';
    case 'WEDDING':
    default:
      return 'o meu casamento';
  }
}

/** Texto formatado (WhatsApp) com *negrito* e emojis. */
export function buildInviteShareMessage(event: ShareEvent, inviteLink: string): string {
  const lines = [
    `Olá! 💍 És muito importante para mim, por isso estás convidado(a) para ${occasionOf(event.type)}:`,
    `*${event.title || 'o meu evento'}*`,
  ];
  if (event.date) lines.push(`📅 ${event.date}${event.time ? ` às ${event.time}` : ''}`);
  if (event.locationName) lines.push(`📍 ${event.locationName}`);
  lines.push('', `Confirme a sua presença aqui: ${inviteLink}`, '', 'Conto contigo! 🙏');
  return lines.join('\n');
}

/** Abre o seletor de partilha do WhatsApp com a mensagem + link. */
export function openInviteShareWhatsApp(event: ShareEvent, inviteLink: string): void {
  if (typeof window === 'undefined') return;
  const msg = buildInviteShareMessage(event, inviteLink);
  window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank', 'noopener,noreferrer');
}
