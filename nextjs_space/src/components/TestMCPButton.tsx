'use client';

import React from 'react';
import { Button } from '@/components/ui/button';

/**
 * TestMCPButton - Component for testing MCP-DeepAgent integration
 * Created as part of MCP integration test
 */
export const TestMCPButton: React.FC = () => {
  const handleClick = () => {
    alert('MCP Test OK! 🚀\n\nDeepAgent successfully created this component via MCP integration.');
  };

  return (
    <div className="p-4">
      <Button 
        onClick={handleClick}
        className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-3"
      >
        🧪 Test MCP Integration
      </Button>
      <p className="mt-2 text-sm text-gray-600">
        Click to verify MCP-DeepAgent integration
      </p>
    </div>
  );
};
