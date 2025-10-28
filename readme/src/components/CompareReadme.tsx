import React, { useState } from "react";
import { Copy, Upload } from "lucide-react";
import { marked } from "marked";

interface AIJudgeResult {
  Clarity: number;
  Coverage: number;
  Correctness: number;
  Style: number;
  Composite: number;
  Reasoning: string;
}

interface ComparisonResult {
    text_similarity: {
        tfidf_cosine_similarity: number;
        semantic_cosine_similarity: number;
    };
    ai_judge: AIJudgeResult;
    topic_modeling: {
        generated_readme_topics: Array<{ word: string; count: number }>;
        user_readme_topics: Array<{ word: string; count: number }>;
    };
    readability_metrics: {
        generated_readme: {
            flesch_reading_ease: number;
            gunning_fog_index: number;
        };
        user_readme: {
            flesch_reading_ease: number;
            gunning_fog_index: number;
        };
    };
    named_entity_recognition: {
        generated_readme_entities: Array<{ text: string; label: string }>;
        user_readme_entities: Array<{ text: string; label: string }>;
    };
}

interface Props {
    generatedReadme: string;
}

const CompareReadme: React.FC<Props> = ({ generatedReadme }) => {
    const [userReadme, setUserReadme] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(false);
    const [results, setResults] = useState<ComparisonResult | null>(null);
    const [activeTab, setActiveTab] = useState<number>(0);

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const content = e.target?.result as string;
                setUserReadme(content);
            };
            reader.readAsText(file);
        }
    };

    const handleCompare = async () => {
    if (!userReadme) {
        alert("Please upload your README.md file first.");
        return;
    }

    setLoading(true);
    const formData = new FormData();
    // Append generatedReadme as a string field, not a blob
    formData.append("generated_readme", generatedReadme); 
    formData.append("user_readme_file", new Blob([userReadme], { type: "text/markdown" }), "user_readme.md");

    try {
        const response = await fetch("http://127.0.0.1:8000/compare", { 
            method: "POST",
            body: formData, // FormData is correctly used here
        });
        const data = await response.json(); // Added await here
        setResults(data);
    } catch (error) {
        console.error("Comparison failed:", error);
        alert("Failed to compare READMEs. Please check the backend connection.");
    } finally {
        setLoading(false);
    }
};

    const renderContent = () => {
        if (loading) {
            return <div className="p-6 text-center text-gray-500">Comparing...</div>;
        }

        if (!results) {
            return (
                <div className="p-6 text-center text-gray-500">
                    <p>Upload your existing README.md to compare it with the AI-generated version.</p>
                </div>
            );
        }

        switch (activeTab) {
            case 0: // Text Similarity
                return (
                    <div className="p-6">
                        <h3 className="text-xl font-semibold mb-4">Text Similarity & Semantic Analysis</h3>
                        <p className="mb-2">
                            <strong>TF-IDF Cosine Similarity:</strong> {results.text_similarity.tfidf_cosine_similarity.toFixed(4)}
                        </p>
                        <p className="mb-4">
                            <strong>Semantic Cosine Similarity (BERT):</strong> {results.text_similarity.semantic_cosine_similarity.toFixed(4)}
                        </p>
                        <p className="text-sm text-gray-600">
                            *Scores range from 0 to 1, with 1 being a perfect match. TF-IDF measures keyword overlap, while Semantic Similarity measures the conceptual closeness of the text.
                        </p>
                    </div>
                );
    //         case 1: // Topic Modeling
    // return (
    //     <div className="p-6">
    //         <h3 className="text-xl font-semibold mb-4">Topic Modeling</h3>

    //         {"error" in results.topic_modeling ? (
    //             <p className="text-red-500">
    //                 {String(results.topic_modeling.error)}
    //             </p>
    //         ) : (
    //             <div className="grid md:grid-cols-2 gap-8">
    //                 <div>
    //                     <h4 className="font-semibold mb-2">AI-Generated README Topics</h4>
    //                     {results.topic_modeling.generated_readme_topics?.length > 0 ? (
    //                         <ul>
    //                             {results.topic_modeling.generated_readme_topics.map((topic, index) => (
    //                                 <li key={index}>
    //                                     <strong>{topic.word}</strong> (Weight: {topic.count.toFixed(2)})
    //                                 </li>
    //                             ))}
    //                         </ul>
    //                     ) : (
    //                         <p>No dominant topics found.</p>
    //                     )}
    //                 </div>
    //                 <div>
    //                     <h4 className="font-semibold mb-2">User README Topics</h4>
    //                     {results.topic_modeling.user_readme_topics?.length > 0 ? (
    //                         <ul>
    //                             {results.topic_modeling.user_readme_topics.map((topic, index) => (
    //                                 <li key={index}>
    //                                     <strong>{topic.word}</strong> (Weight: {topic.count.toFixed(2)})
    //                                 </li>
    //                             ))}
    //                         </ul>
    //                     ) : (
    //                         <p>No dominant topics found.</p>
    //                     )}
    //                 </div>
    //             </div>
    //         )}
    //     </div>
    // );
    case 2: // AI Judge (Gemini)
        const judge = results.ai_judge;
        return (
          <div className="p-6">
            <h3 className="text-xl font-semibold mb-4">AI Judge (Gemini)</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 mb-4">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Metric
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Score (1–5)
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap">Clarity</td>
                    <td className="px-6 py-4 whitespace-nowrap">{judge.Clarity}</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap">Coverage</td>
                    <td className="px-6 py-4 whitespace-nowrap">{judge.Coverage}</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap">Correctness</td>
                    <td className="px-6 py-4 whitespace-nowrap">{judge.Correctness}</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap">Style</td>
                    <td className="px-6 py-4 whitespace-nowrap">{judge.Style}</td>
                  </tr>
                </tbody>
              </table>

              <p className="mb-2">
                <strong>Composite Score (0–100):</strong>{" "}
                {judge.Composite}
              </p>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">
                <strong>Reasoning:</strong> {judge.Reasoning}
              </p>
            </div>
          </div>
        );

            case 1: // Readability Metrics
                return (
                    <div className="p-6">
                        <h3 className="text-xl font-semibold mb-4">Readability & Complexity Metrics</h3>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Metric</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">AI-Generated</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Your README</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    <tr>
                                        <td className="px-6 py-4 whitespace-nowrap">Flesch Reading Ease</td>
                                        <td className="px-6 py-4 whitespace-nowrap">{results.readability_metrics.generated_readme.flesch_reading_ease.toFixed(2)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">{results.readability_metrics.user_readme.flesch_reading_ease.toFixed(2)}</td>
                                    </tr>
                                    <tr>
                                        <td className="px-6 py-4 whitespace-nowrap">Gunning Fog Index</td>
                                        <td className="px-6 py-4 whitespace-nowrap">{results.readability_metrics.generated_readme.gunning_fog_index.toFixed(2)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">{results.readability_metrics.user_readme.gunning_fog_index.toFixed(2)}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            case 3: // NER
                return (
                    <div className="p-6">
                        <h3 className="text-xl font-semibold mb-4">Named Entity Recognition</h3>
                        <div className="grid md:grid-cols-2 gap-8">
                            <div>
                                <h4 className="font-semibold mb-2">AI-Generated Entities</h4>
                                {results.named_entity_recognition.generated_readme_entities.length > 0 ? (
                                    <ul>
                                        {results.named_entity_recognition.generated_readme_entities.map((ent, index) => (
                                            <li key={index} className="text-sm">
                                                <strong>{ent.text}</strong> ({ent.label})
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p>No entities found.</p>
                                )}
                            </div>
                            <div>
                                <h4 className="font-semibold mb-2">User README Entities</h4>
                                {results.named_entity_recognition.user_readme_entities.length > 0 ? (
                                    <ul>
                                        {results.named_entity_recognition.user_readme_entities.map((ent, index) => (
                                            <li key={index} className="text-sm">
                                                <strong>{ent.text}</strong> ({ent.label})
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p>No entities found.</p>
                                )}
                            </div>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="h-full flex flex-col bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <input
                    type="file"
                    accept=".md"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="readme-upload"
                />
                <label htmlFor="readme-upload" className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700 transition-colors font-medium">
                    <Upload size={16} />
                    Upload Your README
                </label>
                <button
                    onClick={handleCompare}
                    disabled={!userReadme || loading}
                    className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                    <Copy size={16} />
                    Compare
                </button>
            </div>

            {results && (
                <div className="border-b border-gray-200 bg-gray-50 flex">
                    {["Text Similarity","Readability Metrics", "AI as a Judge", "Named Entity Recognition"].map((tab, index) => (
                        <button
                            key={index}
                            onClick={() => setActiveTab(index)}
                            className={`px-4 py-2 text-sm font-medium border-r border-gray-200 ${activeTab === index ? "bg-white text-blue-600" : "text-gray-600 hover:bg-gray-100"}`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            )}

            <div className="flex-1 overflow-auto">
                {renderContent()}
            </div>
        </div>
    );
};

export default CompareReadme;