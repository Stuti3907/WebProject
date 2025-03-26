import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { collection, addDoc, query, where, getDocs, getDoc, doc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import { getAuth } from 'firebase/auth';
import './UniversityPage.css';

function UniversityDetails() {
    const [collegeDetails, setCollegeDetails] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
    const [profileData, setProfileData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [applicationSubmitted, setApplicationSubmitted] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [applicationId, setApplicationId] = useState(null);
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
                        // Try searching by college name as fallback
                        const nameQuery = query(collection(db, "applications"), 
                            where("collegeName", "==", "Harvard University"));
                        const nameSnapshot = await getDocs(nameQuery);
                        
                        if (!nameSnapshot.empty) {
                            const collegeData = nameSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))[0];
                            setCollegeDetails(collegeData);
                        } else {
                            console.log("No matching college document found")
                        }
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
            if (!currentUser || !collegeId) return;
    
            try {
                // Check local storage first for quick verification
                const localStorageKey = `application_${currentUser.uid}_${collegeId}`;
                const localStorageApp = localStorage.getItem(localStorageKey);
                
                if (localStorageApp) {
                    setApplicationSubmitted(true);
                    setApplicationId(localStorageApp);
                    console.log("Found existing application in local storage:", localStorageApp);
                    return;
                }
                
                // Check for application using the URL collegeId
                const applicationQuery = query(
                    collection(db, "studentApplications"),
                    where("studentId", "==", currentUser.uid),
                    where("collegeId", "==", collegeId)
                );
                
                let applicationSnapshot = await getDocs(applicationQuery);
                
                // If not found, try college name as a backup check
                if (applicationSnapshot.empty && collegeDetails?.collegeName) {
                    const nameQuery = query(
                        collection(db, "studentApplications"),
                        where("studentId", "==", currentUser.uid),
                        where("collegeName", "==", collegeDetails.collegeName)
                    );
                    
                    applicationSnapshot = await getDocs(nameQuery);
                }
                
                if (!applicationSnapshot.empty) {
                    const appDoc = applicationSnapshot.docs[0];
                    setApplicationSubmitted(true);
                    setApplicationId(appDoc.id);
                    
                    // Store in localStorage for faster checking on reload
                    localStorage.setItem(localStorageKey, appDoc.id);
                    console.log("Found existing application in database:", appDoc.id);
                } else {
                    setApplicationSubmitted(false);
                    console.log("No existing application found for this college");
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
        
        if (isSubmitting) {
            return; // Prevent multiple clicks
        }
    
        console.log("Starting application submission process...");
        setIsSubmitting(true);
    
        try {
            // Create a unique local storage key for this application
            const localStorageKey = `application_${currentUser.uid}_${collegeId}`;
            
            // Double-check the latest application status before proceeding
            const applicationQuery = query(
                collection(db, "studentApplications"),
                where("studentId", "==", currentUser.uid),
                where("collegeId", "==", collegeId)
            );
    
            const applicationSnapshot = await getDocs(applicationQuery);
            if (!applicationSnapshot.empty) {
                setApplicationSubmitted(true);
                const appId = applicationSnapshot.docs[0].id;
                setApplicationId(appId);
                localStorage.setItem(localStorageKey, appId);
                window.alert("You have already applied to this college.");
                setIsSubmitting(false);
                return;
            }
    
            // Proceed with fetching college ID
            const collegeQuery = query(
                collection(db, "applications"),
                where("collegeName", "==", collegeDetails.collegeName)
            );
            const collegeSnapshot = await getDocs(collegeQuery);
    
            let collegeData = {};
            if (!collegeSnapshot.empty) {
                collegeData = collegeSnapshot.docs[0].data();
            } else {
                console.log("Using existing college details as fallback");
                collegeData = collegeDetails;
            }
    
            // Extract the reliable collegeId
            const actualCollegeId = collegeData.collegeId || collegeId;
            console.log("Using college ID for application:", actualCollegeId);
    
            // Store the application
            const applicationData = {
                studentId: currentUser.uid,
                collegeId: actualCollegeId,
                collegeName: collegeDetails.collegeName,
                collegeUserId: collegeData.userId || actualCollegeId,
                studentDetails: profileData,
                status: "pending",
                timestamp: new Date()
            };
    
            console.log("Application data to be stored:", applicationData);
    
            // Add to the global applications collection
            const studentAppRef = await addDoc(collection(db, "studentApplications"), applicationData);
            console.log("Global application added with ID:", studentAppRef.id);
            
            // Store the application ID for future reference
            setApplicationId(studentAppRef.id);
            
            // Save to localStorage to prevent resubmission even after page reload
            localStorage.setItem(localStorageKey, studentAppRef.id);
    
            // Also add to the college's applications subcollection
            if (collegeData.userId) {
                await addDoc(
                    collection(db, "users", collegeData.userId, "applications"),
                    {
                        studentId: currentUser.uid,
                        applicationId: studentAppRef.id,
                        studentDetails: profileData,
                        status: "pending",
                        timestamp: new Date()
                    }
                );
            }
            
            // Add to user's applications collection for easy tracking
            await setDoc(
                doc(db, "users", currentUser.uid, "applications", studentAppRef.id),
                {
                    collegeId: actualCollegeId,
                    collegeName: collegeDetails.collegeName,
                    applicationId: studentAppRef.id,
                    status: "pending",
                    timestamp: new Date()
                }
            );
    
            setApplicationSubmitted(true);
            window.alert("Application submitted successfully!");
        } catch (error) {
            console.error("Error submitting application:", error);
            window.alert("Error submitting application. Please try again.");
        } finally {
            setIsSubmitting(false);
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
                            className={`submit-button ${(applicationSubmitted || isSubmitting || !profileData) ? 'disabled' : ''}`} 
                            onClick={handleSubmit}
                            disabled={applicationSubmitted || isSubmitting || !profileData}
                        >
                            {applicationSubmitted ? "Application Submitted" : 
                             isSubmitting ? "Submitting..." : "Submit Application"}
                        </button>
                        {!profileData && (
                            <p className="warning-text">Please complete your profile before submitting an application.</p>
                        )}
                        {applicationSubmitted && (
                            <p className="success-text">You have already applied to this university.</p>
                        )}
                        {applicationId && (
                            <p className="detail">Application ID: <span className="value">{applicationId}</span></p>
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
