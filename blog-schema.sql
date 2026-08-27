-- ==============================================
-- Blog Database Schema for Cloudflare D1
-- Database name: blog-db
-- DROP existing tables and recreate fresh.
-- Run this in Cloudflare D1 Console for blog-db
-- ==============================================

DROP TABLE IF EXISTS comment_reactions;
DROP TABLE IF EXISTS comments;
DROP TABLE IF EXISTS post_likes;
DROP TABLE IF EXISTS post_views;

CREATE TABLE comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_slug TEXT NOT NULL,
  user_id INTEGER,
  text TEXT NOT NULL,
  parent_id INTEGER DEFAULT NULL,
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected')),
  ip_hash TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE comment_reactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  comment_id INTEGER NOT NULL,
  visitor_id TEXT NOT NULL,
  reaction_type TEXT NOT NULL CHECK(reaction_type IN ('like','dislike')),
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(comment_id, visitor_id)
);

CREATE TABLE post_likes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_slug TEXT NOT NULL,
  visitor_id TEXT NOT NULL,
  ip_hash TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(post_slug, visitor_id)
);

CREATE TABLE post_views (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_slug TEXT NOT NULL,
  visitor_id TEXT,
  ip_hash TEXT,
  viewed_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_comments_slug ON comments(post_slug, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_comments_parent ON comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_reactions_comment ON comment_reactions(comment_id);
CREATE INDEX IF NOT EXISTS idx_likes_slug ON post_likes(post_slug);
CREATE INDEX IF NOT EXISTS idx_views_slug ON post_views(post_slug);