import { Theme } from '@mui/material';
import React, { useCallback, useMemo, useState } from 'react';
import { connect } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import { IReduxState } from '../../../app/types';
import { translate } from '../../../base/i18n/functions';
import { getParticipantDisplayName } from '../../../base/participants/functions';
import Popover from '../../../base/popover/components/Popover.web';
import Message from '../../../base/react/components/web/Message';
import { withPixelLineHeight } from '../../../base/styles/functions.web';
import { getFormattedTimestamp, getMessageText, getPrivateNoticeMessage } from '../../functions';
import { IChatMessageProps } from '../../types';

import MessageMenu from './MessageMenu';
import ReactButton from './ReactButton';

interface IProps extends IChatMessageProps {
    shouldDisplayChatMessageMenu: boolean;
    state?: IReduxState;
    type: string;
}

const useStyles = makeStyles()((theme: Theme) => {
    return {
        chatMessageFooter: {
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: theme.spacing(1)
        },
        chatMessageFooterLeft: {
            display: 'flex',
            flexGrow: 1,
            overflow: 'hidden'
        },
        chatMessageWrapper: {
            maxWidth: '100%'
        },
        chatMessage: {
            display: 'inline-flex',
            padding: '12px',
            backgroundColor: theme.palette.ui02,
            borderRadius: '4px 12px 12px 12px',
            maxWidth: '100%',
            marginTop: '4px',
            boxSizing: 'border-box' as const,

            '&.privatemessage': {
                backgroundColor: theme.palette.support05
            },
            '&.local': {
                backgroundColor: theme.palette.ui04,
                borderRadius: '12px 4px 12px 12px',

                '&.privatemessage': {
                    backgroundColor: theme.palette.support05
                },
                '&.local': {
                    backgroundColor: theme.palette.ui04,
                    borderRadius: '12px 4px 12px 12px',

                    '&.privatemessage': {
                        backgroundColor: theme.palette.support05
                    }
                },

                '&.error': {
                    backgroundColor: theme.palette.actionDanger,
                    borderRadius: 0,
                    fontWeight: 100
                },

                '&.lobbymessage': {
                    backgroundColor: theme.palette.support05
                }
            },
            '&.error': {
                backgroundColor: theme.palette.actionDanger,
                borderRadius: 0,
                fontWeight: 100
            },
            '&.lobbymessage': {
                backgroundColor: theme.palette.support05
            }
        },
        sideBySideContainer: {
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'left',
            alignItems: 'center',
            marginLeft: theme.spacing(1)
        },
        reactionBox: {
            display: 'flex',
            alignItems: 'center',
            gap: theme.spacing(1),
            backgroundColor: theme.palette.grey[800],
            borderRadius: theme.shape.borderRadius,
            padding: theme.spacing(0, 1),
            cursor: 'pointer'
        },
        reactionCount: {
            fontSize: '0.8rem',
            color: theme.palette.grey[400]
        },
        replyButton: {
            padding: '2px'
        },
        replyWrapper: {
            display: 'flex',
            flexDirection: 'row' as const,
            alignItems: 'center',
            maxWidth: '100%'
        },
        messageContent: {
            maxWidth: '100%',
            overflow: 'hidden',
            flex: 1
        },
        optionsButtonContainer: {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: theme.spacing(1),
            minWidth: '32px',
            minHeight: '32px'
        },
        displayName: {
            ...withPixelLineHeight(theme.typography.labelBold),
            color: theme.palette.text02,
            whiteSpace: 'nowrap',
            textOverflow: 'ellipsis',
            overflow: 'hidden',
            marginBottom: theme.spacing(1),
            maxWidth: '130px'
        },
        userMessage: {
            ...withPixelLineHeight(theme.typography.bodyShortRegular),
            color: theme.palette.text01,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word'
        },
        privateMessageNotice: {
            ...withPixelLineHeight(theme.typography.labelRegular),
            color: theme.palette.text02,
            marginTop: theme.spacing(1)
        },
        timestamp: {
            ...withPixelLineHeight(theme.typography.labelRegular),
            color: theme.palette.text03,
            marginTop: theme.spacing(1),
            marginLeft: theme.spacing(1),
            whiteSpace: 'nowrap',
            flexShrink: 0
        },
        reactionsPopover: {
            padding: theme.spacing(2),
            backgroundColor: theme.palette.ui03,
            borderRadius: theme.shape.borderRadius,
            maxWidth: '150px',
            maxHeight: '400px',
            overflowY: 'auto',
            color: theme.palette.text01
        },
        reactionItem: {
            display: 'flex',
            alignItems: 'center',
            marginBottom: theme.spacing(1),
            gap: theme.spacing(1),
            borderBottom: `1px solid ${theme.palette.common.white}`,
            paddingBottom: theme.spacing(1),
            '&:last-child': {
                borderBottom: 'none',
                paddingBottom: 0
            }
        },
        participantList: {
            marginLeft: theme.spacing(1),
            fontSize: '0.8rem',
            maxWidth: '120px'
        },
        participant: {
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
        },
        // New styles for media preview
        previewContainer: {
            display: 'flex',
            flexDirection: 'column' as const,
            gap: theme.spacing(1),
            margin: theme.spacing(1, 0)
        },
        imagePreview: {
            maxWidth: '100%',
            maxHeight: '300px',
            borderRadius: '4px',
            border: `1px solid ${theme.palette.divider}`
        },
        fileLink: {
            textDecoration: 'none',
            color: 'inherit'
        },
        pdfPreview: {
            display: 'flex',
            alignItems: 'center',
            gap: theme.spacing(1),
            padding: theme.spacing(1),
            backgroundColor: theme.palette.ui02,
            borderRadius: '4px',
            border: `1px solid ${theme.palette.divider}`
        },
        filePreview: {
            display: 'flex',
            alignItems: 'center',
            gap: theme.spacing(1),
            padding: theme.spacing(1),
            backgroundColor: theme.palette.ui02,
            borderRadius: '4px',
            border: `1px solid ${theme.palette.divider}`
        },
        fileIcon: {
            fontSize: '20px'
        }
    };
});

