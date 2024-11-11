import client from "../config/paypalConfig.js";
import asyncHandler from "express-async-handler";
import paypal from "@paypal/checkout-server-sdk";
import nodeMailer from "nodemailer";

// Benachrichtigung an den Administrator senden
const sendAdminNotification = (
  paymentStatus,
  orderId,
  customerEmail,
  order
) => {
  const transporter = nodeMailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.ADMIN_PAYPAL_EMAIL,
      pass: process.env.AMIN_EMAIL_PASS,
    },
  });

 
  const mailOptions = {
    from: process.env.ADMIN_PAYPAL_EMAIL,
    to: process.env.ADMIN_PAYPAL_EMAIL,
    subject: `Zahlungsantrag PayPal - Bestellung ${orderId}`,
    html: `
      <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              background-color: #f4f4f9;
              color: #333;
              padding: 20px;
            }
            .email-container {
              background-color: #ffffff;
              border-radius: 8px;
              box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
              padding: 20px;
              max-width: 600px;
              margin: 0 auto;
            }
            .header {
              background-color: #0070f3;
              color: #ffffff;
              padding: 10px;
              text-align: center;
              border-radius: 8px 8px 0 0;
            }
            .content {
              margin-top: 20px;
            }
            .content p {
              font-size: 16px;
              line-height: 1.6;
            }
            .content h3 {
              font-size: 18px;
              color: #0070f3;
            }
            .footer {
              margin-top: 30px;
              font-size: 12px;
              text-align: center;
              color: #777;
            }
            .important {
              color: #d9534f;
            }
          </style>
        </head>
        <body>
          <div class="email-container">
            <div class="header">
              <h2>PayPal Zahlungsantrag</h2>
            </div>
            <div class="content">
              <p><strong>Bestell-ID:</strong> ${orderId}</p>
              <p><strong>Kunde:</strong> ${customerEmail}</p>
              <p><strong>Zahlungsstatus:</strong> <span class="important">${paymentStatus}</span></p>
              
              <h3>Details der Bestellung:</h3>
              <p>Die Bestellung mit der ID <strong>${orderId}</strong> wurde erfolgreich durch den Kunden mit der E-Mail-Adresse <strong>${customerEmail}</strong> mit PayPal als Zahlungsmethode platziert.</p>
              
              <p>Bitte prüfen Sie die Zahlung und den Status der Bestellung in Ihrer Paypal App.</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} Ihr Unternehmen - Alle Rechte vorbehalten.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  };
  

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log("Fehler beim Senden der E-Mail:", error);
    } else {
      console.log("Benachrichtigung gesendet: " + info.response);
    }
  });
};

// Zahlung erstellen
// Zahlung erstellen
// Zahlung erstellen
export const createPayment = asyncHandler(async (req, res) => {
  const { totalAmount, customerEmail } = req.body;

  if (!customerEmail) {
    return res.status(400).json({ message: "E-Mail-Adresse des Kunden fehlt" });
  }

  const request = new paypal.orders.OrdersCreateRequest();
  request.requestBody({
    intent: "CAPTURE",
    purchase_units: [
      {
        amount: {
          currency_code: "EUR",
          value: totalAmount.toFixed(2),
        },
        payee: {
          email_address: process.env.ADMIN_PAYPAL_EMAIL, // Empfänger der Zahlung
        },
      },
    ],
  });

  try {
    const order = await client.execute(request);
    console.log(order.result);

    // Antwort wird nur einmal gesendet
    res.json({
      id: order.result.id,
      status: order.result.status,
    });

    // Sende Benachrichtigung an den Administrator, dass eine Zahlung angefordert wurde
    sendAdminNotification(
      order.result.status,
      order.result.id,
      customerEmail,
      order
    );
  } catch (error) {
    console.error("Fehler bei der Erstellung der Zahlung:", error);
    res.status(500).json({ message: "Fehler bei der Erstellung der Zahlung" });
  }
});

// Zahlung erfassen
export const capturePayment = asyncHandler(async (req, res) => {
  const { orderId } = req.body;

  if (!orderId) {
    return res.status(400).json({ message: "Ungültige Bestell-ID" });
  }

  const request = new paypal.orders.OrdersCaptureRequest(orderId);
  request.requestBody({});

  try {
    const capture = await client.execute(request);

    const customerEmail = capture.result.purchase_units[0].payee.email_address;

    // Sende Benachrichtigung an den Administrator, dass die Zahlung erfasst wurde
    sendAdminNotification(
      capture.result.status,
      orderId,
      customerEmail,
      capture
    );

    res.json({
      id: capture.result.id,
      status: capture.result.status,
    });
  } catch (error) {
    console.error("Fehler beim Erfassen der Zahlung:", error);
    res.status(500).json({ message: "Fehler beim Erfassen der Zahlung" });
  }
});
