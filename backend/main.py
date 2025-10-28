from fastapi import FastAPI, UploadFile, File, HTTPException, Form
from pydantic import BaseModel
from typing import Dict, List, Any
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sentence_transformers import SentenceTransformer
from gensim.parsing.preprocessing import remove_stopwords
from textstat import flesch_reading_ease, gunning_fog
import spacy
from bertopic import BERTopic
from fastapi.middleware.cors import CORSMiddleware


# Initialize FastAPI app
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],  
    allow_headers=["*"],  
)

# Load SpaCy model for NER
try:
    nlp = spacy.load("en_core_web_sm")
except OSError:
    print("Downloading en_core_web_sm model...")
    from spacy.cli import download
    download("en_core_web_sm")
    nlp = spacy.load("en_core_web_sm")

# Load Sentence-Transformer model
model = SentenceTransformer('all-MiniLM-L6-v2')

class CompareRequest(BaseModel):
    generated_readme: str

# Helper function for text preprocessing
def preprocess_text(text: str) -> str:
    text = text.lower()
    text = remove_stopwords(text)
    return text

def to_serializable(obj):
    import numpy as np
    import pandas as pd

    if isinstance(obj, dict):
        return {k: to_serializable(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [to_serializable(v) for v in obj]
    elif isinstance(obj, np.generic):       # e.g. numpy.float32, numpy.int64
        return obj.item()
    elif isinstance(obj, np.ndarray):       # numpy arrays
        return obj.tolist()
    elif isinstance(obj, pd.DataFrame):     # pandas DataFrames
        return obj.to_dict(orient="records")
    elif isinstance(obj, pd.Series):
        return obj.to_list()
    else:
        return obj


# Text Similarity & Semantic Analysis
def analyze_similarity(generated_readme: str, user_readme: str) -> Dict[str, float]:
    # TF-IDF Cosine Similarity
    corpus = [preprocess_text(generated_readme), preprocess_text(user_readme)]
    vectorizer = TfidfVectorizer().fit_transform(corpus)
    tfidf_cosine_sim = cosine_similarity(vectorizer[0:1], vectorizer[1:2])[0][0]

    # Sentence Embedding Cosine Similarity
    embeddings = model.encode(corpus)
    semantic_cosine_sim = cosine_similarity([embeddings[0]], [embeddings[1]])[0][0]

    return {
        "tfidf_cosine_similarity": tfidf_cosine_sim,
        "semantic_cosine_similarity": semantic_cosine_sim
    }

# Topic Modeling
from umap import UMAP

# def analyze_topics(generated_readme: str, user_readme: str) -> Dict[str, Any]:
#     documents = [generated_readme, user_readme]

#     # Force a small UMAP model
#     topic_model = BERTopic(
#         language="english", 
#         calculate_probabilities=True, 
#         verbose=True,
#         umap_model=UMAP(n_neighbors=2, n_components=2, min_dist=0.0)
#     )

#     try:
#         topics, _ = topic_model.fit_transform(documents)
#     except ValueError as e:
#         return {"error": f"Topic modeling failed: {str(e)}"}

#     return {
#         "generated_readme_topics": topic_model.get_topic(topics[0]),
#         "user_readme_topics": topic_model.get_topic(topics[1]),
#         "topic_info": topic_model.get_topic_info()
#     }

from bertopic import BERTopic

def analyze_topics(generated_readme: str, user_readme: str) -> Dict[str, Any]:
    documents = [generated_readme, user_readme]

    topic_model = BERTopic(
        language="english",
        calculate_probabilities=True,
        verbose=True,
        umap_model=None,       
        hdbscan_model=None     
    )

    try:
        topics, _ = topic_model.fit_transform(documents)
    except ValueError as e:
        return {"error": f"Topic modeling failed: {str(e)}"}

    return {
        "generated_readme_topics": topic_model.get_topic(topics[0]),
        "user_readme_topics": topic_model.get_topic(topics[1]),
        "topic_info": topic_model.get_topic_info()
    }

# Readability & Complexity Metrics
def analyze_readability(generated_readme: str, user_readme: str) -> Dict[str, Dict[str, float]]:
    return {
        "generated_readme": {
            "flesch_reading_ease": flesch_reading_ease(generated_readme),
            "gunning_fog_index": gunning_fog(generated_readme)
        },
        "user_readme": {
            "flesch_reading_ease": flesch_reading_ease(user_readme),
            "gunning_fog_index": gunning_fog(user_readme)
        }
    }

# Named Entity Recognition (NER)
def analyze_ner(generated_readme: str, user_readme: str) -> Dict[str, List[Any]]:
    doc_generated = nlp(generated_readme)
    doc_user = nlp(user_readme)
    
    return {
        "generated_readme_entities": [
            {"text": ent.text, "label": ent.label_} for ent in doc_generated.ents
        ],
        "user_readme_entities": [
            {"text": ent.text, "label": ent.label_} for ent in doc_user.ents
        ]
    }

PROMPT_TEMPLATE = """   
You are an expert evaluator. Your task is to rate the quality of a generated README file compared to a user-provided README on software documentation metrics.

## Evaluation Criteria:
- **Clarity**: how understandable is the generated README?
- **Coverage**: how well does it cover the same topics/information?
- **Correctness**: factual consistency and accuracy.
- **Style**: structure, tone, formatting consistent with typical README style.

Use a **1–5 rubric** for each metric:
5 = Excellent, 4 = Good, 3 = Fair, 2 = Poor, 1 = Very poor.

## User Inputs:
### Generated README:
{generated_readme}

### User README:
{user_readme}

## Instructions:
1. For each criterion, assign a score (1–5) and explain briefly.
2. Finally, compute a **composite score** (0–100) as a weighted average (e.g. equal weights).
3. Respond in Strict JSON format NO extra text.:
{{
"Clarity": score,
"Coverage": score,
"Correctness": score,
"Style": score,
"Composite": final_score,
"Reasoning": "..."
}}
"""
import google.generativeai as genai
import json
import re

genai.configure(api_key="AIzaSyBvVzzp_FNquKzHcDZ7V1mil13jk34JIZ0")

def ai_evaluate_readmes(generated: str, user: str) -> Dict[str, Any]:
    prompt = PROMPT_TEMPLATE.format(
        generated_readme=generated,
        user_readme=user
    )

    response = genai.GenerativeModel("gemini-2.5-flash").generate_content(prompt)

    # Gemini response might include code fences, newlines, or even explanations
    raw_text = response.text.strip()

    # Remove triple backticks with or without 'json'
    cleaned = re.sub(r"```(?:json)?", "", raw_text, flags=re.IGNORECASE).replace("```", "").strip()

    try:
        output = json.loads(cleaned)
    except Exception:
        # As fallback, try to extract JSON with regex
        match = re.search(r"\{.*\}", raw_text, flags=re.DOTALL)
        if match:
            try:
                output = json.loads(match.group())
            except Exception:
                output = {"error": "Failed to parse AI response", "raw": raw_text}
        else:
            output = {"error": "Failed to parse AI response", "raw": raw_text}

    print("AI Evaluation Response:", output)
    return output

from fastapi.responses import JSONResponse
@app.post("/compare")
async def compare_readmes(
    generated_readme: str=Form(...),
    user_readme_file: UploadFile = File(...)
):
    try:
        user_readme_content = (await user_readme_file.read()).decode("utf-8")
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid file upload.")

    results = {
        "text_similarity": analyze_similarity(generated_readme, user_readme_content),
        "topic_modeling": analyze_topics(generated_readme, user_readme_content),
        "readability_metrics": analyze_readability(generated_readme, user_readme_content),
        "named_entity_recognition": analyze_ner(generated_readme, user_readme_content),
        "ai_judge" : ai_evaluate_readmes(generated_readme, user_readme_content)
    }
    result_serializable =to_serializable(results)
    return JSONResponse(content=result_serializable)
