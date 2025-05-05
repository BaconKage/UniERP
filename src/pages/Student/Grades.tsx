import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Grade } from '../../types';
import { Search, BookOpen, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const Grades = () => {
  const { userProfile } = useAuth();
  const [grades, setGrades] = useState<Grade[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!userProfile) return;

    const gradesQuery = query(
      collection(db, 'grades'),
      where('studentId', '==', userProfile.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(gradesQuery, (snapshot) => {
      const gradesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      })) as Grade[];
      setGrades(gradesData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userProfile]);

  const filteredGrades = grades.filter(grade =>
    grade.subject.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getGradeColor = (marks: number) => {
    if (marks >= 90) return 'text-green-600';
    if (marks >= 80) return 'text-blue-600';
    if (marks >= 70) return 'text-yellow-600';
    if (marks >= 60) return 'text-orange-600';
    return 'text-red-600';
  };

  const calculateAverageGrade = () => {
    if (grades.length === 0) return 0;
    return Math.round(grades.reduce((sum, grade) => sum + grade.marks, 0) / grades.length);
  };

  const gradesBySubject = grades.reduce((acc, grade) => {
    if (!acc[grade.subject]) {
      acc[grade.subject] = [];
    }
    acc[grade.subject].push(grade.marks);
    return acc;
  }, {} as Record<string, number[]>);

  const chartData = Object.entries(gradesBySubject).map(([subject, marks]) => ({
    subject,
    average: Math.round(marks.reduce((a, b) => a + b, 0) / marks.length),
  }));

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Grades</h1>
        <p className="text-gray-600">View and track your academic performance</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="bg-indigo-50 border-l-4 border-indigo-500">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-indigo-500 bg-opacity-10">
              <BookOpen className="h-6 w-6 text-indigo-500" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Average Grade</h3>
              <p className="text-2xl font-bold text-indigo-600">{calculateAverageGrade()}%</p>
            </div>
          </div>
        </Card>

        <Card className="bg-green-50 border-l-4 border-green-500">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-500 bg-opacity-10">
              <TrendingUp className="h-6 w-6 text-green-500" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Total Subjects</h3>
              <p className="text-2xl font-bold text-green-600">{Object.keys(gradesBySubject).length}</p>
            </div>
          </div>
        </Card>

        <Card className="bg-blue-50 border-l-4 border-blue-500">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-500 bg-opacity-10">
              <BookOpen className="h-6 w-6 text-blue-500" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Total Grades</h3>
              <p className="text-2xl font-bold text-blue-600">{grades.length}</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4">Grade History</h3>
            <div className="relative">
              <Input
                id="search"
                type="text"
                placeholder="Search by subject..."
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
                <div key={i} className="h-16 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          ) : filteredGrades.length > 0 ? (
            <div className="space-y-4">
              {filteredGrades.map((grade) => (
                <div
                  key={grade.id}
                  className="p-4 bg-gray-50 rounded-lg"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-medium text-gray-900">{grade.subject}</h4>
                      <p className="text-sm text-gray-600">{grade.comments}</p>
                    </div>
                    <div className="text-right">
                      <span className={`text-lg font-bold ${getGradeColor(grade.marks)}`}>
                        {grade.marks}%
                      </span>
                      <p className="text-xs text-gray-500">
                        {format(grade.createdAt, 'MMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-gray-500">
              <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>No grades found</p>
            </div>
          )}
        </Card>

        <Card>
          <h3 className="text-lg font-semibold mb-4">Grade Distribution</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="subject" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="average" fill="#4F46E5" name="Average Grade (%)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Grades;
