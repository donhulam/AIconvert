import React, { useMemo, useState, useRef, useEffect } from 'react';
import { AppFile, ExtractedContent, ChatMessage } from '../types';
import { DocumentTextIcon, DownloadIcon, ChatBubbleLeftRightIcon, PaperAirplaneIcon, LightBulbIcon } from './icons';
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType } from 'docx';
import { getChatbotResponse } from '../services/geminiService';

interface ResultCardProps {
  file: AppFile;
  onSaveMessages: (fileId: string, userMessage: ChatMessage, modelMessage: ChatMessage) => void;
}

const structuredContentToPlainText = (content?: ExtractedContent): string => {
  if (!content) return '';
  return content.map(block => {
    if (block.type === 'paragraph') {
      return block.content.runs.map(r => r.text).join('');
    }
    if (block.type === 'table') {
      return block.rows.map(row => 
        row.cells.map(cell => 
          cell.content.runs.map(r => r.text).join('')
        ).join('\t') // Use tab separation for table cells in plain text
      ).join('\n');
    }
    return '';
  }).join('\n\n');
};

export const ResultCard: React.FC<ResultCardProps> = ({ file, onSaveMessages }) => {
  const plainText = useMemo(() => structuredContentToPlainText(file.extractedContent), [file.extractedContent]);

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(file.chatHistory || []);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatContentRef = useRef<HTMLDivElement>(null);

  const suggestions = [
    'Tóm tắt nội dung chính của tài liệu',
    'Giải thích chi tiết tài liệu',
    'Lấy ví dụ minh họa nội dung chính của tài liệu',
    'Rút ra các hành động hoặc quyết định được đề cập',
    'Dịch nguyên văn tài liệu sang tiếng Việt'
  ];

  useEffect(() => {
    if (chatContentRef.current) {
        chatContentRef.current.scrollTop = chatContentRef.current.scrollHeight;
    }
  }, [chatMessages, isChatLoading]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const messageToSend = currentMessage.trim();
    if (!messageToSend || isChatLoading) return;

    const userMessage: ChatMessage = { role: 'user', content: messageToSend };
    
    // Optimistically update UI with user's message
    const newChatHistory = [...chatMessages, userMessage];
    setChatMessages(newChatHistory);
    setCurrentMessage('');
    setIsChatLoading(true);

    try {
        const responseText = await getChatbotResponse(plainText, newChatHistory);
        const modelMessage: ChatMessage = { role: 'model', content: responseText };
        
        onSaveMessages(file.id, userMessage, modelMessage);
        setChatMessages(prev => [...prev, modelMessage]);

    } catch (error) {
        const errorMessage: ChatMessage = {
            role: 'model',
            content: error instanceof Error ? `Lỗi: ${error.message}` : "Đã xảy ra lỗi không mong muốn."
        };
         setChatMessages(prev => [...prev, errorMessage]);
    } finally {
        setIsChatLoading(false);
    }
  };


  const handleDownload = async () => {
    if (!file.extractedContent) return;

    const docChildren = file.extractedContent.map(block => {
      if (block.type === 'paragraph') {
        const runs = block.content.runs.map(run => new TextRun({
          text: run.text,
          bold: run.isBold,
          italics: run.isItalic,
        }));
        return new Paragraph({ children: runs });
      }
      
      if (block.type === 'table') {
        const tableRows = block.rows.map(tableRow => {
          const docxCells = tableRow.cells.map(tableCell => {
            const cellParagraphs = tableCell.content.runs.map(run => new Paragraph({
              children: [new TextRun({
                text: run.text,
                bold: run.isBold,
                italics: run.isItalic,
              })]
            }));
            return new TableCell({
              children: cellParagraphs,
            });
          });
          return new TableRow({ children: docxCells });
        });
        
        return new Table({
          rows: tableRows,
          width: {
            size: 100,
            type: WidthType.PERCENTAGE,
          },
        });
      }
      return null;
    }).filter((item): item is Paragraph | Table => item !== null);


    const doc = new Document({
      sections: [{
        children: docChildren,
      }],
    });

    const blob = await Packer.toBlob(doc);
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    
    const sanitizedFilename = file.file.name.replace(/\.[^/.]+$/, "") || "document";
    link.download = `${sanitizedFilename}.docx`;
    
    document.body.appendChild(link);
    link.click();
    
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  };

  const handleDownloadChatMessage = async (content: string) => {
    if (!content) return;

    // Process each line to clean markdown and create a new Paragraph
    const paragraphs = content.split('\n').map(line => {
      // Remove heading markers (e.g., #, ##)
      let cleanedLine = line.replace(/^#+\s+/, '');
      // Remove list item markers (e.g., *, -, 1.)
      cleanedLine = cleanedLine.replace(/^\s*([-*]|\d+\.)\s+/, '');
      // Remove blockquote markers (e.g., >)
      cleanedLine = cleanedLine.replace(/^>\s?/, '');
      // Remove bold/italic/strikethrough markers
      cleanedLine = cleanedLine.replace(/(\*\*|__|\*|_|~~)/g, '');
      // Remove inline code backticks
      cleanedLine = cleanedLine.replace(/`/g, '');
      // Remove links, keeping only the text
      cleanedLine = cleanedLine.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');

      return new Paragraph({
        children: [new TextRun(cleanedLine)],
      });
    });

    const doc = new Document({
      sections: [{
        children: paragraphs,
      }],
    });

    const blob = await Packer.toBlob(doc);
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `chatbot-response.docx`;
    
    document.body.appendChild(link);
    link.click();
    
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="p-4 sm:p-5 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center flex-wrap gap-2">
        <div className="flex items-center gap-3 overflow-hidden">
          <DocumentTextIcon className="h-6 w-6 text-primary-500" />
          <h3 className="font-semibold text-gray-800 dark:text-gray-200 truncate" title={file.file.name}>
            {file.file.name}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleDownload}
            disabled={!file.extractedContent}
            className="inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <DownloadIcon className="h-4 w-4" />
            Tải xuống .DOCX
          </button>
          <button
            onClick={() => setIsChatOpen(!isChatOpen)}
            disabled={!file.extractedContent}
            className="inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-md bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300 hover:bg-primary-200 dark:hover:bg-primary-900/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChatBubbleLeftRightIcon className="h-4 w-4" />
            Trò chuyện với tài liệu
          </button>
        </div>
      </div>
      <div className="p-4 sm:p-5">
        <textarea
          readOnly
          value={plainText || 'Không thể trích xuất văn bản.'}
          className="w-full h-40 min-h-[10rem] p-3 font-mono text-sm bg-gray-50 dark:bg-gray-900/50 rounded-md border-gray-200 dark:border-gray-600 focus:ring-primary-500 focus:border-primary-500"
          aria-label={`Extracted text for ${file.file.name}`}
        ></textarea>
      </div>

      {isChatOpen && (
        <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <div ref={chatContentRef} className="p-4 h-80 overflow-y-auto space-y-4">
            {chatMessages.length === 0 && !isChatLoading && (
              <div className="p-4 rounded-lg bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 mb-3">
                  <LightBulbIcon className="h-5 w-5 text-yellow-400" />
                  <h4 className="font-semibold text-gray-800 dark:text-gray-100">Gợi ý cho bạn</h4>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                  Bạn có thể hỏi bất cứ điều gì về nội dung của tài liệu này. Dưới đây là một vài ví dụ để giúp bạn bắt đầu:
                </p>
                <ul className="space-y-2">
                  {suggestions.map((suggestion, index) => (
                    <li key={index}>
                      <button
                        onClick={() => setCurrentMessage(suggestion)}
                        className="w-full text-left p-2.5 rounded-lg bg-white dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-sm text-primary-700 dark:text-primary-300 font-medium focus:outline-none focus:ring-2 focus:ring-primary-500"
                      >
                       “{suggestion}”
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {chatMessages.map((msg, index) => (
              <div key={index} className={`flex items-start gap-2.5 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                {msg.role === 'model' && <span className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-500 text-sm font-semibold text-white">AI</span>}
                
                {msg.role === 'model' ? (
                  <div className="flex flex-col items-start gap-1.5">
                    <div className="w-full max-w-[320px] leading-1.5 p-3 border-gray-200 rounded-xl rounded-tl-none bg-white dark:bg-gray-700">
                      <p className="text-sm font-normal text-gray-900 dark:text-white" style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</p>
                    </div>
                    <button
                      onClick={() => handleDownloadChatMessage(msg.content)}
                      className="inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      <DownloadIcon className="h-3 w-3" />
                      Tải xuống .DOCX
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col w-full max-w-[320px] leading-1.5 p-3 border-gray-200 rounded-xl rounded-tr-none bg-primary-100 dark:bg-primary-700">
                    <p className="text-sm font-normal text-gray-900 dark:text-white" style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</p>
                  </div>
                )}

                {msg.role === 'user' && <span className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-300 dark:bg-gray-600 text-sm font-semibold text-gray-800 dark:text-white">BẠN</span>}
              </div>
            ))}
            {isChatLoading && (
              <div className="flex items-start gap-2.5">
                <span className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-500 text-sm font-semibold text-white">AI</span>
                <div className="flex flex-col w-full max-w-[320px] leading-1.5 p-3 border-gray-200 rounded-xl rounded-tl-none bg-white dark:bg-gray-700">
                  <div className="flex space-x-1 justify-center items-center h-full">
                    <span className="sr-only">Đang tải...</span>
                    <div className="h-2 w-2 bg-primary-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="h-2 w-2 bg-primary-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="h-2 w-2 bg-primary-500 rounded-full animate-bounce"></div>
                  </div>
                </div>
              </div>
            )}
          </div>
          <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200 dark:border-gray-600 flex items-center gap-2">
            <input
              type="text"
              value={currentMessage}
              onChange={(e) => setCurrentMessage(e.target.value)}
              placeholder="Hỏi bất cứ điều gì về tài liệu này..."
              className="flex-grow bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-lg p-2.5 text-sm focus:ring-primary-500 focus:border-primary-500"
              disabled={isChatLoading}
            />
            <button
              type="submit"
              disabled={isChatLoading || !currentMessage}
              className="inline-flex items-center justify-center p-2.5 rounded-full text-white bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 dark:disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors"
            >
              <PaperAirplaneIcon className="w-5 h-5" />
              <span className="sr-only">Gửi tin nhắn</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
};