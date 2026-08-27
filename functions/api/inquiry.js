/**
 * Inquiry API Endpoint - Cloudflare Pages Function
 * 
 * Handles contact form submissions and sends email notifications
 * using Brevo (SendinBlue) Transactional Email API.
 * 
 * Environment Variables (set in Cloudflare Dashboard or wrangler.toml):
 * - BREVO_API: Your Brevo API key
 * - CONTACT_EMAIL: Destination email for inquiries
 * - SENDER_EMAIL: "From" address used to send via Brevo (must be a
 *   verified sender in your Brevo account). Falls back to CONTACT_EMAIL,
 *   then to gaumatosewa@gmail.com if unset.
 * - SITE_NAME: Site name used in email headers
 */

import { corsHeaders as buildCorsHeaders } from '../_lib/cors.js';

export async function onRequestPost(context) {
    // CORS headers for cross-origin requests
    const corsHeaders = {
        ...buildCorsHeaders(context.request, context.env, {
            methods: 'POST, OPTIONS',
            headers: 'Content-Type',
        }),
        'Content-Type': 'application/json'
    };

    try {
        // Handle CORS preflight
        if (context.request.method === 'OPTIONS') {
            return new Response(null, { status: 204, headers: corsHeaders });
        }

        // Parse form data
        const body = await context.request.json();
        const { name, email, phone, subject, message } = body;

        // Validate required fields
        if (!name || !email || !subject || !message) {
            return new Response(
                JSON.stringify({ 
                    success: false, 
                    error: 'Missing required fields: name, email, subject, and message are required.' 
                }),
                { status: 400, headers: corsHeaders }
            );
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return new Response(
                JSON.stringify({ 
                    success: false, 
                    error: 'Invalid email format.' 
                }),
                { status: 400, headers: corsHeaders }
            );
        }

        // Get configuration from environment
        const brevoApiKey = context.env.BREVO_API;
        const toEmail = context.env.CONTACT_EMAIL;
        const senderEmail = context.env.SENDER_EMAIL || context.env.CONTACT_EMAIL;
        const siteName = context.env.SITE_NAME;

        if (!brevoApiKey) {
            console.error('BREVO_API environment variable not set');
            return new Response(
                JSON.stringify({ 
                    success: false, 
                    error: 'Email service not configured. Please contact administrator.',
                    debug: 'BREVO_API env var missing'
                }),
                { status: 500, headers: corsHeaders }
            );
        }

        // Prepare email content
        const emailSubject = `New Inquiry: ${subject}`;
        const emailHtml = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; background-color: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #059669, #047857); color: white; padding: 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; }
        .header p { margin: 10px 0 0; opacity: 0.9; font-size: 14px; }
        .content { padding: 30px; }
        .field { margin-bottom: 20px; }
        .field-label { font-weight: 600; color: #059669; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px; }
        .field-value { background: #f9fafb; padding: 15px; border-radius: 8px; font-size: 15px; border-left: 3px solid #059669; }
        .message-field { background: #f0fdf4; border-left: 4px solid #059669; }
        .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 13px; }
        .badge { display: inline-block; background: #dcfce7; color: #065f46; padding: 6px 16px; border-radius: 20px; font-size: 12px; font-weight: 500; margin-bottom: 20px; }
        a { color: #059669; text-decoration: none; }
        a:hover { text-decoration: underline; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📬 New Customer Inquiry</h1>
            <p>A new inquiry has been received from your website</p>
        </div>
        <div class="content">
            <div style="text-align: center;">
                <span class="badge">${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
            
            <div class="field">
                <div class="field-label">👤 Customer Name</div>
                <div class="field-value">${escapeHtml(name)}</div>
            </div>
            
            <div class="field">
                <div class="field-label">📧 Email Address</div>
                <div class="field-value"><a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></div>
            </div>
            
            ${phone ? `
            <div class="field">
                <div class="field-label">📱 Phone Number</div>
                <div class="field-value">${escapeHtml(phone)}</div>
            </div>
            ` : ''}
            
            <div class="field">
                <div class="field-label">📌 Subject</div>
                <div class="field-value">${escapeHtml(subject)}</div>
            </div>
            
            <div class="field">
                <div class="field-label">💬 Message</div>
                <div class="field-value message-field">${escapeHtml(message).replace(/\n/g, '<br>')}</div>
            </div>
            
            <div class="footer">
                <p>This inquiry was submitted through the <strong>${escapeHtml(siteName)}</strong> website contact form.</p>
                <p style="margin-top: 10px;">Please respond to the customer at their email address above.</p>
            </div>
        </div>
    </div>
</body>
</html>`;

        const emailText = `
NEW INQUIRY FROM ${siteName.toUpperCase()} WEBSITE
==========================================

Date: ${new Date().toLocaleString()}

CUSTOMER INFORMATION
---------------------
Name: ${name}
Email: ${email}
${phone ? `Phone: ${phone}` : ''}

INQUIRY DETAILS
----------------
Subject: ${subject}

Message:
${message}

==========================================
Please respond to this inquiry at the customer's email address above.
`.trim();

        // Send email via Brevo API - Using VERIFIED sender from Brevo account
        const brevoResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'api-key': brevoApiKey
            },
            body: JSON.stringify({
                sender: {
                    name: `${siteName} Website`,
                    email: senderEmail // MUST match a verified sender in your Brevo account
                },
                to: [{ email: toEmail, name: `${siteName} Team` }],
                replyTo: { email: email, name: name },
                subject: emailSubject,
                htmlContent: emailHtml,
                textContent: emailText,
                headers: {
                    'X-Mailer': `${siteName} Contact Form`,
                    'X-Priority': '3',
                    'Inquiry-Source': 'Website Contact Form'
                },
                tags: ['inquiry', 'contact-form', 'website']
            })
        });

        const brevoData = await brevoResponse.json();
        console.log('Brevo API Response:', JSON.stringify(brevoData));

        if (!brevoResponse.ok) {
            // Provide detailed error message for debugging
            let errorMessage = 'Failed to send email.';
            
            if (brevoData.code === 'invalid_parameter' && brevoData.message?.includes('sender')) {
                errorMessage = 'Email sender configuration issue. Please verify your Brevo sender domain.';
            } else if (brevoData.code === 'unauthorized') {
                errorMessage = 'Invalid API key. Check BREVO_API configuration.';
            } else if (brevoData.code === 'too_many_requests') {
                errorMessage = 'Too many requests. Please wait a moment and try again.';
            } else if (brevoData.message) {
                errorMessage += ` ${brevoData.message}`;
            }

            console.error('Brevo API Error:', JSON.stringify(brevoData));
            return new Response(
                JSON.stringify({ 
                    success: false, 
                    error: errorMessage,
                    details: brevoData.message || 'Unknown error',
                    code: brevoData.code || 'UNKNOWN'
                }),
                { status: 502, headers: corsHeaders }
            );
        }

        // Log successful submission
        console.log(`Inquiry sent successfully from ${email} - Message ID: ${brevoData.messageId}`);

        // Return success response
        return new Response(
            JSON.stringify({ 
                success: true, 
                message: 'Your inquiry has been sent successfully! We will get back to you soon.',
                messageId: brevoData.messageId
            }),
            { status: 200, headers: corsHeaders }
        );

    } catch (error) {
        console.error('Inquiry submission error:', error);
        
        return new Response(
            JSON.stringify({ 
                success: false, 
                error: 'An unexpected error occurred. Please try again or contact us directly.',
                details: error.message 
            }),
            { status: 500, headers: corsHeaders }
        );
    }
}

/**
 * Helper function to escape HTML special characters
 * Prevents XSS attacks in email content
 */
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}
