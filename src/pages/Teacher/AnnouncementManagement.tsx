import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, addDoc, serverTimestamp, deleteDoc, doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { UserRole, Announcement } from '../../types';
import toast from 'react-hot-toast';
import { Bell, Send, Trash2, Search } from 'lucide-react';
import { format } from 'date-fns';

const AnnouncementManagement = () => {
  const { userProfile } = useAuth();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [visibleTo, setVisibleTo] = useState<UserRole[]>(['student']);
  const [submitting, setSubmitting] = useState(false);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    if (!userProfile) return;

    // Query based on user role
    const queries = [];

    if (userProfile.role === 'admin') {
      // Admins see all announcements
      queries.push(
        query(
          collection(db, 'announcements'),
          orderBy('createdAt', 'desc')
        )
      );
    } else {
      // Teachers see their own announcements
      queries.push(
        query(
          collection(db, 'announcements'),
          where('createdBy', '==', userProfile.uid),
          orderBy('createdAt', 'desc')
        )
      );
      // And admin announcements visible to teachers
      queries.push(
        query(
          collection(db, 'announcements'),
          where('createdByRole', '==', 'admin'),
          where('visibleTo', 'array-contains', 'teacher'),
          orderBy('createdAt', 'desc')
        )
      );
    }

    const unsubscribes = queries.map(query =>
      onSnapshot(query, (snapshot) => {
        const announcementsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
        })) as Announcement[];

        setAnnouncements(prev => {
          // Combine announcements and remove duplicates
          const combined = [...prev, ...announcementsData];
          const unique = Array.from(new Map(combined.map(item => [item.id, item])).values());
          return unique.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        });
        setLoading(false);
      })
    );

    return () => unsubscribes.forEach(unsubscribe => unsubscribe());
  }, [userProfile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    try {
      await addDoc(collection(db, 'announcements'), {
        title,
        content,
        visibleTo,
        createdBy: userProfile?.uid,
        createdByName: userProfile?.name,
        createdByRole: userProfile?.role,
        createdAt: serverTimestamp()
      });

      toast.success('Announcement created successfully');
      setTitle('');
      setContent('');
      setVisibleTo(['student']);
    } catch (error) {
      console.error('Error creating announcement:', error);
      toast.error('Failed to create announcement');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (announcementId: string) => {
    if (!window.confirm('Are you sure you want to delete this announcement?')) {
      return;
    }

    setDeleting(announcementId);
    try {
      await deleteDoc(doc(db, 'announcements', announcementId));
      toast.success('Announcement deleted successfully');
    } catch (error) {
      console.error('Error deleting announcement:', error);
      toast.error('Failed to delete announcement');
    } finally {
      setDeleting(null);
    }
  };

  const toggleRole = (role: UserRole) => {
    setVisibleTo(prev =>
      prev.includes(role)
        ? prev.filter(r => r !== role)
        : [...prev, role]
    );
  };

  const filteredAnnouncements = announcements.filter(announcement =>
    announcement.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    announcement.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Determine which roles can be selected based on user's role
  const availableRoles = userProfile?.role === 'admin'
    ? ['student', 'teacher', 'admin'] as UserRole[]
    : ['student'] as UserRole[];

  const canDelete = (announcement: Announcement) => {
    return userProfile?.role === 'admin' || announcement.createdBy === userProfile?.uid;
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Announcement Management</h1>
        <p className="text-gray-600">Create and manage announcements</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Create Announcement">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              id="title"
              label="Title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Content
              </label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                rows={4}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Visible to
              </label>
              <div className="flex flex-wrap gap-2">
                {availableRoles.map(role => (
                  <Button
                    key={role}
                    type="button"
                    size="sm"
                    variant={visibleTo.includes(role) ? 'primary' : 'outline'}
                    onClick={() => toggleRole(role)}
                  >
                    {role.charAt(0).toUpperCase() + role.slice(1)}s
                  </Button>
                ))}
              </div>
            </div>

            <Button
              type="submit"
              loading={submitting}
              icon={<Send size={18} />}
              fullWidth
            >
              Create Announcement
            </Button>
          </form>
        </Card>

        <Card>
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4">Announcements</h3>
            <div className="relative">
              <Input
                id="search"
                type="text"
                placeholder="Search announcements..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
              <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            </div>
          </div>

          {loading ? (
            <div className="animate-pulse space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          ) : filteredAnnouncements.length > 0 ? (
            <div className="space-y-4">
              {filteredAnnouncements.map((announcement) => (
                <div
                  key={announcement.id}
                  className="p-4 bg-gray-50 rounded-lg"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center">
                      <Bell className="h-5 w-5 text-indigo-500 mr-2" />
                      <div>
                        <h4 className="font-medium text-gray-900">{announcement.title}</h4>
                        <p className="text-sm text-gray-500">
                          By: {announcement.createdByRole === 'admin' ? 'Administrator' : announcement.createdByName}
                        </p>
                      </div>
                    </div>
                    {canDelete(announcement) && (
                      <Button
                        onClick={() => handleDelete(announcement.id)}
                        loading={deleting === announcement.id}
                        variant="danger"
                        size="sm"
                        icon={<Trash2 size={16} />}
                      >
                        Delete
                      </Button>
                    )}
                  </div>
                  <p className="text-gray-600 mb-2">{announcement.content}</p>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">
                      {format(announcement.createdAt, 'MMM d, yyyy')}
                    </span>
                    <div className="flex gap-2">
                      {announcement.visibleTo.map((role) => (
                        <span
                          key={role}
                          className="px-2 py-1 bg-indigo-100 text-indigo-800 rounded-full text-xs"
                        >
                          {role}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Bell className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No announcements found</h3>
              <p className="mt-1 text-sm text-gray-500">
                Create your first announcement to get started
              </p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default AnnouncementManagement;