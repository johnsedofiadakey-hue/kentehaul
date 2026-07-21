const functions = require("firebase-functions");
const admin = require("firebase-admin");
const crypto = require("crypto");
admin.initializeApp();

const db = admin.firestore();

const SITE_URL = "https://kentehaul.com";

/**
 * Builds the branded order-confirmation email (logo, order details, item
 * images, order number, and a magic link straight to that order's tracking
 * page). Delivery happens via the "Trigger Email from Firestore" extension
 * watching the `mail` collection, configured to send through Brevo SMTP —
 * this function only needs to write the document, not talk to Brevo itself.
 */
function buildOrderConfirmationEmail(orderId, orderData, siteContent) {
    const customer = orderData.customer || {};
    const items = orderData.items || [];
    const primary = siteContent?.primaryColor || "#5b0143";
    const accent = siteContent?.secondaryColor || "#f97316";
    const logo = siteContent?.logo;
    const trackingUrl = `${SITE_URL}/track/${orderId}`;

    const itemsHtml = items.map((item) => `
      <tr style="border-bottom: 1px solid #eee;">
        <td style="padding: 12px 0; width: 64px;">
          ${item.image
            ? `<img src="${item.image}" alt="${item.name || 'Product'}" width="56" height="56" style="width: 56px; height: 56px; object-fit: cover; border-radius: 12px; display: block;" />`
            : `<div style="width: 56px; height: 56px; border-radius: 12px; background-color: ${primary}10;"></div>`}
        </td>
        <td style="padding: 12px 16px;">
          <div style="font-weight: bold; color: ${primary}; font-size: 14px;">${item.name || "Item"}</div>
          <div style="font-size: 11px; color: #666;">Qty: ${item.quantity || 1} × ₵${Number(item.price || 0).toLocaleString()}</div>
          ${item.isPreorder ? `<div style="font-size: 11px; color: ${accent}; font-weight: bold; margin-top: 2px;">Pre-order: ~${item.preorderDays || 14} days</div>` : ""}
        </td>
        <td style="padding: 12px 0; text-align: right; font-weight: bold; color: #333; white-space: nowrap;">₵${(Number(item.price || 0) * Number(item.quantity || 1)).toLocaleString()}</td>
      </tr>
    `).join("");

    return `
      <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f9f9f9; padding: 40px 20px; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 30px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.05);">
          <!-- Header -->
          <div style="background-color: ${primary}; padding: 40px 30px; text-align: center; color: #ffffff;">
            ${logo
              ? `<img src="${logo}" alt="KenteHaul" style="height: 48px; margin-bottom: 16px;" />`
              : `<h1 style="margin: 0 0 4px; font-size: 26px; letter-spacing: 4px; font-weight: 900; text-transform: uppercase;">KenteHaul</h1>`}
            <p style="margin: 0; opacity: 0.85; font-size: 13px; font-weight: 300; text-transform: uppercase; letter-spacing: 2px;">Order Confirmed</p>
          </div>

          <!-- Content -->
          <div style="padding: 40px 30px;">
            <div style="margin-bottom: 30px; border-bottom: 2px solid ${primary}10; padding-bottom: 20px;">
              <h2 style="margin: 0; font-size: 18px; color: ${primary}; font-weight: 900;">Order #${orderId}</h2>
              <p style="font-size: 12px; color: #999; margin: 5px 0 0;">Placed on ${orderData.date || new Date().toLocaleDateString()}</p>
            </div>

            <p style="font-size: 14px; line-height: 1.6;">Dear ${customer.name || "Valued Customer"}, thank you for weaving your story with KenteHaul. Our master weavers are already preparing your pieces.</p>

            <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
              ${itemsHtml}
              <tr>
                <td colspan="2" style="padding: 25px 0 5px; font-size: 13px; color: #666;">Shipping (${orderData.shippingRegion || customer.shippingRegion || "Accra"})</td>
                <td style="padding: 25px 0 5px; text-align: right; font-weight: bold; color: #666;">₵${Number(orderData.shippingFee || customer.shippingFee || 0).toLocaleString()}</td>
              </tr>
              <tr>
                <td colspan="2" style="padding: 5px 0 30px; font-size: 22px; font-weight: 900; color: ${accent};">Total Amount</td>
                <td style="padding: 5px 0 30px; text-align: right; font-size: 22px; font-weight: 900; color: ${accent};">₵${Number(orderData.total || 0).toLocaleString()}</td>
              </tr>
            </table>

            <div style="background-color: ${primary}05; padding: 25px; border-radius: 20px; border: 1px solid ${primary}10;">
              <h3 style="margin: 0 0 12px; font-size: 10px; color: ${primary}; text-transform: uppercase; letter-spacing: 2px; font-weight: 900;">Shipping Destination</h3>
              <p style="margin: 0; font-size: 14px; font-weight: bold; color: #333;">${customer.name || ""}</p>
              <p style="margin: 4px 0 0; font-size: 13px; color: #666; line-height: 1.5;">${customer.address || ""}</p>
              <p style="margin: 10px 0 0; font-size: 12px; color: ${primary}; font-weight: bold; letter-spacing: 0.5px;">${customer.phone || ""}</p>
            </div>
          </div>

          <!-- Footer -->
          <div style="background-color: #fafafa; padding: 40px 30px; text-align: center; border-top: 1px solid #f0f0f0;">
            <p style="margin: 0 0 25px; font-size: 13px; color: #888; line-height: 1.6;">We'll notify you as your order moves through production and delivery. You can check live status anytime using the button below.</p>
            <a href="${trackingUrl}" style="display: inline-block; background-color: ${primary}; color: #ffffff; padding: 16px 35px; border-radius: 15px; text-decoration: none; font-weight: 900; font-size: 12px; letter-spacing: 2px; text-transform: uppercase; box-shadow: 0 10px 20px ${primary}30;">Track Order Status</a>
            <div style="margin-top: 40px; border-top: 1px solid #eee; padding-top: 20px;">
              <p style="margin: 0; font-size: 10px; color: #bbb; letter-spacing: 1px; font-weight: bold; text-transform: uppercase;">KenteHaul | Authentic Ghanaian Heritage</p>
            </div>
          </div>
        </div>
      </div>
    `;
}

