import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, addDoc, serverTimestamp, Timestamp, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { User, Attendance } from '../../types';
import toast from 'react-hot-toast';
import { Calendar, Check, X, Clock, Trash2 } from 'lucide-react';

const AttendanceManagement = () => {
  const { userProfile } = useAuth();
  const [students, setStudents] = useState<User[]>([]);
  const [attendance, setAttendance] = useState<Record<string, 'present' | 'absent' | 'late'>>({});
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [existingAttendance, setExistingAttendance] = useState<Attendance[]>([]);

  useEffect(() => {
    const fetchStudents = async () => {
      setLoading(true);
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

        // Initialize attendance state
        const initialAttendance: Record<string, 'present' | 'absent' | 'late'> = {};
        studentsData.forEach(student => {
          initialAttendance[student.uid] = 'present';
        });
        setAttendance(initialAttendance);
      } catch (error) {
        console.error('Error fetching students:', error);
        toast.error('Failed to fetch students');
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, []);

  useEffect(() => {
    const checkExistingAttendance = async () => {
      try {
        const startOfDay = new Date(selectedDate);
        startOfDay.setHours(0, 0, 0, 0);
        
        const endOfDay = new Date(selectedDate);
        endOfDay.setHours(23, 59, 59, 999);

        const attendanceQuery = query(
          collection(db, 'attendance'),
          where('date', '>=', Timestamp.fromDate(startOfDay)),
          where('date', '<=', Timestamp.fromDate(endOfDay))
        );

        const snapshot = await getDocs(attendanceQuery);
        const existingRecords = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          date: doc.data().date?.toDate() || new Date(),
          createdAt: doc.data().createdAt?.toDate() || new Date()
        })) as Attendance[];

        setExistingAttendance(existingRecords);

        // Reset attendance state for new date
        const initialAttendance: Record<string, 'present' | 'absent' | 'late'> = {};
        students.forEach(student => {
          const existingRecord = existingRecords.find(record => record.studentId === student.uid);
          initialAttendance[student.uid] = existingRecord?.status || 'present';
        });
        setAttendance(initialAttendance);

      } catch (error) {
        console.error('Error checking existing attendance:', error);
        toast.error('Failed to check existing attendance');
      }
    };

    if (selectedDate && students.length > 0) {
      checkExistingAttendance();
    }
  }, [selectedDate, students]);

  const handleSubmit = async () => {
    if (!selectedDate) {
      toast.error('Please select a date');
      return;
    }

    if (existingAttendance.length > 0) {
      toast.error('Attendance already marked for this date');
      return;
    }

    setSubmitting(true);
    try {
      const date = new Date(selectedDate);
      date.setHours(12, 0, 0, 0); // Set to noon to avoid timezone issues

      const attendancePromises = Object.entries(attendance).map(([studentId, status]) =>
        addDoc(collection(db, 'attendance'), {
          studentId,
          date,
          status,
          markedBy: userProfile?.uid,
          locked: false,
          createdAt: serverTimestamp()
        })
      );

      await Promise.all(attendancePromises);
      toast.success('Attendance marked successfully');

      // Refresh existing attendance
      const startOfDay = new Date(selectedDate);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(selectedDate);
      endOfDay.setHours(23, 59, 59, 999);

      const attendanceQuery = query(
        collection(db, 'attendance'),
        where('date', '>=', Timestamp.fromDate(startOfDay)),
        where('date', '<=', Timestamp.fromDate(endOfDay))
      );

      const snapshot = await getDocs(attendanceQuery);
      const updatedRecords = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date?.toDate() || new Date(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      })) as Attendance[];

      setExistingAttendance(updatedRecords);

    } catch (error) {
      console.error('Error marking attendance:', error);
      toast.error('Failed to mark attendance');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAttendance = async () => {
    if (!window.confirm('Are you sure you want to delete attendance records for this date? This action cannot be undone.')) {
      return;
    }

    setDeleting(true);
    try {
      const deletePromises = existingAttendance.map(record =>
        deleteDoc(doc(db, 'attendance', record.id))
      );

      await Promise.all(deletePromises);
      setExistingAttendance([]);
      toast.success('Attendance records deleted successfully');
    } catch (error) {
      console.error('Error deleting attendance records:', error);
      toast.error('Failed to delete attendance records');
    } finally {
      setDeleting(false);
    }
  };

  const filteredStudents = students.filter(student => 
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusButton = (status: 'present' | 'absent' | 'late', studentId: string) => {
    const icons = {
      present: <Check size={16} />,
      absent: <X size={16} />,
      late: <Clock size={16} />
    };

    const existingRecord = existingAttendance.find(record => record.studentId === studentId);

    return (
      <Button
        size="sm"
        variant={attendance[studentId] === status ? 'primary' : 'outline'}
        onClick={() => setAttendance(prev => ({
          ...prev,
          [studentId]: status
        }))}
        icon={icons[status]}
        disabled={!!existingRecord}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Button>
    );
  };

  const getAttendanceStatus = (studentId: string) => {
    const record = existingAttendance.find(record => record.studentId === studentId);
    if (!record) return null;

    return (
      <div className="mt-1">
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
          record.status === 'present' ? 'bg-green-100 text-green-800' :
          record.status === 'absent' ? 'bg-red-100 text-red-800' :
          'bg-yellow-100 text-yellow-800'
        }`}>
          Marked {record.status}
        </span>
      </div>
    );
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Attendance Management</h1>
        <p className="text-gray-600">Mark and manage student attendance</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <div className="space-y-4">
            <div className="flex gap-4">
              <Input
                id="date"
                label="Select Date"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                className="flex-1"
              />
              <Input
                id="search"
                label="Search Students"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name or email"
                className="flex-1"
              />
            </div>

            {loading ? (
              <div className="animate-pulse space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-16 bg-gray-200 rounded-lg"></div>
                ))}
              </div>
            ) : (
              <div className="space-y-4 mt-6">
                {existingAttendance.length > 0 && (
                  <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
                    <div className="flex justify-between items-center">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <Calendar className="h-5 w-5 text-yellow-400" />
                        </div>
                        <div className="ml-3">
                          <p className="text-sm text-yellow-700">
                            Attendance has already been marked for {selectedDate}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="danger"
                        size="sm"
                        icon={<Trash2 size={16} />}
                        onClick={handleDeleteAttendance}
                        loading={deleting}
                      >
                        Delete Records
                      </Button>
                    </div>
                  </div>
                )}

                {filteredStudents.map(student => (
                  <div
                    key={student.uid}
                    className="p-4 bg-gray-50 rounded-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
                  >
                    <div>
                      <h3 className="font-medium text-gray-900">{student.name}</h3>
                      <p className="text-sm text-gray-500">{student.email}</p>
                      {getAttendanceStatus(student.uid)}
                    </div>
                    <div className="flex gap-2">
                      {getStatusButton('present', student.uid)}
                      {getStatusButton('absent', student.uid)}
                      {getStatusButton('late', student.uid)}
                    </div>
                  </div>
                ))}

                <Button
                  onClick={handleSubmit}
                  loading={submitting}
                  icon={<Calendar size={18} />}
                  fullWidth
                  className="mt-6"
                  disabled={existingAttendance.length > 0}
                >
                  Submit Attendance
                </Button>
              </div>
            )}
          </div>
        </Card>

        <Card>
          <h3 className="text-lg font-semibold mb-6">Attendance Summary</h3>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-green-50 p-4 rounded-lg text-center">
              <p className="text-sm text-green-600 font-medium">Present</p>
              <p className="text-2xl font-bold text-green-700">
                {Object.values(attendance).filter(status => status === 'present').length}
              </p>
            </div>
            <div className="bg-red-50 p-4 rounded-lg text-center">
              <p className="text-sm text-red-600 font-medium">Absent</p>
              <p className="text-2xl font-bold text-red-700">
                {Object.values(attendance).filter(status => status === 'absent').length}
              </p>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg text-center">
              <p className="text-sm text-yellow-600 font-medium">Late</p>
              <p className="text-2xl font-bold text-yellow-700">
                {Object.values(attendance).filter(status => status === 'late').length}
              </p>
            </div>
          </div>

          <div className="prose prose-sm">
            <h4 className="font-semibold mb-4">Instructions</h4>
            <ul className="list-disc list-inside space-y-2 text-gray-600">
              <li>Select the date for attendance marking</li>
              <li>Use the search bar to find specific students</li>
              <li>Mark each student as Present, Absent, or Late</li>
              <li>Review the summary before submitting</li>
              <li>Attendance records will be locked after submission</li>
              <li>You cannot mark attendance twice for the same date</li>
              <li>You can delete attendance records for a date if needed</li>
            </ul>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AttendanceManagement;