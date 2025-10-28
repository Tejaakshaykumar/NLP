export async function fetchRepoFiles(repoPath: string) {
  const res = await fetch(
    `https://api.github.com/repos/${repoPath}/git/trees/main?recursive=1`
  );
  if (!res.ok) throw new Error("Failed to load repo");
  const data = await res.json();
  return data.tree.map((f: any) => ({ path: f.path, type: f.type }));
}

// Generate README using Gemini API
export async function generateReadme(files: any[]) {
  const fileList = files.map((f) => f.path).slice(0, 50); // limit for brevity
  const systemPrompt = `
You are a professional README.md generator.  
When generating the README.md content, internally think through the project files carefully step-by-step — understanding the project purpose, main features, usage, and other relevant details.  
Use this chain of thought reasoning to produce a clean, comprehensive, and well-structured README.md file in valid GitHub Markdown format.  
Include typical sections such as Project Title, Description, Features, Tech Stack, Installation(setting up the project in local),Environment Variables(optional),ScreenShots(optional), Contributing, License, and any other useful information inferred from the files.  
Strictly output only the final README.md content as valid Markdown, without explanations, metadata, code fences, or any intermediate reasoning text.
note:1. **Command formatting**
   - **All shell/terminal commands must be inside fenced code blocks labeled bash**. Example:
     \`\`\`bash
     npm install
     npm run dev
     \`\`\`
   - Use language-specific fenced code blocks for code examples (e.g., js, python, sql) where appropriate.
   - Do **not** use inline commands without fences; always provide copy-paste ready command blocks.
     
   2. if line contains subheadings, highlight them(strong) and use bullet points for lists.
  
   3. For screenshots, always write them in the format:
      **Name:** ![Name](path/to/image.png)
   
   4. If environment variable files exist (like \`.env\`, \`frontend/.env\`, \`backend/.env\`, etc.), 
add a section titled "Environment Variables".  

For each \`.env\` file, show:
1. The file path (e.g., \`frontend/.env\`, \`backend/.env\`).
2. A list of variables used in that file.
3. A short description of what each variable controls.
4. Clear instructions that users must open that specific file and change the values as needed.  

    ⚠️ Important: When referencing files or folders from the repository, do not rename, fix typos, or assume corrections. Always use the file/folder names exactly as they exist in the repo. If they look incorrect, still use them as-is.
   `;
  const userPrompt = `
Generate README for this repo. Files:
${fileList.join("\n")}
  `;
  console.log("Generating README with files:", fileList);

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=AIzaSyA3BBjWBd5PQH3qZsgW4T-7K2R7zQwN1YM`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          { role: "user", parts: [{ text: systemPrompt + "\n" + userPrompt }] },
        ],
      }),
    }
  );

  const data = await res.json();
  return (
    data?.candidates?.[0]?.content?.parts?.[0]?.text ||
    "Error generating README."
  );
}

export async function improveReadme(files: any[], currentReadme: string, improvementPrompt: string) {
  const fileList = files.map((f) => f.path).slice(0, 50); // For context
  
  const systemPrompt = `
You are an expert README.md improver. Your task is to take an existing README content, a user's specific enhancement request, and project file context to produce a new, improved README.md.
**Crucial Rules:**
1.  Apply the user's **enhancement request** precisely.
2.  Maintain the existing content's structure and all required technical sections (Installation, Tech Stack, etc.) unless the user's request explicitly modifies them.
3.  Use the project files and existing README as context, but strictly output **only the final, improved README.md content** as valid GitHub Markdown. Do not include any reasoning, pre-amble, or code fences around the final output.
4.  Ensure all formatting rules are followed: **bash** code blocks for shell commands, strong emphasis for subheadings, and the specific screenshot format.

**Project Files Context:**
${fileList.join("\n")}

**Current README.md:**
---
${currentReadme}
---

**User Enhancement Request:**
${improvementPrompt}
  `;

  console.log("Improving README with prompt:", improvementPrompt);

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=AIzaSyA3BBjWBd5PQH3qZsgW4T-7K2R7zQwN1YM`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          { role: "user", parts: [{ text: systemPrompt }] },
        ],
      }),
    }
  );

  const data = await res.json();
  return (
    data?.candidates?.[0]?.content?.parts?.[0]?.text ||
    "Error improving README."
  );
}