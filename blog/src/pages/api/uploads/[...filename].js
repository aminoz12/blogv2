export const prerender = false;

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function GET({ params, request }) {
  const requestUrl = new URL(request.url);
  console.log('🔍 Blog Image API: Request received for:', requestUrl.pathname);
  
  try {
    let { filename } = params;
    
    // Enhanced input validation
    if (!filename || Array.isArray(filename) && filename.length === 0) {
      console.error('❌ Blog Image API: No filename provided');
      return new Response(JSON.stringify({ 
        error: 'Filename required',
        message: 'Please provide a valid filename parameter'
      }), { 
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    // Handle array of filename parts (from [...filename] dynamic route)
    if (Array.isArray(filename)) {
      filename = filename.join('/');
    }
    
    console.log('🔍 Blog Image API: Processing filename:', filename);
    
    // Enhanced URL decoding and JSON object extraction
    try {
      filename = decodeURIComponent(filename);
      
      // Check if filename is actually a JSON string (common issue from admin panel)
      if (filename.startsWith('{') && filename.includes('"url"')) {
        console.log('🔧 Blog Image API: Detected JSON string, extracting filename:', filename.substring(0, 100) + '...');
        try {
          const imageObj = JSON.parse(filename);
          if (imageObj.url) {
            // Extract just the filename from the URL
            const urlParts = imageObj.url.split('/');
            filename = urlParts[urlParts.length - 1];
            console.log('✅ Blog Image API: Extracted filename from JSON:', filename);
          } else {
            console.error('❌ Blog Image API: JSON object missing url property');
            return new Response(JSON.stringify({ 
              error: 'Invalid image data',
              message: 'JSON object is missing url property'
            }), { 
              status: 400,
              headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
              }
            });
          }
        } catch (jsonError) {
          console.error('❌ Blog Image API: Failed to parse JSON filename:', jsonError.message);
          return new Response(JSON.stringify({ 
            error: 'Invalid filename format',
            message: 'Could not parse JSON filename data'
          }), { 
            status: 400,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            }
          });
        }
      }
    } catch (decodeError) {
      console.warn('⚠️ Blog Image API: URL decode failed, using original filename:', decodeError.message);
      // If decoding fails, use original filename
    }
    
    // Security: Prevent path traversal attacks
    if (filename.includes('..') || filename.includes('\\') || filename.startsWith('/')) {
      console.error('❌ Blog Image API: Security violation - invalid filename:', filename);
      return new Response(JSON.stringify({ 
        error: 'Invalid filename',
        message: 'Filename contains invalid characters'
      }), { 
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
    
    console.log('🔍 Blog Image API: Looking for image file:', filename);
    
    // Construct the file path - point to the shared uploads directory
    const uploadsDir = path.join(__dirname, '../../../../../../danialblogs-chat_work/adminblog/public/uploads');
    const filePath = path.join(uploadsDir, filename);
    
    console.log('🔍 Blog Image API: Attempting to access file at:', filePath);
    
    // Check if file exists with enhanced error handling
    try {
      const stats = await fs.stat(filePath);
      if (!stats.isFile()) {
        console.error('❌ Blog Image API: Path exists but is not a file:', filePath);
        return new Response(JSON.stringify({ 
          error: 'Invalid file',
          message: 'Path does not point to a valid file'
        }), { 
          status: 404,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }
    } catch (accessError) {
      console.error('❌ Blog Image API: File not found:', filePath, 'Error:', accessError.message);
      return new Response(JSON.stringify({ 
        error: 'Image not found',
        message: `File ${filename} does not exist in uploads directory`,
        filename: filename,
        requestPath: requestUrl.pathname
      }), { 
        status: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
    
    // Read the file with error handling
    let fileBuffer;
    try {
      fileBuffer = await fs.readFile(filePath);
      console.log('✅ Blog Image API: Successfully read file, size:', fileBuffer.length, 'bytes');
    } catch (readError) {
      console.error('❌ Blog Image API: Failed to read file:', readError.message);
      return new Response(JSON.stringify({ 
        error: 'File read error',
        message: 'Could not read the requested file'
      }), { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
    
    // Determine content type based on file extension
    const ext = path.extname(filename).toLowerCase();
    let contentType = 'image/jpeg'; // default
    
    switch (ext) {
      case '.png':
        contentType = 'image/png';
        break;
      case '.gif':
        contentType = 'image/gif';
        break;
      case '.webp':
        contentType = 'image/webp';
        break;
      case '.svg':
        contentType = 'image/svg+xml';
        break;
      case '.bmp':
        contentType = 'image/bmp';
        break;
      case '.ico':
        contentType = 'image/x-icon';
        break;
      case '.jpg':
      case '.jpeg':
      default:
        contentType = 'image/jpeg';
        break;
    }
    
    console.log('✅ Blog Image API: Serving image successfully:', filename, 'Type:', contentType);
    
    // Return the image with proper headers
    return new Response(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Length': fileBuffer.length.toString(),
        'Cache-Control': 'public, max-age=31536000, immutable',
        'ETag': `"${filename}-${fileBuffer.length}"`,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });
    
  } catch (error) {
    console.error('❌ Blog Image API: Unexpected error serving image:', error.message);
    console.error('❌ Blog Image API: Error stack:', error.stack);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      message: 'An unexpected error occurred while serving the image',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }), { 
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}

// Handle OPTIONS requests for CORS
export async function OPTIONS({ request }) {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400'
    }
  });
}
