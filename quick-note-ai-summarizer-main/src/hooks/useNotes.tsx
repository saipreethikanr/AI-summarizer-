import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface Note {
  id: string;
  title: string;
  content: string;
  summary?: string;
  file_name?: string;
  created_at: string;
  updated_at: string;
  user_id: string;
}

export const useNotes = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchNotes = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching notes:', error);
        toast.error('Failed to fetch notes');
      } else {
        setNotes(data || []);
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to fetch notes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotes();
    } else {
      setNotes([]);
      setLoading(false);
    }
  }, [user]);

  const createNote = async (title: string, content: string, fileName?: string) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('notes')
        .insert([
          {
            title,
            content,
            file_name: fileName,
            user_id: user.id,
          },
        ])
        .select()
        .single();

      if (error) {
        console.error('Error creating note:', error);
        toast.error('Failed to create note');
        return null;
      } else {
        setNotes(prev => [data, ...prev]);
        toast.success('Note created successfully!');
        return data;
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to create note');
      return null;
    }
  };

  const updateNote = async (id: string, title: string, content: string) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('notes')
        .update({ title, content, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating note:', error);
        toast.error('Failed to update note');
        return null;
      } else {
        setNotes(prev => prev.map(note => note.id === id ? data : note));
        toast.success('Note updated successfully!');
        return data;
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to update note');
      return null;
    }
  };

  const deleteNote = async (id: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting note:', error);
        toast.error('Failed to delete note');
        return false;
      } else {
        setNotes(prev => prev.filter(note => note.id !== id));
        toast.success('Note deleted successfully!');
        return true;
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to delete note');
      return false;
    }
  };

  const summarizeNote = async (noteId: string) => {
    const note = notes.find(n => n.id === noteId);
    if (!note || !user) return null;

    try {
      const { data, error } = await supabase.functions.invoke('summarize-note', {
        body: { content: note.content }
      });

      if (error) {
        console.error('Error summarizing note:', error);
        toast.error('Failed to summarize note');
        return null;
      }

      const summary = data.summary;
      
      // Update note with summary
      const { data: updatedNote, error: updateError } = await supabase
        .from('notes')
        .update({ summary, updated_at: new Date().toISOString() })
        .eq('id', noteId)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating note with summary:', updateError);
        toast.error('Failed to save summary');
        return null;
      }

      setNotes(prev => prev.map(note => note.id === noteId ? updatedNote : note));
      toast.success('Note summarized successfully!');
      return summary;
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to summarize note');
      return null;
    }
  };

  const summarizeAllNotes = async () => {
    if (!user || notes.length === 0) return null;

    try {
      const { data, error } = await supabase.functions.invoke('summarize-notes', {
        body: { notes: notes.map(note => ({ title: note.title, content: note.content })) }
      });

      if (error) {
        console.error('Error summarizing all notes:', error);
        toast.error('Failed to summarize all notes');
        return null;
      }

      toast.success('All notes summarized successfully!');
      return data.summary;
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to summarize all notes');
      return null;
    }
  };

  return {
    notes,
    loading,
    createNote,
    updateNote,
    deleteNote,
    summarizeNote,
    summarizeAllNotes,
    refetch: fetchNotes,
  };
};
