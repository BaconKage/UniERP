import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, where } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Card } from '../../components/ui/Card';
import { BarChart as BarChartIcon, PieChart as PieChartIcon, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Grade, Attendance, User } from '../../types';

const Analytics = () => {
  const [gradeData, setGradeData] = useState<Grade[]>([]);
  const [attendanceData, setAttendanceData] = useState<Attendance[]>([]);
  const [userData, setUserData] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch grades
        const gradesSnapshot = await getDocs(collection(db, 'grades'));
        const grades = gradesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date()
        })) as Grade[];
        setGradeData(grades);

        // Fetch attendance
        const attendanceSnapshot = await getDocs(collection(db, 'attendance'));
        const attendance = attendanceSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          date: doc.data().date?.toDate() || new Date(),
          createdAt: doc.data().createdAt?.toDate() || new Date()
        })) as Attendance[];
        setAttendanceData(attendance);

        // Fetch users
        const usersSnapshot = await getDocs(collection(db, 'users'));
        const users = usersSnapshot.docs.map(doc => ({
          uid: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date()
        })) as User[];
        setUserData(users);

        setLoading(false);
      } catch (error) {
        console.error('Error fetching analytics data:', error);
      }
    };

    fetchData();
  }, []);

  const averageGradesBySubject = gradeData.reduce((acc, grade) => {
    if (!acc[grade.subject]) {
      acc[grade.subject] = { total: 0, count: 0 };
    }
    acc[grade.subject].total += grade.marks;
    acc[grade.subject].count += 1;
    return acc;
  }, {} as Record<string, { total: number; count: number }>);

  const gradeDistributionData = Object.entries(averageGradesBySubject).map(([subject, data]) => ({
    subject,
    average: Math.round(data.total / data.count)
  }));

  const attendanceDistribution = attendanceData.reduce((acc, record) => {
    acc[record.status] = (acc[record.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const attendancePieData = Object.entries(attendanceDistribution).map(([status, count]) => ({
    name: status.charAt(0).toUpperCase() + status.slice(1),
    value: count
  }));

  const COLORS = ['#4CAF50', '#f44336', '#FFC107'];

  const usersByRole = userData.reduce((acc, user) => {
    acc[user.role] = (acc[user.role] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
        <p className="text-gray-600">Comprehensive system analytics and statistics</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-64 bg-gray-200 rounded-lg"></div>
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Total Users</h3>
                <TrendingUp className="h-6 w-6 text-blue-500" />
              </div>
              <p className="text-3xl font-bold">{userData.length}</p>
              <div className="mt-4">
                <div className="flex justify-between text-sm">
                  <span>Students: {usersByRole.student || 0}</span>
                  <span>Teachers: {usersByRole.teacher || 0}</span>
                  <span>Admins: {usersByRole.admin || 0}</span>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Average Grade</h3>
                <BarChartIcon className="h-6 w-6 text-green-500" />
              </div>
              <p className="text-3xl font-bold">
                {Math.round(gradeData.reduce((acc, grade) => acc + grade.marks, 0) / gradeData.length || 0)}%
              </p>
              <p className="text-sm text-gray-600 mt-2">Across all subjects</p>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Attendance Rate</h3>
                <PieChartIcon className="h-6 w-6 text-purple-500" />
              </div>
              <p className="text-3xl font-bold">
                {Math.round((attendanceData.filter(a => a.status === 'present').length / attendanceData.length) * 100 || 0)}%
              </p>
              <p className="text-sm text-gray-600 mt-2">Overall attendance rate</p>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Grade Distribution by Subject</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={gradeDistributionData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="subject" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="average" fill="#4CAF50" name="Average Grade (%)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Attendance Distribution</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={attendancePieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {attendancePieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};

export default Analytics;