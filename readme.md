## 🚀 Project Overview

### This project is a **README Generator and Comparator Tool**.
### It helps users:

1. **Generate a README** automatically (AI-powered) from a GitHub repo or local files.
2. **Preview, edit, and download** the generated README.
3. **Upload their own README** and compare it with the generated one using AI-driven analysis.

### The **comparison** uses multiple NLP and readability metrics:

* **Text similarity** (keyword overlap and semantic similarity).
* **Topic modeling** (discovering key topics/themes).
* **Readability metrics** (how easy or hard the text is to read).
* **Named entity recognition (NER)** (extracting people, organizations, tech names, etc.).

### So, the tool essentially helps developers **improve their documentation quality** using AI.

---

## 🖥️ Frontend (React + TypeScript)

### **1. `ReadmePanel.tsx`**

This is the **main UI panel** for working with READMEs.

* **Props**

  * `repo`: GitHub repo name or `"local-upload"` for local files.
  * `files`: List of project files.
  * `readme`: Current README text.
  * `setReadme`: State setter to update README content.
  * `setLoading`: State setter to show loading spinner.
  * `fileBlobs`: Map of file paths → file objects (used for images).

* **Key Features**

  * **Generate README** (via `generateReadme(files)`).
  * **Copy to Clipboard** and **Download as Markdown**.
  * **Preview / Markdown / Compare tabs**.
  * **Custom Markdown renderer** using `marked`:

    * Handles image embedding.
    * If local upload → converts image blobs to base64.
    * If GitHub repo → pulls raw images from GitHub.

* **Modes**

  * **Preview** → Rendered markdown.
  * **Markdown** → Raw text.
  * **Compare** → Opens `CompareReadme` component.

---

### **2. `CompareReadme.tsx`**

This is the **comparison UI** where a user can upload their own README.md and compare it with the generated one.

* **Features**

  * Upload user’s README file.
  * Sends both the **AI-generated README** and the **user README** to the backend (`/compare`).
  * Tabs to switch between analysis types:

    1. **Text Similarity** (TF-IDF + BERT embeddings).
    2. **Topic Modeling** (BERTopic + UMAP).
    3. **Readability Metrics** (Flesch score, Gunning Fog index).
    4. **Named Entity Recognition** (extracts named entities like tech, organizations, versions, etc.).

* **UX Enhancements**

  * File upload button styled with icons.
  * Disabled states while loading.
  * Tab navigation to show results in different views.

---

## ⚙️ Backend (FastAPI + NLP/ML libraries)

The backend (`main.py` or similar) exposes **one main endpoint**:

### **`POST /compare`**

* Accepts:

  * `generated_readme` (string, AI output).
  * `user_readme_file` (uploaded `.md` file).
* Returns:
  A structured JSON with all analysis results.

---

### **Core Analysis Functions**

1. **Text Similarity (`analyze_similarity`)**

   * **TF-IDF Cosine Similarity** → word/keyword overlap.
   * **Semantic Similarity** → sentence embeddings using `SentenceTransformer('all-MiniLM-L6-v2')`.

2. **Topic Modeling (`analyze_topics`)**

   * Uses **BERTopic** with a small UMAP for dimensionality reduction.
   * Extracts dominant topics for both READMEs.
   * If not enough content → gracefully returns error.

3. **Readability (`analyze_readability`)**

   * **Flesch Reading Ease** (higher = easier).
   * **Gunning Fog Index** (higher = harder).

4. **NER (`analyze_ner`)**

   * Uses **SpaCy (en\_core\_web\_sm)**.
   * Extracts named entities (like "Python", "Google", "Linux").
   * Returns entity + label (ORG, PERSON, PRODUCT, etc.).

---

### **Helper Functions**

* `preprocess_text` → Lowercases and removes stopwords.
* `to_serializable` → Converts Numpy/Pandas objects into plain JSON (needed because ML libs return complex objects).

---

## 🔗 Workflow (End-to-End)

1. User **loads repo** or uploads project files.
2. Clicks **Generate README** → gets AI-generated README (via another backend endpoint not shown but likely `generateReadme`).
3. User can preview/copy/download it.
4. If they want to compare:

   * Upload their own `README.md`.
   * Click **Compare**.
   * Frontend sends both READMEs to `/compare`.
5. Backend runs NLP pipeline → returns structured results.
6. Frontend displays results across four tabs.

---

## 🎯 Purpose of the Project

This project is valuable because:

* Developers often neglect READMEs → this tool **auto-generates them**.
* But auto-generated docs may not match user needs → so it **compares and improves them**.
* Helps **maintain consistent, high-quality documentation** across projects.
* Bridges **software engineering + AI NLP** in a practical developer tool.

---

## Setting up backend
### 1. Create virtual environment inside backend folder
python -m venv venv

### 2. Activate it
venv\Scripts\activate

### 3. Install dependencies
pip install -r requirements.txt

### 4. Run FastAPI server
uvicorn main:app --host 127.0.0.1 --port 8000

--- 

## Setting up Frontend
cd readme


### Install all dependencies
npm install


### Start the development server
npm run dev
