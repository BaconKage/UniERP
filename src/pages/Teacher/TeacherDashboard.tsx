import React, { useEffect, useState } from 'react';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Users, BookOpen, Calendar, Bell } from 'lucide-react';
import { format } from 'date-fns';
import { Announcement, User } from '../../types';
import { Link } from 'react-router-dom';

const TeacherDashboard = () => {
  const { userProfile } = useAuth();
  const [students, setStudents] = useState<User[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userProfile) return;

    // Set up real-time listeners
    const studentsQuery = query(
      collection(db, 'users'),
      where('role', '==', 'student'),
      orderBy('createdAt', 'desc')
    );

    const announcementsQuery = query(
      collection(db, 'announcements'),
      where('createdBy', '==', userProfile.uid),
      orderBy('createdAt', 'desc'),
      limit(5)
    );

    const unsubscribeStudents = onSnapshot(studentsQuery, (snapshot) => {
      const studentsData = snapshot.docs.map((doc) => ({
        uid: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      })) as User[];
      setStudents(studentsData);
      setLoading(false);
    });

    const unsubscribeAnnouncements = onSnapshot(announcementsQuery, (snapshot) => {
      const announcementsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      })) as Announcement[];
      setAnnouncements(announcementsData);
    });

    return () => {
      unsubscribeStudents();
      unsubscribeAnnouncements();
    };
  }, [userProfile]);

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Teacher Dashboard</h1>
          <p className="text-gray-600">Welcome back, {userProfile?.name}</p>
        </div>
        <div className="flex space-x-3">
          <Link to="/teacher/attendance">
            <Button variant="secondary" icon={<Calendar size={18} />}>
              Mark Attendance
            </Button>
          </Link>
          <Link to="/teacher/announcements">
            <Button icon={<Bell size={18} />}>
              New Announcement
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="bg-indigo-50 border-l-4 border-indigo-500">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-indigo-500 bg-opacity-10">
              <Users className="h-6 w-6 text-indigo-500" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Students</h3>
              <p className="text-2xl font-bold text-indigo-600">{students.length}</p>
            </div>
          </div>
        </Card>

        <Link to="/teacher/grades" className="block">
          <Card className="bg-green-50 border-l-4 border-green-500 h-full hover:shadow-lg transition-shadow">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-500 bg-opacity-10">
                <BookOpen className="h-6 w-6 text-green-500" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Grade Management</h3>
                <p className="text-sm text-gray-600">Manage student grades</p>
              </div>
            </div>
          </Card>
        </Link>

        <Link to="/teacher/announcements" className="block">
          <Card className="bg-blue-50 border-l-4 border-blue-500 h-full hover:shadow-lg transition-shadow">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-500 bg-opacity-10">
                <Bell className="h-6 w-6 text-blue-500" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Announcements</h3>
                <p className="text-sm text-gray-600">Recent announcements: {announcements.length}</p>
              </div>
            </div>
          </Card>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="text-lg font-semibold mb-4">Recent Announcements</h3>
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
                  <div className="mt-2 flex gap-2">
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
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500">
              No announcements yet
              <div className="mt-2">
                <Link to="/teacher/announcements">
                  <Button size="sm">Create Announcement</Button>
                </Link>
              </div>
            </div>
          )}
        </Card>

        <Card>
          <h3 className="text-lg font-semibold mb-4">Student List</h3>
          {loading ? (
            <div className="animate-pulse space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-200 rounded"></div>
              ))}
            </div>
          ) : students.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {students.map((student) => (
                <div key={student.uid} className="py-3 flex justify-between items-center">
                  <div>
                    <p className="font-medium text-gray-900">{student.name}</p>
                    <p className="text-sm text-gray-500">{student.email}</p>
                  </div>
                  <Link to={`/teacher/grades?student=${student.uid}`}>
                    <Button size="sm" variant="outline" icon={<BookOpen size={16} />}>
                      Add Grade
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500">No students found</div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default TeacherDashboard;