import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, addDoc, serverTimestamp, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import { User, Grade } from '../../types';
import toast from 'react-hot-toast';
import { Award, Search, BookOpen } from 'lucide-react';
import { format } from 'date-fns';

const GradeManagement = () => {
  const { userProfile } = useAuth();
  const [students, setStudents] = useState<User[]>([]);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [subject, setSubject] = useState('');
  const [marks, setMarks] = useState('');
  const [comments, setComments] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [recentGrades, setRecentGrades] = useState<Grade[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!userProfile) return;

    // Fetch students
    const fetchStudents = async () => {
      try {
        const studentsQuery = query(
          collection(db, 'users'),
          where('role', '==', 'student')
        );
        const snapshot = await getDocs(studentsQuery);
        const studentsData = snapshot.docs.map(doc => ({
          uid: doc.id,
          ...doc.data()
        })) as User[];
        setStudents(studentsData);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching students:', error);
        toast.error('Failed to fetch students');
      }
    };

    // Listen for recent grades
    const gradesQuery = query(
      collection(db, 'grades'),
      where('createdBy', '==', userProfile.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribeGrades = onSnapshot(gradesQuery, (snapshot) => {
      const gradesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      })) as Grade[];
      setRecentGrades(gradesData);
    });

    fetchStudents();
    return () => unsubscribeGrades();
  }, [userProfile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || !subject || !marks) {
      toast.error('Please fill in all required fields');
      return;
    }

    const numericMarks = parseFloat(marks);
    if (isNaN(numericMarks) || numericMarks < 0 || numericMarks > 100) {
      toast.error('Marks must be between 0 and 100');
      return;
    }

    setSubmitting(true);
    try {
      const selectedStudentData = students.find(s => s.uid === selectedStudent);
      await addDoc(collection(db, 'grades'), {
        studentId: selectedStudent,
        studentName: selectedStudentData?.name || '',
        subject,
        marks: numericMarks,
        comments,
        createdBy: userProfile?.uid,
        createdByName: userProfile?.name,
        createdAt: serverTimestamp()
      });

      toast.success('Grade added successfully');
      setSelectedStudent('');
      setSubject('');
      setMarks('');
      setComments('');
    } catch (error) {
      console.error('Error adding grade:', error);
      toast.error('Failed to add grade');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredGrades = recentGrades.filter(grade => 
    grade.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    grade.subject.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getGradeColor = (marks: number) => {
    if (marks >= 90) return 'text-green-600';
    if (marks >= 80) return 'text-blue-600';
    if (marks >= 70) return 'text-yellow-600';
    if (marks >= 60) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Grade Management</h1>
        <p className="text-gray-600">Add and manage student grades</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <Card>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Select
                id="student"
                label="Student"
                value={selectedStudent}
                onChange={(e) => setSelectedStudent(e.target.value)}
                options={students.map(student => ({
                  value: student.uid,
                  label: student.name
                }))}
                disabled={loading}
              />
              <Input
                id="subject"
                label="Subject"
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
              />
              <Input
                id="marks"
                label="Marks (%)"
                type="number"
                min="0"
                max="100"
                value={marks}
                onChange={(e) => setMarks(e.target.value)}
                required
              />
              <Input
                id="comments"
                label="Comments"
                type="text"
                value={comments}
                onChange={(e) => setComments(e.target.value)}
              />
              <Button
                type="submit"
                loading={submitting}
                icon={<Award size={18} />}
                fullWidth
              >
                Add Grade
              </Button>
            </form>
          </Card>

          <Card>
            <div className="prose prose-sm">
              <h4 className="text-lg font-semibold mb-4">Grading Guidelines</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-green-600 font-medium">90-100%</span>
                  <span>Excellent</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-blue-600 font-medium">80-89%</span>
                  <span>Very Good</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-yellow-600 font-medium">70-79%</span>
                  <span>Good</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-orange-600 font-medium">60-69%</span>
                  <span>Satisfactory</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-red-600 font-medium">&lt; 60%</span>
                  <span>Needs Improvement</span>
                </div>
              </div>
            </div>
          </Card>
        </div>

        <Card>
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4">Recent Grades</h3>
            <div className="relative">
              <Input
                id="search"
                type="text"
                placeholder="Search by student or subject..."
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
                      <h4 className="font-medium text-gray-900">{grade.studentName}</h4>
                      <p className="text-sm text-gray-600">{grade.subject}</p>
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
                  {grade.comments && (
                    <p className="text-sm text-gray-600 mt-2">{grade.comments}</p>
                  )}
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
      </div>
    </div>
  );
};

export default GradeManagement;