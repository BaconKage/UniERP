import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, deleteDoc, doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Achievement } from '../../types';
import { Award, Search, Trash2, Filter } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const AchievementsManagement = () => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    const achievementsQuery = query(
      collection(db, 'achievements'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(achievementsQuery, (snapshot) => {
      const achievementsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date?.toDate() || new Date(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        reviewedAt: doc.data().reviewedAt?.toDate() || null,
      })) as Achievement[];
      setAchievements(achievementsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleDelete = async (achievementId: string) => {
    if (!window.confirm('Are you sure you want to delete this achievement? This action cannot be undone.')) {
      return;
    }

    setDeleting(achievementId);
    try {
      await deleteDoc(doc(db, 'achievements', achievementId));
      toast.success('Achievement deleted successfully');
    } catch (error) {
      console.error('Error deleting achievement:', error);
      toast.error('Failed to delete achievement');
    } finally {
      setDeleting(null);
    }
  };

  const filteredAchievements = achievements.filter(achievement => {
    const matchesSearch = 
      achievement.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      achievement.title.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = 
      statusFilter === 'all' || 
      achievement.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Achievements Management</h1>
        <p className="text-gray-600">View and manage all student achievements</p>
      </div>

      <Card>
        <div className="mb-6 space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Input
                  id="search"
                  type="text"
                  placeholder="Search by student name or achievement title..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
                <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              </div>
            </div>
            <div className="w-48">
              <Select
                id="status-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                options={[
                  { value: 'all', label: 'All Status' },
                  { value: 'pending', label: 'Pending' },
                  { value: 'approved', label: 'Approved' },
                  { value: 'rejected', label: 'Rejected' }
                ]}
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="animate-pulse space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        ) : filteredAchievements.length > 0 ? (
          <div className="space-y-6">
            {filteredAchievements.map((achievement) => (
              <div
                key={achievement.id}
                className="bg-white border rounded-lg shadow-sm p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center mb-2">
                      <Award className="h-5 w-5 text-indigo-500 mr-2" />
                      <h3 className="text-lg font-medium text-gray-900">
                        {achievement.title}
                      </h3>
                    </div>
                    <p className="text-sm text-gray-600">
                      Student: {achievement.studentName}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      achievement.status === 'approved' ? 'bg-green-100 text-green-800' :
                      achievement.status === 'rejected' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {achievement.status.charAt(0).toUpperCase() + achievement.status.slice(1)}
                    </span>
                    <p className="text-xs text-gray-500 mt-1">
                      {format(achievement.date, 'MMM d, yyyy')}
                    </p>
                  </div>
                </div>

                <p className="text-gray-600 mb-4">{achievement.description}</p>

                <div className="mb-4">
                  <a
                    href={achievement.certificateUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 hover:text-indigo-800 text-sm"
                  >
                    View Certificate
                  </a>
                </div>

                {achievement.status !== 'pending' && achievement.reviewComments && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium text-gray-700">Review Comments:</p>
                    <p className="text-sm text-gray-600">{achievement.reviewComments}</p>
                    <div className="mt-2 text-xs text-gray-500">
                      Reviewed by {achievement.reviewerName} on {format(achievement.reviewedAt!, 'MMM d, yyyy')}
                    </div>
                  </div>
                )}

                <div className="mt-4 flex justify-end">
                  <Button
                    variant="danger"
                    size="sm"
                    icon={<Trash2 size={16} />}
                    onClick={() => handleDelete(achievement.id)}
                    loading={deleting === achievement.id}
                  >
                    Delete Achievement
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Award className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No achievements found</h3>
            <p className="mt-1 text-sm text-gray-500">
              Try adjusting your search filters
            </p>
          </div>
        )}
      </Card>
    </div>
  );
};

export default AchievementsManagement;