/**
 * Triggered when a new order is created.
 * Sends the branded order-confirmation email and a WhatsApp/SMS notification.
 */
exports.onOrderCreated = functions.firestore
    .document("orders/{orderId}")
    .onCreate(async (snap, context) => {
        const orderId = context.params.orderId;
        const orderData = snap.data();
        const customer = orderData.customer;

        console.log(`New Order Found: ${orderId}`);

        // 1. Notify Admin (WhatsApp/Email)
        // In a real implementation, you would call a WhatsApp API (like Twilio or Hubtel) here.
        // Example: await twilio.messages.create({ ... })

        // 2. Notify Customer (SMS/WhatsApp)
        if (customer && customer.phone) {
            console.log(`Sending confirmation to customer: ${customer.phone}`);
            // await sendSMS(customer.phone, `KenteHaul: Order #${orderId} received! Track here: kentehaul.com/track/${orderId}`);
        }

        // 3. Email order confirmation (Brevo, via the Trigger Email extension)
        // Runs server-side so every order gets exactly one confirmation email,
        // including orders reconstructed from the Paystack webhook after a
        // client-side crash — the client no longer sends this itself.
        if (customer && customer.email) {
            try {
                const siteSnap = await db.collection("settings").doc("siteContent").get();
                const siteContent = siteSnap.exists ? siteSnap.data() : {};
                const html = buildOrderConfirmationEmail(orderId, orderData, siteContent);

                await db.collection("mail").add({
                    to: customer.email,
                    message: {
                        subject: `Order Confirmed - #${orderId}`,
                        html
                    }
                });
                console.log(`Queued confirmation email to ${customer.email} for order ${orderId}`);
            } catch (err) {
                console.error(`[EMAIL ERROR] Failed to queue confirmation for order ${orderId}:`, err);
            }
        } else {
            console.warn(`Order ${orderId} has no customer email — skipping confirmation email.`);
        }

        return null;
    });

/**
 * Triggered when an order status changes.
 * Sends a tracking update to the customer.
 */
exports.onOrderStatusChanged = functions.firestore
    .document("orders/{orderId}")
    .onUpdate(async (change, context) => {
        const after = change.after.data();
        const before = change.before.data();
        const orderId = context.params.orderId;

        if (after.status !== before.status) {
            console.log(`Order ${orderId} status changed to: ${after.status}`);

            // Notify Customer of Status Change
            if (after.customer && after.customer.phone) {
                const message = `KenteHaul Update: Your order #${orderId} is now ${after.status}. Track: kentehaul.com/track/${orderId}`;
                // await sendSMS(after.customer.phone, message);
            }

            // If Rider is assigned, notify the customer with rider details
            if (after.status === 'Rider Assigned' && after.rider) {
                const riderMsg = `KenteHaul: Rider ${after.rider.name} (${after.rider.phone}) has been assigned to your order #${orderId}.`;
                // await sendWhatsApp(after.customer.phone, riderMsg);
            }
        }

        return null;
    });
