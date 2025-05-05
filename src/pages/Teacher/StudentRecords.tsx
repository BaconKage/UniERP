import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { User, Grade, Attendance } from '../../types';
import { Search, Trash2, BookOpen, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const StudentRecords = () => {
  const { userProfile } = useAuth();
  const [students, setStudents] = useState<User[]>([]);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [grades, setGrades] = useState<Grade[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [view, setView] = useState<'grades' | 'attendance'>('grades');

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const studentsQuery = query(
          collection(db, 'users'),
          where('role', '==', 'student'),
          orderBy('name')
        );
        const snapshot = await getDocs(studentsQuery);
        const studentsData = snapshot.docs.map(doc => ({
          uid: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date()
        })) as User[];
        setStudents(studentsData);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching students:', error);
        toast.error('Failed to fetch students');
      }
    };

    fetchStudents();
  }, []);

  useEffect(() => {
    if (!selectedStudent) return;

    const fetchRecords = async () => {
      setLoading(true);
      try {
        // Fetch grades
        const gradesQuery = query(
          collection(db, 'grades'),
          where('studentId', '==', selectedStudent),
          orderBy('createdAt', 'desc')
        );
        const gradesSnapshot = await getDocs(gradesQuery);
        const gradesData = gradesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date()
        })) as Grade[];
        setGrades(gradesData);

        // Fetch attendance
        const attendanceQuery = query(
          collection(db, 'attendance'),
          where('studentId', '==', selectedStudent),
          orderBy('date', 'desc')
        );
        const attendanceSnapshot = await getDocs(attendanceQuery);
        const attendanceData = attendanceSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          date: doc.data().date?.toDate() || new Date(),
          createdAt: doc.data().createdAt?.toDate() || new Date()
        })) as Attendance[];
        setAttendance(attendanceData);
      } catch (error) {
        console.error('Error fetching records:', error);
        toast.error('Failed to fetch student records');
      } finally {
        setLoading(false);
      }
    };

    fetchRecords();
  }, [selectedStudent]);

  const handleDeleteGrade = async (gradeId: string) => {
    if (!window.confirm('Are you sure you want to delete this grade?')) {
      return;
    }

    setDeleting(gradeId);
    try {
      await deleteDoc(doc(db, 'grades', gradeId));
      setGrades(prev => prev.filter(grade => grade.id !== gradeId));
      toast.success('Grade deleted successfully');
    } catch (error) {
      console.error('Error deleting grade:', error);
      toast.error('Failed to delete grade');
    } finally {
      setDeleting(null);
    }
  };

  const handleDeleteAttendance = async (attendanceId: string) => {
    if (!window.confirm('Are you sure you want to delete this attendance record?')) {
      return;
    }

    setDeleting(attendanceId);
    try {
      await deleteDoc(doc(db, 'attendance', attendanceId));
      setAttendance(prev => prev.filter(record => record.id !== attendanceId));
      toast.success('Attendance record deleted successfully');
    } catch (error) {
      console.error('Error deleting attendance record:', error);
      toast.error('Failed to delete attendance record');
    } finally {
      setDeleting(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present':
        return 'bg-green-100 text-green-800';
      case 'absent':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getGradeColor = (marks: number) => {
    if (marks >= 90) return 'text-green-600';
    if (marks >= 80) return 'text-blue-600';
    if (marks >= 70) return 'text-yellow-600';
    if (marks >= 60) return 'text-orange-600';
    return 'text-red-600';
  };

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Student Records</h1>
        <p className="text-gray-600">View and manage individual student records</p>
      </div>

      <Card>
        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Input
                  id="search"
                  type="text"
                  placeholder="Search students..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
                <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              </div>
            </div>
            <div className="w-48">
              <Select
                id="student"
                value={selectedStudent}
                onChange={(e) => setSelectedStudent(e.target.value)}
                options={filteredStudents.map(student => ({
                  value: student.uid,
                  label: student.name
                }))}
              />
            </div>
          </div>

          {selectedStudent && (
            <div className="flex gap-4 border-b pb-4">
              <Button
                variant={view === 'grades' ? 'primary' : 'outline'}
                onClick={() => setView('grades')}
                icon={<BookOpen size={18} />}
              >
                Grades
              </Button>
              <Button
                variant={view === 'attendance' ? 'primary' : 'outline'}
                onClick={() => setView('attendance')}
                icon={<Calendar size={18} />}
              >
                Attendance
              </Button>
            </div>
          )}

          {loading ? (
            <div className="animate-pulse space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          ) : selectedStudent ? (
            view === 'grades' ? (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Grade History</h3>
                {grades.length > 0 ? (
                  grades.map(grade => (
                    <div
                      key={grade.id}
                      className="p-4 bg-gray-50 rounded-lg flex justify-between items-center"
                    >
                      <div>
                        <h4 className="font-medium text-gray-900">{grade.subject}</h4>
                        <p className="text-sm text-gray-500">
                          {format(grade.createdAt, 'MMM d, yyyy')}
                        </p>
                        {grade.comments && (
                          <p className="text-sm text-gray-600 mt-1">{grade.comments}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-4">
                        <span className={`text-lg font-bold ${getGradeColor(grade.marks)}`}>
                          {grade.marks}%
                        </span>
                        <Button
                          variant="danger"
                          size="sm"
                          icon={<Trash2 size={16} />}
                          onClick={() => handleDeleteGrade(grade.id)}
                          loading={deleting === grade.id}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-gray-500">
                    No grades found for this student
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Attendance History</h3>
                {attendance.length > 0 ? (
                  attendance.map(record => (
                    <div
                      key={record.id}
                      className="p-4 bg-gray-50 rounded-lg flex justify-between items-center"
                    >
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {format(record.date, 'EEEE, MMMM d, yyyy')}
                        </h4>
                        <span className={`inline-block mt-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(record.status)}`}>
                          {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                        </span>
                      </div>
                      <Button
                        variant="danger"
                        size="sm"
                        icon={<Trash2 size={16} />}
                        onClick={() => handleDeleteAttendance(record.id)}
                        loading={deleting === record.id}
                      >
                        Delete
                      </Button>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-gray-500">
                    No attendance records found for this student
                  </div>
                )}
              </div>
            )
          ) : (
            <div className="text-center py-12 text-gray-500">
              Select a student to view their records
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default StudentRecords;