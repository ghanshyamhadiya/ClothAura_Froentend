import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import { User, Mail, Shield, Calendar, Clock, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import Loading from './Loading';

const Dashboard = () => {
  const {
    user,
    logout,
    isAuthenticated,
    loading,
    error,
    fetchAndSetUser,
    clearError,
    resendVerificationEmail
  } = useAuth();

  const [resendCountdown, setResendCountdown] = useState(0);

  useEffect(() => {
    // Only fetch if we don't have user data but we're authenticated
    if (isAuthenticated && !user && !loading) {
      fetchAndSetUser().catch((error) => {
        console.error("Error fetching user data:", error);
      });
    }
  }, [isAuthenticated, user, loading]);

  useEffect(() => {
    let timer;
    if (resendCountdown > 0) {
      timer = setTimeout(() => {
        setResendCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCountdown]);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleRefreshUser = async () => {
    try {
      await fetchAndSetUser();
    } catch (error) {
      console.error('Refresh error:', error);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleEmailResend = async () => {
    try {
      await resendVerificationEmail();
      setResendCountdown(60); 
    } catch (error) {
      console.error('Error resending email:', error);
    }
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-gray-200 text-gray-800';
      case 'owner':
        return 'bg-gray-300 text-gray-900';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading) {
    return (
      <Loading />
    );
  }

  return (
    <div className="min-h-screen bg-white relative top-[7vh]">
      {/* Navigation Bar */}
      <nav className="bg-white shadow-md border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center h-auto py-4 sm:h-16">
            <h1 className="text-xl font-semibold text-black">Dashboard</h1>
            <div className="flex items-center space-x-4 mt-4 sm:mt-0">
              <span className="text-gray-700">Welcome back, {user?.username || 'User'}!</span>
              <button
                onClick={handleRefreshUser}
                className="p-2 text-gray-500 hover:text-black hover:bg-gray-100 rounded-md transition-all duration-300 ease-in-out transform hover:scale-105"
                title="Refresh user data"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
              <button
                onClick={handleLogout}
                className="bg-black hover:bg-gray-800 text-white px-4 py-2 rounded-md text-sm font-medium transition-all duration-300 ease-in-out transform hover:scale-105"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Welcome Section */}
        <div className="bg-white overflow-hidden shadow-md rounded-lg mb-6 transition-all duration-500 hover:shadow-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-12 w-12 bg-black rounded-full flex items-center justify-center animate-pulse">
                  <User className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="ml-4">
                <h2 className="text-2xl font-bold text-black">Welcome back, {user?.username || 'User'}!</h2>
                <p className="text-gray-600">Here's your account overview and recent activity.</p>
              </div>
            </div>
          </div>
        </div>

        {/* User Details Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Account Information */}
          <div className="bg-white overflow-hidden shadow-md rounded-lg transition-all duration-300 hover:shadow-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-black mb-4 flex items-center">
                <User className="h-5 w-5 mr-2" />
                Account Information
              </h3>
              <dl className="space-y-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Username</dt>
                  <dd className="mt-1 text-sm text-gray-900">{user?.username || 'N/A'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">User ID</dt>
                  <dd className="mt-1 text-sm text-gray-900 font-mono">{user?.id || 'N/A'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Role</dt>
                  <dd className="mt-1">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(user?.role)}`}>
                      <Shield className="h-3 w-3 mr-1" />
                      {user?.role?.toUpperCase() || 'N/A'}
                    </span>
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-white overflow-hidden shadow-md rounded-lg transition-all duration-300 hover:shadow-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-black mb-4 flex items-center">
                <Mail className="h-5 w-5 mr-2" />
                Contact Information
              </h3>
              <dl className="space-y-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Email Address</dt>
                  <dd className="mt-1 text-sm text-gray-900">{user?.email || 'N/A'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Email Status</dt>
                  <dd className="mt-1 flex flex-col sm:flex-row sm:items-center sm:space-x-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user?.isEmailVerified ? 'bg-gray-100 text-gray-800' : 'bg-gray-200 text-gray-700'}`}>
                      {user?.isEmailVerified ? (
                        <CheckCircle className="h-3 w-3 mr-1" />
                      ) : (
                        <XCircle className="h-3 w-3 mr-1" />
                      )}
                      {user?.isEmailVerified ? 'Verified' : 'Not Verified'}
                    </span>
                    {!user?.isEmailVerified && (
                      <button
                        onClick={handleEmailResend}
                        disabled={resendCountdown > 0}
                        className={`mt-2 sm:mt-0 px-3 py-1 rounded-md text-sm font-medium transition-all duration-300 ease-in-out ${
                          resendCountdown > 0
                            ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                            : 'bg-black text-white hover:bg-gray-800 hover:scale-105'
                        }`}
                      >
                        {resendCountdown > 0 ? `Resend in ${resendCountdown}s` : 'Resend Verification Email'}
                      </button>
                    )}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>

        {/* Activity Information */}
        <div className="bg-white overflow-hidden shadow-md rounded-lg mb-6 transition-all duration-300 hover:shadow-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-black mb-4 flex items-center">
              <Clock className="h-5 w-5 mr-2" />
              Account Activity
            </h3>
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <dt className="text-sm font-medium text-gray-500 flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  Account Created
                </dt>
                <dd className="mt-1 text-sm text-gray-900">{formatDate(user?.accountCreatedAt)}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  Last Login
                </dt>
                <dd className="mt-1 text-sm text-gray-900">{formatDate(user?.lastLoginAt)}</dd>
              </div>
            </dl>
          </div>
        </div>

        {/* System Status */}
        <div className="bg-white overflow-hidden shadow-md rounded-lg transition-all duration-300 hover:shadow-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-black mb-4">System Status</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg animate-fade-in">
                <CheckCircle className="h-8 w-8 text-black mx-auto mb-2" />
                <p className="text-sm font-medium text-black">Authentication</p>
                <p className="text-xs text-gray-600">Active</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg animate-fade-in">
                <Shield className="h-8 w-8 text-black mx-auto mb-2" />
                <p className="text-sm font-medium text-black">Session</p>
                <p className="text-xs text-gray-600">
                  {localStorage.getItem('accessToken') ? 'Valid Token' : 'No Token'}
                </p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg animate-fade-in">
                <User className="h-8 w-8 text-black mx-auto mb-2" />
                <p className="text-sm font-medium text-black">Profile</p>
                <p className="text-xs text-gray-600">{user ? 'Loaded' : 'Loading...'}</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
