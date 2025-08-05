
import React from 'react';
import { AppFile } from '../types';
import { FileIcon, CheckCircleIcon, XCircleIcon, TrashIcon } from './icons';

interface FileListProps {
  files: AppFile[];
  onClearFile: (id: string) => void;
}

const formatBytes = (bytes: number, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

const StatusIndicator: React.FC<{ status: AppFile['status'] }> = ({ status }) => {
  switch (status) {
    case 'processing':
      return (
        <div className="flex items-center gap-2 text-yellow-500">
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-medium">Đang xử lý</span>
        </div>
      );
    case 'success':
      return (
        <div className="flex items-center gap-1 text-green-500">
          <CheckCircleIcon className="w-5 h-5" />
          <span className="text-sm font-medium">Thành công</span>
        </div>
      );
    case 'error':
       return (
        <div className="flex items-center gap-1 text-red-500">
          <XCircleIcon className="w-5 h-5" />
          <span className="text-sm font-medium">Lỗi</span>
        </div>
      );
    case 'pending':
    default:
      return <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Đang chờ</span>;
  }
};


export const FileList: React.FC<FileListProps> = ({ files, onClearFile }) => {
  if (files.length === 0) {
    return (
        <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">Chưa có tệp nào được tải lên.</p>
        </div>
    )
  }

  return (
    <ul className="space-y-3">
      {files.map(appFile => (
        <li key={appFile.id} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 overflow-hidden">
            <FileIcon className="h-8 w-8 text-primary-500 flex-shrink-0" />
            <div className="flex-grow overflow-hidden">
              <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate" title={appFile.file.name}>
                {appFile.file.name}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {formatBytes(appFile.file.size)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 flex-shrink-0">
             <StatusIndicator status={appFile.status} />
             <button onClick={() => onClearFile(appFile.id)} className="text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 transition-colors">
                <TrashIcon className="h-5 w-5" />
                <span className="sr-only">Xóa tệp</span>
             </button>
          </div>
        </li>
      ))}
    </ul>
  );
};
