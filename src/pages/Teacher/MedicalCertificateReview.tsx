import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, doc, updateDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { MedicalCertificate } from '../../types';
import { FileText, CheckCircle, XCircle, Search, Filter } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const MedicalCertificateReview = () => {
  const { userProfile } = useAuth();
  const [certificates, setCertificates] = useState<MedicalCertificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [reviewComments, setReviewComments] = useState('');

  useEffect(() => {
    if (!userProfile) return;

    const certificatesQuery = query(
      collection(db, 'medicalCertificates'),
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

  const handleReview = async (certificateId: string, status: 'approved' | 'rejected') => {
    if (status === 'rejected' && !reviewComments) {
      toast.error('Please provide review comments for rejection');
      return;
    }

    setReviewingId(certificateId);
    try {
      await updateDoc(doc(db, 'medicalCertificates', certificateId), {
        status,
        reviewedBy: userProfile?.uid,
        reviewerName: userProfile?.name,
        reviewComments: status === 'approved' ? 'Approved' : reviewComments,
        reviewedAt: new Date()
      });

      toast.success(`Medical certificate ${status}`);
      setReviewComments('');
    } catch (error) {
      console.error('Error reviewing medical certificate:', error);
      toast.error('Failed to review medical certificate');
    } finally {
      setReviewingId(null);
    }
  };

  const filteredCertificates = certificates.filter(certificate => {
    const matchesSearch = 
      certificate.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      certificate.reason.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = 
      statusFilter === 'all' || 
      certificate.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Medical Certificate Review</h1>
        <p className="text-gray-600">Review and manage student medical certificates</p>
      </div>

      <Card>
        <div className="mb-6 space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Input
                  id="search"
                  type="text"
                  placeholder="Search by student name or reason..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
                <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              </div>
            </div>
            <div className="w-48">
              <Select
                id="status-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                options={[
                  { value: 'all', label: 'All Status' },
                  { value: 'pending', label: 'Pending' },
                  { value: 'approved', label: 'Approved' },
                  { value: 'rejected', label: 'Rejected' }
                ]}
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="animate-pulse space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        ) : filteredCertificates.length > 0 ? (
          <div className="space-y-6">
            {filteredCertificates.map((certificate) => (
              <div
                key={certificate.id}
                className="bg-white border rounded-lg shadow-sm p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center mb-2">
                      <FileText className="h-5 w-5 text-indigo-500 mr-2" />
                      <h3 className="text-lg font-medium text-gray-900">
                        {certificate.studentName}
                      </h3>
                    </div>
                    <p className="text-sm text-gray-600">
                      {format(certificate.startDate, 'MMM d, yyyy')} - {format(certificate.endDate, 'MMM d, yyyy')}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      certificate.status === 'approved' ? 'bg-green-100 text-green-800' :
                      certificate.status === 'rejected' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {certificate.status.charAt(0).toUpperCase() + certificate.status.slice(1)}
                    </span>
                    <p className="text-xs text-gray-500 mt-1">
                      Submitted: {format(certificate.uploadedAt, 'MMM d, yyyy')}
                    </p>
                  </div>
                </div>

                <p className="text-gray-600 mb-4">{certificate.reason}</p>

                <div className="mb-4">
                  <a
                    href={certificate.certificateUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 hover:text-indigo-800 text-sm"
                  >
                    View Certificate
                  </a>
                </div>

                {certificate.status === 'pending' && (
                  <div className="space-y-4">
                    <Input
                      id={`comments-${certificate.id}`}
                      label="Review Comments"
                      type="text"
                      value={reviewComments}
                      onChange={(e) => setReviewComments(e.target.value)}
                      placeholder="Add comments (required for rejection)"
                    />

                    <div className="flex space-x-3">
                      <Button
                        onClick={() => handleReview(certificate.id, 'approved')}
                        loading={reviewingId === certificate.id}
                        variant="primary"
                        icon={<CheckCircle size={18} />}
                      >
                        Approve
                      </Button>
                      <Button
                        onClick={() => handleReview(certificate.id, 'rejected')}
                        loading={reviewingId === certificate.id}
                        variant="danger"
                        icon={<XCircle size={18} />}
                      >
                        Reject
                      </Button>
                    </div>
                  </div>
                )}

                {certificate.status !== 'pending' && certificate.reviewComments && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium text-gray-700">Review Comments:</p>
                    <p className="text-sm text-gray-600">{certificate.reviewComments}</p>
                    <div className="mt-2 text-xs text-gray-500">
                      Reviewed by {certificate.reviewerName} on {format(certificate.reviewedAt!, 'MMM d, yyyy')}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No certificates found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {statusFilter === 'pending' 
                ? 'All certificates have been reviewed'
                : 'Try adjusting your search filters'}
            </p>
          </div>
        )}
      </Card>
    </div>
  );
};

export default MedicalCertificateReview;