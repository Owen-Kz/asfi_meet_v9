// FilePreview.tsx
import React from 'react';
import { IconSend } from '../../../base/icons/svg';
import Button from '../../../base/ui/components/web/Button';

interface IFilePreviewProps {
    filePreview: string;
    file: File;
    onSend: () => void;
}

const FilePreview = ({ filePreview, file, onSend }: IFilePreviewProps) => (
    <div className='file-preview'>
        {file.type.startsWith('image') ? (
            <img 
                src={filePreview} 
                alt='File Preview' 
                style={{ 
                    maxWidth: '100px', 
                    maxHeight: '100px',
                    objectFit: 'cover',
                    borderRadius: '4px'
                }} 
            />
        ) : (
            <div className='document-preview'>
                <span>{file.name}</span>
            </div>
        )}
        <Button 
            onClick={onSend} 
            icon={IconSend}
            label="Send File"
        />
    </div>
);

export default FilePreview;