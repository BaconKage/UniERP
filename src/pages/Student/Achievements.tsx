import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, addDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Achievement } from '../../types';
import { Award, Upload, CheckCircle, XCircle, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const Achievements = () => {
  const { userProfile } = useAuth();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [certificateUrl, setCertificateUrl] = useState('');

  useEffect(() => {
    if (!userProfile) return;

    const achievementsQuery = query(
      collection(db, 'achievements'),
      where('studentId', '==', userProfile.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(achievementsQuery, (snapshot) => {
      const achievementsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date?.toDate() || new Date(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      })) as Achievement[];
      setAchievements(achievementsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userProfile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !date || !certificateUrl) {
      toast.error('Please fill in all fields');
      return;
    }

    setSubmitting(true);
    try {
      await addDoc(collection(db, 'achievements'), {
        studentId: userProfile?.uid,
        studentName: userProfile?.name,
        title,
        description,
        date: new Date(date),
        certificateUrl,
        status: 'pending',
        createdAt: serverTimestamp()
      });

      toast.success('Achievement submitted successfully');
      setTitle('');
      setDescription('');
      setDate('');
      setCertificateUrl('');
    } catch (error) {
      console.error('Error submitting achievement:', error);
      toast.error('Failed to submit achievement');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Achievements</h1>
        <p className="text-gray-600">Submit and track your achievements</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="text-lg font-semibold mb-4">Submit New Achievement</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              id="title"
              label="Achievement Title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., First Place in Hackathon"
              required
            />
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your achievement and its significance..."
                required
              />
            </div>
            <Input
              id="date"
              label="Achievement Date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              required
            />
            <Input
              id="certificate"
              label="Certificate URL"
              type="url"
              value={certificateUrl}
              onChange={(e) => setCertificateUrl(e.target.value)}
              placeholder="Link to your certificate or proof"
              required
            />
            <Button
              type="submit"
              loading={submitting}
              icon={<Upload size={18} />}
              fullWidth
            >
              Submit Achievement
            </Button>
          </form>
        </Card>

        <Card>
          <h3 className="text-lg font-semibold mb-4">Achievement History</h3>
          {loading ? (
            <div className="animate-pulse space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          ) : achievements.length > 0 ? (
            <div className="space-y-4">
              {achievements.map((achievement) => (
                <div
                  key={achievement.id}
                  className="p-4 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center">
                      <Award className="h-5 w-5 text-indigo-500 mr-2" />
                      <h4 className="font-medium text-gray-900">{achievement.title}</h4>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full flex items-center ${getStatusColor(achievement.status)}`}>
                      {getStatusIcon(achievement.status)}
                      <span className="ml-1 capitalize">{achievement.status}</span>
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{achievement.description}</p>
                  <div className="flex justify-between items-center text-xs text-gray-500">
                    <span>Date: {format(achievement.date, 'MMM d, yyyy')}</span>
                    <a
                      href={achievement.certificateUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:text-indigo-800"
                    >
                      View Certificate
                    </a>
                  </div>
                  {achievement.reviewComments && (
                    <div className="mt-2 text-sm">
                      <p className="font-medium text-gray-700">Reviewer Comments:</p>
                      <p className="text-gray-600">{achievement.reviewComments}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-gray-500">
              <Award className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>No achievements submitted yet</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Achievements;