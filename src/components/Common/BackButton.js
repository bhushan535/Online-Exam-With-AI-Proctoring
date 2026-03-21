import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaChevronLeft } from 'react-icons/fa';
import './BackButton.css';

const BackButton = ({ to, label = "Back" }) => {
    const navigate = useNavigate();

    const handleBack = () => {
        if (to) {
            navigate(to);
        } else {
            navigate(-1);
        }
    };

    return (
        <button className="back-button" onClick={handleBack}>
            <FaChevronLeft /> {label}
        </button>
    );
};

export default BackButton;
