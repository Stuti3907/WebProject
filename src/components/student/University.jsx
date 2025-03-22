import React from 'react';
import './UniversityPage.css';

function UniversityInfo({ university }) {
  return (
    <div className="university-info">
      <img src={university.imageUrl} alt={university.collegeName} className="university-image" />
      <div className="university-text-container">
        <h1 className="university-name">{university.collegeName}</h1>
        <p className="university-location">{university.location}</p>
        <p className="university-description">{university.description}</p>
        <p className="university-requirements">{university.startTerm}</p>
      </div>
      <button className="university-submit-button">Submit</button>
    </div>
  );
}

function UniversityContainer({ university }) {
  return (
    <div className="university-container">
      <UniversityInfo university={university} />
    </div>
  );
}

export default UniversityContainer;
  