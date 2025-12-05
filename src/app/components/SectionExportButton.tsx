// src/app/components/SectionExportButton.tsx
'use client';

import { useState } from 'react';

// You can use any icon library you have, or just text
// If you have lucide-react installed: import { Download } from 'lucide-react';

interface Props {
  type: 'members' | 'households' | 'interventions' | 'feeding' | 'livelihoods' | 'donations';
  label?: string;
  className?: string; // To allow custom styling
}

export default function SectionExportButton({ type, label, className }: Props) {
  const [isLoading, setIsLoading] = useState(false);

  const handleExport = async () => {
    setIsLoading(true);
    try {
      // Call the API with the specific type
      const response = await fetch(`/api/export?type=${type}`);
      
      if (!response.ok) throw new Error('Export failed');

      // Download the file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      // Name the file based on type and date
      link.download = `${type}-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download csv:', error);
      alert('Failed to download CSV. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={isLoading}
      // You can adjust these classes to match your theme
      className={className || "px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:opacity-50"}
    >
      {isLoading ? 'Downloading...' : label || `Export ${type}`}
    </button>
  );
}