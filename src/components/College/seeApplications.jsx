import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import './seeApplications.css';

const SeeApplicationsPage = () => {
  const [studentDetails, setStudentDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { studentId } = useParams(); // Retrieve studentId from URL parameters

  useEffect(() => {
    const fetchStudentDetails = async () => {
      setLoading(true);
      setError(null);
      
      if (!studentId || studentId.trim() === '') {
        setError('Invalid student ID provided');
        setLoading(false);
        return;
      }

      try {
        // Query Firestore to find all documents matching studentId
        const q = query(collection(db, 'studentApplications'), where('studentId', '==', studentId));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          setError('No student found with the provided ID');
          setLoading(false);
          return;
        }

        // Convert documents to an array, ensuring unique entries
        const applications = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Remove duplicates using studentId
        const uniqueApplications = applications.filter(
          (app, index, self) => 
            index === self.findIndex(t => t.studentId === app.studentId)
        );

        // Use the latest entry (if multiple exist)
        uniqueApplications.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

        const latestApplication = uniqueApplications[0];

        if (latestApplication.studentDetails) {
          setStudentDetails(latestApplication.studentDetails);
        } else {
          setError('Incomplete student information found');
        }
      } catch (error) {
        console.error('Error fetching student details:', error);
        setError('Failed to fetch student details. Please try again later.');
      }

      setLoading(false);
    };

    fetchStudentDetails();
  }, [studentId]); 

  // Open mail client with student's email
  const handleOpenMail = () => {
    if (studentDetails?.email) {
      window.open(`mailto:${studentDetails.email}`);
    } else {
      console.error('No email address found.');
    }
  };

  if (loading) {
    return <div className="loading-container">Loading...</div>;
  }

  if (error) {
    return <div className="error-container">{error}</div>;
  }

  if (!studentDetails) {
    return <div className="error-container">No student details found.</div>;
  }

  return (
    <><br/><br/><br/><br/>
    <div className="custom-card">
      <h1 className="custom-card-title">Student Details</h1>
      <div className="custom-card-content">
        <p><strong>Name:</strong> {studentDetails.name}</p>
        <p><strong>Email:</strong> {studentDetails.email}</p>
        <p><strong>Phone:</strong> {studentDetails.phone || 'N/A'}</p>
        <p><strong>Address:</strong> {studentDetails.address || 'N/A'}</p>
        <p><strong>Age:</strong> {studentDetails.age || 'N/A'}</p>
        <p><strong>Extra-Curricular Activities:</strong> {studentDetails.eca || 'N/A'}</p>
        <p><strong>Education Details:</strong> {studentDetails.educationDetails || 'N/A'}</p>
        <p><strong>Father's Name:</strong> {studentDetails.fatherName || 'N/A'}</p>
        <p><strong>Father's Phone:</strong> {studentDetails.fatherPhone || 'N/A'}</p>
        <p><strong>Mother's Name:</strong> {studentDetails.motherName || 'N/A'}</p>
        <p><strong>Mother's Phone:</strong> {studentDetails.motherPhone || 'N/A'}</p>
        {studentDetails.email && (
          <button className="custom-card-button" onClick={handleOpenMail}>Open Mail</button>
        )}
      </div>
    </div>
    </>
  );
};

export default SeeApplicationsPage;
