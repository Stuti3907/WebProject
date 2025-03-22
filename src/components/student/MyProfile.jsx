import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, query, where, doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import { getAuth } from 'firebase/auth'; // Import Firebase auth
import './MyProfile.css';

const ProfilePage = () => {
  const [activeTab, setActiveTab] = useState('personalInfo');
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    address: '',
    email: '',
    phone: '',
    fatherName: '',
    fatherPhone: '',
    motherName: '',
    motherPhone: '',
    educationDetails: '',
    eca: ''
  });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const auth = getAuth();
  const currentUser = auth.currentUser;

  // Fetch existing profile data when component mounts
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!currentUser) {
        setLoading(false);
        return;
      }

      try {
        // Get the user's profile document
        const profileRef = doc(db, "users", currentUser.uid, "profile", "details");
        const profileDoc = await getDoc(profileRef);

        if (profileDoc.exists()) {
          // If profile exists, load the data into the form
          setFormData(profileDoc.data());
        }
        
        setLoading(false);
      } catch (error) {
        console.error("Error fetching profile:", error);
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [currentUser]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    
    if (!currentUser) {
      setMessage('You must be logged in to save your profile.');
      return;
    }

    try {
      // Store profile in user-specific collection
      await setDoc(doc(db, "users", currentUser.uid, "profile", "details"), {
        ...formData,
        userId: currentUser.uid,
        updatedAt: new Date()
      });

      // Also update in the studentdetails collection for backwards compatibility
      // This line can be removed later when all components are updated
      const existingQuery = query(collection(db, "studentdetails"), 
                                  where("userId", "==", currentUser.uid));
      const querySnapshot = await getDocs(existingQuery);
      
      if (!querySnapshot.empty) {
        // Update existing document
        const docId = querySnapshot.docs[0].id;
        await setDoc(doc(db, "studentdetails", docId), {
          ...formData,
          userId: currentUser.uid,
          updatedAt: new Date()
        });
      } else {
        // Create new document
        await addDoc(collection(db, "studentdetails"), {
          ...formData,
          userId: currentUser.uid,
          updatedAt: new Date()
        });
      }

      setMessage('Profile saved successfully!');
    } catch (error) {
      console.error("Error saving profile: ", error);
      setMessage('Error saving profile. Please try again.');
    }
  };

  if (loading) {
    return <div>Loading profile data...</div>;
  }

  return (
    <div className="profile-page">
      {message && <div className="message">{message}</div>}
      <div className="tab-nav">
        <button
          className={`tab-nav-button ${activeTab === 'personalInfo' && 'active'}`}
          onClick={() => handleTabChange('personalInfo')}
        >
          Personal Info
        </button>
        <button
          className={`tab-nav-button ${activeTab === 'education' && 'active'}`}
          onClick={() => handleTabChange('education')}
        >
          Education
        </button>
        <button
          className={`tab-nav-button ${activeTab === 'eca' && 'active'}`}
          onClick={() => handleTabChange('eca')}
        >
          Extra Co-Curriculum Activities
        </button>
      </div>
      <div className="tab-content">
        {activeTab === 'personalInfo' && (
          <PersonalInfoForm
            formData={formData}
            handleChange={handleChange}
            handleSubmit={handleSubmit}  
          />
        )}
        {activeTab === 'education' && (
          <EducationForm
            formData={formData}
            handleChange={handleChange}
            handleSubmit={handleSubmit} 
          />
        )}
        {activeTab === 'eca' && (
          <Eca
            formData={formData}
            handleChange={handleChange}
            handleSubmit={handleSubmit}  
          />
        )}
      </div>
    </div>
  );
};

const PersonalInfoForm = ({ formData, handleChange, handleSubmit }) => {
  return (
    <form className="form" onSubmit={handleSubmit}>
      <div className="input-container">
        <input className="input" type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Name" required/>
      </div>
      <div className="input-container">
        <input className="input" type="number" name="age" value={formData.age} onChange={handleChange} placeholder="Age" required/>
      </div>
      <div className="input-container">
        <input className="input" type="text" name="address" value={formData.address} onChange={handleChange} placeholder="Address" required/>
      </div>
      <div className="input-container">
        <input className="input" type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Email" required/>
      </div>
      <div className="input-container">
        <input className="input" type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="Phone" required/>
      </div>
      <div className="input-container">
        <input className="input" type="text" name="fatherName" value={formData.fatherName} onChange={handleChange} placeholder="Father's Name" required/>
      </div>
      <div className="input-container">
        <input className="input" type="tel" name="fatherPhone" value={formData.fatherPhone} onChange={handleChange} placeholder="Father's Phone" required/>
      </div>
      <div className="input-container">
        <input className="input" type="text" name="motherName" value={formData.motherName} onChange={handleChange} placeholder="Mother's Name" required/>
      </div>
      <div className="input-container">
        <input className="input" type="tel" name="motherPhone" value={formData.motherPhone} onChange={handleChange} placeholder="Mother's Phone" required/>
      </div>
      <button type="submit">Save Personal Info</button>
    </form>
  );
};

const EducationForm = ({ formData, handleChange, handleSubmit }) => {
  return (
    <form className="form" onSubmit={handleSubmit}>
      <textarea
        className="input2"
        name="educationDetails"
        value={formData.educationDetails}
        onChange={handleChange}
        placeholder="Education Details"
        required
      />
      <button type="submit">Save Education Info</button>
    </form>
  );
};

const Eca = ({ formData, handleChange, handleSubmit }) => {
  return (
    <form className="form" onSubmit={handleSubmit}>
      <textarea
        className="input2"
        name="eca"
        value={formData.eca}
        onChange={handleChange}
        placeholder="Extra-Curricular Activities"
        required
      />
      <button type="submit">Save ECA Info</button>
    </form>
  );
};

export default ProfilePage;