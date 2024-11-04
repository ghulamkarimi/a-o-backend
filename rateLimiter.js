// rateLimiter.js

import rateLimit from 'express-rate-limit';

// Rate Limiting für Anmeldeversuche
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 Minuten
  max: 5, // Maximal 5 Anmeldeversuche pro IP-Adresse
  message: 'Zu viele Anmeldeversuche von dieser IP, bitte versuchen Sie es in 15 Minuten erneut.',
});

export default loginLimiter;
