"use client";

import { useState, useRef } from "react";
import { 
  Upload, FileText, CheckCircle2, AlertCircle, FileSpreadsheet, 
  Play, Sparkles, MessageSquare, Layers, HelpCircle, HardDrive
} from "lucide-react";
import { motion } from "framer-motion";
import PodcastPlayer from "@/components/PodcastPlayer";
import { API_BASE_URL } from "@/lib/api";

interface DocumentLibraryProps {
  documents: string[];
  selectedDoc: string | null;
  onSelectDoc: (doc: string) => void;
  onUploadSuccess: (filename: string) => void;
  onChangeTab: (tab: string) => void;
}

export default function DocumentLibrary({
  documents,
  selectedDoc,
  onSelectDoc,
  onUploadSuccess,
  onChangeTab
}: DocumentLibraryProps) {
  const [dragActive, setDragActive] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string>("");
  const [uploadError, setUploadError] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      uploadFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      uploadFile(e.target.files[0]);
    }
  };

  const uploadFile = async (file: File) => {
    // Validate file type
    const validExtensions = [".pdf", ".docx", ".xlsx", ".pptx"];
    const fileExtension = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
    
    if (!validExtensions.includes(fileExtension)) {
      setUploadError("Invalid file type. Supported types: PDF, DOCX, XLSX, PPTX.");
      return;
    }

    setLoading(true);
    setUploadStatus("Uploading & Indexing document chunks...");
    setUploadError("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/documents/upload`, {
        method: "POST",
        body: formData
      });
      const data = await res.json();
      if (data.status === "success") {
        setUploadStatus("Upload complete! Document fully indexed in ChromaDB.");
        onUploadSuccess(data.filename);
        onSelectDoc(data.filename);
      } else {
        setUploadError(data.detail || "Failed to upload document.");
      }
    } catch (error) {
      console.error(error);
      setUploadError("Could not connect to the backend server.");
    }
    setLoading(false);
  };

  const getFileIcon = (filename: string) => {
    const ext = filename.substring(filename.lastIndexOf(".")).toLowerCase();
    if (ext === ".xlsx") return <FileSpreadsheet className="text-green-500" size={24} />;
    return <FileText className="text-blue-500" size={24} />;
  };

  return (
    <div className="flex-1 flex flex-col lg:flex-row gap-8 items-start w-full">
      
      {/* Left Column: Upload and File Library List */}
      <div className="flex-1 flex flex-col gap-8 w-full">
        {/* Upload Box Container */}
        <motion.div 
          className={`border-2 border-dashed rounded-3xl p-8 text-center flex flex-col items-center justify-center gap-4 cursor-pointer transition-all ${
            dragActive 
              ? "border-blue-600 bg-blue-50/50 dark:bg-blue-950/20" 
              : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-350 dark:hover:border-zinc-700 bg-white dark:bg-zinc-950"
          }`}
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          whileHover={{ scale: 1.002 }}
        >
          <input 
            ref={fileInputRef}
            type="file" 
            onChange={handleFileChange} 
            className="hidden"
            accept=".pdf,.docx,.xlsx,.pptx"
          />

          <div className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-full border border-zinc-200 dark:border-zinc-800 text-zinc-500">
            <Upload size={28} className={loading ? "animate-bounce" : ""} />
          </div>

          <div>
            <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
              Drag & drop files here or click to select
            </p>
            <p className="text-xs text-zinc-400 mt-1">
              Supported formats: PDF, DOCX, XLSX, PPTX
            </p>
          </div>

          {uploadStatus && (
            <div className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1.5 justify-center">
              <CheckCircle2 size={14} />
              <span>{uploadStatus}</span>
            </div>
          )}

          {uploadError && (
            <div className="text-xs text-red-650 dark:text-red-400 flex items-center gap-1.5 justify-center">
              <AlertCircle size={14} />
              <span>{uploadError}</span>
            </div>
          )}
        </motion.div>

        {/* Library Files List */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <HardDrive size={18} className="text-zinc-500" />
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">Study Materials Library</h3>
          </div>

          {documents.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-zinc-950 rounded-3xl border border-zinc-200 dark:border-zinc-850 text-zinc-400">
              <FileText size={36} className="mx-auto text-zinc-300 dark:text-zinc-800 mb-2" />
              <p className="text-xs">No documents uploaded yet. Upload a document above to get started!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {documents.map((doc, idx) => {
                const isSelected = selectedDoc === doc;
                return (
                  <motion.div 
                    key={idx}
                    onClick={() => onSelectDoc(doc)}
                    className={`p-5 rounded-3xl border text-left cursor-pointer transition-all flex flex-col justify-between gap-4 relative overflow-hidden ${
                      isSelected 
                        ? "border-blue-600 bg-blue-50/10 dark:bg-blue-950/10 shadow-sm" 
                        : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-350 dark:hover:border-zinc-700 bg-white dark:bg-zinc-950"
                    }`}
                    whileHover={{ y: -2 }}
                  >
                    <div className="flex gap-3 items-start">
                      <div className="p-2 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 mt-0.5">
                        {getFileIcon(doc)}
                      </div>
                      <div className="truncate">
                        <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate pr-4">
                          {doc}
                        </h4>
                        <p className="text-[10px] text-zinc-450 mt-0.5">
                          Chroma Vector Store Indexed
                        </p>
                      </div>
                    </div>

                    {/* Actions Bar */}
                    <div className="flex items-center gap-2 border-t border-zinc-100 dark:border-zinc-900 pt-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectDoc(doc);
                          onChangeTab("chat");
                        }}
                        className="p-1.5 bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-900 dark:hover:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-650 dark:text-zinc-350"
                        title="AI Chat"
                      >
                        <MessageSquare size={12} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectDoc(doc);
                          onChangeTab("notes");
                        }}
                        className="p-1.5 bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-900 dark:hover:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-650 dark:text-zinc-350"
                        title="Generate Study Notes"
                      >
                        <Sparkles size={12} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectDoc(doc);
                          onChangeTab("quizzes");
                        }}
                        className="p-1.5 bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-900 dark:hover:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-650 dark:text-zinc-350"
                        title="Generate Quiz"
                      >
                        <HelpCircle size={12} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectDoc(doc);
                          onChangeTab("flashcards");
                        }}
                        className="p-1.5 bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-900 dark:hover:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-650 dark:text-zinc-350"
                        title="Generate Flashcards"
                      >
                        <Layers size={12} />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Right Column: Audio Podcast Player Overview */}
      {selectedDoc && (
        <div className="w-full lg:w-80 shrink-0">
          <PodcastPlayer selectedDoc={selectedDoc} />
        </div>
      )}

    </div>
  );
}
