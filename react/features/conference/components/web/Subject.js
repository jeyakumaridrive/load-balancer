/* @flow */

import React, { Component } from 'react';

import { getConferenceName } from '../../../base/conference/functions';
import { getParticipantCount } from '../../../base/participants/functions';
import { connect } from '../../../base/redux';
import { isToolboxVisible } from '../../../toolbox';

import ConferenceTimer from '../ConferenceTimer';
import ParticipantsCount from './ParticipantsCount';
import {
    toggleTileView
} from '../../../video-layout';

/**
 * The type of the React {@code Component} props of {@link Subject}.
 */
type Props = {

    /**
     * Whether then participant count should be shown or not.
     */
    _showParticipantCount: boolean,

    /**
     * The subject or the of the conference.
     * Falls back to conference name.
     */
    _subject: string,

    /**
     * Indicates whether the component should be visible or not.
     */
    _visible: boolean,
    /**
    * Whether the Tileview is enabled or not.
    */
    _tileViewEnabled:boolean
};

/**
 * Subject react component.
 *
 * @class Subject
 */
class Subject extends Component<Props> {

    constructor(props: Props) {
        super(props);
        this.state = {
            galleryView: !this.props._tileViewEnabled
        };
    }
    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */

    _doToggleTileView = () => {
        this.props.dispatch(toggleTileView());
        this.setState({
            galleryView: !this.state.galleryView
        })
    }
    render() {
        const { _showParticipantCount, _subject, _visible } = this.props;
        return (
            <div className = { `subject ${_visible ? 'visible' : ''}` }>
                <span className = 'subject-text'>{ _subject }</span>
                {/* <ConferenceTimer /> */}
                {/* { _showParticipantCount && <ParticipantsCount /> } */}
                <div className='view-settings'>
                    
                    <div className='toggle-view' onClick={this._doToggleTileView}>
                       {this.state.galleryView ? 
                        <React.Fragment>
                            <svg version="1.1" id="Capa_1" xmlns="http://www.w3.org/2000/svg"  x="0px" y="0px"
                                    width="450px" height="323px" viewBox="0 0 450 323" enableBackground="new 0 0 450 323">
                                <g display="none">
                                    <g id="videocam-off" display="inline">
                                        <path d="M483.5,113.75l-102,102V126.5c0-15.3-10.2-25.5-25.5-25.5H197.9l285.6,285.6V113.75z M32.15-1L-1,32.15L67.85,101H50
                                            c-15.3,0-25.5,10.2-25.5,25.5v255c0,15.3,10.2,25.5,25.5,25.5h306c5.1,0,10.2-2.55,12.75-5.1l81.6,81.6l33.15-33.15L32.15-1z"/>
                                    </g>
                                </g>
                                <g>
                                    <rect x="-60" y="59.341" display="none" fill="#353535" width="570" height="272"/>
                                    <g>
                                        <rect x="13.264" y="13" fill="#F7F7F7" width="132.24" height="91"/>
                                        <rect x="158.879" y="13" fill="#F7F7F7" width="132.24" height="91"/>
                                        <rect x="304.496" y="13" fill="#F7F7F7" width="132.24" height="91"/>
                                        <rect x="13.264" y="116" fill="#F7F7F7" width="132.24" height="91"/>
                                        <rect x="158.879" y="116" fill="#F7F7F7" width="132.24" height="91"/>
                                        <rect x="304.496" y="116" fill="#F7F7F7" width="132.24" height="91"/>
                                        <rect x="13.264" y="219" fill="#F7F7F7" width="132.24" height="91"/>
                                        <rect x="158.879" y="219" fill="#F7F7F7" width="132.24" height="91"/>
                                        <rect x="304.496" y="219" fill="#F7F7F7" width="132.24" height="91"/>
                                    </g>
                                    <g display="none">
                                        <g display="inline">
                                            <path fill="#4F4F4F" d="M225,236.836c26.029,0,47.131-23.841,47.131-53.247c0-40.781-21.102-53.248-47.131-53.248
                                                c-26.032,0-47.134,12.467-47.134,53.248C177.868,212.995,198.969,236.836,225,236.836z"/>
                                            <path fill="#4F4F4F" d="M329.079,315.209L305.3,263.507c-1.087-2.365-2.998-4.327-5.375-5.523L263.02,239.44
                                                c-0.813-0.406-1.799-0.328-2.528,0.207c-10.439,7.619-22.712,11.647-35.489,11.647c-12.781,0-25.053-4.028-35.49-11.647
                                                c-0.734-0.535-1.72-0.613-2.533-0.207l-36.901,18.543c-2.379,1.196-4.288,3.156-5.377,5.523l-23.779,51.702
                                                c-1.64,3.563-1.304,7.644,0.899,10.912c2.201,3.271,5.927,5.22,9.967,5.22h186.425c4.041,0,7.771-1.951,9.971-5.22
                                                C330.384,322.852,330.72,318.772,329.079,315.209z"/>
                                        </g>
                                    </g>
                                    <g display="none">
                                        <g display="inline">
                                            <path fill="#4F4F4F" d="M446.609,20.572c6.898,0,12.494-6.472,12.494-14.456c0-11.071-5.596-14.457-12.494-14.457
                                                c-6.903,0-12.5,3.386-12.5,14.457C434.111,14.102,439.706,20.572,446.609,20.572z"/>
                                            <path fill="#4F4F4F" d="M474.207,41.852l-6.306-14.038c-0.289-0.642-0.798-1.174-1.427-1.5l-9.786-5.034
                                                c-0.217-0.11-0.478-0.089-0.672,0.057c-2.768,2.068-6.021,3.163-9.407,3.163c-3.392,0-6.646-1.095-9.411-3.163
                                                c-0.194-0.146-0.456-0.167-0.671-0.057l-9.785,5.034c-0.633,0.325-1.14,0.857-1.426,1.5l-6.307,14.038
                                                c-0.435,0.968-0.346,2.075,0.238,2.962c0.582,0.888,1.57,1.417,2.642,1.417h49.435c1.07,0,2.061-0.53,2.643-1.417
                                                C474.553,43.927,474.642,42.819,474.207,41.852z"/>
                                        </g>
                                    </g>
                                    <g display="none">
                                        <g display="inline">
                                            <path fill="#4F4F4F" d="M294.986,20.799c6.904,0,12.498-6.473,12.498-14.456c0-11.073-5.594-14.458-12.498-14.458
                                                c-6.899,0-12.496,3.385-12.496,14.458C282.49,14.326,288.087,20.799,294.986,20.799z"/>
                                            <path fill="#4F4F4F" d="M322.585,42.076l-6.306-14.036c-0.287-0.643-0.795-1.176-1.426-1.5l-9.785-5.034
                                                c-0.217-0.11-0.478-0.089-0.67,0.057c-2.77,2.069-6.022,3.162-9.412,3.162c-3.389,0-6.641-1.093-9.408-3.162
                                                c-0.196-0.146-0.457-0.167-0.674-0.057l-9.782,5.034c-0.631,0.324-1.138,0.856-1.427,1.5l-6.307,14.036
                                                c-0.436,0.969-0.347,2.076,0.239,2.964c0.582,0.888,1.57,1.417,2.644,1.417h49.433c1.071,0,2.062-0.53,2.644-1.417
                                                C322.932,44.152,323.02,43.045,322.585,42.076z"/>
                                        </g>
                                    </g>
                                    <g display="none">
                                        <g display="inline">
                                            <path fill="#4F4F4F" d="M150.436,20.572c6.903,0,12.498-6.472,12.498-14.456c0-11.071-5.595-14.457-12.498-14.457
                                                c-6.902,0-12.498,3.386-12.498,14.457C137.938,14.102,143.533,20.572,150.436,20.572z"/>
                                            <path fill="#4F4F4F" d="M178.034,41.852l-6.306-14.038c-0.289-0.642-0.795-1.174-1.426-1.5l-9.785-5.034
                                                c-0.217-0.11-0.478-0.089-0.672,0.057c-2.768,2.068-6.021,3.163-9.411,3.163c-3.388,0-6.643-1.095-9.41-3.163
                                                c-0.195-0.146-0.456-0.167-0.672-0.057l-9.785,5.034c-0.631,0.325-1.137,0.857-1.426,1.5l-6.306,14.038
                                                c-0.435,0.968-0.345,2.075,0.239,2.962c0.583,0.888,1.571,1.417,2.643,1.417h49.433c1.072,0,2.061-0.53,2.644-1.417
                                                C178.379,43.927,178.469,42.819,178.034,41.852z"/>
                                        </g>
                                    </g>
                                    <g display="none">
                                        <g display="inline">
                                            <path fill="#4F4F4F" d="M7.023,20.572c6.902,0,12.497-6.472,12.497-14.456c0-11.071-5.595-14.457-12.497-14.457
                                                S-5.475-4.955-5.475,6.116C-5.474,14.102,0.122,20.572,7.023,20.572z"/>
                                            <path fill="#4F4F4F" d="M34.621,41.852l-6.305-14.038c-0.288-0.642-0.795-1.174-1.425-1.5l-9.786-5.034
                                                c-0.215-0.11-0.476-0.089-0.67,0.057c-2.768,2.068-6.022,3.163-9.411,3.163s-6.643-1.095-9.41-3.163
                                                c-0.195-0.146-0.456-0.167-0.671-0.057l-9.785,5.034c-0.631,0.325-1.137,0.857-1.426,1.5l-6.306,14.038
                                                c-0.435,0.968-0.346,2.075,0.239,2.962c0.583,0.888,1.571,1.417,2.643,1.417H31.74c1.072,0,2.061-0.53,2.644-1.417
                                                S35.056,42.819,34.621,41.852z"/>
                                        </g>
                                    </g>
                                </g>
                                </svg>
                                <span>Gallery View</span> 
                        </React.Fragment> :
                        <React.Fragment>
                            <svg version="1.1" id="Capa_1" xmlns="http://www.w3.org/2000/svg" 
                            x="0px" y="0px"
                                width="591px" height="349px" viewBox="0 0 591 349" enableBackground="new 0 0 591 349" >
                            <g>
                                <rect x="9.648" y="10.894" fill="#F9F9F9" width="442.753" height="328.106"/>
                                <g>
                                    <g>
                                        <path fill="#DDDDDD" d="M230.79,217.52c33.459,0,60.583-30.645,60.583-68.444c0-52.422-27.124-68.447-60.583-68.447
                                            c-33.463,0-60.587,16.025-60.587,68.447C170.205,186.875,197.328,217.52,230.79,217.52z"/>
                                        <path fill="#DDDDDD" d="M364.577,318.264l-30.566-66.459c-1.397-3.041-3.854-5.563-6.909-7.102l-47.439-23.835
                                            c-1.046-0.522-2.312-0.421-3.251,0.266c-13.419,9.794-29.193,14.974-45.619,14.974c-16.431,0-32.204-5.18-45.622-14.974
                                            c-0.94-0.687-2.209-0.788-3.255-0.266l-47.435,23.835c-3.059,1.539-5.512,4.059-6.911,7.102l-30.566,66.459
                                            c-2.107,4.582-1.676,9.825,1.155,14.026c2.83,4.204,7.619,6.71,12.813,6.71h239.636c5.194,0,9.987-2.509,12.816-6.71
                                            C366.255,328.088,366.686,322.844,364.577,318.264z"/>
                                    </g>
                                </g>
                                <g>
                                    <rect x="462.703" y="10" fill="#F9F9F9" width="118.226" height="74.204"/>
                                    <g>
                                        <g>
                                            <path fill="#DDDDDD" d="M524.256,60.226c6.421,0,11.628-6.023,11.628-13.454c0-10.304-5.207-13.455-11.628-13.455
                                                c-6.425,0-11.633,3.15-11.633,13.455C512.624,54.204,517.831,60.226,524.256,60.226z"/>
                                            <path fill="#DDDDDD" d="M549.94,80.03l-5.868-13.064c-0.271-0.598-0.742-1.094-1.327-1.396l-9.108-4.685
                                                c-0.201-0.103-0.443-0.083-0.625,0.052c-2.574,1.926-5.603,2.944-8.756,2.944c-3.155,0-6.185-1.019-8.759-2.944
                                                c-0.18-0.134-0.424-0.155-0.624-0.052l-9.107,4.685c-0.587,0.302-1.059,0.797-1.325,1.396l-5.869,13.064
                                                c-0.404,0.901-0.321,1.931,0.222,2.757c0.542,0.826,1.462,1.318,2.459,1.318h46.007c0.997,0,1.917-0.494,2.459-1.318
                                                C550.263,81.961,550.345,80.931,549.94,80.03z"/>
                                        </g>
                                    </g>
                                </g>
                                <g>
                                    <rect x="463.126" y="94.932" fill="#F9F9F9" width="118.226" height="74.204"/>
                                    <g>
                                        <g>
                                            <path fill="#DDDDDD" d="M520.123,146.301c6.173,0,11.174-5.786,11.174-12.924c0-9.899-5.001-12.926-11.174-12.926
                                                c-6.168,0-11.172,3.026-11.172,12.926C508.951,140.515,513.955,146.301,520.123,146.301z"/>
                                            <path fill="#DDDDDD" d="M544.797,165.324l-5.638-12.549c-0.257-0.574-0.71-1.051-1.274-1.341l-8.747-4.501
                                                c-0.193-0.098-0.427-0.079-0.601,0.051c-2.475,1.85-5.384,2.827-8.414,2.827c-3.029,0-5.938-0.977-8.411-2.827
                                                c-0.176-0.13-0.409-0.149-0.603-0.051l-8.745,4.501c-0.564,0.29-1.019,0.766-1.276,1.341l-5.638,12.549
                                                c-0.39,0.865-0.311,1.855,0.215,2.648c0.521,0.793,1.403,1.268,2.362,1.268h44.192c0.959,0,1.843-0.475,2.363-1.268
                                                C545.105,167.18,545.186,166.189,544.797,165.324z"/>
                                        </g>
                                    </g>
                                </g>
                                <g>
                                    <rect x="462.574" y="179.864" fill="#F9F9F9" width="118.226" height="74.204"/>
                                    <g>
                                        <g>
                                            <path fill="#DDDDDD" d="M520.524,231.031c6.172,0,11.174-5.787,11.174-12.926c0-9.897-5.002-12.924-11.174-12.924
                                                c-6.171,0-11.174,3.025-11.174,12.924C509.352,225.245,514.354,231.031,520.524,231.031z"/>
                                            <path fill="#DDDDDD" d="M545.198,250.055l-5.639-12.551c-0.258-0.572-0.71-1.049-1.273-1.341l-8.748-4.5
                                                c-0.193-0.101-0.427-0.08-0.601,0.05c-2.476,1.852-5.384,2.828-8.413,2.828s-5.939-0.979-8.413-2.828
                                                c-0.174-0.13-0.408-0.148-0.602-0.05l-8.748,4.5c-0.563,0.291-1.017,0.767-1.273,1.341l-5.64,12.551
                                                c-0.389,0.865-0.308,1.855,0.214,2.647c0.521,0.795,1.405,1.268,2.363,1.268h44.193c0.959,0,1.843-0.475,2.363-1.268
                                                C545.507,251.91,545.587,250.92,545.198,250.055z"/>
                                        </g>
                                    </g>
                                </g>
                                <g>
                                    <rect x="462.918" y="263.902" fill="#F9F9F9" width="118.226" height="74.204"/>
                                    <g>
                                        <g>
                                            <path fill="#DDDDDD" d="M522.838,315.069c6.17,0,11.172-5.787,11.172-12.926c0-9.897-5.002-12.925-11.172-12.925
                                                c-6.171,0-11.173,3.026-11.173,12.925C511.665,309.283,516.668,315.069,522.838,315.069z"/>
                                            <path fill="#DDDDDD" d="M547.511,334.093l-5.636-12.551c-0.259-0.573-0.711-1.049-1.275-1.341l-8.748-4.5
                                                c-0.19-0.101-0.426-0.08-0.599,0.05c-2.476,1.851-5.384,2.828-8.415,2.828c-3.029,0-5.938-0.979-8.412-2.828
                                                c-0.174-0.13-0.406-0.149-0.6-0.05l-8.748,4.5c-0.563,0.291-1.016,0.767-1.274,1.341l-5.639,12.551
                                                c-0.389,0.865-0.309,1.854,0.214,2.647c0.521,0.795,1.405,1.268,2.363,1.268h44.193c0.959,0,1.842-0.475,2.362-1.268
                                                C547.819,335.947,547.9,334.958,547.511,334.093z"/>
                                        </g>
                                    </g>
                                </g>
                            </g>
                            </svg>

                            <span>Speaker View</span> 
                        </React.Fragment> 


                       
                       
                    
                    
                    } 
                    </div>
                </div>
            </div>
        );
    }
}

/**
 * Maps (parts of) the Redux state to the associated
 * {@code Subject}'s props.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {{
 *     _subject: string,
 *     _visible: boolean
 * }}
 */
function _mapStateToProps(state) {
    const participantCount = getParticipantCount(state);

    return {
        _showParticipantCount: participantCount > 1,
        _subject: getConferenceName(state),
        _visible: isToolboxVisible(state),
        _tileViewEnabled: state['features/video-layout'].tileViewEnabled,
    };
}

export default connect(_mapStateToProps)(Subject);
