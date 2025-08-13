import React, { useCallback, useEffect, useState, useRef } from 'react';
import { connect } from 'react-redux';
import { makeStyles } from 'tss-react/mui';
import * as pdfjsLib from 'pdfjs-dist';

import { IReduxState } from '../../../app/types';
import { translate } from '../../../base/i18n/functions';
import { getLocalParticipant } from '../../../base/participants/functions';
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

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

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
    poster_preview_image: string;
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
        display: 'flex',
        justifyContent: 'space-between',
        padding: `${theme.spacing(3)} ${theme.spacing(4)}`,
        alignItems: 'center',
        boxSizing: 'border-box',
        color: theme.palette.text01,
        ...withPixelLineHeight(theme.typography.heading6)
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
    posterLink: {
        display: 'block',
        textAlign: 'center',
        padding: theme.spacing(1),
        backgroundColor: theme.palette.ui03,
        color: theme.palette.text01,
        textDecoration: 'none',
        '&:hover': {
            backgroundColor: theme.palette.ui04
        }
    },
    pdfContainer: {
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.palette.ui03
    },
    emptyState: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        color: theme.palette.text03
    },
    loadMoreButton: {
        margin: theme.spacing(2),
        padding: theme.spacing(1, 3),
        backgroundColor: theme.palette.action01,
        color: theme.palette.text01,
        borderRadius: theme.shape.borderRadius,
        border: 'none',
        cursor: 'pointer',
        '&:hover': {
            backgroundColor: theme.palette.action01Hover
        }
    },
    paginationContainer: {
        display: 'flex',
        justifyContent: 'center',
        marginTop: theme.spacing(2)
    }
}));

/** PDF Preview Component */
const PDFPreview = ({ pdfUrl }: { pdfUrl: string }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const renderPDF = async () => {
            try {
                setLoading(true);
                setError('');

                const pdfResponse = await fetch(pdfUrl);
                const pdfBlob = await pdfResponse.blob();
                const pdfData = await pdfBlob.arrayBuffer();

                const loadingTask = pdfjsLib.getDocument({ data: pdfData });
                const pdf = await loadingTask.promise;
                const page = await pdf.getPage(1);
                const viewport = page.getViewport({ scale: 0.8 });

                const canvas = canvasRef.current;
                if (!canvas) return;
                const context = canvas.getContext('2d');
                if (!context) return;

                canvas.height = viewport.height;
                canvas.width = viewport.width;

                await page.render({ canvasContext: context, viewport }).promise;
                setLoading(false);
            } catch (err) {
                console.error('Error rendering PDF preview:', err);
                setError('Failed to load PDF preview');
                setLoading(false);
            }
        };
        renderPDF();
    }, [pdfUrl]);

    if (loading) return <div>Loading PDF preview...</div>;
    if (error) return <div>{error}</div>;

    return <canvas ref={canvasRef} />;
};

