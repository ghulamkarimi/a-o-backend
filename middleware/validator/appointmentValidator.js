import { body, validationResult } from 'express-validator';


export const appointmentValidator = [
  body('email').isEmail().withMessage('Bitte eine gültige E-Mail-Adresse eingeben'),
  body('phone').isLength({ min: 10 }).withMessage('Bitte eine gültige Telefonnummer eingeben'),
  body('service').notEmpty().withMessage('Service ist erforderlich'),
  body('fullName').notEmpty().withMessage('Name ist erforderlich'),
  body('date').isISO8601().toDate().withMessage('Bitte ein gültiges Datum angeben'),
  body('licensePlate').notEmpty().withMessage('Fahrzeugkennzeichen ist erforderlich'),
  body('notes').optional().isString().withMessage('Notizen müssen Text sein'),

  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];
