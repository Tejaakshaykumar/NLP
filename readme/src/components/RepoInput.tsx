import { useState } from "react";
import { Github, Upload, Link } from "lucide-react";
import { fetchRepoFiles } from "../api";

interface Props {
  setRepo: (repo: string) => void;
  setFiles: (files: { path: string; type: "file" | "dir" }[]) => void;
  loading: boolean;
  setFileBlobs: (blobs: Map<string, File>) => void;
}

export default function RepoInput({ setRepo, setFiles, loading, setFileBlobs }: Props) {
  const [url, setUrl] = useState("");
  const [inputMethod, setInputMethod] = useState<"github" | "local">("github");

  const handleLoad = async () => {
  if (inputMethod === "github") {
    const repoPath = url.replace(/^https?:\/\/(www\.)?github\.com\//, "");
    setRepo(repoPath);
    const files = await fetchRepoFiles(repoPath);
    const normalized = files.map((f: any) => ({
      path: f.path,
      type: f.type === "tree" ? "dir" : "file",
    }));
    console.log("Normalized files:", normalized);
    setFiles(normalized);
    setFileBlobs(new Map()); // Added
  }
};

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
  if (!event.target.files) return;

  const uploadedFiles = Array.from(event.target.files).map((f: File) => {
    let path = f.webkitRelativePath || f.name;
    if (!f.webkitRelativePath && path.includes("/")) {
      path = path;
    } else if (!f.webkitRelativePath) {
      path = path;
    }
    const type = f.webkitRelativePath.includes("/") && !f.type ? "dir" : "file";
    return { path, type: type as "dir" | "file" };
  });

  const fileBlobsMap = new Map<string, File>();
  Array.from(event.target.files).forEach((f: File) => {
    const path = f.webkitRelativePath || f.name;
    fileBlobsMap.set(path, f);
  });

  setRepo("local-upload");
  setFiles(uploadedFiles);
  setFileBlobs(fileBlobsMap); // Added
};

  return (
    <div className="p-4 border-b bg-gray-50">
      <div className="flex gap-2 mb-3">
        <button
          onClick={() => setInputMethod("github")}
          className={`flex items-center gap-2 px-3 py-2 rounded text-sm font-medium transition-colors ${
            inputMethod === "github"
              ? "bg-blue-600 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          <Github size={16} />
          GitHub URL
        </button>
        <button
          onClick={() => setInputMethod("local")}
          className={`flex items-center gap-2 px-3 py-2 rounded text-sm font-medium transition-colors ${
            inputMethod === "local"
              ? "bg-blue-600 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          <Upload size={16} />
          Local Files
        </button>
      </div>

      {inputMethod === "github" ? (
        <div className="space-y-2">
          <div className="relative">
            <Link
              size={16}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            />
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://github.com/username/repository"
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loading}
            />
          </div>
          <button
            onClick={handleLoad}
            disabled={loading || !url.trim()}
            className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Loading..." : "Load Repository"}
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <input
            type="file"
            multiple
            // @ts-ignore
            webkitdirectory=""
            onChange={handleFileUpload}
            className="hidden"
            id="file-upload"
          />
          <label
            htmlFor="file-upload"
            className="flex items-center justify-center gap-2 w-full px-4 py-8 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
          >
            <Upload size={20} className="text-gray-400" />
            <span className="text-sm text-gray-600">
              Click to upload folder or files
            </span>
          </label>
        </div>
      )}
    </div>
  );
}
