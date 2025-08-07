import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { useEffect } from "react";

import FloatingShape from "./components/FloatingShape"
import SignUpPage from "./pages/SignUpPage";
import LoginPage from "./pages/LoginPage";
import EmailVerificationPage from "./pages/EmailVerificationPage";
import DashboardPage from "./pages/DashboardPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import { useAuthStore } from "./store/authStore";
import LoadingSpinner from "./components/LoadingSpinner";


// if the user is not authenticated
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuthStore();

  // if the user is not authenticated then take them to the login page
  if (!isAuthenticated) {
		return <Navigate to='/login' replace />;
	}

  // if the authenticating is done but the verification is not done
	if (!user.isVerified) {
		return <Navigate to='/verify-email' replace />;
	}

	return children;
}


// if the user is already authenticated then we have to send them to the home page
const RedirectAuthenticatedUser = ({children}) => {
  const { isAuthenticated, user } = useAuthStore();
  
  if (isAuthenticated && user.isVerified) {
		return <Navigate to='/' replace />;
	}

	return children;
}

function App() {
  const { checkAuth, isCheckingAuth } = useAuthStore();

  // Ima gonna run this everytime

  useEffect(() => {
    checkAuth();
  }, [checkAuth])

  if (isCheckingAuth) return <LoadingSpinner />;

  return (
    <>
    <div 
      className='min-h-screen bg-gradient-to-br
    from-gray-900 via-green-900 to-emerald-900 flex items-center justify-center relative overflow-hidden'>
        <FloatingShape
          color="bg-green-500" 
          size="w-64 h-64" 
          top="-5%" 
          left="10%" 
          delay={0} 
        />
        <FloatingShape 
          color='bg-emerald-500' 
          size='w-48 h-48' 
          top='70%' 
          left='80%' 
          delay={5} 
        />
			  <FloatingShape 
          color='bg-lime-500' 
          size='w-32 h-32' 
          top='40%' 
          left='-10%' 
          delay={2}
        /> 
        <Routes>
          <Route path="/" element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          } />
          <Route path="/signup" element={
            <RedirectAuthenticatedUser>
							<SignUpPage />
						</RedirectAuthenticatedUser>
          } />
          <Route path="/login" element={
            <RedirectAuthenticatedUser>
							<LoginPage />
						</RedirectAuthenticatedUser>
          } />
          <Route path="/verify-email" element={<EmailVerificationPage />} />
          <Route path="/forgot-password" element={
            <RedirectAuthenticatedUser>
							<ForgotPasswordPage />
						</RedirectAuthenticatedUser>
          } />
          <Route path="/reset-password/:token" element={
            <RedirectAuthenticatedUser>
							<ResetPasswordPage />
						</RedirectAuthenticatedUser>
          } />
        </Routes>
        <Toaster />
      </div>
    </>
  )
}

export default App
