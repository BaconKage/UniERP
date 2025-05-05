import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Announcement } from '../../types';
import { Bell, Search } from 'lucide-react';
import { format } from 'date-fns';

const Announcements = () => {
  const { userProfile } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!userProfile) return;

    const announcementsQuery = query(
      collection(db, 'announcements'),
      where('visibleTo', 'array-contains', userProfile.role),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(announcementsQuery, (snapshot) => {
      const announcementsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      })) as Announcement[];
      setAnnouncements(announcementsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userProfile]);

  const filteredAnnouncements = announcements.filter(announcement =>
    (announcement.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (announcement.content || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (announcement.createdByName || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Announcements</h1>
        <p className="text-gray-600">View all announcements</p>
      </div>

      <Card>
        <div className="mb-6">
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
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        ) : filteredAnnouncements.length > 0 ? (
          <div className="space-y-6">
            {filteredAnnouncements.map((announcement) => (
              <div
                key={announcement.id}
                className="bg-white border rounded-lg shadow-sm p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <Bell className="h-5 w-5 text-indigo-500 mr-2" />
                    <h3 className="text-lg font-medium text-gray-900">
                      {announcement.title}
                    </h3>
                  </div>
                  <span className="text-sm text-gray-500">
                    {format(announcement.createdAt, 'MMM d, yyyy')}
                  </span>
                </div>
                <p className="text-gray-600 mb-4">{announcement.content}</p>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">
                    Posted by: {announcement.createdByName}
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
              Try adjusting your search terms
            </p>
          </div>
        )}
      </Card>
    </div>
  );
};

export default Announcements;