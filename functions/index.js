const functions = require("firebase-functions");
const admin = require("firebase-admin");
const crypto = require("crypto");
const https = require("https");
admin.initializeApp();

const db = admin.firestore();

const SITE_URL = "https://kentehaul.com";
const ADMIN_NOTIFICATION_EMAIL = "kentehaul@gmail.com";
const ARKESEL_SENDER = "kentehaul";

/**
 * Send SMS via Arkesel v2 API.
 * apiKey comes from settings/private.arkeselApiKey (never client-visible).
 * recipients: array of E.164-ish phone strings.
 */
function arkeselSend(apiKey, recipients, message) {
    return new Promise((resolve, reject) => {
        const payload = JSON.stringify({
            sender: ARKESEL_SENDER,
            message,
            recipients: recipients.map(r => r.replace(/[^0-9+]/g, "")),
        });
        const req = https.request({
            hostname: "sms.arkesel.com",
            path: "/api/v2/sms/send",
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "api-key": apiKey,
            },
        }, (res) => {
            let raw = "";
            res.on("data", chunk => raw += chunk);
            res.on("end", () => {
                try { resolve({ status: res.statusCode, body: JSON.parse(raw) }); }
                catch { resolve({ status: res.statusCode, body: raw }); }
            });
        });
        req.on("error", reject);
        req.write(payload);
        req.end();
    });
}

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
 * Builds the internal "new order" notification sent to the store owner
 * (kentehaul@gmail.com) — order details, customer contact info, and items,
 * so the owner never has to check the admin panel to know a sale happened.
 */
