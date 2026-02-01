import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Sparkles, Rocket, Zap } from 'lucide-react';
import './Login.css';

function Login() {
  const { signIn, signUp, error: authError } = useAuth();
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState('');
  const [showConfirmationMessage, setShowConfirmationMessage] = useState(false);

  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const [loginSuccess, setLoginSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validasi input sebelum submit
    if (!email || !password) {
      if (mountedRef.current) {
        setLocalError('Email and password are required');
      }
      return;
    }

    // Validasi format email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      if (mountedRef.current) {
        setLocalError('Please enter a valid email address');
      }
      return;
    }

    if (!isLogin && password !== confirmPassword) {
      if (mountedRef.current) {
        setLocalError('Passwords do not match');
      }
      return;
    }

    if (!isLogin && password.length < 6) {
      if (mountedRef.current) {
        setLocalError('Password should be at least 6 characters');
      }
      return;
    }

    if (mountedRef.current) {
      setLocalError('');
      setLoading(true);
      setShowConfirmationMessage(false);
    }

    try {
      if (isLogin) {
        console.log('Attempting to sign in with:', email); // Debug log
        await signIn(email, password);
        console.log('Sign in completed successfully'); // Debug log

        // Set login success to trigger navigation effect
        if (mountedRef.current) {
          setLoginSuccess(true);
        }
      } else {
        console.log('Attempting to sign up with:', email); // Debug log
        const result = await signUp(email, password, {
          username: email.split('@')[0],
          full_name: email.split('@')[0],
          email: email
        });
        console.log('Sign up completed:', result); // Debug log

        // Set login success directly upon successful sign-up
        if (mountedRef.current) {
          setLoginSuccess(true);
        }
      }
    } catch (err) {
      console.error('Authentication error:', err); // Debug log
      console.error('Error details:', err.message, err?.status, err?.code); // More detailed error log

      let errorMessage = 'An unexpected error occurred';

      // Handle different types of errors
      if (err?.message) {
        errorMessage = err.message;
      } else if (err?.error_description) {
        errorMessage = err.error_description;
      } else if (err?.error) {
        errorMessage = err.error;
      }

      // Pastikan komponen masih mounted sebelum mengupdate state
      if (mountedRef.current) {
        setLocalError(errorMessage);
        setLoading(false);

        if (err.message && err.message.includes('Email not confirmed')) {
          setShowConfirmationMessage(true);
        }
      }
    }
  };

  // Handle navigation after login success
  useEffect(() => {
    if (loginSuccess) {
      // Delay navigation to ensure UI updates complete
      const navTimer = setTimeout(() => {
        if (mountedRef.current) {
          navigate('/');
        }
      }, 100);

      return () => clearTimeout(navTimer);
    }
  }, [loginSuccess, navigate]);

  return (
    <div className="auth-container-futuristic">
      {/* Background elements without dynamic management */}
      <div className="cyber-grid"></div>
      <div className="floating-orbs">
        <div className="orb orb-1"></div>
        <div className="orb orb-2"></div>
        <div className="orb orb-3"></div>
      </div>

      <div className="auth-form-futuristic">
        {/* Header with Icon */}
        <div className="auth-header">
          <div className="icon-container">
            {isLogin ? (
              <Rocket className="header-icon" size={40} />
            ) : (
              <Sparkles className="header-icon" size={40} />
            )}
          </div>
          <h2 className="auth-title">
            {isLogin ? 'Welcome Back!' : 'Join the Future'}
          </h2>
          <p className="auth-subtitle">
            {isLogin ? 'Enter your credentials to continue' : 'Create your account and explore'}
          </p>
        </div>

        {/* Error Message */}
        {(authError?.message || localError) && !showConfirmationMessage && (
          <div className="error-message-futuristic">
            <Zap size={20} />
            <span>{authError?.message || localError}</span>
          </div>
        )}

        {/* Confirmation Message Removed */}

        <form onSubmit={handleSubmit} className="form-futuristic">
          {/* Email Field */}
          <div className="form-group-futuristic">
            <label htmlFor="email" className="form-label-futuristic">
              <Mail size={16} />
              Email Address
            </label>
            <div className="input-wrapper">
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="input-field-futuristic"
                placeholder="your@email.com"
                disabled={loading}
              />
              <div className="input-glow"></div>
            </div>
          </div>

          {/* Password Field */}
          <div className="form-group-futuristic">
            <label htmlFor="password" className="form-label-futuristic">
              <Zap size={16} />
              Password
            </label>
            <div className="input-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="input-field-futuristic password-field"
                placeholder="••••••••"
                disabled={loading}
              />
              <button
                type="button"
                className="password-toggle-futuristic"
                onClick={() => !loading && setShowPassword(!showPassword)}
                aria-label="Toggle password visibility"
                disabled={loading}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
              <div className="input-glow"></div>
            </div>
          </div>

          {/* Confirm Password Field */}
          {!isLogin && (
            <div className="form-group-futuristic">
              <label htmlFor="confirmPassword" className="form-label-futuristic">
                <Zap size={16} />
                Confirm Password
              </label>
              <div className="input-wrapper">
                <input
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="input-field-futuristic"
                  placeholder="••••••••"
                  disabled={loading}
                />
                <div className="input-glow"></div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          {!loading ? (
            <button
              type="submit"
              className="btn-futuristic"
              key="login-submit-btn"
            >
              <span className="btn-content">
                <>
                  {isLogin ? 'Launch 🚀' : 'Create Account ✨'}
                </>
              </span>
              <div className="btn-glow"></div>
            </button>
          ) : (
            <button
              type="button"
              className="btn-futuristic btn-loading"
              disabled
              key="login-loading-btn"
            >
              <span className="btn-content">
                <>
                  <div className="spinner"></div>
                  Processing...
                </>
              </span>
              <div className="btn-glow"></div>
            </button>
          )}
        </form>

        {/* Switch Auth Mode */}
        <div className="auth-switch-futuristic">
          <div className="divider">
            <span>or</span>
          </div>
          <p className="switch-text">
            {isLogin ? "Don't have an account?" : "Already have an account?"}
          </p>
          <button
            type="button"
            className="switch-btn-futuristic"
            onClick={() => {
              if (loading) return;
              setIsLogin(!isLogin);
              setLocalError('');
              setShowConfirmationMessage(false);
            }}
            disabled={loading}
          >
            {isLogin ? '✨ Create New Account' : '🚀 Sign In Instead'}
          </button>
        </div>

        {/* Fun Footer */}
        <div className="auth-footer">
          <p className="footer-text">🌟Didukung oleh Future Tech</p>
        </div>
      </div>
    </div>
  );
}

export default Login;