import React, { useEffect, useRef, useState } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Input from '../Input';
import { getAutocomplete } from '../../services/productService';

function SearchBar({ onSearch, searchQuery, setSearchQuery }) {
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const debounceTimeoutRef = useRef(null);
  const autocompleteTimeoutRef = useRef(null);
  const wrapperRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowSuggestions(false);
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
      onSearch(value);
    }, 500);

    if (value.trim().length >= 2) {
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
    onSearch('');
    setSuggestions([]);
    setShowSuggestions(false);
    setSelectedIndex(-1);
  };

  const handleSuggestionClick = (suggestion) => {
    setSearchQuery(suggestion.name);
    onSearch(suggestion.name);
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
    <div ref={wrapperRef} className="relative w-full">
      <div className="relative">
        <Input
          type="text"
          value={searchQuery}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
          placeholder="Search products..."
          className="pr-12 pl-10"
          style={{ transition: 'all 0.2s ease' }}
        />
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        
        <AnimatePresence>
          {loadingSuggestions && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="absolute right-12 top-1/2 -translate-y-1/2"
            >
              <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
            </motion.div>
          )}
        </AnimatePresence>

        {searchQuery && !loadingSuggestions && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </motion.button>
        )}
      </div>

      <AnimatePresence>
        {showSuggestions && suggestions.length > 0 && (
          <motion.ul
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-xl z-50 max-h-60 overflow-y-auto"
          >
            {suggestions.map((sug, idx) => (
              <motion.li
                key={sug.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: idx * 0.05 }}
                onClick={() => handleSuggestionClick(sug)}
                className={`px-4 py-3 text-sm hover:bg-gray-50 cursor-pointer transition-colors ${
                  idx === selectedIndex ? 'bg-gray-100' : ''
                }`}
              >
                {sug.name}
              </motion.li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

export default SearchBar;