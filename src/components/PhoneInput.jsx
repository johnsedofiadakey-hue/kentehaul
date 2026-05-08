import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const COUNTRIES = [
  { name: 'Ghana', code: '+233', flag: '🇬🇭', iso: 'GH' },
  { name: 'United Kingdom', code: '+44', flag: '🇬🇧', iso: 'GB' },
  { name: 'United States', code: '+1', flag: '🇺🇸', iso: 'US' },
  { name: 'Nigeria', code: '+234', flag: '🇳🇬', iso: 'NG' },
  { name: 'Canada', code: '+1', flag: '🇨🇦', iso: 'CA' },
  { name: 'Germany', code: '+49', flag: '🇩🇪', iso: 'DE' },
  { name: 'France', code: '+33', flag: '🇫🇷', iso: 'FR' },
  { name: 'Netherlands', code: '+31', flag: '🇳🇱', iso: 'NL' },
  { name: 'South Africa', code: '+27', flag: '🇿🇦', iso: 'ZA' },
  { name: 'Ivory Coast', code: '+225', flag: '🇨🇮', iso: 'CI' },
  { name: 'Kenya', code: '+254', flag: '🇰🇪', iso: 'KE' },
  { name: 'China', code: '+86', flag: '🇨🇳', iso: 'CN' },
  { name: 'India', code: '+91', flag: '🇮🇳', iso: 'IN' },
  { name: 'United Arab Emirates', code: '+971', flag: '🇦🇪', iso: 'AE' },
];

export default function PhoneInput({ value, onChange, placeholder = "Phone Number", primaryColor = "#4F46E5" }) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0]);
  const dropdownRef = useRef(null);

  // Parse initial value if it contains a country code
  useEffect(() => {
    if (value && typeof value === 'string') {
      const matchingCountry = COUNTRIES.find(c => value.startsWith(c.code));
      if (matchingCountry) {
        setSelectedCountry(matchingCountry);
      }
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredCountries = COUNTRIES.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.code.includes(search)
  );

  const handleCountrySelect = (country) => {
    setSelectedCountry(country);
    setIsOpen(false);
    // If there's an existing number, we might want to update the code prefix
    const rawNumber = value ? value.replace(/^\+\d+\s?/, '') : '';
    onChange(`${country.code}${rawNumber}`);
  };

  const handleInputChange = (e) => {
    const raw = e.target.value.replace(/[^\d]/g, ''); // only digits
    onChange(`${selectedCountry.code}${raw}`);
  };

  // The value passed to the input display should not include the prefix
  const displayValue = value ? String(value).replace(selectedCountry.code, '') : '';

  return (
    <div className="relative w-full font-sans">
      <div className="flex items-center bg-gray-50 border-none rounded-[25px] overflow-hidden focus-within:ring-2 focus-within:ring-blue-100 transition-all">
        {/* Country Selector Trigger */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-5 py-5 hover:bg-gray-100 border-r border-gray-200/50 transition-colors"
        >
          <span className="text-xl">{selectedCountry.flag}</span>
          <span className="font-black text-sm text-gray-700">{selectedCountry.code}</span>
          <ChevronDown size={14} className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* Real Input */}
        <input
          type="tel"
          className="flex-1 bg-transparent border-none p-5 font-bold text-gray-900 outline-none placeholder:text-gray-300"
          placeholder={placeholder}
          value={displayValue}
          onChange={handleInputChange}
        />
      </div>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            ref={dropdownRef}
            className="absolute z-[200] mt-3 left-0 w-72 bg-white rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-gray-100 overflow-hidden"
          >
            <div className="p-4 bg-gray-50/50 border-b border-gray-100">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                <input
                  autoFocus
                  className="w-full pl-9 pr-4 py-3 bg-white border border-gray-100 rounded-2xl text-xs font-bold outline-none focus:border-blue-400 transition-all"
                  placeholder="Search countries..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
              {filteredCountries.map((country) => (
                <button
                  key={country.iso}
                  type="button"
                  onClick={() => handleCountrySelect(country)}
                  className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{country.flag}</span>
                    <div className="text-left">
                      <p className="font-black text-xs text-gray-800 uppercase tracking-tight">{country.name}</p>
                      <p className="font-bold text-[10px] text-gray-400 uppercase">{country.code}</p>
                    </div>
                  </div>
                  {selectedCountry.iso === country.iso && (
                    <div className="w-6 h-6 rounded-full flex items-center justify-center bg-blue-50 text-blue-600">
                      <Check size={12} strokeWidth={3} />
                    </div>
                  )}
                </button>
              ))}
              {filteredCountries.length === 0 && (
                <div className="p-10 text-center">
                  <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">No country found</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
