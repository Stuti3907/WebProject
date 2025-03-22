import React, { useState, useEffect } from 'react';
import './AddPrograms.css';
import { Table, TableBody, TableCell, TableHead, TableRow, TextField, Button } from '@mui/material';
import { db } from '../../firebase/firebase'; 
import { collection, getDocs, doc, setDoc, getDoc } from 'firebase/firestore';
import { useAuth } from '../../firebase/AuthContext'; 

const UniversityTable = () => {
    const [search, setSearch] = useState('');
    const [programs, setPrograms] = useState([]);
    const { currentUser } = useAuth();

    useEffect(() => {
        const fetchPrograms = async () => {
            try {
                const querySnapshot = await getDocs(collection(db, "applications"));
                const loadedPrograms = querySnapshot.docs.map(doc => ({
                    collegeId: doc.id,
                    collegeName: doc.data().collegeName,
                    location: doc.data().location,
                    description: doc.data().description,
                    startTerm: doc.data().startTerm,
                    imageUrl: doc.data().imageUrl,
                }));
                setPrograms(loadedPrograms);
                
            } catch (error) {
                console.error("Error fetching programs:", error);
            }
        };

        fetchPrograms();
    }, []);

    const handleSearchChange = (event) => {
        setSearch(event.target.value);
    };

    const handleAddCollege = async (program) => {
        if (!currentUser) {
            alert('You must be logged in to add colleges.');
            return;
        }

        const userUid = currentUser.uid;
        const userCollegesRef = collection(db, "users", userUid, "colleges"); // Store under user

        try {
            const collegeDocRef = doc(userCollegesRef, program.collegeId);
            const collegeDoc = await getDoc(collegeDocRef);

            if (collegeDoc.exists()) {
                alert(`You have already added ${program.collegeName}`);
                return;
            }

            await setDoc(collegeDocRef, {
                collegeName: program.collegeName,
                collegeId: program.collegeId,  
                location: program.location,
                description: program.description,
                startTerm: program.startTerm,
                imageUrl: program.imageUrl
            });

            alert(`College added successfully: ${program.collegeName}`);
        } catch (error) {
            console.error("Error adding college to Student Colleges", error);
            alert('Failed to add college. Please try again.');
        }
    };

    const filteredData = programs.filter(program =>
        program.collegeName?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="table-container">
            <TextField
                fullWidth
                label="Search Programs"
                variant="outlined"
                value={search}
                onChange={handleSearchChange}
            />
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell>College Name</TableCell>
                        <TableCell>Location</TableCell>
                        <TableCell>Start Term</TableCell>
                        <TableCell>Action</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {filteredData.map((program) => (
                        <TableRow key={program.collegeId} className='tr'>
                            <TableCell>{program.collegeName || 'Unknown Name'}</TableCell>
                            <TableCell>{program.location || 'Unknown Location'}</TableCell>
                            <TableCell>{program.startTerm || 'Unknown Term'}</TableCell>
                            <TableCell>
                                <Button className="add-college-btn" onClick={() => handleAddCollege(program)}>
                                    Add College
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
};

export default UniversityTable;
