import React, { Component } from 'react';
import PropTypes from 'prop-types';
import cx from 'classnames';
import assign from 'object-assign';

import listener from './globalEventListener';
import { hideMenu } from './actions';
import { cssClasses, callIfExists, store } from './helpers';

export default class ContextMenu extends Component {
    static propTypes = {
        id: PropTypes.string.isRequired,
        children: PropTypes.node.isRequired,
        data: PropTypes.object,
        className: PropTypes.string,
        hideOnLeave: PropTypes.bool,
        hideOnScroll: PropTypes.bool,
        onHide: PropTypes.func,
        onMouseLeave: PropTypes.func,
        onShow: PropTypes.func
    };

    static defaultProps = {
        className: '',
        data: {},
        hideOnLeave: false,
        hideOnScroll: true,
        onHide() { return null; },
        onMouseLeave() { return null; },
        onShow() { return null; }
    };

    constructor(props) {
        super(props);

        this.state = {
            x: 0,
            y: 0,
            isVisible: false
        };

        this.isVisibilityChange = false;
    }

    componentDidMount() {
        this.listenId = listener.register(this.handleShow, this.handleHide);
    }

    shouldComponentUpdate(nextProps, nextState) {
        this.isVisibilityChange = this.state.isVisible !== nextState.isVisible;
        return true;
    }

    componentDidUpdate() {
        if (!this.isVisibilityChange) return;
        if (this.state.isVisible) {
            const wrapper = window.requestAnimationFrame || setTimeout;

            wrapper(() => {
                this.menu.style.removeProperty('display');

                const { x, y } = this.state;
                const { top, left } = this.getMenuPosition(x, y);

                wrapper(() => {
                    this.menu.style.top = `${top}px`;
                    this.menu.style.left = `${left}px`;
                    this.menu.classList.add(cssClasses.menuVisible);
                });
            });
        } else {
            this.menu.classList.remove(cssClasses.menuVisible);
            this.menu.style.top = 0;
            this.menu.style.left = 0;
            this.menu.style.display = 'none';
        }
    }

    componentWillUnmount() {
        if (this.listenId) {
            listener.unregister(this.listenId);
        }

        this.unregisterHandlers();
    }

    registerHandlers = () => { // eslint-disable-line react/sort-comp
        document.addEventListener('mousedown', this.handleOutsideClick);
        document.addEventListener('ontouchstart', this.handleOutsideClick);
        document.addEventListener('contextmenu', this.handleHide);
        document.addEventListener('keyup', this.handleEscape);
        if (this.props.hideOnScroll) {
            document.addEventListener('scroll', this.handleHide);
        }
        window.addEventListener('resize', this.handleHide);
    }

    unregisterHandlers = () => {
        document.removeEventListener('mousedown', this.handleOutsideClick);
        document.removeEventListener('ontouchstart', this.handleOutsideClick);
        document.removeEventListener('contextmenu', this.handleHide);
        document.removeEventListener('keyup', this.handleEscape);
        if (this.props.hideOnScroll) {
            document.removeEventListener('scroll', this.handleHide);
        }
        window.removeEventListener('resize', this.handleHide);
    }

    handleShow = (e) => {
        if (e.detail.id !== this.props.id || this.state.isVisible) return;

        const { x, y } = e.detail.position;

        this.setState({ isVisible: true, x, y });
        this.registerHandlers();
        callIfExists(this.props.onShow, e);
    }

    handleHide = (e) => {
        if (this.state.isVisible && (!e.detail || !e.detail.id || e.detail.id === this.props.id)) {
            this.unregisterHandlers();
            this.setState({ isVisible: false });
            callIfExists(this.props.onHide, e);
        }
    }

    handleEscape = (e) => {
        if (e.keyCode === 27) {
            hideMenu();
        }
    }

    handleOutsideClick = (e) => {
        if (!this.menu.contains(e.target)) hideMenu();
    }

    handleMouseLeave = (event) => {
        event.preventDefault();

        callIfExists(
            this.props.onMouseLeave,
            event,
            assign({}, this.props.data, store.data),
            store.target
        );

        if (this.props.hideOnLeave) hideMenu();
    }

    getMenuPosition = (x = 0, y = 0) => {
        const { innerWidth, innerHeight } = window;
        const rect = this.menu.getBoundingClientRect();
        const menuPos = { x, y };

        if (y + rect.height > innerHeight) {
            menuPos.y -= rect.height;
        }

        if (x + rect.width > innerWidth) {
            menuPos.x -= rect.width;
        }

        if (menuPos.y < 0) {
            menuPos.y = rect.height < innerHeight ? (innerHeight - rect.height) / 2 : 0;
        }

        if (menuPos.x < 0) {
            menuPos.x = rect.width < innerWidth ? (innerWidth - rect.width) / 2 : 0;
        }

        const menuStyle = {
            top: menuPos.y - rect.top,
            left: menuPos.x - rect.left
        };

        return menuStyle;
    }

    menuRef = (c) => {
        this.menu = c;
    }

    render() {
        const { children, className } = this.props;
        const style = { display: 'none' };
        const menuClassnames = cx(cssClasses.menu, cssClasses.menuRoot, className);
        const wrapperStyle = { position: 'relative' };

        return (
            <div style={wrapperStyle}>
                <nav
                    role='menu' tabIndex='-1' ref={this.menuRef} style={style} className={menuClassnames}
                    onContextMenu={this.handleHide} onMouseLeave={this.handleMouseLeave}>
                    {children}
                </nav>
            </div>
        );
    }
}
