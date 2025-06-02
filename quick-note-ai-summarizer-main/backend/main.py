
from fastapi import FastAPI, HTTPException, Depends, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import os
import uuid
from datetime import datetime
import asyncpg
import httpx
from contextlib import asynccontextmanager

# Pydantic models
class NoteCreate(BaseModel):
    title: str
    content: str

class NoteUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None

class Note(BaseModel):
    id: str
    title: str
    content: str
    summary: Optional[str] = None
    created_at: datetime
    updated_at: datetime

class SummaryRequest(BaseModel):
    content: str

class BulkSummaryRequest(BaseModel):
    notes: List[str]

# Database connection
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://dev:dev@localhost:5432/notes_db")
NVIDIA_API_KEY = os.getenv("NVIDIA_API_KEY", "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")
NVIDIA_API_BASE = "https://integrate.api.nvidia.com/v1"

# Global database pool
db_pool = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    global db_pool
    # Create database connection pool
    db_pool = await asyncpg.create_pool(DATABASE_URL)
    
    # Create tables if they don't exist
    async with db_pool.acquire() as conn:
        await conn.execute('''
            CREATE TABLE IF NOT EXISTS notes (
                id VARCHAR PRIMARY KEY,
                title VARCHAR NOT NULL,
                content TEXT NOT NULL,
                summary TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
    
    yield
    
    # Close database pool
    await db_pool.close()

app = FastAPI(title="AI Notes API", version="1.0.0", lifespan=lifespan)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8080", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dependency to get database connection
async def get_db():
    async with db_pool.acquire() as conn:
        yield conn

# NVIDIA API helper
async def call_nvidia_api(content: str) -> str:
    """Call NVIDIA API for text summarization"""
    if not NVIDIA_API_KEY:
        raise HTTPException(status_code=500, detail="NVIDIA API key not configured")
    
    headers = {
        "Authorization": f"Bearer {NVIDIA_API_KEY}",
        "Content-Type": "application/json"
    }
    
    # Using NVIDIA's text summarization model
    payload = {
        "messages": [
            {
                "role": "system",
                "content": "You are a helpful assistant that summarizes text concisely and accurately. Provide a clear, concise summary that captures the main points."
            },
            {
                "role": "user", 
                "content": f"Please summarize the following text in 1-2 sentences (not bullet points):\n\n{content}"
            }
        ],
        "temperature": 0.2,
        "top_p": 0.7,
        "max_tokens": 200,
        "model": "nvidia/llama-3.1-nemotron-70b-instruct"
    }
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                f"{NVIDIA_API_BASE}/chat/completions",
                headers=headers,
                json=payload,
                timeout=30.0
            )
            response.raise_for_status()
            
            result = response.json()
            return result["choices"][0]["message"]["content"]
            
        except httpx.HTTPError as e:
            raise HTTPException(status_code=500, detail=f"NVIDIA API error: {str(e)}")
        except KeyError:
            raise HTTPException(status_code=500, detail="Invalid response from NVIDIA API")

# Routes
@app.get("/")
async def root():
    return {"message": "AI Notes API is running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now()}

@app.post("/notes/", response_model=Note)
async def create_note(note: NoteCreate, db: asyncpg.Connection = Depends(get_db)):
    note_id = str(uuid.uuid4())
    now = datetime.now()
    
    await db.execute(
        "INSERT INTO notes (id, title, content, created_at, updated_at) VALUES ($1, $2, $3, $4, $5)",
        note_id, note.title, note.content, now, now
    )
    
    return Note(
        id=note_id,
        title=note.title,
        content=note.content,
        created_at=now,
        updated_at=now
    )

@app.get("/notes/", response_model=List[Note])
async def get_notes(db: asyncpg.Connection = Depends(get_db)):
    rows = await db.fetch("SELECT * FROM notes ORDER BY created_at DESC")
    return [Note(**dict(row)) for row in rows]

@app.get("/notes/{note_id}", response_model=Note)
async def get_note(note_id: str, db: asyncpg.Connection = Depends(get_db)):
    row = await db.fetchrow("SELECT * FROM notes WHERE id = $1", note_id)
    if not row:
        raise HTTPException(status_code=404, detail="Note not found")
    return Note(**dict(row))

@app.put("/notes/{note_id}", response_model=Note)
async def update_note(note_id: str, note_update: NoteUpdate, db: asyncpg.Connection = Depends(get_db)):
    # Check if note exists
    existing_note = await db.fetchrow("SELECT * FROM notes WHERE id = $1", note_id)
    if not existing_note:
        raise HTTPException(status_code=404, detail="Note not found")
    
    # Update fields
    updates = {}
    if note_update.title is not None:
        updates["title"] = note_update.title
    if note_update.content is not None:
        updates["content"] = note_update.content
    
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    updates["updated_at"] = datetime.now()
    
    # Build dynamic query
    set_clause = ", ".join([f"{key} = ${i+2}" for i, key in enumerate(updates.keys())])
    query = f"UPDATE notes SET {set_clause} WHERE id = $1 RETURNING *"
    values = [note_id] + list(updates.values())
    
    row = await db.fetchrow(query, *values)
    return Note(**dict(row))

@app.delete("/notes/{note_id}")
async def delete_note(note_id: str, db: asyncpg.Connection = Depends(get_db)):
    result = await db.execute("DELETE FROM notes WHERE id = $1", note_id)
    if result == "DELETE 0":
        raise HTTPException(status_code=404, detail="Note not found")
    return {"message": "Note deleted successfully"}

@app.post("/notes/{note_id}/summarize")
async def summarize_note(note_id: str, db: asyncpg.Connection = Depends(get_db)):
    # Get note content
    row = await db.fetchrow("SELECT content FROM notes WHERE id = $1", note_id)
    if not row:
        raise HTTPException(status_code=404, detail="Note not found")
    
    # Generate summary
    summary = await call_nvidia_api(row["content"])
    
    # Update note with summary
    await db.execute(
        "UPDATE notes SET summary = $1, updated_at = $2 WHERE id = $3",
        summary, datetime.now(), note_id
    )
    
    return {"summary": summary}

@app.post("/notes/bulk-summarize")
async def bulk_summarize_notes(db: asyncpg.Connection = Depends(get_db)):
    # Get all notes content
    rows = await db.fetch("SELECT content FROM notes ORDER BY created_at DESC")
    if not rows:
        raise HTTPException(status_code=404, detail="No notes found")
    
    # Combine all content
    combined_content = "\n\n---\n\n".join([row["content"] for row in rows])
    
    # Generate bulk summary
    bulk_summary = await call_nvidia_api(f"Summarize all of these notes together, identifying common themes and key insights:\n\n{combined_content}")
    
    return {"bulk_summary": bulk_summary}

@app.post("/upload-text")
async def upload_text_file(file: UploadFile = File(...)):
    if not file.filename.endswith('.txt'):
        raise HTTPException(status_code=400, detail="Only .txt files are allowed")
    
    content = await file.read()
    text_content = content.decode('utf-8')
    
    return {
        "filename": file.filename,
        "content": text_content,
        "suggested_title": file.filename.replace('.txt', '')
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
