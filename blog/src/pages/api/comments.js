import { executeQueryFactory } from '../../utils/databaseFactory.js';

export async function GET({ request, url }) {
  try {
    const articleSlug = url.searchParams.get('article_slug');
    
    if (!articleSlug) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Article slug is required' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Get comments for this article
    const commentsQuery = `
      SELECT * FROM comments
      WHERE article_slug = ?
      ORDER BY created_at ASC
    `;
    const comments = await executeQueryFactory(commentsQuery, [articleSlug]);
    
    // Get total comment count
    const countQuery = `
      SELECT COUNT(*) as count
      FROM comments
      WHERE article_slug = ?
    `;
    const countResult = await executeQueryFactory(countQuery, [articleSlug]);
    const totalCount = countResult[0]?.count || 0;
    
    return new Response(JSON.stringify({ 
      success: true, 
      comments,
      count: totalCount
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('❌ Error fetching comments:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Failed to fetch comments' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function POST({ request }) {
  try {
    console.log('📤 Comment API: POST request received');
    const body = await request.json();
    console.log('📤 Comment API: Request body:', body);
    
    const { 
      article_slug, 
      article_title, 
      author_name, 
      author_email, 
      content, 
      notify_replies 
    } = body;
    
    // Validation
    if (!article_slug || !author_name || !content) {
      console.log('❌ Comment API: Missing required fields');
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Missing required fields: article_slug, author_name, content' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    console.log('✅ Comment API: Validation passed');
    
    // Get client IP and user agent
    const clientIP = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';
    
    const commentData = {
      article_slug,
      article_title: article_title || 'Untitled Article',
      author_name,
      author_email: author_email || null,
      content,
      status: 'approved',
      parent_id: null,
      ip_address: clientIP,
      user_agent: userAgent,
      notify_replies: notify_replies || false
    };
    
    console.log('📤 Comment API: Comment data prepared:', commentData);
    
    // Insert comment using database factory
    const insertQuery = `
      INSERT INTO comments (article_slug, article_title, author_name, author_email, content, status, parent_id, ip_address, user_agent, notify_replies)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const insertParams = [
      commentData.article_slug,
      commentData.article_title,
      commentData.author_name,
      commentData.author_email,
      commentData.content,
      commentData.status,
      commentData.parent_id,
      commentData.ip_address,
      commentData.user_agent,
      commentData.notify_replies ? 1 : 0
    ];
    
    console.log('📤 Comment API: Executing insert query with params:', insertParams);
    const result = await executeQueryFactory(insertQuery, insertParams);
    console.log('✅ Comment API: Insert result:', result);
    
    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Comment published successfully!',
      comment_id: result.insertId || result.lastID
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('❌ Comment API: Error creating comment:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Failed to create comment: ' + error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function PUT({ request }) {
  try {
    const body = await request.json();
    const { comment_id, status } = body;
    
    if (!comment_id || !status) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Missing required fields: comment_id, status' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Update comment status using database factory
    const updateQuery = `
      UPDATE comments 
      SET status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    const result = await executeQueryFactory(updateQuery, [status, comment_id]);
    
    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Comment status updated successfully',
      affected_rows: result.affectedRows || result.modifiedCount || 1
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('❌ Error updating comment:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Failed to update comment' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function DELETE({ request, url }) {
  try {
    const commentId = url.searchParams.get('id');
    
    if (!commentId) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Comment ID is required' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Delete comment using database factory
    const deleteQuery = `
      DELETE FROM comments 
      WHERE id = ?
    `;
    const result = await executeQueryFactory(deleteQuery, [commentId]);
    
    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Comment deleted successfully',
      affected_rows: result.affectedRows || result.deletedCount || 1
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('❌ Error deleting comment:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Failed to delete comment' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
