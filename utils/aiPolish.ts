import { AITone } from './types';

/**
 * Intelligent client-side AI message tone polisher
 * Instant transformation, zero latency, 100% free with zero API key dependencies!
 */
export function polishMessage(text: string, tone: AITone, recipientName?: string): string {
  const clean = text.trim();
  if (!clean) return text;

  const name = recipientName?.trim() || '{name}';

  switch (tone) {
    case 'professional':
      return `Dear ${name},\n\nI hope this message finds you well.\n\n${clean}\n\nPlease let me know if you require any additional information. Looking forward to your response.\n\nBest regards.`;

    case 'celebratory':
      return `🎉 Dear ${name}! Wishing you a wonderful and joyful celebration! 🎂✨\n\n"${clean}"\n\nMay this year bring you immense happiness, great health, and tremendous success! 🚀🎊`;

    case 'friendly':
      return `Hey ${name}! 👋\n\n${clean}\n\nCatch up with you soon! Have an awesome day! ✨`;

    case 'urgent_polite':
      return `Hi ${name}, gentle follow-up regarding the below:\n\n"${clean}"\n\nCould you please share a quick update when convenient? Greatly appreciate your time! 🙏`;

    default:
      return clean;
  }
}
