/** WhatsApp chat link for order enquiries */
const WHATSAPP_NUMBER = '918008794794';
const WHATSAPP_PREFILL =
  'Hi, I came across Kushalopari Arts and would like to know more. Could you please assist me?';

export const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
  WHATSAPP_PREFILL
)}`;
