'use client';

import { useEffect, useState } from 'react';
import adminAPI from '@/lib/api';
import { useToast } from '@/lib/toast';

export default function CountryFilter({ value, onChange, style }) {
  const [countries, setCountries] = useState([]);
  const toast = useToast();

  useEffect(() => {
    let active = true;
    adminAPI.get('/country-options')
      .then(result => {
        if (!active) return;
        const data = Array.isArray(result) ? result : result?.data || [];
        setCountries(data);
      })
      .catch(error => {
        if (active) toast.error(error.message || 'Failed to load countries');
      });
    return () => { active = false; };
  }, [toast]);

  return (
    <select
      className="input select"
      style={{ minWidth: 160, ...style }}
      value={value}
      onChange={event => onChange(event.target.value)}
      aria-label="Filter by country"
    >
      <option value="">All Countries</option>
      {countries.map(country => (
        <option key={country.id} value={country.id}>{country.name || country.code}</option>
      ))}
    </select>
  );
}
