import React, { useCallback, useEffect, useState } from 'react';
import { connect } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import { IReduxState } from '../../../app/types';
import { translate } from '../../../base/i18n/functions';
import { getLocalParticipant, getParticipantById } from '../../../base/participants/functions';
import { withPixelLineHeight } from '../../../base/styles/functions.web';
import Tabs from '../../../base/ui/components/web/Tabs';
import { arePollsDisabled, getMeetingId } from '../../../conference/functions.any';
import PollsPane from '../../../polls/components/web/PollsPane';
import { sendMessage, setIsPollsTabFocused, toggleChat } from '../../actions.web';
import { CHAT_SIZE, CHAT_TABS, SMALL_WIDTH_THRESHOLD } from '../../constants';
import { IChatProps as AbstractProps } from '../../types';

import ChatHeader from './ChatHeader';
import ChatInput from './ChatInput';
import DisplayNameForm from './DisplayNameForm';
import KeyboardAvoider from './KeyboardAvoider';
import MessageContainer from './MessageContainer';
import MessageRecipient from './MessageRecipient';

interface IProps extends AbstractProps {
    _isModal: boolean;
    _isOpen: boolean;
    _isPollsEnabled: boolean;
    _isPollsTabFocused: boolean;
    _nbUnreadPolls: number;
    _onSendMessage: Function;
    _onToggleChat: Function;
    _onToggleChatTab: Function;
    _onTogglePollsTab: Function;
    _showNamePrompt: boolean;
}

interface PosterDeck {
    poster_deck_title: string;
    poster_deck_id: string;
    poster_deck_owner: string;
    poster_deck_description: string;
    poster_deck_image: string;
}

const useStyles = makeStyles()(theme => ({
    container: {
        backgroundColor: theme.palette.ui01,
        flexShrink: 0,
        overflow: 'hidden',
        position: 'relative',
        transition: 'width .16s ease-in-out',
        width: `${CHAT_SIZE}px`,
        zIndex: 300,

        '@media (max-width: 580px)': {
            height: '100dvh',
            position: 'fixed',
            left: 0,
            right: 0,
            top: 0,
            width: 'auto'
        },

        '*': {
            userSelect: 'text',
            '-webkit-user-select': 'text'
        }
    },
    chatHeader: {
        height: '60px',
        position: 'relative',
        width: '100%',
        zIndex: 1,
        display: 'flex',
        justifyContent: 'space-between',
        padding: `${theme.spacing(3)} ${theme.spacing(4)}`,
        alignItems: 'center',
        boxSizing: 'border-box',
        color: theme.palette.text01,
        ...withPixelLineHeight(theme.typography.heading6),

        '.jitsi-icon': {
            cursor: 'pointer'
        }
    },
    chatPanel: {
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100% - 110px)'
    },
    chatPanelNoTabs: {
        height: 'calc(100% - 60px)'
    },
    pollsPanel: {
        height: 'calc(100% - 110px)'
    },
    postersPanel: {
        height: 'calc(100% - 110px)',
        overflowY: 'auto',
        padding: theme.spacing(2)
    },
    postersGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
        gap: theme.spacing(2),
        padding: theme.spacing(1)
    },
    posterCard: {
        backgroundColor: theme.palette.ui02,
        borderRadius: theme.shape.borderRadius,
        overflow: 'hidden',
        transition: 'transform 0.2s',
        '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: theme.shadows[3]
        }
    },
    posterImageContainer: {
        height: '160px',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.palette.ui03
    },
    posterImage: {
        width: '100%',
        height: '100%',
        objectFit: 'cover'
    },
    posterInfo: {
        padding: theme.spacing(2)
    },
    posterTitle: {
        ...withPixelLineHeight(theme.typography.bodyShortBold),
        color: theme.palette.text01,
        marginBottom: theme.spacing(1)
    },
    posterOwner: {
        ...withPixelLineHeight(theme.typography.labelSmall),
        color: theme.palette.text02
    },
    emptyState: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        color: theme.palette.text03
    }
}));