function buildAdminOrderNotificationEmail(orderId, orderData, siteContent) {
    const customer = orderData.customer || {};
    const items = orderData.items || [];
    const primary = siteContent?.primaryColor || "#5b0143";
    const accent = siteContent?.secondaryColor || "#f97316";
    const logo = siteContent?.logo || null;
    const deliveryLabel = {
        seller_rider: "🛵 KenteHaul arranges rider",
        customer_rider: "🏍 Customer sends own rider",
        pickup: "🏪 Pickup from store",
    }[orderData.deliveryMethod || customer.deliveryMethod] || "Delivery";

    const itemsHtml = items.map((item) => `
      <tr style="border-bottom: 1px solid #f0f0f0;">
        <td style="padding: 14px 0; width: 72px; vertical-align: top;">
          ${item.image
            ? `<img src="${item.image}" alt="${item.name || "Product"}" width="60" height="60" style="width:60px;height:60px;object-fit:cover;border-radius:12px;display:block;border:1px solid #eee;" />`
            : `<div style="width:60px;height:60px;border-radius:12px;background:${primary}15;display:flex;align-items:center;justify-content:center;font-size:22px;">🧵</div>`}
        </td>
        <td style="padding: 14px 12px; vertical-align: top;">
          <div style="font-weight:900;color:#111;font-size:14px;margin-bottom:3px;">${item.name || "Item"}</div>
          <div style="font-size:12px;color:#888;">Qty: ${item.quantity || 1} × ₵${Number(item.price || 0).toLocaleString()}</div>
          ${item.isPreorder ? `<div style="margin-top:4px;font-size:11px;color:${accent};font-weight:900;background:${accent}15;display:inline-block;padding:2px 8px;border-radius:20px;">Pre-order ~${item.preorderDays || 14} days</div>` : ""}
        </td>
        <td style="padding: 14px 0; text-align: right; vertical-align: top; font-weight:900; font-size:14px; white-space:nowrap;">₵${(Number(item.price || 0) * Number(item.quantity || 1)).toLocaleString()}</td>
      </tr>
    `).join("");

    return `
      <div style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;background:#f5f5f5;padding:40px 20px;color:#333;">
        <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:24px;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,0.08);">

          <!-- Header -->
          <div style="background:${primary};padding:28px 32px;color:#fff;display:flex;align-items:center;justify-content:space-between;">
            <div>
              ${logo ? `<img src="${logo}" alt="KenteHaul" style="height:40px;margin-bottom:10px;display:block;" />` : `<div style="font-size:20px;font-weight:900;letter-spacing:3px;margin-bottom:8px;">KENTEHAUL</div>`}
              <div style="font-size:18px;font-weight:900;">🛍 New Order!</div>
              <div style="opacity:0.8;font-size:12px;margin-top:4px;">Order #${orderId} · ${new Date().toLocaleDateString("en-GH", { day:"numeric", month:"short", year:"numeric", hour:"2-digit", minute:"2-digit" })}</div>
            </div>
            <div style="background:${accent};border-radius:16px;padding:12px 18px;text-align:center;">
              <div style="font-size:22px;font-weight:900;color:#fff;">₵${Number(orderData.total || 0).toLocaleString()}</div>
              <div style="font-size:10px;color:#fff;opacity:0.9;text-transform:uppercase;letter-spacing:1px;">Total</div>
            </div>
          </div>

          <div style="padding:32px;">

            <!-- Customer block -->
            <div style="background:#f9f9f9;border-radius:16px;padding:20px 24px;margin-bottom:24px;border-left:4px solid ${primary};">
              <div style="font-size:10px;font-weight:900;color:#aaa;text-transform:uppercase;letter-spacing:2px;margin-bottom:10px;">Customer</div>
              <div style="font-size:16px;font-weight:900;color:#111;">${customer.name || "Unknown"}</div>
              ${customer.phone ? `<div style="margin-top:4px;"><a href="tel:${customer.phone}" style="font-size:13px;color:${primary};font-weight:bold;text-decoration:none;">📞 ${customer.phone}</a></div>` : ""}
              ${customer.email ? `<div style="margin-top:2px;"><a href="mailto:${customer.email}" style="font-size:13px;color:#666;text-decoration:none;">✉ ${customer.email}</a></div>` : ""}
              ${customer.address ? `<div style="margin-top:6px;font-size:13px;color:#555;">📍 ${customer.address}${customer.landmark ? ` (near ${customer.landmark})` : ""}</div>` : ""}
              <div style="margin-top:8px;font-size:12px;color:${accent};font-weight:900;">${deliveryLabel} · ${orderData.shippingRegion || customer.shippingRegion || "Accra"}</div>
              ${customer.riderName ? `<div style="margin-top:4px;font-size:12px;color:#888;">Rider: ${customer.riderName} ${customer.riderPhone ? `(${customer.riderPhone})` : ""}</div>` : ""}
            </div>

            <!-- Items -->
            <div style="font-size:10px;font-weight:900;color:#aaa;text-transform:uppercase;letter-spacing:2px;margin-bottom:12px;">Items Ordered</div>
            <table style="width:100%;border-collapse:collapse;">
              ${itemsHtml}
              <tr>
                <td colspan="2" style="padding:16px 0 4px;font-size:12px;color:#aaa;border-top:2px solid #f0f0f0;">Shipping (${orderData.shippingRegion || customer.shippingRegion || "Accra"})</td>
                <td style="padding:16px 0 4px;text-align:right;font-size:12px;color:#aaa;border-top:2px solid #f0f0f0;">₵${Number(orderData.shippingFee || customer.shippingFee || 0).toLocaleString()}</td>
              </tr>
              <tr>
                <td colspan="2" style="padding:8px 0;font-size:18px;font-weight:900;color:#111;">Total Payable</td>
                <td style="padding:8px 0;text-align:right;font-size:20px;font-weight:900;color:${accent};">₵${Number(orderData.total || 0).toLocaleString()}</td>
              </tr>
            </table>

            <!-- CTA -->
            <div style="text-align:center;margin-top:32px;">
              <a href="${SITE_URL}/admin" style="display:inline-block;background:${primary};color:#fff;padding:16px 40px;border-radius:14px;text-decoration:none;font-weight:900;font-size:13px;letter-spacing:2px;text-transform:uppercase;box-shadow:0 10px 30px ${primary}40;">
                Fulfil This Order →
              </a>
              <div style="margin-top:12px;font-size:11px;color:#bbb;">Open Orders → search <strong>#${orderId}</strong></div>
            </div>
          </div>
        </div>
      </div>
    `;
}

