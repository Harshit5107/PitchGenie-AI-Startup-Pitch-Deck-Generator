import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pg;
const pool = new Pool({
  connectionString: 'postgresql://postgres:Harshit%405107@db.wxwpxwtgrxytknzqzuwr.supabase.co:5432/postgres'
});

async function initializeDB() {
  try {
    console.log("Connecting to Supabase PostgreSQL for Secure Blueprint...");
    
    // Create Projects table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS projects (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL,
        idea TEXT NOT NULL,
        selected_slides TEXT[] NOT NULL,
        generated_content JSONB NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    
    console.log("Created table 'projects'.");

    // Enable RLS
    await pool.query(`ALTER TABLE projects ENABLE ROW LEVEL SECURITY;`);
    console.log("Enabled Row Level Security on 'projects'.");

    // Create RLS Policy
    // We try to drop it first in case it already exists so we don't crash
    try {
      await pool.query(`DROP POLICY IF EXISTS "Users can access only their data" ON projects;`);
    } catch (e) {}
    
    await pool.query(`
      CREATE POLICY "Users can access only their data"
      ON projects
      FOR ALL
      USING (auth.uid() = user_id);
    `);
    console.log("Applied RLS Policy to enforce data isolation.");

    console.log("Secure Database structure perfectly initialized!");
    process.exit(0);
  } catch (error) {
    console.error("Failed to initialize tables:", error);
    process.exit(1);
  }
}

initializeDB();