/**
 * Paystack Webhook Handler
 * Verifies and processes successful payments purely on the server side.
 * This ensures no orders are lost if the client browser crashes.
 */
exports.paystackWebhook = functions.https.onRequest(async (req, res) => {
    // 1. Signature Verification
    // Paystack sends a signature in the header. We must verify it to ensure the request is legit.
    let secret = functions.config().paystack?.secret || process.env.PAYSTACK_SECRET_KEY;
    
    // Fallback: Fetch from private firestore settings if not in config
    if (!secret) {
        const privateSnap = await db.collection("settings").doc("private").get();
        secret = privateSnap.data()?.paystackSecret;
    }

    // WARNING: Do not hardcode secrets. Key must be set in Firebase Config or settings/private doc.
    if (!secret) {
        console.error("[WEBHOOK] No Paystack Secret Key found. Verification failed.");
        return res.status(500).send("Server configuration error.");
    }

    const signature = req.headers["x-paystack-signature"];
    if (!signature) {
        console.warn("[WEBHOOK] Missing x-paystack-signature header.");
        return res.status(400).send("No signature.");
    }

    const hash = crypto.createHmac("sha512", secret).update(JSON.stringify(req.body)).digest("hex");

    if (hash !== signature) {
        console.error("[WEBHOOK] Invalid signature. Request may be fraudulent.");
        return res.status(401).send("Invalid signature.");
    }

    // 2. Event Handling
    const event = req.body;
    if (event.event !== "charge.success") {
        console.info(`[WEBHOOK] Received unhandled event type: ${event.event}`);
        return res.status(200).send("Event acknowledged.");
    }

    const data = event.data;
    const metadata = data.metadata || {};
    const orderId = metadata.orderId;
    const customer = metadata.customer || {};
    const items = metadata.items || [];
    const amountPaid = data.amount / 100; // converted from pesewas

    if (!orderId) {
        console.error("[WEBHOOK] Missing orderId in transaction metadata.");
        return res.status(400).send("Missing orderId.");
    }

    console.info(`[WEBHOOK] Processing successful payment for Order: ${orderId}`);

    try {
        const orderRef = db.collection("orders").doc(orderId);
        const orderSnap = await orderRef.get();

        // If order doesn't exist (client failed), reconstruct it from metadata
        if (!orderSnap.exists) {
            console.info(`[WEBHOOK] Order ${orderId} not found in DB. Reconstructing from metadata...`);
            
            const orderData = {
                id: orderId,
                date: new Date().toLocaleDateString(),
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
                status: "Payment Confirmed",
                paymentRef: data.reference,
                total: amountPaid,
                items: items,
                customer: customer
            };

            await orderRef.set(orderData);

            // Trigger CRM/Stock updates manually since the client didn't do it
            const batch = db.batch();
            
            // Update Customer CRM
            const phoneStr = String(customer.phone || "").replace(/[^0-9]/g, "");
            if (phoneStr) {
                const custRef = db.collection("customers").doc(phoneStr);
                batch.set(custRef, {
                    name: customer.name,
                    email: customer.email || "",
                    phone: customer.phone,
                    totalSpent: admin.firestore.FieldValue.increment(amountPaid),
                    lastOrder: admin.firestore.FieldValue.serverTimestamp(),
                    orderCount: admin.firestore.FieldValue.increment(1),
                    authenticated: customer.authenticated || false
                }, { merge: true });
            }

            // Update Stock
            for (const item of items) {
                if (item.id) {
                    batch.update(db.collection("products").doc(item.id), {
                        stockQuantity: admin.firestore.FieldValue.increment(-Number(item.quantity || 1))
                    });
                }
            }

            await batch.commit();
            console.info(`[WEBHOOK] Successfully created missing order ${orderId}`);
        } else {
            // If order already exists (client worked), just ensure it's confirmed
            console.info(`[WEBHOOK] Order ${orderId} already exists. Updating status...`);
            await orderRef.update({
                status: "Payment Confirmed",
                paymentRef: data.reference,
                confirmedAt: admin.firestore.FieldValue.serverTimestamp()
            });
        }

        return res.status(200).send("Webhook Processed Successfully.");
    } catch (err) {
        console.error(`[WEBHOOK ERROR] ${err.message}`);
        return res.status(500).send(`Internal Error: ${err.message}`);
    }
});
