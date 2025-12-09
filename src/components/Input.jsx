import React, { useState, forwardRef } from 'react';


const Input = forwardRef(({ 
  type = 'text', 
  placeholder = '', 
  label = '', 
  error = '', 
  className = '',
  ...props 
}, ref) => {
  const [isFocused, setIsFocused] = useState(false);
  const [hasValue, setHasValue] = useState(false);

  const handleChange = (e) => {
    setHasValue(e.target.value.length > 0);
    if (props.onChange) {
      props.onChange(e);
    }
  };

  return (
    <div 
      className={`relative w-full ${className}`}
      style={{
        animation: 'fadeInUp 0.3s ease-out'
      }}
    >
      {label && (
        <label
          className={`absolute left-3 transition-all duration-300 pointer-events-none z-10 ${
            isFocused || hasValue
              ? 'top-1 text-xs text-gray-600 bg-white px-1 -translate-y-1/2'
              : 'top-1/2 text-sm text-gray-400 -translate-y-1/2'
          }`}
          style={{
            transform: isFocused || hasValue ? 'translateY(-8px) scale(0.9)' : 'translateY(-50%)',
            transition: 'all 0.2s ease'
          }}
        >
          {label}
        </label>
      )}
      
      <input
        ref={ref}
        type={type}
        placeholder={label ? '' : placeholder}
        className={`
          w-full px-4 py-3 text-black bg-white rounded-xl
          transition-all duration-300 outline-none
          focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50
          hover:shadow-md focus:shadow-lg
          ${error ? 'ring-2 ring-red-500' : 'ring-1 ring-gray-200'}
          ${label ? 'pt-6 pb-2' : ''}
        `}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onChange={handleChange}
        style={{
          transform: isFocused ? 'scale(1.02)' : 'scale(1)',
          transition: 'all 0.2s ease'
        }}
        onMouseEnter={(e) => {
          if (!isFocused) e.target.style.transform = 'scale(1.01)';
        }}
        onMouseLeave={(e) => {
          if (!isFocused) e.target.style.transform = 'scale(1)';
        }}
        {...props}
      />
      
      {error && (
        <span
          className="text-red-500 text-sm mt-1 block"
          style={{
            animation: 'fadeIn 0.2s ease-in'
          }}
        >
          {error}
        </span>
      )}
      
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-5px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
});

export default Input;