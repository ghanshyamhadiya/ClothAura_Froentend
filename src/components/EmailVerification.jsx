import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Loading from './Loading';

const EmailVerification = () => {
  const [status, setStatus] = useState('verifying');
  const [message, setMessage] = useState('');
  const { token } = useParams();
  const { verifyEmail } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (token) {
      handleVerification();
    }
  }, [token]);

  const handleVerification = async () => {
    try {
      setStatus('verifying');
      const response = await verifyEmail(token);
      
      if (response.success) {
        setStatus('success');
        setMessage('Email verified! Redirecting...');
        
        setTimeout(() => {
          navigate('/');
        }, 2000);
      } else {
        throw new Error(response.message || 'Verification failed');
      }
    } catch (error) {
      setStatus('error');
      setMessage(error.message || 'Token invalid or expired');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">
            Email Verification
          </h2>
        </div>
        <div className="mt-8 space-y-6">
          {status === 'verifying' && (
            <div className="text-center">
              <Loading />
              <p className="mt-4 text-gray-600">Verifying your email...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmailVerification;