import React, { Component, RefObject } from 'react';
import { WithTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import axios from 'axios';

import { IReduxState, IStore } from '../../../app/types';
import { isMobileBrowser } from '../../../base/environment/utils';
import { translate } from '../../../base/i18n/functions';
import { IconFaceSmile, IconSend, IconShareDoc } from '../../../base/icons/svg';
import Button from '../../../base/ui/components/web/Button';
import Input from '../../../base/ui/components/web/Input';
import { areSmileysDisabled } from '../../functions';
import SmileysPanel from './SmileysPanel';

interface IProps extends WithTranslation {
    _areSmileysDisabled: boolean;
    _privateMessageRecipientId?: string;
    dispatch: IStore['dispatch'];
    onSend: Function;
}

interface IState {
    message: string;
    showSmileysPanel: boolean;
    filePreview: string | null;
    selectedFile: File | null;
}

class ChatInput extends Component<IProps, IState> {
    _textArea?: RefObject<HTMLTextAreaElement>;
    fileInput?: HTMLInputElement | null;

    state: IState = {
        message: '',
        showSmileysPanel: false,
        filePreview: null,
        selectedFile: null
    };

    constructor(props: IProps) {
        super(props);
        this._textArea = React.createRef<HTMLTextAreaElement>();

        this._onDetectSubmit = this._onDetectSubmit.bind(this);
        this._onMessageChange = this._onMessageChange.bind(this);
        this._onSmileySelect = this._onSmileySelect.bind(this);
        this._onSubmitMessage = this._onSubmitMessage.bind(this);
        this._toggleSmileysPanel = this._toggleSmileysPanel.bind(this);
        this._handleFileUpload = this._handleFileUpload.bind(this);
        this._sendFile = this._sendFile.bind(this);
    }

    componentDidMount() {
        if (isMobileBrowser()) {
            this._textArea?.current?.blur();
        } else {
            this._focus();
        }
    }

    componentDidUpdate(prevProps: Readonly<IProps>) {
        if (prevProps._privateMessageRecipientId !== this.props._privateMessageRecipientId) {
            this._textArea?.current?.focus();
        }
    }

    componentWillUnmount() {
        // Cleanup object URL to prevent memory leaks
        if (this.state.filePreview) {
            URL.revokeObjectURL(this.state.filePreview);
        }
    }

    async _sendFile() {
        const { selectedFile } = this.state;
        if (!selectedFile) return;

        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('timestamp', String(Math.floor(Date.now() / 1000)));

        try {
            const response = await axios.post(
                `http://localhost:34000/asfimeetfileupload`,
                formData
            );
            const fileUrl = response.data.secure_url;
            console.log('Uploaded file URL:', fileUrl);
            this.props.onSend(fileUrl || "An Error Accoured while uploading file please try again");
        } catch (error) {
            this.props.onSend(error.response?.data || error.message);
            console.error('File upload failed:', error.response?.data || error.message);
        }

        // Clear file preview and selection after sending
        this.setState({ filePreview: null, selectedFile: null });
    }

    render() {
        return (
            <div className={`chat-input-container${this.state.message.trim().length ? ' populated' : ''}`}>
                <div id='chat-input'>
                    {!this.props._areSmileysDisabled && (
                        <Button icon={IconFaceSmile} onClick={this._toggleSmileysPanel} />
                    )}
                    <Input
                        className='chat-input'
                        placeholder={this.props.t('chat.messagebox')}
                        value={this.state.message}
                        onChange={this._onMessageChange}
                        onKeyPress={this._onDetectSubmit}
                        ref={this._textArea}
                        textarea={true}
                    />
                    <input
                        type='file'
                        accept='image/*,application/pdf'
                        style={{ display: 'none' }}
                        ref={(ref) => (this.fileInput = ref)}
                        onChange={this._handleFileUpload}
                    />
                    <Button icon={IconShareDoc} onClick={() => this.fileInput?.click()} />
                    <Button icon={IconSend} disabled={!this.state.message.trim()} onClick={this._onSubmitMessage} />
                </div>
    
                {/* 🟢 Add SmileysPanel Here */}
                {this.state.showSmileysPanel && (
                    <SmileysPanel
                        onSmileySelect={this._onSmileySelect}
                        closePanel={() => this.setState({ showSmileysPanel: false })}
                    />
                )}
    
                {/* File Preview Section */}
                {this.state.filePreview && (
                    <div className='file-preview'>
                        {this.state.selectedFile?.type.startsWith('image') ? (
                            <img src={this.state.filePreview} alt='File Preview' style={{ maxWidth: '100px', maxHeight: '100px' }} />
                        ) : (
                            <iframe src={this.state.filePreview} width='100' height='100'></iframe>
                        )}
                        <Button onClick={this._sendFile} icon={IconSend} />
                    </div>
                )}
            </div>
        );
    }
    

    _focus() {
        this._textArea?.current?.focus();
    }

    _onSubmitMessage() {
        const trimmed = this.state.message.trim();
        if (trimmed) {
            this.props.onSend(trimmed);
            this.setState({ message: '' });
            this._focus();
        }
    }

    _onDetectSubmit(event: any) {
        if (event.isComposing || event.keyCode === 229) return;
        if (event.key === 'Enter' && !event.shiftKey && !event.ctrlKey) {
            event.preventDefault();
            event.stopPropagation();
            this._onSubmitMessage();
        }
    }

    _onMessageChange(value: string) {
        this.setState({ message: value });
    }

    _onSmileySelect(smileyText: string) {
        if (smileyText) {
            this.setState(prevState => ({
                message: `${prevState.message} ${smileyText}`,
                showSmileysPanel: false
            }), () => this._focus());
        }
    }
    

    _toggleSmileysPanel() {
        this.setState(prevState => ({
            showSmileysPanel: !prevState.showSmileysPanel
        }), () => {
            if (!this.state.showSmileysPanel) {
                this._focus();
            }
        });
    }
    

    async _handleFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0];
        if (!file) return;

        // Generate a local preview URL for images and PDFs
        const fileURL = URL.createObjectURL(file);

        // Cleanup previous file preview to prevent memory leaks
        if (this.state.filePreview) {
            URL.revokeObjectURL(this.state.filePreview);
        }

        this.setState({ filePreview: fileURL, selectedFile: file });
    }
}

const mapStateToProps = (state: IReduxState) => {
    const { privateMessageRecipient } = state['features/chat'];
    return {
        _areSmileysDisabled: areSmileysDisabled(state),
        _privateMessageRecipientId: privateMessageRecipient?.id
    };
};

export default translate(connect(mapStateToProps)(ChatInput));
