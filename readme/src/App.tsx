// import FileUploader from './FileUploader';

// export default function App() {
//     return (
//         <div style={{ padding: 20 }}>
//             <FileUploader />
//         </div>
//     );
// }
import { useState } from "react";
import RepoInput from "./components/RepoInput";
import FileTree from "./components/FileTree";
import ReadmePanel from "./components/ReadmePanel";
import LoadingOverlay from "./components/LoadingOverlay";
import { FileText } from "lucide-react";

export default function App() {
  const [repo, setRepo] = useState<string>("");
  const [files, setFiles] = useState<any[]>([]);
  const [readme, setReadme] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [fileBlobs, setFileBlobs] = useState<Map<string, File>>(new Map());

  return (
    <div className="flex flex-col h-screen">
      <header className="px-6 py-4 bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
              <FileText size={18} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                README Generator
              </h2>
              <p className="text-sm text-gray-500">AI-powered documentation</p>
            </div>
          </div>
        </div>
      </header>

      <main className="flex flex-1 overflow-hidden">
        <div className="w-1/3 border-r overflow-y-auto">
          <RepoInput setRepo={setRepo} setFiles={setFiles} loading={loading} setFileBlobs={setFileBlobs} />
          <FileTree files={files} />
        </div>

        <div className="flex-1 p-4 overflow-y-auto">
          <ReadmePanel
            repo={repo}
            files={files}
            readme={readme}
            setReadme={setReadme}
            setLoading={setLoading}
            fileBlobs={fileBlobs}
          />
        </div>
      </main>

      {loading && <LoadingOverlay />}
    </div>
  );
}
