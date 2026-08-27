/**
 * inquiry.js - Inquiry Form Handler
 * 
 * Sends contact form data to the serverless API endpoint which
 * automatically sends an email notification via Brevo (SendinBlue).
 * 
 * Features:
 * - Client-side validation
 * - Loading state management
 * - Success/error feedback with Toast notifications
 * - Automatic form reset on success
 */

const Inquiry = {
    // Track submission state to prevent double submissions
    _isSubmitting: false,

    /**
     * Main submit handler - called from form onsubmit
     * @param {Event} evt - Form submit event
     */
    async submit(evt) {
        evt.preventDefault();

        // Prevent double submissions
        if (this._isSubmitting) {
            Toast.show('Please wait, your inquiry is being processed...');
            return;
        }

        // Gather form data
        const name = document.getElementById('inquiryName').value.trim();
        const email = document.getElementById('inquiryEmail').value.trim();
        const phone = document.getElementById('inquiryPhone').value.trim();
        const subject = document.getElementById('inquirySubject').value.trim();
        const message = document.getElementById('inquiryMessage').value.trim();

        // Client-side validation
        if (!this._validateForm(name, email, subject, message)) {
            return;
        }

        // Set loading state
        this._setLoadingState(true);

        try {
            // Send data to API endpoint
            const response = await this._sendToAPI({
                name,
                email,
                phone,
                subject,
                message
            });

            const result = await response.json();

            if (response.ok && result.success) {
                // Success!
                Toast.show('✅ ' + (result.message || 'Your inquiry has been sent successfully!'));
                document.getElementById('inquiryForm').reset();
                
                // Optional: Scroll to top of form for better UX
                document.getElementById('inquiryForm').scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'start' 
                });
            } else {
                // API returned an error
                Toast.show('❌ ' + (result.error || 'Failed to send inquiry. Please try again.'));
                console.error('Inquiry API Error:', result);
            }

        } catch (error) {
            // Network or other error
            console.error('Inquiry submission failed:', error);
            
            // Fallback: Offer mailto option if API fails
            this._offerMailtoFallback(name, email, phone, subject, message);
            
        } finally {
            // Reset loading state
            this._setLoadingState(false);
        }
    },

    /**
     * Validate form fields before submission
     * @returns {boolean} True if valid
     */
    _validateForm(name, email, subject, message) {
        // Check required fields
        if (!name || !email || !subject || !message) {
            Toast.show('⚠️ Please fill in all required fields.');
            this._highlightEmptyFields();
            return false;
        }

        // Email format validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            Toast.show('⚠️ Please enter a valid email address.');
            document.getElementById('inquiryEmail').focus();
            return false;
        }

        // Minimum message length
        if (message.length < 10) {
            Toast.show('⚠️ Please provide a more detailed message (at least 10 characters).');
            document.getElementById('inquiryMessage').focus();
            return false;
        }

        return true;
    },

    /**
     * Send form data to the serverless API
     * @param {Object} data - Form data object
     * @returns {Promise<Response>} Fetch response
     */
    async _sendToAPI(data) {
        const apiUrl = '/api/inquiry';
        
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });

        return response;
    },

    /**
     * Set loading state on the form
     * @param {boolean} isLoading - Loading state
     */
    _setLoadingState(isLoading) {
        this._isSubmitting = isLoading;
        
        const form = document.getElementById('inquiryForm');
        const button = form.querySelector('button[type="submit"]');
        const inputs = form.querySelectorAll('input, textarea');

        if (isLoading) {
            // Disable form elements
            button.disabled = true;
            button.innerHTML = `
                <span class="inline-flex items-center">
                    <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Sending...
                </span>
            `;
            button.classList.add('opacity-75', 'cursor-not-allowed');
            
            inputs.forEach(input => input.disabled = true);
            
        } else {
            // Re-enable form elements
            button.disabled = false;
            button.innerHTML = 'Send Inquiry';
            button.classList.remove('opacity-75', 'cursor-not-allowed');
            
            inputs.forEach(input => input.disabled = false);
        }
    },

    /**
     * Highlight empty required fields
     */
    _highlightEmptyFields() {
        const requiredFields = [
            { id: 'inquiryName', label: 'Name' },
            { id: 'inquiryEmail', label: 'Email' },
            { id: 'inquirySubject', label: 'Subject' },
            { id: 'inquiryMessage', label: 'Message' }
        ];

        requiredFields.forEach(field => {
            const element = document.getElementById(field.id);
            if (!element.value.trim()) {
                element.classList.add('border-red-400', 'bg-red-50');
                
                // Remove highlight after 3 seconds
                setTimeout(() => {
                    element.classList.remove('border-red-400', 'bg-red-50');
                }, 3000);
            }
        });

        // Focus first empty field
        const firstEmpty = requiredFields.find(f => !document.getElementById(f.id).value.trim());
        if (firstEmpty) {
            document.getElementById(firstEmpty.id).focus();
        }
    },

    /**
     * Fallback to mailto if API fails
     * Provides graceful degradation
     */
    _offerMailtoFallback(name, email, phone, subject, message) {
        const toEmail = (SiteConfig?.contact?.email) || 'gaumatosewa@gmail.com';

        const bodyLines = [
            `Name: ${name}`,
            `Email: ${email}`,
            phone ? `Phone: ${phone}` : null,
            '',
            message,
            '',
            '---',
            '(This inquiry was sent via fallback due to a technical issue)'
        ].filter(Boolean);

        const mailtoUrl =
            `mailto:${encodeURIComponent(toEmail)}` +
            `?subject=${encodeURIComponent('Inquiry: ' + subject)}` +
            `&body=${encodeURIComponent(bodyLines.join('\n'))}`;

        // Show error with option to use email client
        if (confirm(
            'Unable to send directly. Would you like to open your email app instead?\n\n' +
            'Click OK to open your email client, or Cancel to try again.'
        )) {
            window.location.href = mailtoUrl;
        } else {
            Toast.show('You can try sending again or email us directly at ' + toEmail);
        }
    }
};
