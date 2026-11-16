import { defineConfig } from 'wxt';
import react from '@vitejs/plugin-react';

export default defineConfig({
  vite: () => ({
    plugins: [react()],
  }),
  manifest: {
    name: 'ChronoWA - WhatsApp Message Scheduler',
    description: 'Schedule messages on WhatsApp Web with precision, 100% private and free.',
    version: '1.0.0',
    permissions: [
      'storage',
      'alarms',
      'notifications',
      'tabs',
    ],
    host_permissions: [
      'https://web.whatsapp.com/*',
    ],
  },
});