const Chat = ({
    _isModal,
    _isOpen,
    _isPollsEnabled,
    _isPollsTabFocused,
    _messages,
    _nbUnreadMessages,
    _nbUnreadPolls,
    _onSendMessage,
    _onToggleChat,
    _onToggleChatTab,
    _onTogglePollsTab,
    _showNamePrompt,
    dispatch,
    t
}: IProps) => {
    const { classes, cx } = useStyles();
    const [activeTab, setActiveTab] = useState(CHAT_TABS.CHAT);
    const [posters, setPosters] = useState<PosterDeck[]>([]);
    const [loadingPosters, setLoadingPosters] = useState(true);
    const [postersError, setPostersError] = useState('');

    useEffect(() => {
        if (activeTab === CHAT_TABS.POSTERS && posters.length === 0 && !postersError) {
            fetchPosters();
        }
    }, [activeTab]);

    const fetchPosters = async () => {
        try {
            setLoadingPosters(true);
            const meetingId = getMeetingId();
            
            if (!meetingId) {
                setPostersError('Unauthorized access');
                return;
            }

            const response = await fetch(`https://posters.asfischolar.com/getposterdecks/${meetingId}`);
            
            if (!response.ok) {
                throw new Error('Failed to fetch posters');
            }

            const data = await response.json();
            console.log(data)
            const allPosterDecks = JSON.parse(data.PosterDecks);
            
            if (allPosterDecks.length > 0) {
                setPosters(allPosterDecks);
            } else {
                setPostersError('No posters available');
            }
        } catch (error) {
            console.error('Error fetching posters:', error);
            setPostersError('Failed to load posters');
        } finally {
            setLoadingPosters(false);
        }
    };

    const onSendMessage = useCallback((text: string) => {
        dispatch(sendMessage(text));
    }, []);

    const onToggleChat = useCallback(() => {
        dispatch(toggleChat());
    }, []);

    const onEscClick = useCallback((event: React.KeyboardEvent) => {
        if (event.key === 'Escape' && _isOpen) {
            event.preventDefault();
            event.stopPropagation();
            onToggleChat();
        }
    }, [_isOpen]);

    const onChangeTab = useCallback((id: string) => {
        setActiveTab(id);
        dispatch(setIsPollsTabFocused(id === CHAT_TABS.POLLS));
    }, []);

    const renderPosters = () => {
        if (loadingPosters) {
            return (
                <div className={classes.emptyState}>
                    {t('chat.posters.loading')}
                </div>
            );
        }

        if (postersError) {
            return (
                <div className={classes.emptyState}>
                    {postersError}
                </div>
            );
        }

        return (
            <div className={classes.postersGrid}>
                {posters.map(poster => (
                    <a 
                        key={poster.poster_deck_id}
                        href={`/event/poster/${poster.poster_deck_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={classes.posterCard}
                    >
                        <div className={classes.posterImageContainer}>
                            {poster.poster_deck_image ? (
                                <img 
                                    src={poster.poster_deck_image} 
                                    alt={poster.poster_deck_title}
                                    className={classes.posterImage}
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZD0iTTE5IDV2MTRIMVY1aDhtMTYgMTRIN1Y3aDEydjEyek0xNiAxLjFMMTIgNS4xIDggMS4xSDF2MTNoMTV2LTEzek0xMyA4YTEuNSAxLjUgMCAxMS0zIDAgMS41IDEuNSAwIDAxMyAweiIgZmlsbD0iIzc1NzU3NSIvPjwvc3ZnPg==';
                                    }}
                                />
                            ) : (
                                <div>No Image</div>
                            )}
                        </div>
                        <div className={classes.posterInfo}>
                            <div className={classes.posterTitle}>
                                {poster.poster_deck_title}
                            </div>
                            <div className={classes.posterOwner}>
                                {poster.poster_deck_owner}
                            </div>
                        </div>
                    </a>
                ))}
            </div>
        );
    };

    function renderChat() {
        return (
            <>
                {(_isPollsEnabled || true) && renderTabs()}
                <div
                    aria-labelledby={CHAT_TABS.CHAT}
                    className={cx(
                        classes.chatPanel,
                        !_isPollsEnabled && classes.chatPanelNoTabs,
                        activeTab !== CHAT_TABS.CHAT && 'hide'
                    )}
                    id={`${CHAT_TABS.CHAT}-panel`}
                    role="tabpanel"
                    tabIndex={0}
                >
                    <MessageContainer messages={_messages} />
                    <MessageRecipient />
                    <ChatInput onSend={onSendMessage} />
                </div>
                
                {_isPollsEnabled && (
                    <div
                        aria-labelledby={CHAT_TABS.POLLS}
                        className={cx(classes.pollsPanel, activeTab !== CHAT_TABS.POLLS && 'hide')}
                        id={`${CHAT_TABS.POLLS}-panel`}
                        role="tabpanel"
                        tabIndex={0}
                    >
                        <PollsPane />
                    </div>
                )}
                
                <div
                    aria-labelledby={CHAT_TABS.POSTERS}
                    className={cx(classes.postersPanel, activeTab !== CHAT_TABS.POSTERS && 'hide')}
                    id={`${CHAT_TABS.POSTERS}-panel`}
                    role="tabpanel"
                    tabIndex={0}
                >
                    {renderPosters()}
                </div>
                
                <KeyboardAvoider />
            </>
        );
    }

    function renderTabs() {
        return (
            <Tabs
                accessibilityLabel={t(_isPollsEnabled ? 'chat.titleWithPolls' : 'chat.title')}
                onChange={onChangeTab}
                selected={activeTab}
                tabs={[
                    {
                        accessibilityLabel: t('chat.tabs.chat'),
                        countBadge: activeTab !== CHAT_TABS.CHAT && _nbUnreadMessages > 0 ? _nbUnreadMessages : undefined,
                        id: CHAT_TABS.CHAT,
                        controlsId: `${CHAT_TABS.CHAT}-panel`,
                        label: t('chat.tabs.chat')
                    },
                    ...(_isPollsEnabled ? [{
                        accessibilityLabel: t('chat.tabs.polls'),
                        countBadge: activeTab !== CHAT_TABS.POLLS && _nbUnreadPolls > 0 ? _nbUnreadPolls : undefined,
                        id: CHAT_TABS.POLLS,
                        controlsId: `${CHAT_TABS.POLLS}-panel`,
                        label: t('chat.tabs.polls')
                    }] : []),
                    {
                        accessibilityLabel: t('chat.tabs.posters'),
                        id: CHAT_TABS.POSTERS,
                        controlsId: `${CHAT_TABS.POSTERS}-panel`,
                        label: t('Posters')
                    }
                ]}
            />
        );
    }

    return (
        _isOpen ? <div
            className={classes.container}
            id="sideToolbarContainer"
            onKeyDown={onEscClick}
        >
            <ChatHeader
                className={cx('chat-header', classes.chatHeader)}
                isPollsEnabled={_isPollsEnabled}
                onCancel={onToggleChat}
            />
            {_showNamePrompt
                ? <DisplayNameForm isPollsEnabled={_isPollsEnabled} />
                : renderChat()}
        </div> : null
    );
};

function _mapStateToProps(state: IReduxState, _ownProps: any) {
    const { isOpen, isPollsTabFocused, messages, nbUnreadMessages } = state['features/chat'];
    const { nbUnreadPolls } = state['features/polls'];
    const _localParticipant = getLocalParticipant(state);

    return {
        _isModal: window.innerWidth <= SMALL_WIDTH_THRESHOLD,
        _isOpen: isOpen,
        _isPollsEnabled: !arePollsDisabled(state),
        _isPollsTabFocused: isPollsTabFocused,
        _messages: messages,
        _nbUnreadMessages: nbUnreadMessages,
        _nbUnreadPolls: nbUnreadPolls,
        _showNamePrompt: !_localParticipant?.name
    };
} 

export default translate(connect(_mapStateToProps)(Chat));