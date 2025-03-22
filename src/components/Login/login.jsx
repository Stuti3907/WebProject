import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../firebase/firebase'; 
import '../styles/AuthPageStyles.css';

const LoginPage = () => {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true); 
    const email = event.target.elements.email.value;
    const password = event.target.elements.password.value;

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const userData = docSnap.data();
        const { role, collegeId } = userData;

        if (role === 'College' && collegeId) {
          localStorage.setItem('collegeId', collegeId);
        }

        if (role === 'Student') {
          navigate("/student-dashboard");
        } else if (role === 'College') {
          navigate("/college-dashboard");
        } else {
          setError("Role not recognized.");
          setLoading(false); 
        }
      } else {
        setError("No user data found.");
        setLoading(false); 
      }
    } catch (error) {
      setError(error.message);
      setLoading(false); 
    }
  };

  const handleSignUpNavigation = () => {
    navigate("/signup");
  };

  return (
    <div className="auth-page">
      <h2>LogIn</h2>
      <form onSubmit={handleSubmit} className="auth-form">
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <div className="input-container">
          <input
            className="input1" 
            name="email" 
            type="email" 
            placeholder="Email" 
            required 
          />
        </div>
        <div className="input-container">
          <input
            className="input1" 
            name="password" 
            type="password" 
            placeholder="Password" 
            required 
          />
        </div>
        <button type="submit" disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
      <div style={{ marginTop: "20px" }}>
        <button className="button signup-button" onClick={handleSignUpNavigation}>
          Don't have an account? Sign up
        </button>
      </div>
    </div>
  );
};

export default LoginPage;