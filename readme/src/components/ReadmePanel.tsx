import { useState,useEffect } from "react";
import { generateReadme } from "../api";
import { FileText, Sparkles, Eye, Code, Copy, Download,Zap } from "lucide-react";
import { marked, type Tokens, Renderer } from "marked";
import CompareReadme from "./CompareReadme";
import ReadmeImprover from "./ReadmeImprover";

interface Props {
  repo: string;
  files: any[];
  readme: string;
  setReadme: (r: string) => void;
  setLoading: (l: boolean) => void;
  fileBlobs: Map<string, File>;
};

export default function ReadmePanel({
  repo,
  files,
  readme,
  setReadme,
  setLoading,
  fileBlobs
}: Props) {
  const [viewMode, setViewMode] = useState<"preview" | "markdown" | "compare" | "improve">("preview");
  const [copied, setCopied] = useState(false);
  const [imageUrls, setImageUrls] = useState<Map<string, string>>(new Map());
  const renderer = new Renderer();

  useEffect(() => {
  if (repo === "local-upload") {
    const newImageUrls = new Map<string, string>();
    const promises = Array.from(fileBlobs.entries())
      .filter(([path]) => /\.(png|jpg|jpeg|gif)$/i.test(path))
      .map(async ([path, file]) => {
        const url = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
        newImageUrls.set(path, url);
      });

    Promise.all(promises).then(() => {
      setImageUrls(newImageUrls);
    });
  }
}, [fileBlobs, repo]);

  const handleGenerate = async () => {
  if (!repo || files.length === 0) {
    alert("Please load a GitHub repo or local files first.");
    return;
  }
  setLoading(true);
  const readmeContent = await generateReadme(files);
  setReadme(readmeContent);
  setLoading(false);
  setViewMode("preview");
};

  const handleCopy = () => {
    navigator.clipboard.writeText(readme);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleDownload = () => {
    const blob = new Blob([readme], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "README.md";
    a.click();
    URL.revokeObjectURL(url);
  };

renderer.image = ({ href, title, text }: Tokens.Image) => {
  console.log("renderer.image called:", { href });

  if (!href) return "";

  let src = href;

  if (repo === "local-upload") {
    const normalizedPath = Array.from(imageUrls.keys()).find((p) =>
      p.replace(/\\/g, "/").endsWith(href.replace(/\\/g, "/"))
    );
    if (normalizedPath) {
      src = imageUrls.get(normalizedPath)!;
    } else {
      console.warn("Image not found in uploads:", href);
    }
  } else {
    const [owner, repoName] = repo.split("/");
    src = `https://raw.githubusercontent.com/${owner}/${repoName}/main/${href}`;
  }

  return `<img src="${src}" alt="${text}"${
    title ? ` title="${title}"` : ""
  } style="max-width: 100%;">`;
};

marked.use({ renderer });

const normalizeReadme = (md: string) => {
  return md.replace(/(?<!!)\[([^\]]+)\]\(([^)]+\.(?:png|jpg|jpeg|gif))\)/gi, '![$1]($2)');
};


  const parseMarkdown = (md: string) => {
     const normalized = normalizeReadme(md);
    return marked(normalized, {
        gfm: true,
        breaks: true,
        pedantic: false,
    });
    };

  return (
    <div className="h-full flex flex-col">
      {/* Adding GitHub Markdown CSS */}
      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/github-markdown-css/5.2.0/github-markdown.min.css"
      />
      <div className="flex items-center justify-between mb-6">
   <div className="flex items-center gap-4"> {/* Added a wrapper div for grouping */}
      <button
       onClick={handleGenerate}
       disabled={!repo || files.length === 0}
      className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
      >
       <Sparkles size={16} />
       Generate README
      </button>
      {/* NEW IMPROVE BUTTON */}
      {readme && (
      <button
       onClick={() => setViewMode("improve")}
       className="flex items-center gap-2 bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 transition-colors font-medium"
      >
       <Zap size={16} />
       Improve
      </button>
      )}
   </div>
      </div>

      {/* Content Area */}
      {readme ? (
        <div className="flex-1 flex flex-col bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          {/* Toolbar */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setViewMode("preview")}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  viewMode === "preview"
                    ? "bg-blue-600 text-white"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                }`}
              >
                <Eye size={14} />
                Preview
              </button>
              <button
                onClick={() => setViewMode("markdown")}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  viewMode === "markdown"
                    ? "bg-blue-600 text-white"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                }`}
              >
                <Code size={14} />
                Markdown
              </button>
              <button
                onClick={() => setViewMode("compare")}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  viewMode === "compare"
                    ? "bg-blue-600 text-white"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                }`}
              >
                <Eye size={14} />
                Compare
              </button>
            {viewMode === "improve" && (
              <button
               onClick={() => setViewMode("improve")} // Keeps view mode on improve
               className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium bg-blue-600 text-white"
              >
              <Zap size={14} />
              Improve
            </button>
            )}
          </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  copied
                    ? "bg-green-100 text-green-700"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                }`}
              >
                <Copy size={14} />
                {copied ? "Copied!" : "Copy"}
              </button>
              <button
                onClick={handleDownload}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
              >
                <Download size={14} />
                Download
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto">
            {viewMode === "preview" ? (
              <div
                className="markdown-body p-6"
                dangerouslySetInnerHTML={{ __html: parseMarkdown(readme) }}
              />
            ) : viewMode === "markdown" ? (
              <div className="p-4">
                <pre className="text-sm font-mono text-gray-800 whitespace-pre-wrap leading-relaxed">
                  {readme}
                </pre>
              </div>
            ) : viewMode === "compare" ? (
              <CompareReadme generatedReadme={readme} />
            ) : ( // New: Render ReadmeImprover
              <ReadmeImprover
               currentReadme={readme}
               setReadme={setReadme}
               setLoading={setLoading}
               files={files}
               setViewMode={setViewMode}
              />
            )}
          </div>
        </div>
      ) : (
        /* Empty State */
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText size={32} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No README Generated
            </h3>
            <p className="text-gray-500 mb-6">
              Load a repository and click "Generate README" to create AI-powered
              documentation for your project.
            </p>
            <div className="text-sm text-gray-400 space-y-1">
              <p>✨ AI analyzes your code structure</p>
              <p>📝 Generates comprehensive documentation</p>
              <p>🎨 Beautiful markdown formatting</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}