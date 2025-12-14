import React, { useState, forwardRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

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
    if (props.onChange) props.onChange(e);
  };

  const labelVariants = {
    rested: { top: '50%', fontSize: '0.875rem', transform: 'translateY(-50%)', color: '#9ca3af' },
    floated: { top: 0, fontSize: '0.75rem', transform: 'translateY(-50%)', color: '#6b7280' },
  };

  const inputVariants = {
    rested: { scale: 1 },
    focused: { scale: 1.01 },
  };

  return (
    <div className={`relative w-full ${className}`}>
      {label && (
        <motion.label
          className="absolute left-3 px-1 bg-white pointer-events-none z-10 origin-left"
          variants={labelVariants}
          animate={isFocused || hasValue ? 'floated' : 'rested'}
          transition={{ duration: 0.2, ease: 'easeInOut' }}
        >
          {label}
        </motion.label>
      )}
      
      <motion.input
        ref={ref}
        type={type}
        placeholder={label ? '' : placeholder}
        className={`
          w-full px-4 py-3 text-gray-900 bg-white rounded-lg
          border border-gray-300 focus:border-gray-500 outline-none
          transition-colors duration-200
          ${error ? 'border-red-500 focus:border-red-500' : ''}
          ${label ? 'pt-5 pb-2' : ''}
        `}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onChange={handleChange}
        variants={inputVariants}
        animate={isFocused ? 'focused' : 'rested'}
        transition={{ duration: 0.2 }}
        {...props}
      />
      
      <AnimatePresence>
        {error && (
          <motion.span
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute left-0 mt-1 text-red-500 text-xs"
          >
            {error}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
});

export default Input;