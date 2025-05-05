import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import { ClockIcon, LogOut } from 'lucide-react';

const ApprovalWaiting = () => {
  const { logout, userProfile } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <Card className="text-center">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-yellow-100 p-3">
              <ClockIcon className="h-8 w-8 text-yellow-500" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Account Pending Approval</h2>
          <p className="text-gray-600 mb-6">
            Your {userProfile?.role} account is currently pending approval from an administrator.
            You'll be notified via email when your account has been approved.
          </p>
          <Button
            onClick={handleLogout}
            variant="outline"
            icon={<LogOut size={18} />}
          >
            Sign Out
          </Button>
        </Card>
      </div>
    </div>
  );
};

export default ApprovalWaiting;
