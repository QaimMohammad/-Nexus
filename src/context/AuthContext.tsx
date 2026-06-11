import React, { createContext, useState, useContext, useEffect } from 'react';
import { User, UserRole, AuthContextType } from '../types';
import { authService } from '../services/authService';
import { userService } from '../services/userService';
import { TOKEN_STORAGE_KEY } from '../services/api';
import { disconnectSocket } from '../services/socket';
import toast from 'react-hot-toast';

// Create Auth Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USER_STORAGE_KEY = 'business_nexus_user';

// Auth Provider Component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  // Set when a 2FA-enabled account logs in and must enter their one-time code
  const [pendingOtpUserId, setPendingOtpUserId] = useState<string | null>(null);

  // Restore the session on initial load: validate the stored token against the API
  useEffect(() => {
    const restore = async () => {
      const token = localStorage.getItem(TOKEN_STORAGE_KEY);
      if (!token) {
        setIsLoading(false);
        return;
      }
      try {
        const me = await authService.me();
        setUser(me);
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(me));
      } catch {
        // Token invalid/expired - clear the stale session
        authService.logout();
        localStorage.removeItem(USER_STORAGE_KEY);
      } finally {
        setIsLoading(false);
      }
    };
    restore();
  }, []);

  const login = async (
    email: string,
    password: string,
    role: UserRole
  ): Promise<{ requiresOtp: boolean }> => {
    setIsLoading(true);
    try {
      const result = await authService.login(email, password, role);

      if (result.requiresOtp && result.userId) {
        setPendingOtpUserId(result.userId);
        if (result.devOtp) {
          // SMTP not configured on the server - surface the code for the demo
          toast(`Demo OTP: ${result.devOtp}`, { duration: 15000, icon: '🔐' });
        } else {
          toast.success('A verification code was sent to your email');
        }
        return { requiresOtp: true };
      }

      if (result.user) {
        setUser(result.user);
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(result.user));
        toast.success('Successfully logged in!');
      }
      return { requiresOtp: false };
    } catch (error) {
      toast.error((error as Error).message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOtp = async (otp: string): Promise<void> => {
    if (!pendingOtpUserId) {
      throw new Error('No verification in progress');
    }
    setIsLoading(true);
    try {
      const verifiedUser = await authService.verifyOtp(pendingOtpUserId, otp);
      setPendingOtpUserId(null);
      setUser(verifiedUser);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(verifiedUser));
      toast.success('Successfully logged in!');
    } catch (error) {
      toast.error((error as Error).message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (
    name: string,
    email: string,
    password: string,
    role: UserRole
  ): Promise<void> => {
    setIsLoading(true);
    try {
      const newUser = await authService.register(name, email, password, role);
      setUser(newUser);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(newUser));
      toast.success('Account created successfully!');
    } catch (error) {
      toast.error((error as Error).message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const forgotPassword = async (email: string): Promise<void> => {
    try {
      const result = await authService.forgotPassword(email);
      if (result.devResetToken) {
        // SMTP not configured on the server - surface the token for the demo
        toast(`Demo reset token: ${result.devResetToken}`, { duration: 20000, icon: '🔑' });
      }
      toast.success('Password reset instructions sent to your email');
    } catch (error) {
      toast.error((error as Error).message);
      throw error;
    }
  };

  const resetPassword = async (token: string, newPassword: string): Promise<void> => {
    try {
      await authService.resetPassword(token, newPassword);
      toast.success('Password reset successfully');
    } catch (error) {
      toast.error((error as Error).message);
      throw error;
    }
  };

  const logout = (): void => {
    setUser(null);
    setPendingOtpUserId(null);
    authService.logout();
    localStorage.removeItem(USER_STORAGE_KEY);
    disconnectSocket();
    toast.success('Logged out successfully');
  };

  const updateProfile = async (userId: string, updates: Partial<User>): Promise<void> => {
    try {
      const updatedUser = await userService.updateUser(userId, updates);
      if (user?.id === userId) {
        setUser(updatedUser);
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUser));
      }
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error((error as Error).message);
      throw error;
    }
  };

  const value = {
    user,
    login,
    verifyOtp,
    register,
    logout,
    forgotPassword,
    resetPassword,
    updateProfile,
    isAuthenticated: !!user,
    isLoading
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook for using auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