/**
 * Triggered when a new order is created.
 * Sends the branded order-confirmation email to the customer, a "new order"
 * notification email to the store owner, and (placeholder) a WhatsApp/SMS
 * notification.
 */
exports.onOrderCreated = functions.firestore
    .document("orders/{orderId}")
    .onCreate(async (snap, context) => {
        const orderId = context.params.orderId;
        const orderData = snap.data();
        const customer = orderData.customer;

        console.log(`New Order Found: ${orderId}`);

        // SMS via Arkesel — customer + admin
        const privateSnap = await db.collection("settings").doc("private").get();
        const privateData = privateSnap.exists ? privateSnap.data() : {};
        const arkeselKey = privateData.arkeselApiKey || null;

        if (arkeselKey) {
            const adminPhone = privateData.adminPhone || null;
            const customerMsg = `KenteHaul: Hi ${(customer && customer.name) ? customer.name.split(" ")[0] : "there"}! Your order #${orderId} (₵${Number(orderData.total || 0).toLocaleString()}) is confirmed. Track it here: ${SITE_URL}/track/${orderId}`;
            const adminMsg = `NEW ORDER #${orderId} | ₵${Number(orderData.total || 0).toLocaleString()} | ${(customer && customer.name) || "Unknown"} | ${(customer && customer.phone) || ""} | ${SITE_URL}/admin`;
            const smsTargets = [];
            if (customer && customer.phone) smsTargets.push({ phone: customer.phone, msg: customerMsg });
            if (adminPhone) smsTargets.push({ phone: adminPhone, msg: adminMsg });
            for (const t of smsTargets) {
                try {
                    const r = await arkeselSend(arkeselKey, [t.phone], t.msg);
                    console.log(`Arkesel SMS to ${t.phone}: status ${r.status}`);
                } catch (err) {
                    console.error(`Arkesel SMS error to ${t.phone}:`, err.message);
                }
            }
        } else {
            console.log("Arkesel key not configured — skipping SMS.");
        }

        // Both emails below go through the same "Trigger Email from Firestore"
        // extension (the `mail` collection), configured to send via Brevo SMTP —
        // this function only needs to write the documents, not talk to Brevo itself.
        const siteSnap = await db.collection("settings").doc("siteContent").get();
        const siteContent = siteSnap.exists ? siteSnap.data() : {};

        // Email order confirmation to the customer. Runs server-side so every
        // order gets exactly one confirmation email, including orders
        // reconstructed from the Paystack webhook after a client-side crash —
        // the client no longer sends this itself.
        if (customer && customer.email) {
            try {
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
                console.error(`[EMAIL ERROR] Failed to queue customer confirmation for order ${orderId}:`, err);
            }
        } else {
            console.warn(`Order ${orderId} has no customer email — skipping customer confirmation email.`);
        }

        // Notify the store owner that a new order came in.
        try {
            const adminHtml = buildAdminOrderNotificationEmail(orderId, orderData, siteContent);
            await db.collection("mail").add({
                to: ADMIN_NOTIFICATION_EMAIL,
                message: {
                    subject: `New Order - #${orderId} (₵${Number(orderData.total || 0).toLocaleString()})`,
                    html: adminHtml
                }
            });
            console.log(`Queued admin notification for order ${orderId}`);
        } catch (err) {
            console.error(`[EMAIL ERROR] Failed to queue admin notification for order ${orderId}:`, err);
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

            const customer = after.customer || {};
            const NOTIFY_STATUSES = ["Rider Assigned", "Out for Delivery", "Delivered", "Processing"];

            if (NOTIFY_STATUSES.includes(after.status)) {
                const [siteSnap, privSnap] = await Promise.all([
                    db.collection("settings").doc("siteContent").get(),
                    db.collection("settings").doc("private").get(),
                ]);
                const siteContent = siteSnap.exists ? siteSnap.data() : {};
                const privData = privSnap.exists ? privSnap.data() : {};
                const arkeselKey = privData.arkeselApiKey || null;

                // SMS update to customer
                if (arkeselKey && customer.phone) {
                    let smsText = `KenteHaul: Order #${orderId} is now "${after.status}". Track: ${SITE_URL}/track/${orderId}`;
                    if (after.status === "Rider Assigned") {
                        const rider = after.rider || after.delivery || {};
                        smsText = rider.name
                            ? `KenteHaul: Rider ${rider.name}${rider.phone ? ` (${rider.phone})` : ""} is on the way for order #${orderId}. Track: ${SITE_URL}/track/${orderId}`
                            : `KenteHaul: A rider has been assigned for order #${orderId}. Track: ${SITE_URL}/track/${orderId}`;
                    } else if (after.status === "Delivered") {
                        smsText = `KenteHaul: Order #${orderId} delivered! We hope you love your kente. Thank you! 🎉`;
                    }
                    try {
                        await arkeselSend(arkeselKey, [customer.phone], smsText);
                    } catch (err) {
                        console.error(`Arkesel SMS error (status change) to ${customer.phone}:`, err.message);
                    }
                }

                if (customer.email) {
                const primary = siteContent.primaryColor || "#5b0143";
                const accent = siteContent.secondaryColor || "#f97316";
                const logo = siteContent.logo || null;
                const trackingUrl = `${SITE_URL}/track/${orderId}`;

                let statusNote = "";
                let emoji = "📦";
                if (after.status === "Rider Assigned") {
                    emoji = "🛵";
                    const rider = after.rider || after.delivery || {};
                    statusNote = rider.name
                        ? `<p style="font-size:14px;color:#333;margin:16px 0;">Your rider <strong>${rider.name}</strong> has been assigned and will be picking up your order soon.</p>${rider.phone ? `<p style="font-size:13px;color:#666;">Rider phone: <a href="tel:${rider.phone}" style="color:${primary};font-weight:bold;">${rider.phone}</a></p>` : ""}`
                        : `<p style="font-size:14px;color:#333;margin:16px 0;">A rider has been assigned to your order and will deliver soon.</p>`;
                } else if (after.status === "Out for Delivery") {
                    emoji = "🚀";
                    statusNote = `<p style="font-size:14px;color:#333;margin:16px 0;">Your order is now <strong>out for delivery</strong>. Expect it shortly!</p>`;
                } else if (after.status === "Delivered") {
                    emoji = "✅";
                    statusNote = `<p style="font-size:14px;color:#333;margin:16px 0;">Your order has been <strong>delivered</strong>! We hope you love your kente pieces. Thank you for choosing KenteHaul.</p>`;
                } else if (after.status === "Processing") {
                    emoji = "🧵";
                    statusNote = `<p style="font-size:14px;color:#333;margin:16px 0;">Our master weavers are now working on your order. We'll notify you once it's ready for delivery.</p>`;
                }

                const html = `
                  <div style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;background-color:#f9f9f9;padding:40px 20px;color:#333;">
                    <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:30px;overflow:hidden;box-shadow:0 20px 40px rgba(0,0,0,0.05);">
                      <div style="background-color:${primary};padding:40px 30px;text-align:center;color:#fff;">
                        ${logo ? `<img src="${logo}" alt="KenteHaul" style="height:48px;margin-bottom:16px;" />` : `<h1 style="margin:0 0 4px;font-size:26px;letter-spacing:4px;font-weight:900;text-transform:uppercase;">KenteHaul</h1>`}
                        <p style="margin:0;opacity:0.85;font-size:13px;font-weight:300;text-transform:uppercase;letter-spacing:2px;">${emoji} Order Update</p>
                      </div>
                      <div style="padding:40px 30px;">
                        <h2 style="margin:0 0 8px;font-size:20px;color:${primary};font-weight:900;">Order #${orderId}</h2>
                        <div style="display:inline-block;background:${accent}15;border:1px solid ${accent}30;border-radius:12px;padding:8px 18px;margin:12px 0;">
                          <span style="font-size:13px;font-weight:900;color:${accent};">${after.status}</span>
                        </div>
                        <p style="font-size:14px;color:#333;margin:12px 0;">Hi ${customer.name || "there"},</p>
                        ${statusNote}
                        <div style="margin:30px 0;text-align:center;">
                          <a href="${trackingUrl}" style="display:inline-block;background:${primary};color:#fff;padding:16px 35px;border-radius:15px;text-decoration:none;font-weight:900;font-size:12px;letter-spacing:2px;text-transform:uppercase;">Track Your Order</a>
                        </div>
                      </div>
                      <div style="background:#fafafa;padding:30px;text-align:center;border-top:1px solid #f0f0f0;">
                        <p style="margin:0;font-size:10px;color:#bbb;letter-spacing:1px;font-weight:bold;text-transform:uppercase;">KenteHaul | Authentic Ghanaian Heritage</p>
                      </div>
                    </div>
                  </div>
                `;

                await db.collection("mail").add({
                    to: [customer.email],
                    message: {
                        subject: `${emoji} Order Update — ${after.status} | #${orderId}`,
                        html,
                    },
                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                });
                console.log(`Status update email sent to ${customer.email} for status: ${after.status}`);
                } // end if customer.email
            } // end if NOTIFY_STATUSES
        } // end if status changed

        return null;
    });
