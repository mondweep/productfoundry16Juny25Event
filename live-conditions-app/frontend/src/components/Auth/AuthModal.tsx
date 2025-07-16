'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '@/hooks/useStore';
import { apiClient } from '@/utils/api';
import toast from 'react-hot-toast';

const signInSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const signUpSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type SignInFormData = z.infer<typeof signInSchema>;
type SignUpFormData = z.infer<typeof signUpSchema>;

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { setUser } = useAuthStore();

  const signInForm = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
  });

  const signUpForm = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
  });

  const handleSignIn = async (data: SignInFormData) => {
    setIsLoading(true);
    try {
      const response = await apiClient.post('/api/auth/signin', data);
      
      if (response.success) {
        setUser(response.data.user);
        apiClient.setToken(response.data.token);
        toast.success('Signed in successfully!');
        onClose();
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to sign in');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (data: SignUpFormData) => {
    setIsLoading(true);
    try {
      const response = await apiClient.post('/api/auth/signup', {
        name: data.name,
        email: data.email,
        password: data.password,
      });
      
      if (response.success) {
        setUser(response.data.user);
        apiClient.setToken(response.data.token);
        toast.success('Account created successfully!');
        onClose();
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to create account');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    signInForm.reset();
    signUpForm.reset();
    setIsSignUp(false);
    setShowPassword(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div 
        className="modal-content max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {isSignUp ? 'Create Account' : 'Sign In'}
          </h2>
          <button
            onClick={handleClose}
            className="p-1 rounded-md hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <div className="p-6">
          {isSignUp ? (
            <form onSubmit={signUpForm.handleSubmit(handleSignUp)} className="space-y-4">
              {/* Name */}
              <div className="form-field">
                <label className="form-label">Full Name</label>
                <div className="relative">
                  <input
                    type="text"
                    {...signUpForm.register('name')}
                    className="form-input pl-10"
                    placeholder="Enter your full name"
                  />
                  <User className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                </div>
                {signUpForm.formState.errors.name && (
                  <p className="text-sm text-red-600">
                    {signUpForm.formState.errors.name.message}
                  </p>
                )}
              </div>

              {/* Email */}
              <div className="form-field">
                <label className="form-label">Email</label>
                <div className="relative">
                  <input
                    type="email"
                    {...signUpForm.register('email')}
                    className="form-input pl-10"
                    placeholder="Enter your email"
                  />
                  <Mail className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                </div>
                {signUpForm.formState.errors.email && (
                  <p className="text-sm text-red-600">
                    {signUpForm.formState.errors.email.message}
                  </p>
                )}
              </div>

              {/* Password */}
              <div className="form-field">
                <label className="form-label">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    {...signUpForm.register('password')}
                    className="form-input pl-10 pr-10"
                    placeholder="Create a password"
                  />
                  <Lock className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {signUpForm.formState.errors.password && (
                  <p className="text-sm text-red-600">
                    {signUpForm.formState.errors.password.message}
                  </p>
                )}
              </div>

              {/* Confirm Password */}
              <div className="form-field">
                <label className="form-label">Confirm Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    {...signUpForm.register('confirmPassword')}
                    className="form-input pl-10"
                    placeholder="Confirm your password"
                  />
                  <Lock className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                </div>
                {signUpForm.formState.errors.confirmPassword && (
                  <p className="text-sm text-red-600">
                    {signUpForm.formState.errors.confirmPassword.message}
                  </p>
                )}
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={isLoading}
                className="btn btn-primary w-full flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="loading-spinner w-4 h-4"></div>
                    Creating Account...
                  </>
                ) : (
                  'Create Account'
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={signInForm.handleSubmit(handleSignIn)} className="space-y-4">
              {/* Email */}
              <div className="form-field">
                <label className="form-label">Email</label>
                <div className="relative">
                  <input
                    type="email"
                    {...signInForm.register('email')}
                    className="form-input pl-10"
                    placeholder="Enter your email"
                  />
                  <Mail className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                </div>
                {signInForm.formState.errors.email && (
                  <p className="text-sm text-red-600">
                    {signInForm.formState.errors.email.message}
                  </p>
                )}
              </div>

              {/* Password */}
              <div className="form-field">
                <label className="form-label">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    {...signInForm.register('password')}
                    className="form-input pl-10 pr-10"
                    placeholder="Enter your password"
                  />
                  <Lock className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {signInForm.formState.errors.password && (
                  <p className="text-sm text-red-600">
                    {signInForm.formState.errors.password.message}
                  </p>
                )}
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={isLoading}
                className="btn btn-primary w-full flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="loading-spinner w-4 h-4"></div>
                    Signing In...
                  </>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>
          )}

          {/* Toggle between sign in and sign up */}
          <div className="mt-6 text-center">
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-primary-600 hover:text-primary-700 text-sm"
            >
              {isSignUp 
                ? "Already have an account? Sign in" 
                : "Don't have an account? Create one"
              }
            </button>
          </div>

          {/* Guest mode */}
          <div className="mt-4">
            <button
              onClick={() => {
                // Set a guest user
                setUser({
                  id: 'guest',
                  email: 'guest@example.com',
                  name: 'Guest User',
                  preferences: {
                    notifications: {
                      pushEnabled: false,
                      emailEnabled: false,
                      smsEnabled: false,
                      types: [],
                      regions: [],
                    },
                    map: {
                      defaultCenter: { lat: -25.2744, lng: 133.7751 },
                      defaultZoom: 5,
                      preferredLayers: ['weather', 'fire', 'flood'],
                    },
                  },
                  createdAt: new Date().toISOString(),
                });
                toast.success('Continuing as guest');
                onClose();
              }}
              className="btn btn-secondary w-full"
            >
              Continue as Guest
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};