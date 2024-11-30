import React from 'react';
import './Spinner.css'; // Make sure to include the CSS file

const Spinner = ({ size = 24, color = '#4A90E2' }) => {
  return (
    <div
      className="spinner"
      style={{
        width: size,
        height: size,
        borderColor: `${color} transparent transparent transparent`,
      }}
    ></div>
  );
};

export default Spinner;
