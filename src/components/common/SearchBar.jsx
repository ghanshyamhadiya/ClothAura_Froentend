import { useEffect, useRef, useState } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { getAutocomplete } from '../../services/productService';

function SearchBar({ onSearch, searchQuery, setSearchQuery }) {
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const debounceTimeoutRef = useRef(null);
  const autocompleteTimeoutRef = useRef(null);
  const wrapperRef = useRef(null);

  // Close suggestions when clicking outside
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

    // Clear existing timeouts
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    if (autocompleteTimeoutRef.current) {
      clearTimeout(autocompleteTimeoutRef.current);
    }

    // Debounced search
    debounceTimeoutRef.current = setTimeout(() => {
      onSearch(value);
    }, 500);

    // Faster autocomplete
    if (value.trim().length >= 2) {
      autocompleteTimeoutRef.current = setTimeout(async () => {
        setLoadingSuggestions(true);
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
      setSelectedIndex((prev) => 
        prev < suggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault();
      handleSuggestionClick(suggestions[selectedIndex]);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  // Clean up timeouts
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      if (autocompleteTimeoutRef.current) {
        clearTimeout(autocompleteTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div ref={wrapperRef} className="relative w-full max-w-md mx-auto">
      <div className="relative">
        <input
          type="text"
          placeholder="Search products..."
          value={searchQuery}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length > 0) {
              setShowSuggestions(true);
            }
          }}
          className="w-full pl-10 pr-10 py-2 border border-slate-200 rounded-lg focus:border-slate-400 focus:outline-none transition-all bg-white text-sm"
        />
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
        
        {loadingSuggestions && (
          <Loader2 className="absolute right-10 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 animate-spin" />
        )}
        
        {searchQuery && !loadingSuggestions && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Autocomplete Suggestions */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((suggestion, index) => (
            <button
              key={suggestion._id}
              onClick={() => handleSuggestionClick(suggestion)}
              className={`w-full px-4 py-2 text-left hover:bg-slate-50 transition-colors ${
                index === selectedIndex ? 'bg-slate-100' : ''
              } ${index !== suggestions.length - 1 ? 'border-b border-slate-100' : ''}`}
            >
              <div className="font-medium text-sm text-slate-800">
                {suggestion.name}
              </div>
              <div className="text-xs text-slate-500">
                {suggestion.category}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* No results message */}
      {showSuggestions && !loadingSuggestions && suggestions.length === 0 && searchQuery.length >= 2 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg p-4 text-center text-sm text-slate-500">
          No suggestions found
        </div>
      )}
    </div>
  );
}

export default SearchBar;