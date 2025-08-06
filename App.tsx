
import React, { useState, useCallback } from 'react';
import { AppFile, FileStatus, ChatMessage } from './types';
import { extractFormattedContentFromGemini } from './services/geminiService';
import { FileUpload } from './components/FileUpload';
import { FileList } from './components/FileList';
import { ResultCard } from './components/ResultCard';
import { IntroductionModal } from './components/IntroductionModal';
import { LogoIcon, SparklesIcon, InformationCircleIcon } from './components/icons';

const App: React.FC = () => {
  const [files, setFiles] = useState<AppFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isIntroModalOpen, setIsIntroModalOpen] = useState(false);

  const updateFileStatus = useCallback((id: string, status: FileStatus, data: Partial<AppFile>) => {
    setFiles(prevFiles =>
      prevFiles.map(f => (f.id === id ? { ...f, status, ...data } : f))
    );
  }, []);

  const handleFileChange = (newFiles: File[]) => {
    const newAppFiles: AppFile[] = newFiles.map(file => ({
      id: crypto.randomUUID(),
      file,
      status: 'pending',
      chatHistory: [],
    }));
    setFiles(prev => [...prev, ...newAppFiles]);
  };

  const handleProcessFiles = async () => {
    if (files.filter(f => f.status === 'pending').length === 0) return;
  
    setIsProcessing(true);
    const pendingFiles = files.filter(f => f.status === 'pending');
  
    for (const appFile of pendingFiles) {
      updateFileStatus(appFile.id, 'processing', {});
      try {
        const content = await extractFormattedContentFromGemini(appFile.file);
        updateFileStatus(appFile.id, 'success', { extractedContent: content });
      } catch (error) {
        console.error('Error processing file:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
        updateFileStatus(appFile.id, 'error', { errorMessage });
      }
    }
  
    setIsProcessing(false);
  };
  
  const handleClearFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };
  
  const handleClearAll = () => {
    setFiles([]);
  };

  const handleSaveMessagePair = useCallback((fileId: string, userMessage: ChatMessage, modelMessage: ChatMessage) => {
    setFiles(prevFiles =>
      prevFiles.map(f => {
        if (f.id === fileId) {
          const newHistory = [...(f.chatHistory || []), userMessage, modelMessage];
          return { ...f, chatHistory: newHistory };
        }
        return f;
      })
    );
  }, []);

  const successfulFiles = files.filter(f => f.status === 'success');
  const pendingFilesCount = files.filter(f => f.status === 'pending').length;

  return (
    <>
      <div className="min-h-screen flex flex-col items-center p-4 sm:p-6 md:p-8">
        <div className="w-full max-w-4xl mx-auto">
          <header className="relative text-center mb-8">
            <div className="absolute top-0 right-0 z-10">
              <button
                  onClick={() => setIsIntroModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-200 transition-colors rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/30"
                  aria-label="Giới thiệu phần mềm"
              >
                  <InformationCircleIcon className="h-5 w-5" />
                  <span>Giới thiệu</span>
              </button>
            </div>
            <div className="inline-flex items-center gap-3 mb-2">
              <LogoIcon className="h-10 w-10 text-primary-500" />
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
                AI nhận dạng văn bản từ ảnh
              </h1>
            </div>
            <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400">
              Nhận dạng chính xác văn bản từ ảnh kể cả chữ viết tay theo đúng ngôn ngữ gốc. Trò chuyện với AI để tìm hiểu thêm về nội dung văn bản bằng tiếng Việt.
            </p>
          </header>

          <main className="space-y-8">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold mb-4">1. Tải lên tệp của bạn</h2>
              <FileUpload onFileChange={handleFileChange} />
            </div>
            
            {files.length > 0 && (
               <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">2. Xem lại và Xử lý</h2>
                  <button 
                    onClick={handleClearAll}
                    className="text-sm font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300 transition-colors"
                  >
                    Xóa tất cả
                  </button>
                </div>
                <FileList files={files} onClearFile={handleClearFile} />
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={handleProcessFiles}
                    disabled={isProcessing || pendingFilesCount === 0}
                    className="inline-flex items-center gap-2 justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition-all"
                  >
                    {isProcessing ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Đang xử lý...
                      </>
                    ) : (
                      <>
                        <SparklesIcon className="h-5 w-5"/>
                        Trích xuất văn bản ({pendingFilesCount})
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {successfulFiles.length > 0 && (
              <div className="space-y-6">
                 <h2 className="text-2xl font-semibold text-center">3. Kết quả được trích xuất</h2>
                {successfulFiles.map(file => (
                  <ResultCard key={file.id} file={file} onSaveMessages={handleSaveMessagePair} />
                ))}
              </div>
            )}
          </main>
          <footer className="text-center mt-12 text-sm text-gray-500 dark:text-gray-400">
            <p>
              Phát triển bởi{' '}
              <a 
                href="http://trolyai.io.vn/" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="font-medium text-primary-600 dark:text-primary-400 hover:underline"
              >
                Đỗ Như Lâm
              </a>
            </p>
          </footer>
        </div>
      </div>
      <IntroductionModal isOpen={isIntroModalOpen} onClose={() => setIsIntroModalOpen(false)} />
    </>
  );
};

export default App;
