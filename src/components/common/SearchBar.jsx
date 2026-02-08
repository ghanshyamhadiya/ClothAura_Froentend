import React, { useEffect, useRef, useState } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getAutocomplete } from '../../services/productService';

function SearchBar({
  onSearch,
  searchQuery,
  setSearchQuery,
  placeholder = "Search products...",
  className = "",
  showAutocomplete = true,
  minimal = false,
  autoFocus = false
}) {
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isFocused, setIsFocused] = useState(false);

  const debounceTimeoutRef = useRef(null);
  const autocompleteTimeoutRef = useRef(null);
  const wrapperRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowSuggestions(false);
        setIsFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    setSelectedIndex(-1);

    if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
    if (autocompleteTimeoutRef.current) clearTimeout(autocompleteTimeoutRef.current);

    debounceTimeoutRef.current = setTimeout(() => {
      if (onSearch) onSearch(value);
    }, 500);

    if (showAutocomplete && getAutocomplete && value.trim().length >= 2) {
      setLoadingSuggestions(true);
      autocompleteTimeoutRef.current = setTimeout(async () => {
        try {
          const results = await getAutocomplete(value);
          setSuggestions(results);
          setShowSuggestions(true);
        } catch (error) {
          console.error('Autocomplete error:', error);
          setSuggestions([]);
        } finally {
          setLoadingSuggestions(false);
        }
      }, 200);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleClear = () => {
    setSearchQuery('');
    if (onSearch) onSearch('');
    setSuggestions([]);
    setShowSuggestions(false);
    setSelectedIndex(-1);
  };

  const handleSuggestionClick = (suggestion) => {
    setSearchQuery(suggestion.name);
    if (onSearch) onSearch(suggestion.name);
    setShowSuggestions(false);
    setSuggestions([]);
  };

  const handleKeyDown = (e) => {
    if (!showSuggestions || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault();
      handleSuggestionClick(suggestions[selectedIndex]);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
      if (autocompleteTimeoutRef.current) clearTimeout(autocompleteTimeoutRef.current);
    };
  }, []);

  return (
    <div ref={wrapperRef} className={`relative w-full ${className}`}>
      <div className="relative group">
        {/* Input Field */}
        <input
          type="text"
          value={searchQuery}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown} // Line 114
          onFocus={(e) => { // Line 115
            setIsFocused(true);
            if (suggestions.length > 0) setShowSuggestions(true);
          }}
          onBlur={() => { // Line 119
            // Delay blur to allow click on suggestion
            setTimeout(() => setIsFocused(false), 200);
          }}
          ref={(input) => input && autoFocus && input.focus()}
          placeholder={placeholder}
          className={`
            w-full py-3 text-xl font-medium text-black bg-transparent
            outline-none placeholder:text-gray-300
            ${minimal ? 'border-none shadow-none text-center' : `
              px-4 pl-10 sm:pl-12 pr-10 border-2 rounded-lg
              ${isFocused ? 'border-black shadow-lg' : 'border-gray-300'}
            `}
          `}
        />

        {/* Search Icon - Hide in minimal mode */}
        {!minimal && (
          <div className={`
          absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 
          transition-all duration-300
          ${isFocused ? 'text-black scale-110' : 'text-gray-500'}
        `}>
            <Search className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        )}

        {/* Loading Spinner */}
        {loadingSuggestions && (
          <div
            className="absolute right-10 sm:right-12 top-1/2 -translate-y-1/2 animate-in fade-in spin-in-180 duration-200"
          >
            <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 animate-spin" />
          </div>
        )}

        {/* Clear Button */}
        {searchQuery && !loadingSuggestions && (
          <button
            onClick={handleClear}
            className={`
              absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 
              text-gray-500 hover:text-black 
              transition-all duration-200 hover:scale-110 active:scale-95
              animate-in fade-in zoom-in duration-200
            `}
            aria-label="Clear search"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        )}
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div
          className={`
             absolute w-full mt-4 bg-white rounded-xl shadow-2xl z-50 overflow-hidden
             ${minimal ? 'left-0 right-0 mx-auto max-w-lg border border-gray-100' : 'border border-gray-300'}
          `}
        >
          {suggestions.slice(0, 5).map((sug, idx) => (
            <div
              key={sug.id}
              onClick={() => handleSuggestionClick(sug)}
              className={`
                px-4 py-2.5 sm:py-3 text-sm sm:text-base
                cursor-pointer transition-all duration-150
                border-b border-gray-200 last:border-b-0
                ${idx === selectedIndex
                  ? 'bg-gray-900 text-white font-medium'
                  : 'hover:bg-gray-100 text-gray-900'
                }
              `}
              style={{
                animationDelay: `${idx * 30}ms`,
                animation: 'fadeSlideIn 0.2s ease-out forwards',
                opacity: 0
              }}
            >
              <div className="flex items-center gap-2">
                <Search className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${idx === selectedIndex ? 'text-gray-300' : 'text-gray-500'}`} />
                <span className="truncate">{sug.name}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <style jsx>{`
        @keyframes fadeSlideIn {
          from {
            opacity: 0;
            transform: translateY(-4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}

export default SearchBar;