import React, { useState } from 'react';
import { makeStyles } from 'tss-react/mui';
import { IconDownload } from '../../../base/icons/svg';
import Button from '../../../base/ui/components/web/Button';

interface Props {
    url: string;
    fileType: string;
}

const useStyles = makeStyles()(theme => {
    return {
        fileMessage: {
            display: 'flex',
            flexDirection: 'column',
            margin: theme.spacing(1, 0),
            maxWidth: '100%'
        },
        imageContainer: {
            position: 'relative',
            width: '100%',
            maxWidth: '300px',
            height: '200px',
            backgroundColor: theme.palette.ui02,
            borderRadius: theme.shape.borderRadius,
            border: `1px solid ${theme.palette.divider}`,
            overflow: 'hidden'
        },
        imagePreview: {
            width: '100%',
            height: '100%',
            objectFit: 'contain'
        },
        imageError: {
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            width: '100%',
            height: '100%',
            backgroundColor: theme.palette.ui02
        },
        documentPreview: {
            display: 'flex',
            alignItems: 'center',
            padding: theme.spacing(1),
            backgroundColor: theme.palette.ui02,
            borderRadius: theme.shape.borderRadius,
            border: `1px solid ${theme.palette.divider}`
        },
        fileIcon: {
            fontSize: '24px',
            marginRight: theme.spacing(1)
        },
        fileInfo: {
            display: 'flex',
            flexDirection: 'column'
        },
        fileName: {
            fontWeight: 'bold'
        },
        fileType: {
            fontSize: '0.8rem',
            color: theme.palette.text03
        }
    };
});

const ChatFileMessage = ({ url, fileType }: Props) => {
    const { classes } = useStyles();
    const [imageError, setImageError] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const fileName = url.split('/').pop()?.split('?')[0] || 'Download';

    const getCloudinaryUrl = (url: string) => {
        if (url.includes('res.cloudinary.com')) {
            if (!url.includes('/image/upload/')) {
                return url.replace('/image/upload', '/image/upload/w_600,h_400,c_limit');
            }
            // Add quality parameter
            return url.includes('q_') ? url : `${url}?q=80`;
        }
        return url;
    };

    const handleDownload = () => window.open(url, '_blank');
    const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
        console.error("Image load error:", url, e);
        setImageError(true);
        setIsLoading(false);
    };

    if (fileType.startsWith('image/')) {
        const imageUrl = getCloudinaryUrl(url);
        console.log("Final image URL:", imageUrl); // Debug output
        
        return (
            <div className={classes.fileMessage}>
                <div className={classes.imageContainer}>
                    {imageError ? (
                        <div className={classes.imageError}>
                            <span>Image not available</span>
                            <Button 
                                label="Retry" 
                                onClick={() => {
                                    setImageError(false);
                                    setIsLoading(true);
                                }}
                            />
                        </div>
                    ) : (
                        <>
                            {isLoading && (
                                <div className={classes.imageLoading}>
                                    Loading image...
                                </div>
                            )}
                            <img 
                                src={imageUrl}
                                alt="Uploaded content"
                                className={classes.imagePreview}
                                crossOrigin="anonymous"
                                onLoad={() => {
                                    setIsLoading(false);
                                    setImageError(false);
                                }}
                                onError={handleImageError}
                                style={{ display: isLoading ? 'none' : 'block' }}
                            />
                        </>
                    )}
                </div>
                <Button 
                    icon={IconDownload}
                    label="Download Image"
                    onClick={handleDownload}
                    size="small"
                />
            </div>
        );
    }

    return (
        <div className={classes.fileMessage}>
            <div className={classes.documentPreview}>
                <span className={classes.fileIcon}>
                    {fileType === 'application/pdf' ? '📄' : 
                     fileType.includes('word') ? '📝' : 
                     fileType.includes('excel') ? '📊' : '📁'}
                </span>
                <div className={classes.fileInfo}>
                    <span className={classes.fileName}>{fileName}</span>
                    <span className={classes.fileType}>
                        {fileType === 'application/pdf' ? 'PDF Document' : 
                         fileType.includes('word') ? 'Word Document' : 
                         fileType.includes('excel') ? 'Excel Spreadsheet' : 'File'}
                    </span>
                </div>
            </div>
            <Button 
                icon={IconDownload}
                label="Download File"
                onClick={handleDownload}
                size="small"
            />
        </div>
    );
};

export default ChatFileMessage;