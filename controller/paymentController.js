import paypal from "@paypal/checkout-server-sdk";
import asyncHandler from "express-async-handler";
import nodeMailer from "nodemailer";
import Order from "../models/paymentModel.js";
import client from "../config/paypalConfig.js";
import dotenv from "dotenv";
import CarRent from "../models/carRentModel.js";
import Reservation from "../models/reservationModel.js";
dotenv.config();

const sendCustomerInvoiceEmail = async (customerEmail, order, carDetails) => {
  const transporter = nodeMailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.ADMIN_PAYPAL_EMAIL,
      pass: process.env.ADMIN_EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: process.env.ADMIN_PAYPAL_EMAIL,
    to: customerEmail,
    subject: `Rechnung für Ihre Bestellung ${order.orderId}`,
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
            img {
              max-width: 100%; /* Bild an den Container anpassen */
              height: auto; /* Verhältnis beibehalten */
              display: block; /* Verhindert, dass das Bild unter Text läuft */
              margin-top: 10px; /* Abstand nach oben */
            }
          </style>
        </head>
        <body>
          <div class="email-container">
            <div class="header">
              <h2>Rechnung für Ihre Bestellung ${order.orderId}</h2>
            </div>
            <div class="content">
              <p><strong>Bestell-ID:</strong> ${order.orderId}</p>
              <p><strong>Kunde:</strong> ${order.customerEmail}</p>
              <p><strong>Zahlungsstatus:</strong> ${order.paymentStatus}</p>
              <p><strong>Betrag:</strong> ${order.amount} EUR</p>
              <p><strong>Währung:</strong> ${order.currency}</p>
              
              <h3>Details der Bestellung:</h3>
              <p>Die Bestellung mit der ID <strong>${
                order.orderId
              }</strong> wurde erfolgreich von Ihnen durchgeführt. Wir haben die Zahlung erhalten.</p>
              
              <h3>Fahrzeugdetails:</h3>
              <p><strong>Fahrzeug-ID:</strong> ${carDetails._id}</p>
              <p><strong>Fahrzeugmodell:</strong> ${carDetails.carName}</p>
              
              <!-- Bild einfügen und es anpassen -->
              <img src="${carDetails.carImage}" alt="Fahrzeugbild" />
            
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} Ihr Unternehmen - Alle Rechte vorbehalten.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Rechnung E-Mail gesendet:", info.response);
  } catch (error) {
    console.error("Fehler beim Senden der E-Mail:", error);
  }
};

export const createOrder = asyncHandler(async (req, res) => {
  const { userId, carId, customerEmail, amount ,reservationId} = req.body;

  if (!userId || !carId || !customerEmail || !amount) {
    return res.status(400).json({
      message:
        "Alle erforderlichen Felder (userId, carId, customerEmail, amount) müssen ausgefüllt sein.",
    });
  }

  const request = new paypal.orders.OrdersCreateRequest();
  request.requestBody({
    intent: "CAPTURE",
    purchase_units: [
      {
        amount: {
          currency_code: "EUR",
          value: amount,
        },
      },
    ],
    application_context: {
      return_url: "http://localhost:3000/payment/success",
      cancel_url: "http://localhost:7001/payment/cancel",
    },
  });

  try {
    const order = await client.execute(request);

    // Bestellung in der Datenbank speichern
    const newOrder = new Order({
      orderId: order.result.id, // PayPal-Bestell-ID
      customerEmail: customerEmail,
      carId: carId,
      userId: userId,
      amount: amount,
      currency: "EUR",
      reservationId,
      paymentStatus: "CREATED", // Initialer Status
      payer: {}, // Payer wird im Capture-Schritt aktualisiert
      createTime: order.result.create_time,
      updateTime: order.result.update_time,
    });

    await newOrder.save(); // Speichern in MongoDB

    const approveUrl = order.result.links.find(
      (link) => link.rel === "approve"
    ).href;

    res.json({
      approvalUrl: approveUrl,
      orderId: order.result.id,
    });
  } catch (error) {
    console.error("Fehler beim Erstellen der Bestellung:", error);
    res.status(500).json({ message: "Fehler beim Erstellen der Bestellung" });
  }
});

export const capturePayment = asyncHandler(async (req, res) => {
  const { token, PayerID } = req.query; // token ist die orderId
  console.log("orderId (token):", token);
  console.log("PayerID:", PayerID);

  if (!token || !PayerID) {
    return res
      .status(400)
      .json({ message: "Ungültige Bestell-ID oder Payer-ID" });
  }

  const request = new paypal.orders.OrdersCaptureRequest(token);
  request.requestBody({});

  try {
    const capture = await client.execute(request);
    console.log(
      "PayPal Capture Result:",
      JSON.stringify(capture.result, null, 2)
    );

    if (capture.result.status === "COMPLETED") {
      const orderDetails = await Order.findOne({ orderId: capture.result.id });
      if (!orderDetails) {
        console.error("Bestellung nicht gefunden für:", capture.result.id);
        return res.status(404).json({ message: "Bestellung nicht gefunden" });
      }

      // Bestellung aktualisieren
      orderDetails.paymentStatus = "COMPLETED";
      orderDetails.payer = {
        name: `${capture.result.payer.name.given_name} ${capture.result.payer.name.surname}`,
        email: capture.result.payer.email_address,
        country_code: capture.result.payer.address.country_code,
      };
      orderDetails.createTime = capture.result.create_time;
      orderDetails.updateTime = capture.result.update_time;
      orderDetails.paymentSource = capture.result.payment_source.paypal;
      orderDetails.purchaseUnits = capture.result.purchase_units;

      await orderDetails.save(); // Speichern
      const reservation = await Reservation.findById(
        orderDetails.reservationId
      );
      if (reservation) {
        reservation.paymentStatus = "completed";
        reservation.isBooked = true;

        const carDetails = await CarRent.findById(reservation.carRent);
        if (carDetails) {
          carDetails.isBooked = true;

            // Convert strings to Date objects
    const pickupDate = new Date(reservation.pickupDate);
    const returnDate = new Date(reservation.returnDate);

       carDetails.bookedSlots.push({
      start: pickupDate,
      end: returnDate,
    });

          await carDetails.save();
        }

        await reservation.save();
      }
      const carDetails = await CarRent.findById(orderDetails.carId);
      await sendCustomerInvoiceEmail(
        orderDetails.customerEmail,
        orderDetails,
        carDetails
      );

      res.json({
        message: "Zahlung erfolgreich abgeschlossen! und Rechnung gesendet",
        details: capture.result,
      });
    } else {
      res.status(400).json({ message: "Zahlung nicht erfolgreich." });
    }
  } catch (error) {
    console.error("Fehler beim Erfassen der Zahlung:", error);
    res.status(500).json({ message: "Fehler beim Erfassen der Zahlung" });
  }
});
