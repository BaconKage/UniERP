import React, { ReactNode, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Menu, 
  X, 
  User, 
  LogOut, 
  BarChart,
  BookOpen,
  Bell,
  Calendar,
  Settings,
  Home,
  Award,
  FileText,
  GraduationCap
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';

interface PageLayoutProps {
  children: ReactNode;
}

const PageLayout: React.FC<PageLayoutProps> = ({ children }) => {
  const { userProfile, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  const getNavItems = (role: UserRole) => {
    const navItems = [
      { label: 'Dashboard', path: `/${role}-dashboard`, icon: <Home size={20} /> },
    ];

    if (role === 'student') {
      navItems.push(
        { label: 'Grades', path: '/student/grades', icon: <BookOpen size={20} /> },
        { label: 'Attendance', path: '/student/attendance', icon: <Calendar size={20} /> },
        { label: 'Announcements', path: '/student/announcements', icon: <Bell size={20} /> },
        { label: 'Achievements', path: '/student/achievements', icon: <Award size={20} /> },
        { label: 'Medical Certificates', path: '/student/medical-certificates', icon: <FileText size={20} /> }
      );
    } else if (role === 'teacher') {
      navItems.push(
        { label: 'Student Records', path: '/teacher/student-records', icon: <GraduationCap size={20} /> },
        { label: 'Grades', path: '/teacher/grades', icon: <BookOpen size={20} /> },
        { label: 'Attendance', path: '/teacher/attendance', icon: <Calendar size={20} /> },
        { label: 'Announcements', path: '/teacher/announcements', icon: <Bell size={20} /> },
        { label: 'Achievements', path: '/teacher/achievements', icon: <Award size={20} /> },
        { label: 'Medical Certificates', path: '/teacher/medical-certificates', icon: <FileText size={20} /> }
      );
    } else if (role === 'admin') {
      navItems.push(
        { label: 'Users', path: '/admin/users', icon: <User size={20} /> },
        { label: 'Analytics', path: '/admin/analytics', icon: <BarChart size={20} /> },
        { label: 'Achievements', path: '/admin/achievements', icon: <Award size={20} /> },
        { label: 'Medical Certificates', path: '/admin/medical-certificates', icon: <FileText size={20} /> },
        { label: 'Settings', path: '/admin/settings', icon: <Settings size={20} /> }
      );
    }

    return navItems;
  };

  const navItems = userProfile ? getNavItems(userProfile.role) : [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-soft">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              {/* Logo */}
              <div className="flex-shrink-0 flex items-center">
                <Link to="/" className="gradient-bg text-white font-bold text-xl px-4 py-2 rounded-lg">
                  UniERP
                </Link>
              </div>
            </div>

            {/* Mobile menu button */}
            <div className="flex items-center sm:hidden">
              <button
                type="button"
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                <span className="sr-only">Open main menu</span>
                {isMobileMenuOpen ? (
                  <X className="block h-6 w-6" aria-hidden="true" />
                ) : (
                  <Menu className="block h-6 w-6" aria-hidden="true" />
                )}
              </button>
            </div>

            {/* Desktop navigation */}
            <div className="hidden sm:flex sm:items-center sm:ml-6">
              {userProfile && (
                <div className="ml-3 relative flex items-center space-x-4">
                  <div className="text-sm text-gray-700">
                    {userProfile.name}
                    <span className="block text-xs text-gray-500 capitalize">
                      {userProfile.role}
                    </span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="p-2 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none button-glow"
                  >
                    <span className="sr-only">Logout</span>
                    <LogOut className="h-5 w-5" aria-hidden="true" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile menu */}
      <div className={`sm:hidden ${isMobileMenuOpen ? 'block' : 'hidden'}`}>
        <div className="pt-2 pb-3 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`${
                location.pathname === item.path
                  ? 'bg-primary-50 border-primary-500 text-primary-700'
                  : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'
              } block pl-3 pr-4 py-2 border-l-4 text-base font-medium flex items-center`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <span className="mr-2">{item.icon}</span> {item.label}
            </Link>
          ))}
          {userProfile && (
            <button
              onClick={() => {
                handleLogout();
                setIsMobileMenuOpen(false);
              }}
              className="border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800 block pl-3 pr-4 py-2 border-l-4 text-base font-medium w-full text-left flex items-center"
            >
              <LogOut className="mr-2 h-5 w-5" /> Logout
            </button>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="flex">
          {/* Sidebar for desktop */}
          {userProfile && (
            <div className="hidden sm:block w-64 shrink-0">
              <div className="h-full py-4 bg-white shadow-soft rounded-xl overflow-y-auto">
                <div className="px-2 space-y-1">
                  {navItems.map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`${
                        location.pathname === item.path
                          ? 'bg-primary-50 text-primary-600'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      } group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200`}
                    >
                      <span className="mr-3 flex-shrink-0">{item.icon}</span>
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Page content */}
          <main className="flex-1 pb-8 ml-0 sm:ml-4">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
};

export default PageLayout;
