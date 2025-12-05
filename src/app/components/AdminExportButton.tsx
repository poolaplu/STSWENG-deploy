// src/components/AdminExportButton.tsx
'use client';

import { useState } from 'react';
import { Download, AlertCircle } from 'lucide-react';

export default function AdminExportButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExport = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // 1. Call the API route
      const response = await fetch('/api/export');

      if (!response.ok) {
        // If response is not ok, it might be a JSON error
        const err = await response.json().catch(() => ({ error: 'Failed to download file' }));
        throw new Error(err.error || `Failed with status: ${response.status}`);
      }

      // 2. Get the response as a Blob (the zip file)
      const blob = await response.blob();

      // 3. Create the temporary download link
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      const filename = `data-export-${new Date().toISOString().split('T')[0]}.zip`;

      link.setAttribute('href', url);
      link.setAttribute('download', filename); // Set the filename to .zip
      link.style.visibility = 'hidden';

      // 4. "Click" the link to trigger download, then clean up
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

    } catch (err: any) {
      console.error('Export failed:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-start gap-2">
      <button
        onClick={handleExport}
        disabled={isLoading}
        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:bg-gray-400"
      >
        <Download size={18} />
        {isLoading ? 'Exporting...' : 'Export All Data (CSV)'}
      </button>

      {error && (
        <div className="flex items-center gap-2 text-red-600">
          <AlertCircle size={18} />
          <span>Error: {error}</span>
        </div>
      )}
    </div>
  );
}