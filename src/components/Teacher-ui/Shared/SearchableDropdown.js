import React, { useState, useEffect, useRef } from 'react';
import "./SearchableDropdown.css";

const SearchableDropdown = ({ options, placeholder, onSelect, value, required }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const containerRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredOptions = options.filter(option => 
        (option.name || option).toLowerCase().includes(searchTerm.toLowerCase()) ||
        (option.code || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="searchable-dropdown" ref={containerRef}>
            <input
                type="text"
                className="dropdown-input"
                placeholder={value || placeholder}
                value={searchTerm}
                onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setIsOpen(true);
                }}
                onFocus={() => setIsOpen(true)}
                required={required && !value}
            />
            {isOpen && (
                <div className="dropdown-options glass-v2">
                    {filteredOptions.length > 0 ? (
                        filteredOptions.map((option, index) => (
                            <div 
                                key={index} 
                                className="dropdown-option"
                                onClick={() => {
                                    onSelect(option);
                                    setSearchTerm('');
                                    setIsOpen(false);
                                }}
                            >
                                <div className="option-primary">{option.name || option}</div>
                                {option.code && <div className="option-secondary">{option.code}</div>}
                            </div>
                        ))
                    ) : (
                        <div className="no-options">No matches found</div>
                    )}
                </div>
            )}
        </div>
    );
};

export default SearchableDropdown;
