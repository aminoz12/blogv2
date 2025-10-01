import { sendContactEmail } from '../../utils/emailService.js';

export async function POST({ request }) {
  try {
    // Parse form data
    const formData = await request.json();
    
    // Log received data for debugging
    console.log('Received form data:', JSON.stringify(formData, null, 2));
    
    // Extract fields from form data 
    const firstName = formData.firstName || formData.name || '';
    const email = formData.email;
    const phone = formData.phone || '';
    const subject = formData.subject;
    const message = formData.message;
    
    // Log extracted fields
    console.log('Extracted fields:', { firstName, email, phone, subject, message });
    
    // Use firstName as the name 
    const name = firstName || 'Anonymous';
    
    // Log combined name
    console.log('Name:', name);
    
    // Validate required fields
    if (!name || name === 'Anonymous' || !email || !subject || subject === '' || !message) {
      console.log('Validation failed - Missing required fields:', { name, email, subject, message });
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Tous les champs sont requis' 
        }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Validate email format
    const emailRegex = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Format d\'email invalide' 
        }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Validate phone number format if provided
    if (phone && phone.trim() !== '') {
      const phoneRegex = /^[\+]?[0-9\s\-\(\)]{10,20}$/;
      if (!phoneRegex.test(phone)) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Format de numéro de téléphone invalide' 
          }),
          { 
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }
    }
    
    // Send email
    const result = await sendContactEmail(name, email, phone, subject, message);
    
    if (result.success) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Message envoyé avec succès' 
        }),
        { 
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    } else {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Erreur lors de l\'envoi du message' 
        }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  } catch (error) {
    console.error('❌ Contact form error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Erreur interne du serveur' 
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}