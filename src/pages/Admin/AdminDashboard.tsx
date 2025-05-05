import React, { useEffect, useState } from 'react';
import { collection, query, where, orderBy, limit, doc, updateDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Users, CheckCircle, AlertCircle, BarChart, Bell } from 'lucide-react';
import { format } from 'date-fns';
import { User, Announcement } from '../../types';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

const AdminDashboard = () => {
  const { userProfile } = useAuth();
  const [pendingApprovals, setPendingApprovals] = useState<User[]>([]);
  const [recentUsers, setRecentUsers] = useState<User[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [approvingUser, setApprovingUser] = useState<string | null>(null);

  useEffect(() => {
    if (!userProfile) return;

    // Set up real-time listeners
    const usersQuery = query(
      collection(db, 'users'),
      orderBy('createdAt', 'desc')
    );

    const pendingQuery = query(
      collection(db, 'users'),
      where('approved', '==', false),
      where('role', 'in', ['teacher', 'admin']),
      orderBy('createdAt', 'desc')
    );

    const announcementsQuery = query(
      collection(db, 'announcements'),
      orderBy('createdAt', 'desc'),
      limit(5)
    );

    const unsubscribeUsers = onSnapshot(usersQuery, (snapshot) => {
      const usersData = snapshot.docs.map((doc) => ({
        uid: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      })) as User[];
      setRecentUsers(usersData);
      setLoading(false);
    });

    const unsubscribePending = onSnapshot(pendingQuery, (snapshot) => {
      const pendingData = snapshot.docs.map((doc) => ({
        uid: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      })) as User[];
      setPendingApprovals(pendingData);
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
      unsubscribeUsers();
      unsubscribePending();
      unsubscribeAnnouncements();
    };
  }, [userProfile]);

  const approveUser = async (userId: string) => {
    try {
      setApprovingUser(userId);
      await updateDoc(doc(db, 'users', userId), { approved: true });
      toast.success('User approved successfully');
    } catch (error) {
      console.error('Error approving user:', error);
      toast.error('Failed to approve user');
    } finally {
      setApprovingUser(null);
    }
  };

  const countByRole = (role: string) => {
    return recentUsers.filter((user) => user.role === role).length;
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600">Welcome back, {userProfile?.name}</p>
        </div>
        <div className="flex space-x-3">
          <Link to="/admin/users">
            <Button variant="secondary" icon={<Users size={18} />}>
              Manage Users
            </Button>
          </Link>
          <Link to="/admin/analytics">
            <Button variant="secondary" icon={<BarChart size={18} />}>
              View Analytics
            </Button>
          </Link>
          <Link to="/teacher/announcements">
            <Button icon={<Bell size={18} />}>
              New Announcement
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="bg-indigo-50 border-l-4 border-indigo-500">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-indigo-500 bg-opacity-10">
              <Users className="h-6 w-6 text-indigo-500" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Total Users</h3>
              <p className="text-2xl font-bold text-indigo-600">{recentUsers.length}</p>
            </div>
          </div>
        </Card>

        <Card className="bg-green-50 border-l-4 border-green-500">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-500 bg-opacity-10">
              <Users className="h-6 w-6 text-green-500" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Students</h3>
              <p className="text-2xl font-bold text-green-600">{countByRole('student')}</p>
            </div>
          </div>
        </Card>

        <Card className="bg-blue-50 border-l-4 border-blue-500">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-500 bg-opacity-10">
              <Users className="h-6 w-6 text-blue-500" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Teachers</h3>
              <p className="text-2xl font-bold text-blue-600">{countByRole('teacher')}</p>
            </div>
          </div>
        </Card>

        <Card className="bg-yellow-50 border-l-4 border-yellow-500">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-500 bg-opacity-10">
              <AlertCircle className="h-6 w-6 text-yellow-500" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Pending</h3>
              <p className="text-2xl font-bold text-yellow-600">{pendingApprovals.length}</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="text-lg font-semibold mb-4">Pending Approvals</h3>
          {loading ? (
            <div className="animate-pulse space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-200 rounded"></div>
              ))}
            </div>
          ) : pendingApprovals.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {pendingApprovals.map((user) => (
                <div key={user.uid} className="py-4 flex justify-between items-center">
                  <div>
                    <p className="font-medium text-gray-900">{user.name}</p>
                    <p className="text-sm text-gray-500">{user.email}</p>
                    <span className="inline-block mt-1 px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 capitalize">
                      {user.role}
                    </span>
                  </div>
                  <Button
                    onClick={() => approveUser(user.uid)}
                    loading={approvingUser === user.uid}
                    size="sm"
                    icon={<CheckCircle size={16} />}
                    variant="secondary"
                  >
                    Approve
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500">No pending approvals</div>
          )}
        </Card>

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
                  <p className="text-sm text-gray-600 mb-2">{announcement.content}</p>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-500">By: {announcement.createdByName}</span>
                    <div className="flex gap-1">
                      {announcement.visibleTo.map((role) => (
                        <span
                          key={role}
                          className="px-2 py-1 bg-indigo-100 text-indigo-800 rounded-full"
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
            <div className="text-center py-4 text-gray-500">No announcements yet</div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;