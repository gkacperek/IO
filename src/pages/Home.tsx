import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { PlusCircle, Trash2, Download, BookOpen, User, Calendar, GraduationCap } from 'lucide-react'
import UserMenu from '../components/UserMenu'
import { supabase } from '../lib/supabase'
import { toast } from 'sonner'

interface Note {
  id: string
  title: string
  created_at: string
  subjects: {
    name: string
  }
  professors: {
    name: string
  }
  user_profiles: {
    username: string
  }
  user_id: string
  file_type: string
  content: string | null
  year: number
  download_count: number
  average_rating: number
}

function Home() {
  const { user } = useAuth()
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSubject, setSelectedSubject] = useState<string>('')
  const [subjects, setSubjects] = useState<{ id: string; name: string }[]>([])

  useEffect(() => {
    fetchNotes()
    fetchSubjects()
  }, [])

  const fetchSubjects = async () => {
    const { data } = await supabase
      .from('subjects')
      .select('id, name')
      .order('name')
    
    if (data) setSubjects(data)
  }

  const fetchNotes = async () => {
    try {
      const { data, error } = await supabase
        .from('notes')
        .select(`
          *,
          subjects (name),
          professors (name),
          user_profiles!notes_user_id_fkey (username)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setNotes(data || [])
    } catch (error) {
      console.error('Error fetching notes:', error)
      toast.error('Nie udało się załadować notatek')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (noteId: string, userId: string) => {
    if (userId !== user?.id) {
      toast.error('Możesz usuwać tylko własne notatki')
      return
    }

    try {
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', noteId)

      if (error) throw error

      setNotes(notes.filter(note => note.id !== noteId))
      toast.success('Notatka została usunięta')
    } catch (error) {
      console.error('Error deleting note:', error)
      toast.error('Nie udało się usunąć notatki')
    }
  }

  const filteredNotes = notes.filter(note => {
    const matchesSearch = note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      note.subjects.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      note.professors.name.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesSubject = !selectedSubject || note.subjects.id === selectedSubject
    
    return matchesSearch && matchesSubject
  })

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center">
            <BookOpen className="h-8 w-8 text-indigo-600 mr-2" />
            <h1 className="text-3xl font-bold text-gray-900">Notatki</h1>
          </div>
          <div className="flex items-center space-x-4">
            <Link
              to="/add-note"
              className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <PlusCircle className="w-5 h-5 mr-2" />
              Dodaj notatkę
            </Link>
            <UserMenu />
          </div>
        </div>

        <div className="mb-8 flex flex-col md:flex-row gap-4">
          <input
            type="text"
            placeholder="Szukaj notatek..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          >
            <option value="">Wszystkie przedmioty</option>
            {subjects.map(subject => (
              <option key={subject.id} value={subject.id}>
                {subject.name}
              </option>
            ))}
          </select>
        </div>

        {filteredNotes.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <p className="text-gray-500">Brak notatek. Dodaj swoją pierwszą notatkę!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredNotes.map((note) => (
              <div key={note.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-all duration-200">
                <div className="p-6">
                  <div className="flex justify-between items-start">
                    <Link to={`/notes/${note.id}`} className="block flex-1">
                      <h2 className="text-xl font-semibold text-gray-900 hover:text-indigo-600 transition-colors">
                        {note.title}
                      </h2>
                    </Link>
                    {note.user_id === user?.id && (
                      <button
                        onClick={() => handleDelete(note.id, note.user_id)}
                        className="text-red-500 hover:text-red-700 ml-2 p-1 rounded-full hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>

                  <div className="mt-4 space-y-2">
                    <div className="flex items-center text-gray-600">
                      <User className="w-4 h-4 mr-2" />
                      <span className="text-sm">{note.user_profiles.username}</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <BookOpen className="w-4 h-4 mr-2" />
                      <span className="text-sm">{note.subjects.name}</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <GraduationCap className="w-4 h-4 mr-2" />
                      <span className="text-sm">{note.professors.name}</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <Calendar className="w-4 h-4 mr-2" />
                      <span className="text-sm">{new Date(note.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-sm font-medium px-2 py-1 rounded-full bg-indigo-50 text-indigo-600">
                      {note.file_type === 'text' ? 'Notatka tekstowa' : note.file_type.toUpperCase()}
                    </span>
                    <div className="flex items-center text-gray-500 text-sm">
                      <Download className="w-4 h-4 mr-1" />
                      {note.download_count || 0}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Home