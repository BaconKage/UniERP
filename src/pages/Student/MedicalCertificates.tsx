import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, addDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { MedicalCertificate } from '../../types';
import { FileText, Upload, CheckCircle, XCircle, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const MedicalCertificates = () => {
  const { userProfile } = useAuth();
  const [certificates, setCertificates] = useState<MedicalCertificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [certificateUrl, setCertificateUrl] = useState('');

  useEffect(() => {
    if (!userProfile) return;

    const certificatesQuery = query(
      collection(db, 'medicalCertificates'),
      where('studentId', '==', userProfile.uid),
      orderBy('uploadedAt', 'desc')
    );

    const unsubscribe = onSnapshot(certificatesQuery, (snapshot) => {
      const certificatesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        startDate: doc.data().startDate?.toDate() || new Date(),
        endDate: doc.data().endDate?.toDate() || new Date(),
        uploadedAt: doc.data().uploadedAt?.toDate() || new Date(),
        reviewedAt: doc.data().reviewedAt?.toDate() || null,
      })) as MedicalCertificate[];
      setCertificates(certificatesData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userProfile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate || !reason || !certificateUrl) {
      toast.error('Please fill in all fields');
      return;
    }

    if (new Date(endDate) < new Date(startDate)) {
      toast.error('End date cannot be before start date');
      return;
    }

    setSubmitting(true);
    try {
      await addDoc(collection(db, 'medicalCertificates'), {
        studentId: userProfile?.uid,
        studentName: userProfile?.name,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        reason,
        certificateUrl,
        status: 'pending',
        uploadedAt: serverTimestamp()
      });

      toast.success('Medical certificate submitted successfully');
      setStartDate('');
      setEndDate('');
      setReason('');
      setCertificateUrl('');
    } catch (error) {
      console.error('Error submitting medical certificate:', error);
      toast.error('Failed to submit medical certificate');
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
        <h1 className="text-2xl font-bold text-gray-900">Medical Certificates</h1>
        <p className="text-gray-600">Submit and track your medical certificates</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="text-lg font-semibold mb-4">Submit New Certificate</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                id="startDate"
                label="Start Date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                required
              />
              <Input
                id="endDate"
                label="End Date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate}
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reason
              </label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                rows={4}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Explain the reason for your medical leave..."
                required
              />
            </div>
            <Input
              id="certificate"
              label="Certificate URL"
              type="url"
              value={certificateUrl}
              onChange={(e) => setCertificateUrl(e.target.value)}
              placeholder="Link to your medical certificate"
              required
            />
            <Button
              type="submit"
              loading={submitting}
              icon={<Upload size={18} />}
              fullWidth
            >
              Submit Certificate
            </Button>
          </form>
        </Card>

        <Card>
          <h3 className="text-lg font-semibold mb-4">Certificate History</h3>
          {loading ? (
            <div className="animate-pulse space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          ) : certificates.length > 0 ? (
            <div className="space-y-4">
              {certificates.map((certificate) => (
                <div
                  key={certificate.id}
                  className="p-4 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center">
                      <FileText className="h-5 w-5 text-indigo-500 mr-2" />
                      <div>
                        <p className="font-medium text-gray-900">
                          {format(certificate.startDate, 'MMM d, yyyy')} - {format(certificate.endDate, 'MMM d, yyyy')}
                        </p>
                        <p className="text-sm text-gray-500">
                          Submitted on {format(certificate.uploadedAt, 'MMM d, yyyy')}
                        </p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full flex items-center ${getStatusColor(certificate.status)}`}>
                      {getStatusIcon(certificate.status)}
                      <span className="ml-1 capitalize">{certificate.status}</span>
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{certificate.reason}</p>
                  <div className="flex justify-between items-center text-xs">
                    <a
                      href={certificate.certificateUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:text-indigo-800"
                    >
                      View Certificate
                    </a>
                  </div>
                  {certificate.reviewComments && (
                    <div className="mt-2 p-2 bg-gray-100 rounded text-sm">
                      <p className="font-medium text-gray-700">Reviewer Comments:</p>
                      <p className="text-gray-600">{certificate.reviewComments}</p>
                      {certificate.reviewedAt && (
                        <p className="text-xs text-gray-500 mt-1">
                          Reviewed on {format(certificate.reviewedAt, 'MMM d, yyyy')}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>No certificates submitted yet</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default MedicalCertificates;