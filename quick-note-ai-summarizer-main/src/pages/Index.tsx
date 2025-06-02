import { useState } from 'react';
import { Plus, FileText, Brain, Sparkles, Upload, Trash2, Edit, LogOut, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { useNotes, Note } from '@/hooks/useNotes';
import AuthPage from '@/components/AuthPage';
import SummaryModal from '@/components/SummaryModal';

const Index = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const { 
    notes, 
    loading: notesLoading, 
    createNote, 
    updateNote, 
    deleteNote, 
    summarizeNote, 
    summarizeAllNotes 
  } = useNotes();

  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteContent, setNewNoteContent] = useState('');
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [isLoadingBulkSummary, setIsLoadingBulkSummary] = useState(false);
  const [summaryModal, setSummaryModal] = useState({
    isOpen: false,
    title: '',
    summary: ''
  });

  // Show auth page if not authenticated
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <FileText className="mx-auto h-16 w-16 text-gray-400 mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  const handleCreateNote = async () => {
    if (!newNoteTitle.trim() || !newNoteContent.trim()) {
      toast.error('Please provide both title and content');
      return;
    }

    const newNote = await createNote(newNoteTitle, newNoteContent);
    if (newNote) {
      setSelectedNote(newNote);
      setNewNoteTitle('');
      setNewNoteContent('');
      setIsCreating(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    const success = await deleteNote(noteId);
    if (success && selectedNote?.id === noteId) {
      setSelectedNote(notes.length > 1 ? notes.find(n => n.id !== noteId) || null : null);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'text/plain') {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setNewNoteContent(content);
        setNewNoteTitle(file.name.replace('.txt', ''));
        setIsCreating(true);
      };
      reader.readAsText(file);
    } else {
      toast.error('Please upload a text file (.txt)');
    }
  };

  const handlePasteContent = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setNewNoteContent(text);
        setNewNoteTitle('Pasted Content - ' + new Date().toLocaleString());
        setIsCreating(true);
      }
    } catch (err) {
      toast.error('Failed to read clipboard. Please paste manually.');
    }
  };

  const handleSummarizeNote = async (noteId: string) => {
    setIsLoadingSummary(true);
    try {
      const summary = await summarizeNote(noteId);
      if (summary && selectedNote?.id === noteId) {
        setSelectedNote(prev => prev ? { ...prev, summary } : null);
        setSummaryModal({
          isOpen: true,
          title: `Summary: ${selectedNote?.title}`,
          summary
        });
      }
    } finally {
      setIsLoadingSummary(false);
    }
  };

  const handleBulkSummarize = async () => {
    setIsLoadingBulkSummary(true);
    try {
      const summary = await summarizeAllNotes();
      if (summary) {
        setSummaryModal({
          isOpen: true,
          title: 'Summary of All Notes',
          summary
        });
      }
    } finally {
      setIsLoadingBulkSummary(false);
    }
  };

  const handleUpdateNote = async () => {
    if (!selectedNote || !newNoteTitle.trim() || !newNoteContent.trim()) {
      toast.error('Please provide both title and content');
      return;
    }

    const updatedNote = await updateNote(selectedNote.id, newNoteTitle, newNoteContent);
    if (updatedNote) {
      setSelectedNote(updatedNote);
      setIsEditing(false);
      setNewNoteTitle('');
      setNewNoteContent('');
    }
  };

  const startEdit = () => {
    if (selectedNote) {
      setNewNoteTitle(selectedNote.title);
      setNewNoteContent(selectedNote.content);
      setIsEditing(true);
    }
  };

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast.error('Failed to sign out');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-80 bg-white border-r border-gray-200 min-h-screen">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold text-gray-900">AI Notes</h1>
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-1 text-sm text-gray-600">
                  <User className="h-4 w-4" />
                  <span className="truncate max-w-24">{user.email}</span>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleSignOut}
                  className="h-8 w-8 p-0"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="space-y-2">
              <Button 
                onClick={() => setIsCreating(true)}
                className="w-full justify-start"
              >
                <Plus className="mr-2 h-4 w-4" />
                New Note
              </Button>
              
              <div className="flex gap-2">
                <label className="flex-1">
                  <input
                    type="file"
                    accept=".txt"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <span>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload
                    </span>
                  </Button>
                </label>
                
                <Button 
                  variant="outline" 
                  onClick={handlePasteContent}
                  className="flex-1 justify-start"
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Paste
                </Button>
              </div>

              <Button 
                onClick={handleBulkSummarize}
                disabled={notes.length === 0 || isLoadingBulkSummary}
                className="w-full justify-start bg-purple-600 hover:bg-purple-700"
              >
                <Sparkles className="mr-2 h-4 w-4" />
                {isLoadingBulkSummary ? 'Summarizing...' : 'Summarize All'}
              </Button>
            </div>
          </div>

          {/* Notes List */}
          <div className="p-4 space-y-3">
            {notesLoading ? (
              <div className="text-center text-gray-500 py-8">Loading notes...</div>
            ) : notes.length === 0 ? (
              <div className="text-center text-gray-500 py-8">No notes yet. Create your first note!</div>
            ) : (
              notes.map((note) => (
                <Card 
                  key={note.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedNote?.id === note.id ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                  }`}
                  onClick={() => setSelectedNote(note)}
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium truncate">
                      {note.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                      {note.content}
                    </p>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-400">
                        {new Date(note.created_at).toLocaleDateString()}
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteNote(note.id);
                        }}
                        className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-8">
          {isCreating || isEditing ? (
            <Card className="max-w-4xl">
              <CardHeader>
                <CardTitle>
                  {isEditing ? 'Edit Note' : 'Create New Note'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  placeholder="Note title..."
                  value={newNoteTitle}
                  onChange={(e) => setNewNoteTitle(e.target.value)}
                />
                <Textarea
                  placeholder="Start writing your note..."
                  value={newNoteContent}
                  onChange={(e) => setNewNoteContent(e.target.value)}
                  rows={15}
                />
                <div className="flex gap-2">
                  <Button onClick={isEditing ? handleUpdateNote : handleCreateNote}>
                    {isEditing ? 'Update Note' : 'Create Note'}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setIsCreating(false);
                      setIsEditing(false);
                      setNewNoteTitle('');
                      setNewNoteContent('');
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : selectedNote ? (
            <div className="max-w-4xl space-y-6">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    {selectedNote.title}
                  </h1>
                  <p className="text-gray-500">
                    Created {new Date(selectedNote.created_at).toLocaleDateString()} • 
                    Updated {new Date(selectedNote.updated_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={startEdit}
                    variant="outline"
                    size="sm"
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                  <Button
                    onClick={() => handleSummarizeNote(selectedNote.id)}
                    disabled={isLoadingSummary}
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Brain className="mr-2 h-4 w-4" />
                    {isLoadingSummary ? 'Summarizing...' : 'AI Summary'}
                  </Button>
                </div>
              </div>

              <Card>
                <CardContent className="pt-6">
                  <div className="prose max-w-none">
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {selectedNote.content}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <FileText className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  No Note Selected
                </h2>
                <p className="text-gray-600">
                  Select a note from the sidebar or create a new one
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <SummaryModal
        isOpen={summaryModal.isOpen}
        onClose={() => setSummaryModal({ isOpen: false, title: '', summary: '' })}
        title={summaryModal.title}
        summary={summaryModal.summary}
      />
    </div>
  );
};

export default Index;
