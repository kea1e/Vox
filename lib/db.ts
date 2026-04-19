import * as SQLite from 'expo-sqlite';
import type { Note, NewNote, Segment } from '@/types';

let _db: SQLite.SQLiteDatabase | null = null;

export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (_db) return _db;
  _db = await SQLite.openDatabaseAsync('vox.db');
  await _db.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS notes (
      id TEXT PRIMARY KEY NOT NULL,
      user_id TEXT,
      title TEXT NOT NULL,
      created_at TEXT NOT NULL,
      duration_seconds INTEGER NOT NULL DEFAULT 0,
      audio_path TEXT NOT NULL,
      transcript TEXT NOT NULL DEFAULT '[]',
      summary TEXT,
      key_takeaways TEXT NOT NULL DEFAULT '[]',
      synced INTEGER NOT NULL DEFAULT 0,
      tags TEXT NOT NULL DEFAULT '[]'
    );
    CREATE VIRTUAL TABLE IF NOT EXISTS notes_fts USING fts5(
      id UNINDEXED,
      title,
      transcript_text,
      content=''
    );
    CREATE INDEX IF NOT EXISTS idx_notes_created_at ON notes(created_at DESC);
  `);
  return _db;
}

type Row = {
  id: string;
  user_id: string | null;
  title: string;
  created_at: string;
  duration_seconds: number;
  audio_path: string;
  transcript: string;
  summary: string | null;
  key_takeaways: string;
  synced: number;
  tags: string;
};

function rowToNote(r: Row): Note {
  return {
    id: r.id,
    user_id: r.user_id,
    title: r.title,
    created_at: r.created_at,
    duration_seconds: r.duration_seconds,
    audio_path: r.audio_path,
    transcript: JSON.parse(r.transcript) as Segment[],
    summary: r.summary,
    key_takeaways: JSON.parse(r.key_takeaways) as string[],
    synced: r.synced === 1,
    tags: JSON.parse(r.tags) as string[],
  };
}

export async function insertNote(n: NewNote): Promise<Note> {
  const db = await getDb();
  const note: Note = {
    id: n.id,
    user_id: null,
    title: n.title,
    created_at: n.created_at,
    duration_seconds: n.duration_seconds,
    audio_path: n.audio_path,
    transcript: n.transcript ?? [],
    summary: n.summary ?? null,
    key_takeaways: n.key_takeaways ?? [],
    synced: false,
    tags: n.tags ?? [],
  };
  await db.runAsync(
    `INSERT INTO notes (id, user_id, title, created_at, duration_seconds, audio_path, transcript, summary, key_takeaways, synced, tags)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)`,
    note.id,
    note.user_id,
    note.title,
    note.created_at,
    note.duration_seconds,
    note.audio_path,
    JSON.stringify(note.transcript),
    note.summary,
    JSON.stringify(note.key_takeaways),
    JSON.stringify(note.tags),
  );
  await reindex(note.id, note.title, note.transcript);
  return note;
}

export async function updateTranscript(id: string, transcript: Segment[]) {
  const db = await getDb();
  await db.runAsync(`UPDATE notes SET transcript = ?, synced = 0 WHERE id = ?`, JSON.stringify(transcript), id);
  const note = await getNote(id);
  if (note) await reindex(id, note.title, transcript);
}

export async function updateSummary(id: string, summary: string, takeaways: string[]) {
  const db = await getDb();
  await db.runAsync(
    `UPDATE notes SET summary = ?, key_takeaways = ?, synced = 0 WHERE id = ?`,
    summary,
    JSON.stringify(takeaways),
    id,
  );
}

export async function renameNote(id: string, title: string) {
  const db = await getDb();
  await db.runAsync(`UPDATE notes SET title = ?, synced = 0 WHERE id = ?`, title, id);
}

export async function deleteNote(id: string) {
  const db = await getDb();
  await db.runAsync(`DELETE FROM notes WHERE id = ?`, id);
  await db.runAsync(`DELETE FROM notes_fts WHERE id = ?`, id);
}

export async function listNotes(): Promise<Note[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<Row>(`SELECT * FROM notes ORDER BY created_at DESC`);
  return rows.map(rowToNote);
}

export async function getNote(id: string): Promise<Note | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<Row>(`SELECT * FROM notes WHERE id = ?`, id);
  return row ? rowToNote(row) : null;
}

export async function searchNotes(query: string): Promise<Note[]> {
  if (!query.trim()) return listNotes();
  const db = await getDb();
  const rows = await db.getAllAsync<Row>(
    `SELECT n.* FROM notes n
     JOIN notes_fts f ON f.id = n.id
     WHERE notes_fts MATCH ?
     ORDER BY n.created_at DESC`,
    `${query.replace(/['"]/g, '')}*`,
  );
  return rows.map(rowToNote);
}

async function reindex(id: string, title: string, transcript: Segment[]) {
  const db = await getDb();
  const text = transcript.map((s) => s.text).join(' ');
  await db.runAsync(`DELETE FROM notes_fts WHERE id = ?`, id);
  await db.runAsync(`INSERT INTO notes_fts (id, title, transcript_text) VALUES (?, ?, ?)`, id, title, text);
}
