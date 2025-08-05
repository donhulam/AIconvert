
import React, { useState, useCallback } from 'react';
import { UploadIcon, CameraIcon } from './icons';

interface FileUploadProps {
  onFileChange: (files: File[]) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileChange }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragEnter = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFileChange(Array.from(e.dataTransfer.files));
      e.dataTransfer.clearData();
    }
  }, [onFileChange]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileChange(Array.from(e.target.files));
      // Reset input value to allow selecting the same file again
      e.target.value = '';
    }
  };

  const handleCameraCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files).map(file => {
        // Some mobile browsers don't provide a file name for captures.
        const extension = file.type.split('/')[1] || 'jpg';
        const filename = file.name || `capture-${Date.now()}.${extension}`;
        // Re-create the file to ensure it's got a name.
        return new File([file], filename, { type: file.type });
      });
      onFileChange(files);
      e.target.value = '';
    }
  };

  const acceptedFileTypes = '.pdf,.png,.jpg,.jpeg,.webp';

  return (
    <div className="space-y-4">
      <label
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`flex justify-center w-full h-48 px-6 transition-all duration-300 bg-white dark:bg-gray-800 border-2 border-dashed rounded-lg cursor-pointer ${
          isDragging
            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
            : 'border-gray-300 dark:border-gray-600 hover:border-primary-400 dark:hover:border-primary-500'
        }`}
      >
        <div className="flex flex-col items-center justify-center">
          <UploadIcon className={`w-12 h-12 mb-3 transition-colors ${isDragging ? 'text-primary-500' : 'text-gray-400'}`} />
          <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
            <span className="font-semibold text-primary-600 dark:text-primary-400">Nhấp để tải lên</span> hoặc kéo và thả
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">PDF, PNG, JPG, WEBP (tối đa 10MB mỗi tệp)</p>
        </div>
        <input
          type="file"
          multiple
          accept={acceptedFileTypes}
          onChange={handleFileSelect}
          className="hidden"
        />
      </label>

      <div className="relative flex items-center">
        <div className="flex-grow border-t border-gray-300 dark:border-gray-600"></div>
        <span className="flex-shrink mx-4 text-gray-400 text-sm">hoặc</span>
        <div className="flex-grow border-t border-gray-300 dark:border-gray-600"></div>
      </div>
      
      <label
        htmlFor="camera-upload-input"
        className="w-full cursor-pointer inline-flex items-center justify-center gap-2 px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
      >
        <CameraIcon className="h-6 w-6"/>
        <span>Sử dụng máy ảnh</span>
      </label>
      <input
        id="camera-upload-input"
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleCameraCapture}
        className="hidden"
      />
    </div>
  );
};
