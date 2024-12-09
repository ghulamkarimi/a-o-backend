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



// Funktion für das Senden einer einfachen Stornierungs-E-Mail
export const sendSimpleCancellationEmail = async (email, firstName, date, time) => {
  // Initialisiere den Nodemailer-Transporter
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL,
      pass: process.env.PASS_MAIL,
    },
  });

  // Gestylten E-Mail-Inhalt definieren
  const mailOptions = {
    from: process.env.EMAIL,
    to: email,
    subject: "Termin Stornierung - A und O Werkstatt",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; background-color: #f9f9f9; border-radius: 10px; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2); overflow: hidden;">
        <div style="padding: 20px; background-color: #ff4c4c; text-align: center;">
          <h1 style="color: #ffffff; font-size: 24px; margin: 0;">A und O Werkstatt</h1>
        </div>
        <div style="padding: 20px;">
          <h2 style="font-size: 20px; color: #333;">Hallo ${firstName},</h2>
          <p style="font-size: 16px; color: #555; line-height: 1.6;">
            Wir möchten Sie darüber informieren, dass Ihr Termin am <strong>${date.toLocaleDateString()}</strong> um <strong>${time}</strong> leider storniert werden musste.
          </p>
          <p style="font-size: 16px; color: #555; line-height: 1.6;">
            Entweder erhalten Sie von uns einen neuen Terminvorschlag per E-Mail, oder wir werden uns telefonisch bei Ihnen melden.
          </p>
          <p style="font-size: 16px; color: #555; line-height: 1.6;">
            Wenn Sie Fragen haben oder weitere Informationen benötigen, zögern Sie bitte nicht, uns zu kontaktieren.
          </p>
          <div style="text-align: center; margin: 20px 0;">
            <strong>Kontaktieren Sie uns:</strong><br />
            Telefon: <a href="tel:+491234567890" style="color: #007bff; text-decoration: none;">+49 123 456 7890</a>
          </div>
          <p style="font-size: 14px; color: #777; text-align: center; margin: 20px 0;">
            Wir hoffen, Sie bald wieder bei der A und O Werkstatt begrüßen zu dürfen.
          </p>
        </div>
        <div style="padding: 20px; text-align: center;">
          <a href="http://localhost:3000" style="text-decoration: none; background-color: #007bff; color: #ffffff; padding: 10px 20px; font-size: 16px; border-radius: 5px; display: inline-block; box-shadow: 0px 3px 6px rgba(0, 0, 0, 0.16);">
            Zur Startseite
          </a>
        </div>
        <div style="padding: 10px; background-color: #f1f1f1; text-align: center;">
          <p style="font-size: 12px; color: #999; margin: 0;">
            &copy; 2024 A und O Werkstatt. Alle Rechte vorbehalten.
          </p>
        </div>
      </div>
    `,
  };

  // Versende die E-Mail
  try {
    await transporter.sendMail(mailOptions);
    console.log("Stornierungs-E-Mail wurde erfolgreich gesendet.");
  } catch (error) {
    console.error("Fehler beim Senden der Stornierungs-E-Mail:", error);
    throw new Error("Fehler beim Senden der Stornierungs-E-Mail.");
  }
};



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
  tsn,
  appointmentId
) => {
  const cancelUrl = `${process.env.BASE_URL}/appointment/cancel/${appointmentId}`;

  const mailOptions = {
    from: process.env.EMAIL,
    to: email,
    subject: "Terminbestätigung - A und O Werkstatt",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; background-color: #f9f9f9; border-radius: 10px; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);">
        <div style="padding: 20px; background-color: #007bff; border-top-left-radius: 10px; border-top-right-radius: 10px; text-align: center;">
          <h1 style="color: #ffffff; font-size: 24px; margin: 0;">A und O Werkstatt</h1>
        </div>
        <div style="padding: 20px;">
          <h2 style="font-size: 20px; color: #333;">Hallo ${firstName} ${lastName},</h2>
          <p style="font-size: 16px; color: #555; line-height: 1.6;">
            Ihr Termin wurde erfolgreich bestätigt. Hier sind die Details Ihres Termins:
          </p>
          <ul style="list-style: none; padding: 0;">
            <li style="margin: 10px 0;"><strong>Datum:</strong> ${date}</li>
            <li style="margin: 10px 0;"><strong>Uhrzeit:</strong> ${time}</li>
            <li style="margin: 10px 0;"><strong>Service:</strong> ${service}</li>
            <li style="margin: 10px 0;"><strong>Kennzeichen:</strong> ${licensePlate}</li>
            <li style="margin: 10px 0;"><strong>HSN:</strong> ${hsn}</li>
            <li style="margin: 10px 0;"><strong>TSN:</strong> ${tsn}</li>
          </ul>
          <p style="font-size: 16px; color: #555; line-height: 1.6;">
            Falls Sie den Termin stornieren möchten, klicken Sie bitte auf den folgenden Link. Bitte beachten Sie, dass eine Stornierung nur bis 24 Stunden vor dem Termin möglich ist. Andernfalls wird eine Rechnung auf Ihren Namen ausgestellt und Ihnen zugeschickt.
          </p>
          <div style="text-align: center; margin-top: 30px;">
            <a href="${cancelUrl}" style="text-decoration: none; background-color: #d9534f; color: #ffffff; padding: 10px 20px; font-size: 16px; border-radius: 5px; display: inline-block; box-shadow: 0px 3px 6px rgba(0, 0, 0, 0.16);">Termin stornieren</a>
          </div>
        </div>
        <div style="padding: 10px; background-color: #f1f1f1; border-bottom-left-radius: 10px; border-bottom-right-radius: 10px; text-align: center;">
          <p style="font-size: 12px; color: #999; margin: 0;">
            &copy; 2024 A und O Werkstatt. Alle Rechte vorbehalten.
          </p>
        </div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("Terminbestätigungs-E-Mail wurde erfolgreich gesendet.");
  } catch (error) {
    console.error("Terminbestätigung wurde nicht geschickt ", error);
    throw new Error("Fehler beim Senden der Terminbestätigungs-E-Mail.");
  }
};

