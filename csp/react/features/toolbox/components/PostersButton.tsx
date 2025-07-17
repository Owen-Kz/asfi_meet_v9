// import { once } from 'lodash-es';
import { connect } from 'react-redux';
import { translate } from '../../base/i18n/functions';
import { createToolbarEvent } from '../../analytics/AnalyticsEvents';
import { sendAnalytics } from '../../analytics/functions';
import { openDialog } from '../../base/dialog/actions'; // or any other action
import AbstractButton, { IProps as AbstractButtonProps } from '../../base/toolbox/components/AbstractButton';

/**
 * Posters button in the overflow menu.
 */
class PostersButton extends AbstractButton<AbstractButtonProps> {
    accessibilityLabel = 'toolbar.accessibilityLabel.posters';
    // icon = null; // Replace with an icon if available (e.g. IconPosters)
    label = 'toolbar.posters';
    tooltip = 'toolbar.posters';

    /**
     * Executes the Posters button action.
     *
     * @override
     * @protected
     * @returns {void}
     */
    _handleClick() {
        // sendAnalytics(createToolbarEvent('posters.clicked'));
        console.log("POSTERS CLICKED")

        // Trigger a dialog, navigate, or anything custom
        // this.props.dispatch(openDialog({
        
        //     message: 'This is where the posters feature will appear.'
        // }));
    }
}

export default translate(connect()(PostersButton));
