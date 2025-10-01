import mysql from 'mysql2/promise';
import { open } from 'sqlite';
import sqlite3 from 'sqlite3';
import fs from 'fs';
import fsp from 'fs/promises';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { ObjectId } from 'mongodb';

// Load environment variables from blog's .env file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'mad2moi_blog',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// MongoDB configuration - Add SSL options directly to URI
const mongoConfig = {
  uri: process.env.MONGO_URI 
    ? `${process.env.MONGO_URI}&tls=true` 
    : 'mongodb+srv://blog:admin123@cluster0.5lryebj.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0&tls=true',
  dbName: process.env.MONGO_DB_NAME || 'mad2moi_blog'
};

// Driver: mysql (default) or sqlite
const dbDriver = (process.env.DB_DRIVER || 'mongodb').toLowerCase();

// Create connection pool
let pool = null; // MySQL pool or SQLite handle
let mongoClient = null; // MongoDB client
let isMongoDBConnected = false; // Track MongoDB connection status

// Initialize database connection
export async function initializeDatabaseFactory() {
  try {
    // Always try MongoDB first
    console.log('🚀 Blog: Using MongoDB as configured');
    
    if (mongoClient && isMongoDBConnected) return { client: mongoClient, isMongoDB: true };
    
    // Import MongoDB dynamically
    const { MongoClient } = await import('mongodb');
    
    mongoClient = new MongoClient(mongoConfig.uri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000
      // SSL options are now in the URI
    });
    
    await mongoClient.connect();
    isMongoDBConnected = true;
    console.log('✅ Blog MongoDB connection established');
    return { client: mongoClient, isMongoDB: true };
  } catch (error) {
    console.error('❌ Blog MongoDB initialization failed:', error);
    isMongoDBConnected = false;
    
    // Fallback to SQLite if MongoDB fails
    console.log('🔄 MongoDB failed, falling back to SQLite');
    
    if (pool) return { client: pool, isMongoDB: false };

    const dbDir = path.join(__dirname, '../../../database');
    const dbFile = path.join(dbDir, `${dbConfig.database}.sqlite`);
    
    if (!fs.existsSync(dbDir)) {
      await fsp.mkdir(dbDir, { recursive: true });
    }
    
    pool = await open({ filename: dbFile, driver: sqlite3.Database });
    await pool.exec('PRAGMA foreign_keys = ON;');
    await pool.exec('PRAGMA journal_mode = WAL;');
    console.log('✅ Blog SQLite connection established (fallback)');
    return { client: pool, isMongoDB: false };
  }
}

