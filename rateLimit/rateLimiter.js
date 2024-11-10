
import rateLimit from 'express-rate-limit';

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 5,
  message: 'Zu viele Anmeldeversuche von dieser IP, bitte versuchen Sie es in 15 Minuten erneut.',
});

export default loginLimiter;