// ──────────────────────────────────────────────────────────
// KWIK DELIVERY INTEGRATION
// Docs: https://app.kwikdelivery.com/docs  (update path/payload to match your account)
// Admin must set kwikApiKey in Firestore settings/private
// and workshopAddress in settings/siteContent
// ──────────────────────────────────────────────────────────

function kwikRequest(path, apiKey, body) {
    return new Promise((resolve, reject) => {
        const payload = JSON.stringify(body);
        const req = https.request({
            hostname: "app.kwikdelivery.com",
            path,
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json",
                "Authorization": `Bearer ${apiKey}`
            }
        }, (res) => {
            let raw = "";
            res.on("data", chunk => raw += chunk);
            res.on("end", () => {
                try { resolve({ status: res.statusCode, body: JSON.parse(raw) }); }
                catch { resolve({ status: res.statusCode, body: raw }); }
            });
        });
        req.on("error", reject);
        req.write(payload);
        req.end();
    });
}

/**
 * bookKwikDelivery — Admin callable.
 * Fetches a delivery quote from Kwik for an order.
 * Returns { quoteId, price, eta, pickupAddress, dropoffAddress }
 */
exports.bookKwikDelivery = functions.https.onCall(async (data, context) => {
    if (!context.auth || context.auth.token.email !== "admin@kentehaul.com") {
        throw new functions.https.HttpsError("permission-denied", "Admin only.");
    }

    const { orderId } = data;
    if (!orderId) throw new functions.https.HttpsError("invalid-argument", "orderId required.");

    const [orderSnap, contentSnap, privateSnap] = await Promise.all([
        admin.firestore().collection("orders").doc(orderId).get(),
        admin.firestore().collection("settings").doc("siteContent").get(),
        admin.firestore().collection("settings").doc("private").get()
    ]);

    if (!orderSnap.exists) throw new functions.https.HttpsError("not-found", "Order not found.");

    const order = orderSnap.data();
    const siteContent = contentSnap.data() || {};
    const privateSettings = privateSnap.data() || {};

    const kwikApiKey = privateSettings.kwikApiKey;
    if (!kwikApiKey) {
        throw new functions.https.HttpsError("failed-precondition", "Kwik API key not configured. Go to Settings → Integrations and add your Kwik API key.");
    }

    const workshopAddress = siteContent.workshopAddress;
    if (!workshopAddress) {
        throw new functions.https.HttpsError("failed-precondition", "Workshop address not configured. Go to Settings → Logistics and add your Workshop Address.");
    }

    const customer = order.customer || {};
    const dropoffAddress = [customer.landmark, customer.address, "Accra", "Ghana"].filter(Boolean).join(", ");

    const res = await kwikRequest("/api/v1/delivery/quote", kwikApiKey, {
        pickup_address: workshopAddress,
        dropoff_address: dropoffAddress,
        dropoff_name: customer.name || "",
        dropoff_phone: customer.phone || "",
        package_description: `KenteHaul Order #${orderId} — ${(order.items || []).length} item(s)`,
        package_weight: 2
    });

    console.log(`[KWIK QUOTE] Order ${orderId}, status ${res.status}:`, JSON.stringify(res.body));

    if (res.status !== 200 && res.status !== 201) {
        throw new functions.https.HttpsError("internal", `Kwik API error ${res.status}: ${JSON.stringify(res.body)}`);
    }

    const result = res.body?.data || res.body;
    return {
        quoteId:         result.id        || result.quote_id  || "",
        price:           result.price     || result.amount    || 0,
        eta:             result.estimated_time || result.eta  || "30–45 min",
        pickupAddress:   workshopAddress,
        dropoffAddress
    };
});

