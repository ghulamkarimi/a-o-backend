import paypal from "@paypal/checkout-server-sdk";
import asyncHandler from "express-async-handler";
import nodeMailer from "nodemailer";
import Order from "../models/paymentModel.js";
import client from "../config/paypalConfig.js";



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
              
              <p>Bitte prüfen Sie die Zahlung und den Status der Bestellung in Ihrem Admin Bereich.</p>
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


export const createOrder = asyncHandler(async (req, res) => {
    // Bestellung erstellen
    const request = new paypal.orders.OrdersCreateRequest();
    request.requestBody({
      intent: "CAPTURE", // Intention der Zahlung (Zahlung erfassen)
      purchase_units: [{
        amount: {
          currency_code: "USD",  // Währung der Zahlung
          value: req.body.amount, // Betrag aus der Anfrage
        },
      }],
      application_context: {
        return_url: "http://localhost:7001/payment/success",  // Erfolgs-URL
        cancel_url: "http://localhost:7001/payment/cancel",   // Abbruch-URL
      }
    });
  
    try {
      const order = await client.execute(request); // Bestellung ausführen
  
      // Genehmigungs-URL extrahieren und an den Client zurücksenden
      const approveUrl = order.result.links.find(link => link.rel === 'approve').href;
      res.json({ approvalUrl: approveUrl }); // URL zurücksenden, um die Zahlung zu genehmigen
    } catch (error) {
      console.error("Fehler beim Erstellen der Bestellung:", error);
      res.status(500).json({ message: "Fehler beim Erstellen der Bestellung" });
    }
  });
  
  export const createPayment = asyncHandler(async (req, res) => {
    const { totalAmount, customerEmail, carId, userId } = req.body;
  
    // Überprüfen, ob die E-Mail-Adresse und andere erforderliche Felder vorhanden sind
    if (!customerEmail || !carId || !userId) {
      return res.status(400).json({ message: "E-Mail, Auto-ID oder Benutzer-ID fehlt" });
    }
  
    // PayPal Zahlungsanforderung erstellen
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
            email_address: process.env.ADMIN_PAYPAL_EMAIL, // Admin PayPal-E-Mail-Adresse
          },
        },
      ],
    });
  
    try {
      // PayPal Zahlung ausführen
      const order = await client.execute(request);
      console.log(order.result);
  
      // Bestellung in der Datenbank speichern
      const newOrder = new Order({
        orderId: order.result.id,
        customerEmail: customerEmail,
        amount: totalAmount,
        paymentStatus: order.result.status, // PayPal Status
        paymentMethod: "PayPal", // Zahlungsmethode
        carId: carId,  // Auto-ID (Verknüpft die Bestellung mit einem Auto)
        userId: userId, // Benutzer-ID (Verknüpft die Bestellung mit einem Benutzer)
      });
  
      // Bestellung speichern
      await newOrder.save();
  
      // Erfolgreiche Antwort mit der Bestell-ID und dem Status
      res.json({
        id: order.result.id,
        status: order.result.status,
      });
  
      // Benachrichtigung an den Admin senden
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
  
  

export const capturePayment = asyncHandler(async (req, res) => {
    const { token, PayerID } = req.query; // `token` ist die `orderId`

    if (!token || !PayerID) {
        return res.status(400).json({ message: "Ungültige Bestell-ID oder Payer-ID" });
    }

    const request = new paypal.orders.OrdersCaptureRequest(token);
    request.requestBody({});

    try {
        const capture = await client.execute(request);

        if (capture.result.status === "COMPLETED") {
            res.json({ message: "Zahlung erfolgreich abgeschlossen!", details: capture.result });
        } else {
            res.status(400).json({ message: "Zahlung nicht erfolgreich." });
        }
    } catch (error) {
        console.error("Fehler beim Erfassen der Zahlung:", error);
        res.status(500).json({ message: "Fehler beim Erfassen der Zahlung" });
    }
});