// Execute a query with automatic database selection
export async function executeQueryFactory(query, params = []) {
  try {
    console.log('🔍 Debug: Executing query:', query);
    console.log('🔍 Debug: Query params:', params);
    console.log('🔍 Debug: Query type:', query.trim().toUpperCase().split(' ')[0]);
    
    const dbResult = await initializeDatabaseFactory();
    const { client: dbClient, isMongoDB } = dbResult;
    
    // Check if we got MongoDB client
    if (isMongoDB && dbClient && typeof dbClient.db === 'function') {
      console.log('✅ Got MongoDB client, connecting to database:', mongoConfig.dbName);
      const db = dbClient.db(mongoConfig.dbName);
      
      // Basic SQL to MongoDB query conversion for common operations
      const upperQuery = query.trim().toUpperCase();
      
      if (upperQuery.startsWith('SELECT')) {
        // Handle SELECT queries for articles, categories, users
        if (query.includes('FROM articles')) {
          const collection = db.collection('articles');
          const pipeline = [];
          
          // Basic WHERE clause handling for status = 'published'
          if (query.includes("WHERE a.status = 'published'")) {
            pipeline.push({ $match: { status: 'published' } });
          }
          
          // Handle WHERE slug = ? query for individual articles
          if (query.includes('WHERE a.slug = ?') && params.length > 0) {
            console.log('🔍 Debug: Adding slug match to pipeline:', params[0]);
            pipeline.push({ $match: { slug: params[0], status: 'published' } });
          }
          
          // Basic ORDER BY handling
          if (query.includes('ORDER BY a.published_at DESC')) {
            pipeline.push({ $sort: { published_at: -1, created_at: -1 } });
          }
          
          // Basic JOIN simulation for categories and users
          if (query.includes('LEFT JOIN categories')) {
            // Categories have both _id (ObjectId) and id (integer)
            // Articles have category_id as integer, so match with categories.id
            console.log('🔍 Debug: Adding categories lookup to pipeline');
            pipeline.push({
              $lookup: {
                from: 'categories',
                localField: 'category_id',
                foreignField: 'id', // Match integer to integer
                as: 'category'
              }
            });
            pipeline.push({
              $addFields: {
                category_name: { $arrayElemAt: ['$category.name', 0] },
                category_slug: { $arrayElemAt: ['$category.slug', 0] },
                category_color: { $arrayElemAt: ['$category.color', 0] },
                category_icon: { $arrayElemAt: ['$category.icon', 0] }
              }
            });
          }
          
          if (query.includes('LEFT JOIN users')) {
            pipeline.push({
              $lookup: {
                from: 'users',
                localField: 'author_id',
                foreignField: 'id', // Match integer to integer (users have both _id and id)
                as: 'user'
              }
            });
            pipeline.push({
              $addFields: {
                author_name: {
                  $cond: {
                    if: { 
                      $and: [
                        { $ne: [{ $arrayElemAt: ['$user.first_name', 0] }, null] }, 
                        { $ne: [{ $arrayElemAt: ['$user.last_name', 0] }, null] }
                      ] 
                    },
                    then: { 
                      $concat: [
                        { $arrayElemAt: ['$user.first_name', 0] }, 
                        ' ', 
                        { $arrayElemAt: ['$user.last_name', 0] }
                      ] 
                    },
                    else: { $arrayElemAt: ['$user.username', 0] }
                  }
                }
              }
            });
          }
          
          // Check if this is the complex getPublishedArticles query
          if (query.includes('LEFT JOIN categories') && query.includes('LEFT JOIN users')) {
            console.log('🔍 Debug: Complex articles query detected, executing pipeline');
            console.log('🔍 Debug: Pipeline:', JSON.stringify(pipeline, null, 2));
            
            const result = await collection.aggregate(pipeline).toArray();
            console.log('🔍 Debug: MongoDB complex query result:', result.length, 'articles');
            
            // Debug: Show all documents in collection first
            const allDocs = await collection.find({}).limit(5).toArray();
            console.log('🔍 Debug: Total documents in articles collection:', await collection.countDocuments());
            console.log('🔍 Debug: Sample raw documents:', allDocs);
            
            // Debug: Show sample article with category data
            if (result.length > 0) {
              console.log('🔍 Debug: Sample article data:', {
                title: result[0].title,
                category_id: result[0].category_id,
                category_name: result[0].category_name,
                category_slug: result[0].category_slug,
                category_color: result[0].category_color,
                category: result[0].category
              });
            } else {
              console.log('⚠️ Debug: No results from pipeline - checking if collection has data');
              const simpleResult = await collection.find({}).limit(5).toArray();
              console.log('🔍 Debug: Simple find result:', simpleResult.length, 'documents');
            }
            
            return result;
          }
          
          // For simpler queries, execute the pipeline
          const result = await collection.aggregate(pipeline).toArray();
          console.log('🔍 Debug: MongoDB simple query result:', result);
          return result;
        }
        
        if (query.includes('FROM categories')) {
          const collection = db.collection('categories');
          
          // Debug: Show all categories first
          const allCategories = await collection.find({}).toArray();
          console.log('🔍 Debug: All categories in MongoDB:', allCategories.length);
          if (allCategories.length > 0) {
            console.log('🔍 Debug: Sample category structure:', {
              _id: allCategories[0]._id,
              id: allCategories[0].id,
              name: allCategories[0].name,
              slug: allCategories[0].slug,
              color: allCategories[0].color
            });
          }
          
          // Handle complex categories query with JOIN and GROUP BY
          if (query.includes('LEFT JOIN articles') && query.includes('GROUP BY')) {
            // This is the getCategories query - get categories with article counts
            // Check for both boolean true and number 1 (MongoDB might store it as number)
            const categories = await collection.find({ 
              $or: [
                { is_active: true },
                { is_active: 1 }
              ]
            }).toArray();
            
            console.log('🔍 Debug: Raw categories from MongoDB:', categories.length);
            if (categories.length > 0) {
              console.log('🔍 Debug: Sample category:', {
                _id: categories[0]._id,
                name: categories[0].name,
                is_active: categories[0].is_active,
                type: typeof categories[0].is_active
              });
            }
            
                         // Get article counts for each category
             const articlesCollection = db.collection('articles');
             const categoriesWithCounts = await Promise.all(
               categories.map(async (cat) => {
                 // Articles use ObjectIds for category_id, so we can match directly
                 const articleCount = await articlesCollection.countDocuments({
                   category_id: cat._id,
                   status: 'published'
                 });
                 
                 return {
                   id: cat._id.toString(), // Use ObjectId as string for compatibility
                   name: cat.name,
                   slug: cat.slug,
                   description: cat.description,
                   color: cat.color,
                   icon: cat.icon,
                   parent_id: cat.parent_id,
                   article_count: articleCount
                 };
               })
             );
            
            // Sort by sort_order and name
            categoriesWithCounts.sort((a, b) => {
              if (a.sort_order !== b.sort_order) {
                return (a.sort_order || 0) - (b.sort_order || 0);
              }
              return a.name.localeCompare(b.name);
            });
            
            console.log('🔍 Debug: MongoDB categories with counts result:', categoriesWithCounts);
            return categoriesWithCounts;
          }
          
          // Simple categories query
          const result = await collection.find({}).toArray();
          console.log('🔍 Debug: MongoDB categories result:', result);
          return result;
        }
        
        if (query.includes('FROM users')) {
          const collection = db.collection('users');
          const result = await collection.find({}).toArray();
          console.log('🔍 Debug: MongoDB users result:', result);
          return result;
        }
        
        if (query.includes('FROM comments')) {
          const collection = db.collection('comments');
          
          // Handle SELECT comments
          if (query.includes('SELECT') && query.includes('FROM comments')) {
            let filter = {};
            let limit = 0;
            let skip = 0;
            
            // Handle WHERE article_slug = ? AND status = ?
            if (query.toLowerCase().includes('where article_slug = ?') && query.toLowerCase().includes('and status = ?')) {
              filter = {
                article_slug: params[0],
                status: params[1]
              };
            }
            // Handle WHERE article_slug = ?
            else if (query.toLowerCase().includes('where article_slug = ?')) {
              filter = {
                article_slug: params[0]
              };
            }
            
            // Handle LIMIT and OFFSET
            if (query.toLowerCase().includes('limit ? offset ?')) {
              limit = params[params.length - 2]; // Second to last parameter
              skip = params[params.length - 1]; // Last parameter
            } else if (query.toLowerCase().includes('limit ?')) {
              limit = params[params.length - 1]; // Last parameter
            }
            
            console.log('🔍 Debug: MongoDB comments filter:', filter);
            console.log('🔍 Debug: MongoDB pagination - limit:', limit, 'skip:', skip);
            
            let queryBuilder = collection.find(filter).sort({ created_at: 1 });
            
            if (skip > 0) {
              queryBuilder = queryBuilder.skip(skip);
            }
            if (limit > 0) {
              queryBuilder = queryBuilder.limit(limit);
            }
            
            const comments = await queryBuilder.toArray();
            console.log('📝 Debug: MongoDB comments found:', comments.length);
            
            return comments.map(comment => ({
              ...comment,
              id: comment.id || comment._id
            }));
          }
          
          // Handle COUNT comments
          if (query.includes('select count(*) from comments')) {
            let filter = {};
            
            if (query.toLowerCase().includes('where article_slug = ?') && query.toLowerCase().includes('and status = ?')) {
              filter = {
                article_slug: params[0],
                status: params[1]
              };
            } else if (query.toLowerCase().includes('where article_slug = ?')) {
              filter = {
                article_slug: params[0]
              };
            }
            
            const count = await collection.countDocuments(filter);
            return [{ count }];
          }
        }
        
        // Default fallback
        const collection = db.collection('articles');
        const result = await collection.find({}).toArray();
        return result;
      }
      
      if (upperQuery.startsWith('INSERT')) {
        // Handle INSERT queries
        if (query.toLowerCase().includes('insert into comments')) {
          console.log('🔧 Handling comment INSERT in blog databaseFactory');
          const collection = db.collection('comments');
          
          // Get the next available integer ID
          const lastComment = await collection.findOne({}, { sort: { id: -1 } });
          const nextId = lastComment ? (lastComment.id + 1) : 1;
          
          const commentData = {
            _id: new ObjectId(),
            id: nextId,
            article_slug: params[0],
            article_title: params[1],
            author_name: params[2],
            author_email: params[3] || null,
            content: params[4],
            status: params[5] || 'approved',
            parent_id: params[6] ? parseInt(params[6]) : null,
            ip_address: params[7] || null,
            user_agent: params[8] || null,
            notify_replies: params[9] === 1 || params[9] === true,
            created_at: new Date(),
            updated_at: new Date()
          };
          
          console.log('🔧 Comment data to insert:', commentData);
          
          const result = await collection.insertOne(commentData);
          console.log('✅ Comment inserted with MongoDB ID:', result.insertedId);
          
          return { insertId: nextId, lastID: nextId };
        }
        
        const collection = db.collection('articles');
        const result = await collection.insertOne(params[0]);
        return result;
      }
      
      if (upperQuery.startsWith('UPDATE')) {
        // Handle UPDATE queries
        const collection = db.collection('articles');
        
        // Handle view_count increment
        if (query.includes('view_count = view_count + 1')) {
          const result = await collection.updateOne(
            { id: params[0] },
            { $inc: { view_count: 1 } },
            { upsert: false } // Don't create if doesn't exist
          );
          return result;
        }
        
        // Handle other UPDATE queries
        const result = await collection.updateOne(
          { _id: params[0] },
          { $set: params[1] }
        );
        return result;
      }
      
      if (upperQuery.startsWith('DELETE')) {
        // Handle DELETE queries
        const collection = db.collection('articles');
        const result = await collection.deleteOne({ _id: params[0] });
        return result;
      }
      
      if (upperQuery.startsWith('SELECT COUNT(*)')) {
        // Handle COUNT queries
        if (query.includes('FROM categories')) {
          const collection = db.collection('categories');
          const count = await collection.countDocuments();
          return [{ count }];
        }
        if (query.includes('FROM articles')) {
          const collection = db.collection('articles');
          const count = await collection.countDocuments();
          return [{ count }];
        }
        return [{ count: 0 }];
      }
      
      // If we reach here, return empty result for unhandled queries
      console.log('⚠️ Unhandled MongoDB query, returning empty result:', query);
      return [];
    }
    
    // Fallback to SQLite if MongoDB is not available
    console.log('🔄 Using fallback database (SQLite)');
    
    let translated = query
      .replace(/NOW\(\)/gi, 'CURRENT_TIMESTAMP')
      .replace(/INSERT\s+IGNORE/gi, 'INSERT OR IGNORE');
    
    const upper = translated.trim().toUpperCase();
    
    if (upper.startsWith('SELECT')) {
      const result = await dbClient.all(translated, params);
      return result;
    }
    if (upper.startsWith('INSERT')) {
      const result = await dbClient.run(translated, params);
      return result;
    }
    if (upper.startsWith('UPDATE')) {
      const result = await dbClient.run(translated, params);
      return result;
    }
    if (upper.startsWith('DELETE')) {
      const result = await dbClient.run(translated, params);
      return result;
    }
  } catch (error) {
    console.error('❌ Query execution error:', error);
    throw error;
  }
}

// Close database connections
export async function closeDatabaseFactory() {
  try {
    if (mongoClient) {
      await mongoClient.close();
      mongoClient = null;
      console.log('✅ MongoDB connection closed');
    }
    if (pool) {
      if (dbDriver === 'sqlite') {
        await pool.close();
      } else {
        await pool.end();
      }
      pool = null;
      console.log('✅ Database connection closed');
    }
  } catch (error) {
    console.error('❌ Error closing database:', error);
  }
}

// Get database connection (for backward compatibility)
export function getConnectionPool() {
  // Always try to use MongoDB first
  if (mongoClient) {
    return mongoClient;
  }
  
  if (!pool) {
    throw new Error('Database not initialized. Call initializeDatabaseFactory() first.');
  }
  return pool;
}

