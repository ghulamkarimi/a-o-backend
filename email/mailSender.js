import dotenv from "dotenv";
import nodemailer from "nodemailer";

dotenv.config();

// create reusable transporter object using the default SMTP transport

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL,
    pass: process.env.PASS_MAIL,
  },
});

export const sendVerificationLinkToEmail = async (
  email,
  firstName,
  verificationCode
) => {
  const mailOptions = {
    from: process.env.EMAIL,
    to: email,
    subject: "Verifizieren Sie Ihr Konto",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; background-color: #f9f9f9; border-radius: 10px; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);">
        <div style="padding: 20px; background-color: #007bff; border-top-left-radius: 10px; border-top-right-radius: 10px; text-align: center;">
          <h1 style="color: #ffffff; font-size: 24px; margin: 0;">A und O</h1>
        </div>
        <div style="padding: 20px;">
          <h2 style="font-size: 20px; color: #333;">Hallo ${firstName},</h2>
          <p style="font-size: 16px; color: #555; line-height: 1.6;">
            Vielen Dank, dass Sie sich bei <strong>A und O</strong> registriert haben! Bitte nutzen Sie den folgenden Bestätigungscode, um Ihr Konto zu verifizieren:
          </p>
          <div style="text-align: center; margin: 20px 0;">
            <p style="font-size: 30px; font-weight: bold; color: #007bff; margin: 0; letter-spacing: 2px;">${verificationCode}</p>
          </div>
          <p style="font-size: 14px; color: #777; text-align: center; margin: 20px 0;">
            Dieser Code ist nur 10 Minuten gültig. Wenn Sie die Registrierung nicht initiiert haben, ignorieren Sie diese Nachricht bitte.
          </p>
          <div style="text-align: center; margin-top: 30px;">
            <a href="#" style="text-decoration: none; background-color: #007bff; color: #ffffff; padding: 10px 20px; font-size: 16px; border-radius: 5px; display: inline-block; box-shadow: 0px 3px 6px rgba(0, 0, 0, 0.16);">Verifizieren</a>
          </div>
        </div>
        <div style="padding: 10px; background-color: #f1f1f1; border-bottom-left-radius: 10px; border-bottom-right-radius: 10px; text-align: center;">
          <p style="font-size: 12px; color: #999; margin: 0;">
            &copy; 2024 A und O. Alle Rechte vorbehalten.
          </p>
        </div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("Verifikations-E-Mail wurde erfolgreich gesendet.");
  } catch (error) {
    console.error("Fehler beim Senden der Verifikations-E-Mail:", error);
    throw new Error("Fehler beim Senden der Verifikations-E-Mail.");
  }
};

export const appointmentConfirmationEmail = async (
  email,
  firstName,
  lastName,
  date,
  time,
  service,
  licensePlate,
  hsn,
  tsn
) => {
  const mailOptions = {
    from: process.env.EMAIL,
    to: email,
    subject: "Terminbestätigung",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; background-color: #f9f9f9; border-radius: 10px; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);">
        <div style="padding: 20px; background-color: #007bff; border-top-left-radius: 10px; border-top-right-radius: 10px; text-align: center;">
          <h1 style="color: #ffffff; font-size: 24px; margin: 0;">A und O</h1>
        </div>
        <div style="padding: 20px;">
          <h2 style="font-size: 20px; color: #333;">Hallo ${firstName} ${lastName},</h2>
          <p style="font-size: 16px; color: #555; line-height: 1.6;">
            Ihr Termin wurde erfolgreich bestätigt. Hier sind die Details:
          </p>
          <ul style="list-style: none; padding: 0;">
            <li style="margin: 10px 0;">
              <strong>Datum:</strong> ${date}
            </li>
            <li style="margin: 10px 0;">
              <strong>Uhrzeit:</strong> ${time}
            </li>
            <li style="margin: 10px 0;">
              <strong>Service:</strong> ${service}
            </li>
            <li style="margin: 10px 0;">
              <strong>Kennzeichen:</strong> ${licensePlate}
            </li>
            <li style="margin: 10px 0;">
              <strong>HSN:</strong> ${hsn}
            </li>
            <li style="margin: 10px 0;">
              <strong>TSN:</strong> ${tsn}
            </li>
          </ul>
          <p style="font-size: 16px; color: #555; line-height: 1.6;">
            Wir freuen uns darauf, Sie zu sehen!
          </p>
          <div style="text-align: center; margin-top: 30px;"> 
            <a href="#" style="text-decoration: none; background-color: #007bff; color: #ffffff; padding: 10px 20px; font-size: 16px; border-radius: 5px; display: inline-block; box-shadow: 0px 3px 6px rgba(0, 0, 0, 0.16);">Termin ändern</a>
          </div>
        </div>
        <div style="padding: 10px; background-color: #f1f1f1; border-bottom-left-radius: 10px; border-bottom-right-radius: 10px; text-align: center;">
          <p style="font-size: 12px; color: #999; margin: 0;">
            &copy; 2024 A und O. Alle Rechte vorbehalten.
          </p>
        </div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("Verifikations-E-Mail wurde erfolgreich gesendet.");
  } catch (error) {
    console.error("Fehler beim Senden der Verifikations-E-Mail:", error);
    throw new Error("Fehler beim Senden der Verifikations-E-Mail.");
  }
};
