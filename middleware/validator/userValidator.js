import { body, validationResult } from "express-validator";

export const userRegisterValidator = [
  body("email")
    .isEmail()
    .withMessage("Bitte eine gültige E-Mail-Adresse eingeben"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Passwort muss mindestens 6 Zeichen lang sein"),
  body("confirmPassword").custom((value, { req }) => {
    if (value !== req.body.password) {
      throw new Error("Passwörter stimmen nicht überein");
    }
    return true;
  }),
  body("firstName").notEmpty().withMessage("first Name ist erforderlich"),
  body("lastName").notEmpty().withMessage("last Name ist erforderlich"),

  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];