/**
 * confirmKwikDelivery — Admin callable.
 * Confirms a Kwik quote and dispatches a rider.
 * Writes delivery object to order doc, sets status → "Rider Assigned".
 * Returns { bookingRef, trackingUrl, riderName, riderPhone }
 */
exports.confirmKwikDelivery = functions.https.onCall(async (data, context) => {
    if (!context.auth || context.auth.token.email !== "admin@kentehaul.com") {
        throw new functions.https.HttpsError("permission-denied", "Admin only.");
    }

    const { orderId, quoteId } = data;
    if (!orderId || !quoteId) {
        throw new functions.https.HttpsError("invalid-argument", "orderId and quoteId are required.");
    }

    const [orderSnap, contentSnap, privateSnap] = await Promise.all([
        admin.firestore().collection("orders").doc(orderId).get(),
        admin.firestore().collection("settings").doc("siteContent").get(),
        admin.firestore().collection("settings").doc("private").get()
    ]);

    if (!orderSnap.exists) throw new functions.https.HttpsError("not-found", "Order not found.");

    const order = orderSnap.data();
    const siteContent = contentSnap.data() || {};
    const kwikApiKey = (privateSnap.data() || {}).kwikApiKey;
    if (!kwikApiKey) throw new functions.https.HttpsError("failed-precondition", "Kwik API key not configured.");

    const customer = order.customer || {};
    const dropoffAddress = [customer.landmark, customer.address, "Accra", "Ghana"].filter(Boolean).join(", ");

    const res = await kwikRequest("/api/v1/delivery/create", kwikApiKey, {
        quote_id:          quoteId,
        pickup_address:    siteContent.workshopAddress || "",
        dropoff_address:   dropoffAddress,
        dropoff_name:      customer.name  || "",
        dropoff_phone:     customer.phone || "",
        package_description: `KenteHaul Order #${orderId}`,
        package_weight:    2
    });

    console.log(`[KWIK CREATE] Order ${orderId}, status ${res.status}:`, JSON.stringify(res.body));

    if (res.status !== 200 && res.status !== 201) {
        throw new functions.https.HttpsError("internal", `Kwik booking failed ${res.status}: ${JSON.stringify(res.body)}`);
    }

    const result  = res.body?.data || res.body;
    const ref     = result.tracking_number || result.id        || `KW-${Date.now()}`;
    const url     = result.tracking_url    || `https://app.kwikdelivery.com/track/${ref}`;
    const rider   = result.rider           || {};
    const riderName  = rider.name  || "Kwik Rider";
    const riderPhone = rider.phone || "";
    const price      = result.price || result.amount || 0;
    const eta        = result.estimated_time || result.eta || "30–45 min";

    await admin.firestore().collection("orders").doc(orderId).update({
        delivery: {
            provider:    "kwik",
            bookingRef:  ref,
            trackingUrl: url,
            riderName,
            riderPhone,
            price,
            eta,
            bookedAt: admin.firestore.FieldValue.serverTimestamp()
        },
        rider: {
            name:    riderName,
            phone:   riderPhone,
            vehicle: "Motorbike",
            plate:   "",
            company: "Kwik Delivery"
        },
        status: "Rider Assigned"
    });

    return { bookingRef: ref, trackingUrl: url, riderName, riderPhone, price, eta };
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
