import React, { useCallback } from 'react';
import { Linking } from 'react-native'; // Import Linking from react-native
import { useDispatch } from 'react-redux';

import { createToolbarEvent } from '../../../../analytics/AnalyticsEvents';
import { sendAnalytics } from '../../../../analytics/functions';
import { appNavigate } from '../../../../app/actions.native';
import Button from '../../../../base/ui/components/native/Button';
import { BUTTON_TYPES } from '../../../../base/ui/constants.native';

import EndMeetingIcon from './EndMeetingIcon';
import styles from './styles';

/**
 * Button for ending meeting from carmode.
 *
 * @returns {JSX.Element} - The end meeting button.
 */
const EndMeetingButton = (): JSX.Element => {
    const dispatch = useDispatch();

    const onSelect = useCallback(() => {
        sendAnalytics(createToolbarEvent('hangup'));

        // Use Linking to open the URL when the button is clicked
        Linking.openURL('https://www.asfischolar.net').catch(err => console.error('Failed to open URL:', err));

        // Optionally, dispatch appNavigate if needed for state management (though not necessary for redirect)
        dispatch(appNavigate(undefined));
    }, [ dispatch ]);

    return (
        <Button
            accessibilityLabel = 'toolbar.accessibilityLabel.leaveConference'
            icon = { EndMeetingIcon }
            labelKey = 'toolbar.leaveConference'
            onClick = { onSelect }
            style = { styles.endMeetingButton }
            type = { BUTTON_TYPES.DESTRUCTIVE } />
    );
};

export default EndMeetingButton;
