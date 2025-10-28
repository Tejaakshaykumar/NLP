import { useState } from "react";
import { ChevronDown, ChevronRight, Folder, File } from "lucide-react";

function FileNode({ node, level = 0 }: { node: any; level?: number }) {
  const [isOpen, setIsOpen] = useState(level < 2);
  const hasChildren = node.children && node.children.length > 0;
  const paddingLeft = level * 16;

  return (
    <div>
      <div
        className="flex items-center py-1 px-2 hover:bg-gray-50 cursor-pointer rounded"
        style={{ paddingLeft: `${paddingLeft + 8}px` }}
        onClick={() => hasChildren && setIsOpen(!isOpen)}
      >
        <div className="flex items-center min-w-0 flex-1">
          {hasChildren && (
            <div className="mr-1 flex-shrink-0">
              {isOpen ? (
                <ChevronDown size={16} className="text-gray-500" />
              ) : (
                <ChevronRight size={16} className="text-gray-500" />
              )}
            </div>
          )}
          {!hasChildren && <div className="w-4 flex-shrink-0" />}

          <div className="mr-2 flex-shrink-0">
            {node.type === "dir" ? (
              <Folder size={16} className="text-blue-500" />
            ) : (
              <File size={16} className="text-gray-500" />
            )}
          </div>

          <span className="text-sm truncate" title={node.name}>
            {node.name}
          </span>
        </div>
      </div>

      {hasChildren && isOpen && (
        <div>
          {node.children.map((child: any, idx: number) => (
            <FileNode key={idx} node={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

function buildFileTree(files: { path: string; type: "file" | "dir" }[]) {
  const tree = { name: "root", type: "dir", children: [] as any[] };

  files.forEach((file) => {
    const parts = file.path.split("/");
    let current = tree;

    parts.forEach((part, index) => {
      const isLast = index === parts.length - 1;
      const nodeType = isLast ? file.type : "dir";

      let existing = current.children.find((child: any) => child.name === part);

      if (!existing) {
        existing = {
          name: part,
          type: nodeType,
          children: nodeType === "dir" ? [] : [],
        };
        current.children.push(existing);
      }

      // 👇 always go deeper into dir
      if (existing.type === "dir") {
        current = existing;
      }
    });
  });

  return tree.children;
}



export default function FileTree({
  files,
}: {
  files: { path: string; type: "file" | "dir" }[];
}) {
  const treeData = buildFileTree(files);

  if (files.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        <Folder size={48} className="mx-auto mb-2 text-gray-300" />
        <p className="text-sm">No files loaded</p>
        <p className="text-xs text-gray-400">
          Load a repository or upload a folder to see its structure
        </p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h2 className="flex items-center gap-2 font-semibold mb-3 text-gray-700">
        <Folder size={16} />
        Repository Structure
      </h2>
      <div className="bg-white rounded border">
        {treeData.map((node, i) => (
          <FileNode key={i} node={node} />
        ))}
      </div>
    </div>
  );
}
