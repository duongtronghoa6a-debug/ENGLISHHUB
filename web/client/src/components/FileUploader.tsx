import React, { useState, useRef } from 'react';
import { Upload, X, FileText, Image, File, Loader2, CheckCircle } from 'lucide-react';
import api from '../services/api';

interface FileUploaderProps {
    onUploadComplete: (result: { key: string; url: string | null; size: number; contentType: string }) => void;
    onError?: (error: string) => void;
    folder?: string;
    acceptedTypes?: string;
    maxSize?: number; // in MB
    label?: string;
}

/**
 * File Uploader Component
 * Uploads files to Cloudflare R2 via backend
 */
const FileUploader: React.FC<FileUploaderProps> = ({
    onUploadComplete,
    onError,
    folder = 'uploads',
    acceptedTypes = 'image/*,.pdf,.doc,.docx,.ppt,.pptx',
    maxSize = 50,
    label = 'Kéo thả file hoặc click để chọn'
}) => {
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState('');
    const [uploadedFile, setUploadedFile] = useState<{ name: string; size: number } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const formatFileSize = (bytes: number): string => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    const getFileIcon = (type: string) => {
        if (type.startsWith('image/')) return <Image className="text-blue-500" size={24} />;
        if (type === 'application/pdf') return <FileText className="text-red-500" size={24} />;
        return <File className="text-gray-500" size={24} />;
    };

    const handleFile = async (file: File) => {
        // Validate size
        if (file.size > maxSize * 1024 * 1024) {
            const errMsg = `File quá lớn. Tối đa ${maxSize}MB`;
            setError(errMsg);
            onError?.(errMsg);
            return;
        }

        setUploading(true);
        setError('');
        setProgress(0);

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('folder', folder);

            // Determine endpoint based on folder
            let endpoint = '/upload/document';
            if (folder === 'thumbnails') endpoint = '/upload/thumbnail';
            else if (folder.startsWith('resources')) endpoint = '/upload/resource';

            const response = await api.post(endpoint, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                onUploadProgress: (progressEvent) => {
                    const percent = progressEvent.total
                        ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
                        : 0;
                    setProgress(percent);
                }
            });

            setUploadedFile({ name: file.name, size: file.size });
            onUploadComplete(response.data);
        } catch (err: any) {
            const errMsg = err.response?.data?.error || 'Upload thất bại';
            setError(errMsg);
            onError?.(errMsg);
        } finally {
            setUploading(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file) handleFile(file);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleFile(file);
    };

    const reset = () => {
        setUploadedFile(null);
        setProgress(0);
        setError('');
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    return (
        <div
            className={`
                relative border-2 border-dashed rounded-xl p-6 text-center transition-all
                ${uploading ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20' : ''}
                ${error ? 'border-red-400 bg-red-50 dark:bg-red-900/20' : ''}
                ${uploadedFile ? 'border-green-400 bg-green-50 dark:bg-green-900/20' : ''}
                ${!uploading && !error && !uploadedFile ? 'border-gray-300 dark:border-gray-600 hover:border-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800' : ''}
            `}
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
        >
            <input
                ref={fileInputRef}
                type="file"
                accept={acceptedTypes}
                onChange={handleChange}
                className="hidden"
                disabled={uploading}
            />

            {uploading ? (
                <div className="space-y-3">
                    <Loader2 className="mx-auto animate-spin text-blue-500" size={32} />
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                            className="bg-blue-500 h-2 rounded-full transition-all"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Đang tải lên... {progress}%</p>
                </div>
            ) : uploadedFile ? (
                <div className="space-y-2">
                    <CheckCircle className="mx-auto text-green-500" size={32} />
                    <p className="text-sm font-medium text-green-600 dark:text-green-400">
                        {uploadedFile.name}
                    </p>
                    <p className="text-xs text-gray-500">{formatFileSize(uploadedFile.size)}</p>
                    <button
                        onClick={reset}
                        className="text-sm text-blue-500 hover:underline"
                    >
                        Thay thế file khác
                    </button>
                </div>
            ) : (
                <label className="cursor-pointer block" onClick={() => fileInputRef.current?.click()}>
                    <Upload className="mx-auto mb-2 text-gray-400" size={32} />
                    <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
                    <p className="text-xs text-gray-400 mt-1">Tối đa {maxSize}MB</p>
                </label>
            )}

            {error && (
                <div className="mt-3 flex items-center justify-center gap-2 text-red-500">
                    <X size={16} />
                    <span className="text-sm">{error}</span>
                </div>
            )}
        </div>
    );
};

export default FileUploader;
