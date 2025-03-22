import React, { useState, useEffect } from 'react';
import './college.css';
import { useNavigate } from 'react-router-dom';
import { db } from '../../firebase/firebase';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';

function College() {
  const [activeTab, setActiveTab] = useState("seeApplications");
  const [applications, setApplications] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [collegeDetails, setCollegeDetails] = useState(null);
  const navigate = useNavigate();
  const auth = getAuth();

  // Listen for user authentication state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });

    return () => unsubscribe(); // Cleanup listener on unmount
  }, [auth]);

  // Fetch college details to get collegeId if different from user UID
  useEffect(() => {
    const fetchCollegeDetails = async () => {
      if (!currentUser) return;
      
      try {
        // First check if the college has its details in its own user document
        const collegeRef = doc(db, "users", currentUser.uid);
        const collegeDoc = await getDoc(collegeRef);
        
        if (collegeDoc.exists()) {
          setCollegeDetails({ uid: currentUser.uid, ...collegeDoc.data() });
        } else {
          setCollegeDetails({ uid: currentUser.uid });
        }
      } catch (error) {
        console.error("Error fetching college details:", error);
      }
    };

    fetchCollegeDetails();
  }, [currentUser]);

  // Fetch applications only when currentUser is available
  useEffect(() => {
    const fetchApplications = async () => {
      if (!currentUser || !collegeDetails) return; // Ensure user and college details are available
      setLoading(true);
  
      try {
        let userApplications = [];
        const possibleIds = [currentUser.uid];
        
        if (collegeDetails.collegeId && collegeDetails.collegeId !== currentUser.uid) {
          possibleIds.push(collegeDetails.collegeId);
        }
        if (collegeDetails.collegeName) {
          possibleIds.push(collegeDetails.collegeName);
        }
        
        console.log("Fetching applications with possible IDs:", possibleIds);
  
        // Query the global collection 'studentApplications' based on collegeId
        const globalAppsQuery = query(
          collection(db, "studentApplications"),
          where("collegeId", "in", possibleIds)
        );
        
        const globalAppsSnapshot = await getDocs(globalAppsQuery);
        console.log("Found applications in global collection:", globalAppsSnapshot.size);
        
        if (!globalAppsSnapshot.empty) {
          userApplications = globalAppsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        }
        
        // Fetch applications where collegeName matches (if available)
        if (collegeDetails.collegeName) {
          const nameMatchQuery = query(
            collection(db, "studentApplications"),
            where("collegeName", "==", collegeDetails.collegeName)
          );
          
          const nameMatchSnapshot = await getDocs(nameMatchQuery);
          console.log("Found applications with collegeName match:", nameMatchSnapshot.size);
          
          if (!nameMatchSnapshot.empty) {
            const existingIds = new Set(userApplications.map(app => app.id));
            const nameMatchApps = nameMatchSnapshot.docs
              .filter(doc => !existingIds.has(doc.id))
              .map(doc => ({ id: doc.id, ...doc.data() }));
            
            userApplications = [...userApplications, ...nameMatchApps];
          }
        }
        
        console.log("Total applications fetched:", userApplications.length);
        setApplications(userApplications);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching applications from global collection:", error);
        setLoading(false);
      }
    };
  
    fetchApplications();
  }, [currentUser, collegeDetails]);
  

  const goToApplicationHandling = () => {
    navigate("/handle-applications");
  };

  const goToSeeApplications = (studentId) => {
    if (studentId) {
      navigate(`/see-applications/${studentId}`);
    } else {
      alert("Error: Unable to view student details. Student ID is missing.");
    }
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <p>Welcome to CampusConnect</p>
        <section className="application-form">
          <div className="app">
            <button className="big-button" onClick={goToApplicationHandling}>+ Add Application</button>
          </div>
        </section>
      </header>

      <nav className="tab-nav">
        <button
          className={`tab-nav-button ${activeTab === "seeApplications" ? "active" : ""}`} 
          onClick={() => setActiveTab("seeApplications")}>
          See Applications
        </button>
      </nav>

      <main className="dashboard-main">
        {activeTab === "seeApplications" && (
          <section className="see-applications-table">
            <h2>View Applications</h2>
            {loading ? (
              <p>Loading applications...</p>
            ) : applications.length > 0 ? (
              <div className="responsive-table-container">
                <table className="responsive-table">
                  <thead>
                    <tr>
                      <th>Student Name</th>
                      <th>Age</th>
                      <th>Address</th>
                      <th>Email</th>
                      <th>Phone Number</th>
                      <th>Status</th>
                      <th>Date Applied</th>
                    </tr>
                  </thead>
                  <tbody>
                    {applications.map((app) => (
                      <tr 
                        key={app.id} 
                        onClick={() => goToSeeApplications(app.studentId)}
                        style={{cursor: 'pointer'}}
                      >
                        <td>{app.studentDetails?.name || "N/A"}</td>
                        <td>{app.studentDetails?.age || "N/A"}</td>
                        <td>{app.studentDetails?.address || "N/A"}</td>
                        <td>{app.studentDetails?.email || "N/A"}</td>
                        <td>{app.studentDetails?.phone || "N/A"}</td>
                        <td>{app.status || "pending"}</td>
                        <td>
                          {app.timestamp ? new Date(app.timestamp.seconds * 1000).toLocaleDateString() : "N/A"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p>No applications found. When students apply to your college, they will appear here.</p>
            )}
          </section>
        )}
      </main>

      <footer>
        <p>© 2025 CampusConnect</p>
      </footer>
    </div>
  );
}

export default College;