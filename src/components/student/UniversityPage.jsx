import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { collection, addDoc, query, where, getDocs, getDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import { getAuth } from 'firebase/auth';
import './UniversityPage.css';

function UniversityDetails() {
    const [collegeDetails, setCollegeDetails] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
    const [profileData, setProfileData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [applicationSubmitted, setApplicationSubmitted] = useState(false);
    const { collegeId } = useParams();
    console.log("Extracted collegeId from URL:", collegeId);    
    const auth = getAuth();

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
            setCurrentUser(user);
        });
        
        return () => unsubscribe(); // Clean up the listener
    }, []);

    // Fetch user profile data
    useEffect(() => {
        const fetchUserProfile = async () => {
            if (!currentUser) return;
            
            try {
                // Get the user's profile document
                const profileRef = doc(db, "users", currentUser.uid, "profile", "details");
                const profileDoc = await getDoc(profileRef);

                if (profileDoc.exists()) {
                    setProfileData(profileDoc.data());
                } else {
                    // Check the legacy studentdetails collection as fallback
                    const studentQuery = query(
                        collection(db, "studentdetails"), 
                        where("userId", "==", currentUser.uid)
                    );
                    
                    const studentSnapshot = await getDocs(studentQuery);
                    
                    if (!studentSnapshot.empty) {
                        setProfileData(studentSnapshot.docs[0].data());
                    }
                }
            } catch (error) {
                console.error("Error fetching profile:", error);
            }
        };

        fetchUserProfile();
    }, [currentUser]);

    // Fetch college details
    useEffect(() => {
        const fetchData = async () => {
            if (!currentUser) return; // Wait until user is authenticated
            
            try {
                // First try to get the college from the user's collection
                const userCollegeRef = doc(db, "users", currentUser.uid, "colleges", collegeId);
                const userCollegeDoc = await getDoc(userCollegeRef);
                
                if (userCollegeDoc.exists()) {
                    // If found in user's collection, use that data
                    setCollegeDetails({ id: userCollegeDoc.id, ...userCollegeDoc.data() });
                } else {
                    // If not found in user's collection, try the global applications collection
                    const collegeQuery = query(collection(db, "applications"), where("collegeId", "==", collegeId));
                    const collegeSnapshot = await getDocs(collegeQuery);
                    
                    if (!collegeSnapshot.empty) {
                        const collegeData = collegeSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))[0];
                        setCollegeDetails(collegeData);
                    } else {
                        console.log("No document with the matching collegeId field found");
                    }
                }
                
                setLoading(false);
            } catch (error) {
                console.error("Error fetching college data:", error);
                setLoading(false);
            }
        };

        fetchData();
    }, [collegeId, currentUser]);

    // Check if application was already submitted
    useEffect(() => {
        const checkExistingApplication = async () => {
            if (!currentUser || !collegeDetails) return;
            
            try {
                // Check if the student already applied to this college
                const applicationQuery = query(
                    collection(db, "studentApplications"),
                    where("studentId", "==", currentUser.uid),
                    where("collegeId", "==", collegeId)
                );
                
                const applicationSnapshot = await getDocs(applicationQuery);
                
                if (!applicationSnapshot.empty) {
                    setApplicationSubmitted(true);
                }
            } catch (error) {
                console.error("Error checking existing application:", error);
            }
        };

        checkExistingApplication();
    }, [currentUser, collegeId, collegeDetails]);

    const handleSubmit = async () => {
        if (!currentUser) {
            window.alert("Please log in to submit an application.");
            return;
        }
    
        if (applicationSubmitted) {
            window.alert("You have already submitted an application to this college.");
            return;
        }
    
        if (!profileData) {
            window.alert("Please complete your profile before submitting an application.");
            return;
        }
    
        console.log("Starting application submission process...");
    
        try {
            // First, fetch the correct collegeId from "applications" collection
            const collegeQuery = query(collection(db, "applications"), where("collegeName", "==", collegeDetails.collegeName));
            const collegeSnapshot = await getDocs(collegeQuery);
    
            if (collegeSnapshot.empty) {
                console.log("No matching college found in 'applications' collection.");
                window.alert("College details not found in database.");
                return;
            }
    
            // Extract the first matching document's collegeId
            const collegeData = collegeSnapshot.docs[0].data();
            const actualCollegeId = collegeData.collegeId;
            console.log("Fetched College ID from 'applications':", actualCollegeId);
    
            // Proceed with storing the application
            const applicationData = {
                studentId: currentUser.uid,
                collegeId: actualCollegeId,  // Use fetched collegeId
                collegeName: collegeDetails.collegeName,
                collegeUserId: collegeData.userId || actualCollegeId, // Ensure correct college owner
                studentDetails: profileData,
                status: "pending",
                timestamp: new Date()
            };
    
            console.log("Application data to be stored:", applicationData);
    
            // Store the application in global "studentApplications" collection
            const studentAppRef = await addDoc(collection(db, "studentApplications"), applicationData);
            console.log("Global application added with ID:", studentAppRef.id);
    
            // Store the application in the college user's collection
            const collegeApplicationData = {
                studentId: currentUser.uid,
                applicationId: studentAppRef.id,
                studentDetails: profileData,
                status: "pending",
                timestamp: new Date()
            };
    
            await addDoc(collection(db, "users", collegeData.userId || actualCollegeId, "applications"), collegeApplicationData);
            console.log("College-specific application added successfully.");
    
            setApplicationSubmitted(true);
            window.alert("Application submitted successfully!");
    
        } catch (error) {
            console.error("Error submitting application:", error);
            window.alert("Error submitting application. Please try again.");
        }
    };
    

    if (loading) {
        return <div className="university-container"><p>Loading details...</p></div>;
    }

    return (
        <div className="university-container">
            {collegeDetails ? (
                <div className="university-template">
                    <div className="university-image">
                        <img src={collegeDetails.imageUrl} alt={collegeDetails.collegeName} />
                    </div>
                    <div className="university-details">
                        <h2 className="university-name">{collegeDetails.collegeName}</h2>
                        <p className="detail">{collegeDetails.description}</p>
                        <p className="detail">Location: <span className="value">{collegeDetails.location}</span></p>
                        <p className="detail">Start Term: <span className="value">{collegeDetails.startTerm}</span></p>
                        <button 
                            className="submit-button" 
                            onClick={handleSubmit}
                            disabled={applicationSubmitted || !profileData}
                        >
                            {applicationSubmitted ? "Application Submitted" : "Submit Application"}
                        </button>
                        {!profileData && (
                            <p className="warning-text">Please complete your profile before submitting an application.</p>
                        )}
                    </div>
                </div>
            ) : (
                <p>College details not found. Please try again.</p>
            )}
        </div>
    );
}

export default UniversityDetails;