const MediaPreview = ({ url, classes }: { url: string; classes: any }) => {
    const extension = url.split('.').pop()?.toLowerCase();
    
    // Image preview
    if (['jpg', 'jpeg', 'png', 'gif'].includes(extension || '')) {
        return (
            <div className={classes.previewContainer}>
                <img 
                    src={url} 
                    className={classes.imagePreview} 
                    alt="File preview"
                    onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                    }}
                />
                <a 
                    href={url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className={classes.fileLink}>
                    {url}
                </a>
            </div>
        );
    }
    
    // PDF preview
    if (extension === 'pdf') {
        return (
            <div className={classes.previewContainer}>
                <a 
                    href={url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className={classes.fileLink}>
                    <div className={classes.pdfPreview}>
                        <span className={classes.fileIcon}>📄</span>
                        <span>PDF Document</span>
                    </div>
                </a>
            </div>
        );
    }
    
    // Other file types
    return (
        <div className={classes.previewContainer}>
            <a 
                href={url} 
                target="_blank" 
                rel="noopener noreferrer"
                className={classes.fileLink}>
                <div className={classes.filePreview}>
                    <span className={classes.fileIcon}>
                        {extension === 'docx' ? '📝' : 
                         extension === 'xlsx' ? '📊' : 
                         extension === 'pptx' ? '📑' : '📂'}
                    </span>
                    <span>Download {extension?.toUpperCase()} file</span>
                </div>
            </a>
        </div>
    );
};

function isMediaUrl(text: string): boolean {
    const fileUrlRegex = /(https?:\/\/[^\s]+\.(jpg|jpeg|png|gif|pdf|docx?|xlsx?|pptx?|txt|mp4|mov|avi|mp3|wav))\b/gi;
    const match = text.match(fileUrlRegex);
    return !!match && match[0] === text.trim();
}

