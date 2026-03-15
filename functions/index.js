const functions = require("firebase-functions");
const admin = require("firebase-admin");
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
