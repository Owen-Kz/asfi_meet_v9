import ReducerRegistry from '../base/redux/ReducerRegistry';

import {
    POSTERS_PANE_CLOSE,
    POSTERS_PANE_OPEN,
    SET_VOLUME
} from './actionTypes';
import { REDUCER_KEY } from './constants';

export interface IParticipantsPaneState {
    isOpen: boolean;
    participantsVolume: {
        [participantId: string]: number;
    };
}

const DEFAULT_STATE = {
    isOpen: false,
    participantsVolume: {}
};

/**
 * Listen for actions that mutate the participants pane state.
 */
ReducerRegistry.register(
    REDUCER_KEY, (state: IParticipantsPaneState = DEFAULT_STATE, action) => {
        switch (action.type) {
        case POSTERS_PANE_CLOSE:
            return {
                ...state,
                isOpen: false
            };

        case POSTERS_PANE_OPEN:
            return {
                ...state,
                isOpen: true
            };

        case SET_VOLUME:
            return {
                ...state,
                participantsVolume: {
                    ...state.participantsVolume,

                    [action.participantId]: action.volume
                }
            };

        default:
            return state;
        }
    }
);
