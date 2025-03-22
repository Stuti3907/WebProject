import React, { useState } from 'react';
import { db, storage } from '../../firebase/firebase'; // Adjust the path as needed
import { addDoc, collection, doc, setDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth'; // Import Firebase auth
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import './handleApplications.css';
import { useNavigate } from 'react-router-dom';

function HandleApplication() {
  const [collegeName, setCollegeName] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [startTerm, setStartTerm] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false); // Track loading state
  const [message, setMessage] = useState(''); // User feedback message
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage('');
  
    const auth = getAuth(); // Get authentication instance
    const currentUser = auth.currentUser; // Get current logged-in user
  
    if (!currentUser) {
      setLoading(false);
      alert("Error: User not authenticated. Please log in again.");
      return;
    }
  
    if (!file) {
      setLoading(false);
      alert("Please upload an image file.");
      return;
    }
  
    try {
      // 1. Upload image to Firebase Storage
      const filename = `${currentUser.uid}_${Date.now()}_${file.name}`;
      const storageRef = ref(storage, `collegeimages/${filename}`);
      
      const uploadResult = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(uploadResult.ref);
      
      // 2. Create application data object
      const applicationData = {
        collegeName,
        location,
        description,
        startTerm,
        imageUrl: downloadURL,
        userId: currentUser.uid,
        collegeId: currentUser.uid,
        timestamp: new Date()
      };
      
      // 3. Save to user's subcollection (for college's own records)
      await addDoc(collection(db, "users", currentUser.uid, "applications"), applicationData);
      
      // 4. Save to global applications collection (for discovery)
      await addDoc(collection(db, "applications"), applicationData);
      
      // 5. Update user profile to include college details
      await setDoc(doc(db, "users", currentUser.uid), {
        collegeName,
        location,
        description,
        isCollege: true,
        imageUrl: downloadURL
      }, { merge: true });
      
      console.log("Application submitted successfully.");
      setMessage('Application submitted successfully!');
      resetForm();
      
      // Navigate back to college dashboard
      setTimeout(() => {
        navigate("/college");
      }, 1500);
    } catch (error) {
      console.error("Error submitting application: ", error);
      setMessage('Error submitting application. Please try again.');
    } finally {
      setLoading(false);
    }
  };  

  const resetForm = () => {
    setCollegeName('');
    setLocation('');
    setDescription('');
    setStartTerm('');
    setFile(null);
    document.getElementById('file').value = null;
  };

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };

  return (
    <div className="application-upload-form">
      <h1>Upload College Application</h1>
      <form onSubmit={handleSubmit}>
        {message && <p className={message.includes('Error') ? 'error-message' : 'success-message'}>{message}</p>}
        <div className="input-container">
          <input 
            type="text" 
            id="collegeName" 
            value={collegeName} 
            name="text" 
            className="input" 
            placeholder="College Name" 
            onChange={(e) => setCollegeName(e.target.value)}
            required/>
        </div>
        <div className="input-container">
          <input 
            name="text" 
            className="input" 
            placeholder="Location:"
            id="location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            type="text"
            required
          />
        </div>
        <div className="input-container">
          <input 
            name="text" 
            className="input" 
            placeholder="Start Term:"
            id="startTerm"
            value={startTerm}
            onChange={(e) => setStartTerm(e.target.value)}
            type="text"
            required
          />
        </div>
        <div className="input-container">
          <textarea
            name="text" 
            className="input textarea" 
            placeholder="Description:"
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </div>
        <div className="input-container">
          <input
            type="file" 
            name="text" 
            className="input" 
            placeholder="Upload Image"
            id="file"
            onChange={handleFileChange}
            accept="image/*"
            required
          />
      </div>
        <button type="submit" disabled={loading}>
          {loading ? 'Submitting...' : 'Submit Application'}
        </button>
      </form>
    </div>
  );
}

export default HandleApplication;