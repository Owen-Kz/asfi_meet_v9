// components/chat/ChatFileMessage.tsx
import React from 'react';

interface Props {
    url: string;
    fileType: string;
}

const ChatFileMessage = ({ url, fileType }: Props) => {
    const isImage = fileType.startsWith('image/');
    const isPDF = fileType === 'application/pdf';
    const isWordDoc = [
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ].includes(fileType);

    const getFileIcon = () => {
        if (isPDF) return '📄';
        if (isWordDoc) return '📝';
        return '📁';
    };

    const getFileTypeFromUrl = (url: string) => {
        const extension = url.split('.').pop()?.toLowerCase();
        switch (extension) {
            case 'jpg':
            case 'jpeg':
            case 'png':
            case 'gif':
                return 'image/' + extension;
            case 'pdf':
                return 'application/pdf';
            case 'doc':
                return 'application/msword';
            case 'docx':
                return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
            default:
                return 'application/octet-stream';
        }
    };

    const detectedType = fileType || getFileTypeFromUrl(url);

    if (isImage || detectedType.startsWith('image/')) {
        return (
            <div className="chat-file-message image-message">
                <img 
                    src={url} 
                    alt="Uploaded content" 
                    className="chat-file-image"
                    style={{ maxWidth: '300px', maxHeight: '300px' }}
                />
            </div>
        );
    }

    return (
        <div className="chat-file-message document-message">
            <div className="file-icon">{getFileIcon()}</div>
            <a 
                href={url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="file-link"
            >
                View File
            </a>
        </div>
    );
};

export default ChatFileMessage;