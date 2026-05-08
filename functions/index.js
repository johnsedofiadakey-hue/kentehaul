const functions = require("firebase-functions");
const admin = require("firebase-admin");
const crypto = require("crypto");
admin.initializeApp();

const db = admin.firestore();

/**
 * Triggered when a new order is created.
 * Sends a WhatsApp/SMS notification to the owner and the customer.
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
