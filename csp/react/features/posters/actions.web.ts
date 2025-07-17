import { POSTERS_PANE_OPEN } from './actionTypes';



export * from './actions.any';

/**
 * Action to open the POSTERS pane.
 *
 * @returns {Object}
 */
export const open = () => {
    return {
        type: POSTERS_PANE_OPEN
    };
};
