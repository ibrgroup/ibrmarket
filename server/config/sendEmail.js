import { sendEmail } from "./emailService.js";

/**
 * Email sending wrapper with environment-based disabling
 *
 * TODO: Email sending temporarily disabled for development
 * Set DISABLE_EMAIL=false in production when SMTP is configured
 *
 * @param {Object} options - Email options
 * @param {string} options.sendTo - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.text - Plain text content
 * @param {string} options.html - HTML content
 * @returns {Promise<boolean>} true if sent (or skipped), false on error
 */
const sendEmailFun=async({sendTo, subject, text, html})=>{
  // TODO: Email sending temporarily disabled
  // Remove this check when SMTP is configured and ready for production
  if (process.env.DISABLE_EMAIL === 'true') {
    console.log('📧 [Email] DISABLED - Would send to:', sendTo, 'Subject:', subject);
    console.log('💡 [Email] Set DISABLE_EMAIL=false to enable email sending');
    return true; // Return success to not break flow
  }

  console.log(sendTo)
    const result = await sendEmail(sendTo, subject, text, html);
    if (result.success) {
        return true;
      //res.status(200).json({ message: 'Email sent successfully', messageId: result.messageId });
    } else {
        return false;
     // res.status(500).json({ message: 'Failed to send email', error: result.error });
    }
}


export default sendEmailFun;