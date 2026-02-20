// Import React and useState hook for managing component state
import React, { useState } from 'react';

// Import framer-motion for animations
import { motion, AnimatePresence } from 'framer-motion';

// Import icons used in the UI
import { X, Mail, Lock, User, Eye, EyeOff, Loader2 } from 'lucide-react';

// Import global app context (for modal open/close)
import { useApp } from '@/context/AppContext';

// Import authentication context (login/signup logic)
import { useAuth } from '@/context/AuthContext';

// Import reusable UI components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// Import toast notification hook
import { toast } from '@/hooks/use-toast';


// -------------------- LOGIN COMPONENT --------------------
const Login = () => {

  // Get modal state and close function from AppContext
  const { isLoginModalOpen, closeLoginModal } = useApp();

  // Get authentication functions and loading state
  const { login, signup, isLoading } = useAuth();

  // Mode of the form: "login" or "signup"
  const [mode, setMode] = useState('login');

  // Controls password visibility
  const [showPassword, setShowPassword] = useState(false);

  // Form input states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Stores validation error messages
  const [errors, setErrors] = useState({});

  // -------------------- FORM VALIDATION --------------------
  const validateForm = () => {
    const newErrors = {};

    // Name is required only during signup
    if (mode === 'signup' && !name.trim()) {
      newErrors.name = 'Name is required';
    }

    // Email validation
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } 
    // Regex to check valid email format
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Invalid email format';
    }

    // Password validation
    if (!password) {
      newErrors.password = 'Password is required';
    } 
    else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    // Save errors to state
    setErrors(newErrors);

    // Return true if no validation errors
    return Object.keys(newErrors).length === 0;
  };


  // -------------------- FORM SUBMISSION --------------------
  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent page refresh

    // Stop if validation fails
    if (!validateForm()) return;

    let success = false;

    // Call login or signup based on mode
    if (mode === 'login') {
      success = await login(email, password);
    } else {
      success = await signup(name, email, password);
    }

    // If authentication successful
    if (success) {
      toast({
        title: mode === 'login' ? 'Welcome back!' : 'Account created!',
        description:
          mode === 'login'
            ? 'You have successfully logged in.'
            : 'Your account has been created successfully.',
      });

      closeLoginModal(); // Close modal
      resetForm();       // Clear form
    } 
    // If authentication fails
    else {
      toast({
        title: 'Error',
        description: 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    }
  };


  // -------------------- RESET FORM --------------------
  const resetForm = () => {
    setName('');
    setEmail('');
    setPassword('');
    setErrors({});
    setShowPassword(false);
  };

  // Switch between login and signup modes
  const switchMode = () => {
    setMode(mode === 'login' ? 'signup' : 'login');
    setErrors({});
  };

  // Close modal and reset everything
  const handleClose = () => {
    closeLoginModal();
    resetForm();
    setMode('login');
  };

  
  // -------------------- UI --------------------
  return (
    <AnimatePresence>
      {isLoginModalOpen && (

        // Background overlay (blurred)
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
          onClick={handleClose} // Close when clicking outside
        >

          {/* Modal container */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="w-full max-w-md glass-card rounded-2xl p-8 relative"
            onClick={(e) => e.stopPropagation()} // Prevent background click
          >

            {/* Close icon */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-muted"
            >
              <X className="h-5 w-5 text-muted-foreground" />
            </button>

            {/* Header */}
            <div className="text-center mb-8">
              <motion.h2
                key={mode}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="font-display text-2xl font-bold"
              >
                {mode === 'login' ? 'Welcome Back' : 'Create Account'}
              </motion.h2>

              <p className="text-sm text-muted-foreground mt-2">
                {mode === 'login'
                  ? 'Sign in to continue your focus journey'
                  : 'Start your productivity journey today'}
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">

              {/* Name field (signup only) */}
              <AnimatePresence>
                {mode === 'signup' && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                  >
                    <Label>Full Name</Label>
                    <Input value={name} onChange={(e) => setName(e.target.value)} />
                    {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Email field */}
              <div>
                <Label>Email</Label>
                <Input value={email} onChange={(e) => setEmail(e.target.value)} />
                {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
              </div>

              {/* Password field */}
              <div>
                <Label>Password</Label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff /> : <Eye />}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
              </div>

              {/* Submit button */}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin mr-2" />
                    Processing...
                  </>
                ) : mode === 'login' ? 'Sign In' : 'Create Account'}
              </Button>
            </form>

            {/* Switch login/signup */}
            <div className="mt-6 text-center">
              <p className="text-sm">
                {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}
                <button onClick={switchMode} className="text-primary ml-1">
                  {mode === 'login' ? 'Sign up' : 'Sign in'}
                </button>
              </p>
            </div>

          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Login;