const Chat = (props: IProps) => {
    const {
        _isModal,
        _isOpen,
        _isPollsEnabled,
        _messages,
        _nbUnreadMessages,
        _nbUnreadPolls,
        _showNamePrompt,
        dispatch,
        t
    } = props;

    const { classes, cx } = useStyles();
    const [activeTab, setActiveTab] = useState(CHAT_TABS.CHAT);
    const [posters, setPosters] = useState<PosterDeck[]>([]);
    const [loadingPosters, setLoadingPosters] = useState(true);
    const [postersError, setPostersError] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const postersPerPage = 6;

    useEffect(() => {
        if (activeTab === CHAT_TABS.POSTERS) {
            setPosters([]);
            setCurrentPage(1);
            fetchPosters(1, true);
        }
    }, [activeTab]);

    const fetchPosters = async (page = 1, replace = false) => {
        try {
            setLoadingPosters(true);
            setPostersError('');
            const meetingId = getMeetingId();
            if (!meetingId) {
                setPostersError('Unauthorized access');
                return;
            }

            const response = await fetch(`https://posters.asfischolar.com/getposterdecks/${meetingId}?page=${page}&limit=${postersPerPage}`);
            if (!response.ok) throw new Error('Failed to fetch posters');

            const data = await response.json();
            const newPosters = JSON.parse(data.PosterDecks);

            if (newPosters.length > 0) {
                setPosters(prev => replace ? newPosters : [...prev, ...newPosters]);
                setTotalPages(data.totalPages);
            } else if (page === 1) {
                setPostersError('No posters available');
            }
        } catch (error) {
            console.error('Error fetching posters:', error);
            setPostersError('Failed to load posters');
        } finally {
            setLoadingPosters(false);
        }
    };

    const loadMorePosters = () => {
        if (currentPage < totalPages) {
            const nextPage = currentPage + 1;
            setCurrentPage(nextPage);
            fetchPosters(nextPage);
        }
    };

    const onSendMessage = useCallback((text: string) => {
        dispatch(sendMessage(text));
    }, []);

    const onToggleChat = useCallback(() => {
        dispatch(toggleChat());
    }, []);

    const onChangeTab = useCallback((id: string) => {
        setActiveTab(id);
        setCurrentPage(1);
        dispatch(setIsPollsTabFocused(id === CHAT_TABS.POLLS));
    }, []);

    const renderPosters = () => {
        if (loadingPosters) return <div className={classes.emptyState}>{t('Loading Posters')}</div>;
        if (postersError) return <div className={classes.emptyState}>{postersError} <br/>  <div> <a href="https://posters.asfischolar.com/uploadPoster" target='_blank'> <button className={classes.loadMoreButton}> Upload Poster </button></a></div></div>;
        if (!posters.length) return <div className={classes.emptyState}>{t('chat.posters.none')}</div>;

        const hasMore = currentPage < totalPages;

        return (
            <>
                <div className={classes.postersGrid}>
                    {posters.map(poster => (
                        <div key={poster.poster_deck_id} className={classes.posterCard}>
                            <div className={classes.posterImageContainer}>
                                {poster.poster_preview_image ? (
                                    poster.poster_preview_image.endsWith('.pdf') ? (
                                        <div className={classes.pdfContainer}>
                                            <PDFPreview pdfUrl={poster.poster_preview_image} />
                                        </div>
                                    ) : (
                                        <img
                                            src={poster.poster_preview_image}
                                            alt={poster.poster_deck_title}
                                            className={classes.posterImage}
                                             crossOrigin="anonymous"
                                        />
                                    )
                                ) : (
                                    <div>No Image</div>
                                )}
                            </div>
                            <div className={classes.posterInfo}>
                                <div className={classes.posterTitle}>{poster.poster_deck_title}</div>
                                <div className={classes.posterOwner}>{poster.poster_deck_owner}</div>
                            </div>
                            <a
                                href={`https://posters.asfischolar.com/event/poster/${poster.poster_deck_id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={classes.posterLink}
                            >
                                {t('chat.posters.view')}
                            </a>
                        </div>
                    ))}
                    <div>
                       <a href="https://posters.asfischolar.com/uploadPoster" target='_blank'>
                         <button className={classes.loadMoreButton}> Upload Poster </button>
                         </a>
                    </div>
                </div>
                {hasMore && (
                    <div className={classes.paginationContainer}>
                        <button onClick={loadMorePosters} className={classes.loadMoreButton}>
                            {t('chat.posters.loadMore')}
                        </button>
                    </div>
                )}
            </>
        );
    };

    const renderTabs = () => (
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
                ...(_isPollsEnabled
                    ? [{
                        accessibilityLabel: t('chat.tabs.polls'),
                        countBadge: activeTab !== CHAT_TABS.POLLS && _nbUnreadPolls > 0 ? _nbUnreadPolls : undefined,
                        id: CHAT_TABS.POLLS,
                        controlsId: `${CHAT_TABS.POLLS}-panel`,
                        label: t('chat.tabs.polls')
                    }]
                    : []),
                {
                    accessibilityLabel: t('chat.tabs.posters'),
                    id: CHAT_TABS.POSTERS,
                    controlsId: `${CHAT_TABS.POSTERS}-panel`,
                    label: t('Posters')
                }
            ]}
        />
    );

    return _isOpen ? (
        <div className={classes.container} id="sideToolbarContainer">
            <ChatHeader
                className={cx('chat-header', classes.chatHeader)}
                isPollsEnabled={_isPollsEnabled}
                onCancel={onToggleChat}
            />
            {_showNamePrompt
                ? <DisplayNameForm isPollsEnabled={_isPollsEnabled} />
                : (
                    <>
                        {(_isPollsEnabled || true) && renderTabs()}
                        <div className={cx(classes.chatPanel, !_isPollsEnabled && classes.chatPanelNoTabs, activeTab !== CHAT_TABS.CHAT && 'hide')}>
                            <MessageContainer messages={_messages} />
                            <MessageRecipient />
                            <ChatInput onSend={onSendMessage} />
                        </div>
                        {_isPollsEnabled && (
                            <div className={cx(classes.pollsPanel, activeTab !== CHAT_TABS.POLLS && 'hide')}>
                                <PollsPane />
                            </div>
                        )}
                        <div className={cx(classes.postersPanel, activeTab !== CHAT_TABS.POSTERS && 'hide')}>
                            {renderPosters()}
                        </div>
                        <KeyboardAvoider />
                    </>
                )}
        </div>
    ) : null;
};

function _mapStateToProps(state: IReduxState) {
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
