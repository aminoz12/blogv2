import nodemailer from 'nodemailer';

// SMTP Configuration
const SMTP_CONFIG = {
  host: 'smtp-pulse.com',
  port: 587, // TLS
  secure: false, // true for 465 (SSL), false for other ports
  auth: {
    user: 'alicia@mad2moi.com',
    pass: 'AliciaStar25'
  },
  tls: {
    rejectUnauthorized: false // Accept self-signed certificates
  }
};

// Create transporter
let transporter;

function createTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport(SMTP_CONFIG);
  }
  return transporter;
}

// Send email function
export async function sendEmail(options) {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: `"Blog Admin" <${SMTP_CONFIG.auth.user}>`,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('📧 Email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending email:', error);
    return { success: false, error: error.message };
  }
}

// Send contact form email
export async function sendContactEmail(name, email, phone, subject, message) {
  try {
    // Handle case where name might be "Anonymous"
    const displayName = name && name !== 'Anonymous' ? name : 'Utilisateur anonyme';
    
    // Build HTML content with optional phone number
    let contactInfo = `
      <p><strong>Nom:</strong> ${displayName}</p>
      <p><strong>Email:</strong> ${email}</p>
    `;
    
    if (phone && phone.trim() !== '') {
      contactInfo += `<p><strong>Téléphone:</strong> ${phone}</p>`;
    }
    
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Nouveau message de contact</h2>
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px;">
          ${contactInfo}
          <p><strong>Sujet:</strong> ${subject}</p>
          <p><strong>Message:</strong></p>
          <div style="background-color: white; padding: 15px; border-left: 4px solid #007bff;">
            ${message.replace(/\n/g, '<br>')}
          </div>
        </div>
        <p style="color: #666; font-size: 12px; margin-top: 20px;">
          Ce message a été envoyé depuis le formulaire de contact de votre blog.
        </p>
      </div>
    `;

    // Build text content with optional phone number
    let textContactInfo = `
      Nom: ${displayName}
      Email: ${email}
    `;
    
    if (phone && phone.trim() !== '') {
      textContactInfo += `Téléphone: ${phone}\n`;
    }
    
    const textContent = `
      Nouveau message de contact
      
      ${textContactInfo}
      Sujet: ${subject}
      
      Message:
      ${message}
    `;

    return await sendEmail({
      to: SMTP_CONFIG.auth.user, // Send to admin email
      subject: `Contact Blog: ${subject}`,
      text: textContent,
      html: htmlContent
    });
  } catch (error) {
    console.error('❌ Error sending contact email:', error);
    return { success: false, error: error.message };
  }
}

// Send newsletter subscription confirmation
export async function sendNewsletterConfirmation(subscriberEmail, subscriberName) {
  try {
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Confirmation d'abonnement</h2>
        <p>Bonjour ${subscriberName || 'Cher lecteur'},</p>
        <p>Merci de vous être abonné à notre newsletter !</p>
        <p>Votre email (${subscriberEmail}) a été ajouté à notre liste de diffusion.</p>
        <p>Vous recevrez bientôt nos derniers articles et actualités.</p>
        <div style="background-color: #e9f7ef; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 0;"><strong>À quoi vous attendre :</strong></p>
          <ul style="margin: 10px 0 0 20px;">
            <li>Des articles de qualité sur divers sujets</li>
            <li>Des actualités et tendances</li>
            <li>Des contenus exclusifs pour nos abonnés</li>
          </ul>
        </div>
        <p>Si vous n'êtes pas à l'origine de cette inscription, vous pouvez ignorer cet email.</p>
        <p>Cordialement,<br>L'équipe du Blog</p>
      </div>
    `;

    const textContent = `
      Confirmation d'abonnement
      
      Bonjour ${subscriberName || 'Cher lecteur'},
      
      Merci de vous être abonné à notre newsletter !
      
      Votre email (${subscriberEmail}) a été ajouté à notre liste de diffusion.
      Vous recevrez bientôt nos derniers articles et actualités.
      
      À quoi vous attendre :
      - Des articles de qualité sur divers sujets
      - Des actualités et tendances
      - Des contenus exclusifs pour nos abonnés
      
      Si vous n'êtes pas à l'origine de cette inscription, vous pouvez ignorer cet email.
      
      Cordialement,
      L'équipe du Blog
    `;

    return await sendEmail({
      to: subscriberEmail,
      subject: 'Confirmation d\'abonnement à notre newsletter',
      text: textContent,
      html: htmlContent
    });
  } catch (error) {
    console.error('❌ Error sending newsletter confirmation:', error);
    return { success: false, error: error.message };
  }
}

// Send newsletter notification to admin
export async function sendNewsletterNotification(subscriberEmail, subscriberName) {
  try {
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Nouvel abonné à la newsletter</h2>
        <p>Un nouveau lecteur s'est abonné à votre newsletter :</p>
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px;">
          <p><strong>Nom:</strong> ${subscriberName || 'Non spécifié'}</p>
          <p><strong>Email:</strong> ${subscriberEmail}</p>
        </div>
        <p style="color: #666; font-size: 12px; margin-top: 20px;">
          Ce message a été envoyé automatiquement lors d'une nouvelle inscription à la newsletter.
        </p>
      </div>
    `;

    const textContent = `
      Nouvel abonné à la newsletter
      
      Un nouveau lecteur s'est abonné à votre newsletter :
      
      Nom: ${subscriberName || 'Non spécifié'}
      Email: ${subscriberEmail}
    `;

    return await sendEmail({
      to: SMTP_CONFIG.auth.user, // Send to admin email
      subject: 'Nouvel abonné à la newsletter',
      text: textContent,
      html: htmlContent
    });
  } catch (error) {
    console.error('❌ Error sending newsletter notification:', error);
    return { success: false, error: error.message };
  }
}

// Test email function
export async function testEmailConnection() {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    console.log('✅ SMTP connection verified successfully');
    return { success: true, message: 'SMTP connection verified successfully' };
  } catch (error) {
    console.error('❌ SMTP connection failed:', error);
    return { success: false, error: error.message };
  }
}
