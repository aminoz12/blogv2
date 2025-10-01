import { sendNewsletterConfirmation, sendNewsletterNotification } from '../../utils/emailService.js';
import { initializeDatabaseFactory, executeQueryFactory } from '../../utils/databaseFactory.js';

export async function POST({ request }) {
  try {
    // Initialize database connection
    await initializeDatabaseFactory();
    
    // Parse form data
    const formData = await request.json();
    
    const { name, email } = formData;
    
    // Validate required fields
    if (!email) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'L\'email est requis' 
        }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
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
    
    // Check if subscriber already exists
    const existingSubscriber = await executeQueryFactory(
      'SELECT id FROM subscribers WHERE email = ?',
      [email]
    );
    
    if (existingSubscriber.length > 0) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Cet email est déjà abonné' 
        }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Add subscriber to database
    const result = await executeQueryFactory(`
      INSERT INTO subscribers (name, email, location, source, status, engagement_score)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      name || '',
      email,
      '', // location
      'site_web', // source
      'actif', // status
      50 // engagement_score
    ]);
    
    // Send confirmation email to subscriber
    await sendNewsletterConfirmation(email, name);
    
    // Send notification to admin
    await sendNewsletterNotification(email, name);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Inscription réussie ! Un email de confirmation vous a été envoyé.' 
      }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('❌ Newsletter subscription error:', error);
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

// Get subscriber count
export async function GET() {
  try {
    await initializeDatabaseFactory();
    
    const result = await executeQueryFactory('SELECT COUNT(*) as count FROM subscribers WHERE status = "actif"');
    const count = result[0].count;
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        count 
      }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('❌ Newsletter count error:', error);
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