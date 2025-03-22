import React from 'react';
import { useNavigate } from 'react-router-dom';
import './card.css';

const MyCard = ({ uni }) => {
    const navigate = useNavigate(); 

    const handleClick = () => {
        if (uni && uni.collegeId) {
            navigate(`/university-details/${uni.collegeId}`);
        }
    };

    return (
        <div className="card" onClick={handleClick}>
            <div className="content">
                <h1 className="title">{uni?.collegeName || 'No Name Provided'}</h1>
                <div className="requirements">
                    <strong>Location: </strong>
                    <p>{uni?.location || 'Unknown Location'}</p>
                </div>
                <div className="description">
                    <strong>Description: </strong>
                    <p>{uni?.description || 'No description available.'}</p>
                </div>
            </div>
        </div>
    );
};

export default MyCard;