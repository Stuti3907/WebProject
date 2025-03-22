import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../../firebase/firebase'; 
import '../styles/AuthPageStyles.css'; 

const SignUpPage = () => {
  const navigate = useNavigate();
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    const email = event.target.elements.email.value;
    const password = event.target.elements.password.value;
    const role = event.target.elements.role.value;

    if (!email || password.length < 6 || !role) {
      setError("Please fill all fields correctly.");
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      const userData = {
        email: email, 
        role: role, 
      };

      if (role === "College") {
        userData.collegeId = user.uid; 
      }

      await setDoc(doc(db, "users", user.uid), userData);
      
      console.log("User registered successfully with role:", role);
      if (role === "Student") {
        navigate("/student-dashboard"); 
      } else if (role === "College") {
        navigate("/college-dashboard"); 
      }
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <div className="auth-page">
      <h2>Sign Up</h2>
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
        <select name="role" className='input' required defaultValue="">
          <option value="" disabled>Select Role</option>
          <option value="Student">Student</option>
          <option value="College">College</option>
        </select>
        <button type="submit">Sign Up</button>
      </form>
    </div>
  );
};

export default SignUpPage;