const ChatMessage = ({
    message,
    state,
    showDisplayName,
    type,
    shouldDisplayChatMessageMenu,
    knocking,
    t
}: IProps) => {
    const { classes, cx } = useStyles();
    const [ isHovered, setIsHovered ] = useState(false);
    const [ isReactionsOpen, setIsReactionsOpen ] = useState(false);

    const handleMouseEnter = useCallback(() => {
        setIsHovered(true);
    }, []);

    const handleMouseLeave = useCallback(() => {
        setIsHovered(false);
    }, []);

    const handleReactionsOpen = useCallback(() => {
        setIsReactionsOpen(true);
    }, []);

    const handleReactionsClose = useCallback(() => {
        setIsReactionsOpen(false);
    }, []);

    function _renderDisplayName() {
        return (
            <div
                aria-hidden = { true }
                className = { cx('display-name', classes.displayName) }>
                {message.displayName}
            </div>
        );
    }

    function _renderPrivateNotice() {
        return (
            <div className = { classes.privateMessageNotice }>
                {getPrivateNoticeMessage(message)}
            </div>
        );
    }

    function _renderTimestamp() {
        return (
            <div className = { cx('timestamp', classes.timestamp) }>
                {getFormattedTimestamp(message)}
            </div>
        );
    }

    const renderReactions = useMemo(() => {
        if (!message.reactions || message.reactions.size === 0) {
            return null;
        }

        const reactionsArray = Array.from(message.reactions.entries())
            .map(([ reaction, participants ]) => {
                return { reaction,
                    participants };
            })
            .sort((a, b) => b.participants.size - a.participants.size);

        const totalReactions = reactionsArray.reduce((sum, { participants }) => sum + participants.size, 0);
        const numReactionsDisplayed = 3;

        const reactionsContent = (
            <div className = { classes.reactionsPopover }>
                {reactionsArray.map(({ reaction, participants }) => (
                    <div
                        className = { classes.reactionItem }
                        key = { reaction }>
                        <span>{reaction}</span>
                        <span>{participants.size}</span>
                        <div className = { classes.participantList }>
                            {Array.from(participants).map(participantId => (
                                <div
                                    className = { classes.participant }
                                    key = { participantId }>
                                    {state && getParticipantDisplayName(state, participantId)}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        );

        return (
            <Popover
                content = { reactionsContent }
                onPopoverClose = { handleReactionsClose }
                onPopoverOpen = { handleReactionsOpen }
                position = 'top'
                trigger = 'hover'
                visible = { isReactionsOpen }>
                <div className = { classes.reactionBox }>
                    {reactionsArray.slice(0, numReactionsDisplayed).map(({ reaction }, index) =>
                        <span key = { index }>{reaction}</span>
                    )}
                    {reactionsArray.length > numReactionsDisplayed && (
                        <span className = { classes.reactionCount }>
                            +{totalReactions - numReactionsDisplayed}
                        </span>
                    )}
                </div>
            </Popover>
        );
    }, [ message?.reactions, isHovered, isReactionsOpen ]);

    return (
        <div
            className = { cx(classes.chatMessageWrapper, type) }
            id = { message.messageId }
            onMouseEnter = { handleMouseEnter }
            onMouseLeave = { handleMouseLeave }
            tabIndex = { -1 }>
            <div className = { classes.sideBySideContainer }>
                {!shouldDisplayChatMessageMenu && (
                    <div className = { classes.optionsButtonContainer }>
                        {isHovered && <MessageMenu
                            isLobbyMessage = { message.lobbyChat }
                            message = { message.message }
                            participantId = { message.participantId }
                            shouldDisplayChatMessageMenu = { shouldDisplayChatMessageMenu } />}
                    </div>
                )}
                <div
                    className = { cx(
                        'chatmessage',
                        classes.chatMessage,
                        type,
                        message.privateMessage && 'privatemessage',
                        message.lobbyChat && !knocking && 'lobbymessage'
                    ) }>
                    <div className = { classes.replyWrapper }>
                        <div className = { cx('messagecontent', classes.messageContent) }>
                            {showDisplayName && _renderDisplayName()}
                            <div className = { cx('usermessage', classes.userMessage) }>
                                <span className = 'sr-only'>
                                    {message.displayName === message.recipient
                                        ? t('chat.messageAccessibleTitleMe')
                                        : t('chat.messageAccessibleTitle', {
                                            user: message.displayName
                                        })}
                                </span>
                                {console.log(message)}
                                {isMediaUrl(message.message) ? (
                                    <MediaPreview url={message.message} classes={classes} />
                                ) : (
                                    <Message text={getMessageText(message)} />
                                )}
                                {(message.privateMessage || (message.lobbyChat && !knocking))
                                    && _renderPrivateNotice()}
                                <div className = { classes.chatMessageFooter }>
                                    <div className = { classes.chatMessageFooterLeft }>
                                        {message.reactions && message.reactions.size > 0 && (
                                            <>
                                                {renderReactions}
                                            </>
                                        )}
                                    </div>
                                    {_renderTimestamp()}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                {shouldDisplayChatMessageMenu && (
                    <div className = { classes.sideBySideContainer }>
                        {!message.privateMessage && <div>
                            <div className = { classes.optionsButtonContainer }>
                                {isHovered && <ReactButton
                                    messageId = { message.messageId }
                                    receiverId = { '' } />}
                            </div>
                        </div>}
                        <div>
                            <div className = { classes.optionsButtonContainer }>
                                {isHovered && <MessageMenu
                                    isLobbyMessage = { message.lobbyChat }
                                    message = { message.message }
                                    participantId = { message.participantId }
                                    shouldDisplayChatMessageMenu = { shouldDisplayChatMessageMenu } />}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

function _mapStateToProps(state: IReduxState, { message }: IProps) {
    const { knocking } = state['features/lobby'];
    const localParticipantId = state['features/base/participants'].local?.id;

    return {
        shouldDisplayChatMessageMenu: message.participantId !== localParticipantId,
        knocking,
        state
    };
}

export default translate(connect(_mapStateToProps)(ChatMessage));