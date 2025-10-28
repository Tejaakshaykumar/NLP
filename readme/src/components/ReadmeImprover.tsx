import React, { useState } from "react";
import { improveReadme } from "../api"; 
import { Sparkles, ToggleLeft, ToggleRight, Loader2 } from "lucide-react";

interface Props {
  currentReadme: string;
  setReadme: (r: string) => void;
  setLoading: (l: boolean) => void;
  files: any[];
  setViewMode: (mode: "preview" | "markdown" | "compare" | "improve") => void;
}

export default function ReadmeImprover({
  currentReadme,
  setReadme,
  setLoading,
  files,
  setViewMode,
}: Props) {
  const [prompt, setPrompt] = useState("");
  const [improvedReadme, setImprovedReadme] = useState<string | null>(null);
  // Initial state: false means we show the 'currentReadme' (original) code
  const [showImproved, setShowImproved] = useState(false); 
  const [isImproving, setIsImproving] = useState(false);

  const handleImprove = async () => {
    if (!prompt.trim()) {
      // Use console.log for user feedback instead of alert()
      console.log("Please enter an enhancement request.");
      return;
    }

    setIsImproving(true);
    setLoading(true);

    try {
      // The improveReadme function is called with the project files, current README, and the user's prompt
      const newReadmeContent = await improveReadme(files, currentReadme, prompt);
      setImprovedReadme(newReadmeContent);
      
      // Immediately update the main README content in ReadmePanel
      setReadme(newReadmeContent); 

      // After generation, switch the toggle to show the improved version
      setShowImproved(true); 
    } catch (error) {
      console.error("Error improving README:", error);
      // Use console.log for user feedback instead of alert()
      console.log("Failed to improve README. Please try again.");
    } finally {
      setIsImproving(false);
      setLoading(false);
    }
  };

  const handleApply = () => {
    // The main readme is already updated in handleImprove, so we just switch back to preview
    setViewMode("preview");
  };

  // Determine which content to display: Improved (if available and toggled), otherwise Original.
  const contentToDisplay = improvedReadme && showImproved 
    ? improvedReadme 
    : currentReadme;

  return (
    // Removed padding from main div and moved it inside to control layout better
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header (Simplified - Removed "Back to Preview" button, added sticky background) */}
      <div className="flex items-center justify-end p-4 border-b border-gray-200 bg-white shadow-sm sticky top-0 z-10">
        {improvedReadme && (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">
                {showImproved ? "Improved Version" : "Original Version"}
              </span>
              
              {/* Toggle button to switch between versions */}
              <button
                onClick={() => setShowImproved(!showImproved)}
                className="p-1 rounded-full text-blue-600 hover:bg-gray-200 transition-colors"
                title={showImproved ? "Show Original" : "Show Improved"}
              >
                {showImproved ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
              </button>
            </div>
            
            {/* Apply button */}
            <button
              onClick={handleApply}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm shadow-md"
            >
              Apply & Close
            </button>
          </div>
        )}
      </div>

      {/* Display Area (Takes up all available vertical space) */}
      <div className="flex-1 min-h-0 overflow-hidden p-6"> 
        <div className="bg-white rounded-lg border border-gray-200 shadow-xl h-full flex flex-col">
          <div className="p-4 bg-gray-100 border-b border-gray-200">
            <p className="text-sm font-semibold text-gray-700">
              {/* Title reflects the current content being shown */}
              {improvedReadme && showImproved ? "Improved README Code (Applied)" : "Original README Code"}
            </p>
          </div>
          {/* This inner div handles the content scrolling */}
          <div className="p-4 flex-1 overflow-auto">
            <pre className="text-sm font-mono text-gray-800 whitespace-pre-wrap leading-relaxed">
              {contentToDisplay}
            </pre>
          </div>
        </div>
      </div>

      {/* Input and Action Area (STICKY BOTTOM - COMPACT, ONE-LINE EXPANDING) */}
      <div className="p-4 bg-white border-t border-gray-200 shadow-2xl sticky bottom-0 z-20">
        <div className="flex items-end gap-3 max-w-4xl mx-auto">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Enter your enhancement request..."
            // Single row default, expands vertically with content up to a max height.
            className="flex-1 p-3 border border-gray-300 rounded-xl resize-none focus:ring-blue-500 focus:border-blue-500 text-base leading-snug overflow-hidden transition-all duration-100"
            rows={1}
            style={{ maxHeight: '10rem' }} // Max height before forcing scroll on the input itself
            disabled={isImproving}
          />
          <button
            onClick={handleImprove}
            disabled={isImproving || !prompt.trim()}
            className="flex-shrink-0 flex items-center justify-center h-11 w-11 text-white bg-blue-600 rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg"
            title="Enhance README"
          >
            {isImproving ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              // Using Sparkles for the "send/rocket" feel for enhancement
              <Sparkles size={20} /> 
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
