import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Mail,
  User,
  Calendar,
  Clock,
  RefreshCw,
  LogOut,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import Loading from "./Loading";

const Dashboard = () => {
  const {
    user,
    loading,
    logout,
    fetchAndSetUser,
    resendVerificationEmail,
  } = useAuth();

  const [resendCountdown, setResendCountdown] = useState(0);

  useEffect(() => {
    let timer;
    if (resendCountdown > 0) {
      timer = setTimeout(() => setResendCountdown((p) => p - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCountdown]);

  const formatDate = (date) =>
    date
      ? new Date(date).toLocaleString("en-IN", {
          dateStyle: "medium",
          timeStyle: "short",
        })
      : "—";

  const handleResend = async () => {
    await resendVerificationEmail();
    setResendCountdown(60);
  };

  if (loading || !user) return <Loading />;

  return (
    <div className="min-h-screen bg-gray-50 pt-24 px-4">
      <div className="max-w-5xl mx-auto space-y-8">

        {/* HEADER */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
        >
          <div>
            <h1 className="text-3xl font-bold text-black">
              Welcome, {user.username}
            </h1>
            <p className="text-gray-600">
              Manage your account & preferences
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={fetchAndSetUser}
              className="p-2 rounded-md border hover:bg-gray-100 transition"
            >
              <RefreshCw size={18} />
            </button>
            <button
              onClick={logout}
              className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition"
            >
              <LogOut size={16} className="inline mr-1" />
              Logout
            </button>
          </div>
        </motion.div>

        {/* PROFILE CARD */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl shadow-md p-6"
        >
          <div className="flex items-center gap-4 mb-6">
            <div className="h-14 w-14 bg-black text-white rounded-full flex items-center justify-center">
              <User />
            </div>
            <div>
              <p className="font-semibold text-lg">{user.username}</p>
              <p className="text-sm text-gray-500">{user.email}</p>
            </div>
          </div>

          {/* EMAIL STATUS */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-2">
              {user.isEmailVerified ? (
                <>
                  <CheckCircle className="text-green-600" size={18} />
                  <span className="text-sm text-green-700">
                    Email verified
                  </span>
                </>
              ) : (
                <>
                  <XCircle className="text-red-500" size={18} />
                  <span className="text-sm text-red-600">
                    Email not verified
                  </span>
                </>
              )}
            </div>

            {!user.isEmailVerified && (
              <button
                onClick={handleResend}
                disabled={resendCountdown > 0}
                className={`px-4 py-2 rounded-md text-sm transition ${
                  resendCountdown > 0
                    ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                    : "bg-black text-white hover:bg-gray-800"
                }`}
              >
                {resendCountdown > 0
                  ? `Resend in ${resendCountdown}s`
                  : "Resend Verification Email"}
              </button>
            )}
          </div>
        </motion.div>

        {/* ACTIVITY */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 sm:grid-cols-2 gap-6"
        >
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="flex items-center gap-2 text-gray-700 mb-2">
              <Calendar size={18} />
              <span className="text-sm">Joined</span>
            </div>
            <p className="font-medium text-black">
              {formatDate(user.accountCreatedAt)}
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="flex items-center gap-2 text-gray-700 mb-2">
              <Clock size={18} />
              <span className="text-sm">Last Login</span>
            </div>
            <p className="font-medium text-black">
              {formatDate(user.lastLoginAt)}
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
