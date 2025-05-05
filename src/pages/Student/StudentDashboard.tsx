import React, { useEffect, useState } from 'react';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { BookOpen, Calendar, Bell, Award } from 'lucide-react';
import { format } from 'date-fns';
import { Announcement, Attendance, Grade, Achievement } from '../../types';
import { Link } from 'react-router-dom';

const StudentDashboard = () => {
  const { userProfile } = useAuth();
  const [recentAttendance, setRecentAttendance] = useState<Attendance[]>([]);
  const [recentGrades, setRecentGrades] = useState<Grade[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userProfile) return;

    // Set up real-time listeners
    const attendanceQuery = query(
      collection(db, 'attendance'),
      where('studentId', '==', userProfile.uid),
      orderBy('date', 'desc'),
      limit(5)
    );

    const gradesQuery = query(
      collection(db, 'grades'),
      where('studentId', '==', userProfile.uid),
      orderBy('createdAt', 'desc'),
      limit(5)
    );

    const announcementsQuery = query(
      collection(db, 'announcements'),
      where('visibleTo', 'array-contains', userProfile.role),
      orderBy('createdAt', 'desc'),
      limit(5)
    );

    const achievementsQuery = query(
      collection(db, 'achievements'),
      where('studentId', '==', userProfile.uid),
      orderBy('createdAt', 'desc'),
      limit(5)
    );

    const unsubscribeAttendance = onSnapshot(attendanceQuery, (snapshot) => {
      const attendanceData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date?.toDate() || new Date(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      })) as Attendance[];
      setRecentAttendance(attendanceData);
    });

    const unsubscribeGrades = onSnapshot(gradesQuery, (snapshot) => {
      const gradesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      })) as Grade[];
      setRecentGrades(gradesData);
    });

    const unsubscribeAnnouncements = onSnapshot(announcementsQuery, (snapshot) => {
      const announcementsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      })) as Announcement[];
      setAnnouncements(announcementsData);
    });

    const unsubscribeAchievements = onSnapshot(achievementsQuery, (snapshot) => {
      const achievementsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date?.toDate() || new Date(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      })) as Achievement[];
      setAchievements(achievementsData);
      setLoading(false);
    });

    return () => {
      unsubscribeAttendance();
      unsubscribeGrades();
      unsubscribeAnnouncements();
      unsubscribeAchievements();
    };
  }, [userProfile]);

  const calculateAttendancePercentage = () => {
    if (recentAttendance.length === 0) return 100;
    const present = recentAttendance.filter(a => a.status === 'present').length;
    return Math.round((present / recentAttendance.length) * 100);
  };

  const calculateGPA = () => {
    if (recentGrades.length === 0) return 0;
    const total = recentGrades.reduce((sum, grade) => sum + grade.marks, 0);
    return (total / recentGrades.length / 20).toFixed(1);
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Student Dashboard</h1>
          <p className="text-gray-600">Welcome back, {userProfile?.name}</p>
        </div>
        <Link to="/student/achievements">
          <Button icon={<Award size={18} />}>
            My Achievements
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="bg-indigo-50 border-l-4 border-indigo-500">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-indigo-500 bg-opacity-10">
              <Award className="h-6 w-6 text-indigo-500" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">GPA</h3>
              <p className="text-2xl font-bold text-indigo-600">{calculateGPA()}</p>
            </div>
          </div>
        </Card>

        <Card className="bg-green-50 border-l-4 border-green-500">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-500 bg-opacity-10">
              <Calendar className="h-6 w-6 text-green-500" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Attendance</h3>
              <p className="text-2xl font-bold text-green-600">{calculateAttendancePercentage()}%</p>
            </div>
          </div>
        </Card>

        <Card className="bg-blue-50 border-l-4 border-blue-500">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-500 bg-opacity-10">
              <BookOpen className="h-6 w-6 text-blue-500" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Recent Grades</h3>
              <p className="text-2xl font-bold text-blue-600">{recentGrades.length}</p>
            </div>
          </div>
        </Card>

        <Link to="/student/achievements" className="block">
          <Card className="bg-purple-50 border-l-4 border-purple-500 hover:shadow-lg transition-shadow">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-purple-500 bg-opacity-10">
                <Award className="h-6 w-6 text-purple-500" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Achievements</h3>
                <p className="text-2xl font-bold text-purple-600">{achievements.length}</p>
              </div>
            </div>
          </Card>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Recent Grades">
          {loading ? (
            <div className="animate-pulse space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-200 rounded"></div>
              ))}
            </div>
          ) : recentGrades.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {recentGrades.map((grade) => (
                <div key={grade.id} className="py-3 flex justify-between items-center">
                  <div>
                    <h4 className="font-medium text-gray-900">{grade.subject}</h4>
                    <p className="text-sm text-gray-500">{grade.comments}</p>
                  </div>
                  <div className="text-right">
                    <span className={`font-bold ${
                      grade.marks >= 70 ? 'text-green-600' : 
                      grade.marks >= 60 ? 'text-yellow-600' : 
                      'text-red-600'
                    }`}>
                      {grade.marks}%
                    </span>
                    <p className="text-xs text-gray-500">{format(grade.createdAt, 'MMM d, yyyy')}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500">No grades yet</div>
          )}
        </Card>

        <Card title="Recent Announcements">
          {loading ? (
            <div className="animate-pulse space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-200 rounded"></div>
              ))}
            </div>
          ) : announcements.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {announcements.map((announcement) => (
                <div key={announcement.id} className="py-4">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-gray-900">{announcement.title}</h4>
                    <span className="text-sm text-gray-500">
                      {format(announcement.createdAt, 'MMM d, yyyy')}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{announcement.content}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    By: {announcement.createdByName}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500">No announcements yet</div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default StudentDashboard;