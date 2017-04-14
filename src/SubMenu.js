import React, { Component, PropTypes } from 'react';
import cx from 'classnames';
import assign from 'object-assign';

import MenuItem from './MenuItem';
import { cssClasses, hasOwnProp } from './helpers';

export default class SubMenu extends Component {
    static propTypes = {
        children: PropTypes.node.isRequired,
        title: PropTypes.node.isRequired,
        className: PropTypes.string,
        disabled: PropTypes.bool,
        menuItem: PropTypes.shape(MenuItem.propTypes),
        hoverDelay: PropTypes.number,
        rtl: PropTypes.bool
    };

    static defaultProps = {
        disabled: false,
        menuItem: {},
        hoverDelay: 500,
        className: '',
        rtl: false
    };

    constructor(props) {
        super(props);

        this.state = {
            visible: false
        };

        this.menuHeight = null;
    }

    shouldComponentUpdate(nextProps, nextState) {
        return this.state.isVisible !== nextState.visible;
    }

    componentDidUpdate() {
        if (this.state.visible) {
            const wrapper = window.requestAnimationFrame || setTimeout;

            this.updatetimer = wrapper(() => {
                const styles = this.props.rtl
                                ? this.getRTLMenuPosition()
                                : this.getMenuPosition();

                this.subMenu.style.removeProperty('top');
                this.subMenu.style.removeProperty('bottom');
                this.subMenu.style.removeProperty('left');
                this.subMenu.style.removeProperty('right');

                if (hasOwnProp(styles, 'top')) this.subMenu.style.top = `${styles.top}px`;
                if (hasOwnProp(styles, 'left')) this.subMenu.style.left = styles.left;
                if (hasOwnProp(styles, 'bottom')) this.subMenu.style.bottom = `${styles.bottom}px`;
                if (hasOwnProp(styles, 'right')) this.subMenu.style.right = styles.right;
                this.subMenu.classList.add(cssClasses.menuVisible);
            });
        } else {
            this.subMenu.classList.remove(cssClasses.menuVisible);
            this.subMenu.style.removeProperty('bottom');
            this.subMenu.style.removeProperty('right');
            this.subMenu.style.top = 0;
            this.subMenu.style.left = '100%';
        }
    }

    componentWillUnmount() {
        if (this.updatetimer) {
            const clearFnc = window.cancelAnimationFrame || clearTimeout;
            clearFnc(this.updatetimer);
        }
        if (this.opentimer) {
            clearTimeout(this.opentimer);
        }
        if (this.closetimer) {
            clearTimeout(this.closetimer);
        }
    }

    getMenuPosition = () => {
        const { innerWidth, innerHeight } = window;
        const menuRect = this.menu.getBoundingClientRect();
        const subMenuRect = this.subMenu.getBoundingClientRect();
        const position = {};

        if (subMenuRect.bottom > innerHeight) {
            if (menuRect.bottom < subMenuRect.height) {
                const menuHeight = this.getMenuHeight() || menuRect.height;
                position.top = Math.floor(menuRect.top / menuHeight) * menuHeight * -1;
            } else {
                position.bottom = 0;
            }
        } else {
            position.top = 0;
        }

        if (subMenuRect.right < innerWidth) {
            position.left = '100%';
        } else {
            position.right = '100%';
        }

        return position;
    }

    getRTLMenuPosition = () => {
        const { innerHeight } = window;
        const menuRect = this.menu.getBoundingClientRect();
        const subMenuRect = this.subMenu.getBoundingClientRect();
        const position = {};

        if (subMenuRect.bottom > innerHeight) {
            if (menuRect.bottom < subMenuRect.height) {
                const menuHeight = this.getMenuHeight() || menuRect.height;
                position.top = Math.floor(menuRect.top / menuHeight) * menuHeight * -1;
            } else {
                position.bottom = 0;
            }
        } else {
            position.top = 0;
        }

        if (subMenuRect.left < 0) {
            position.left = '100%';
        } else {
            position.right = '100%';
        }

        return position;
    }

    getMenuHeight() {
        if (this.menuHeight === null) {
            const menuStyles = window.getComputedStyle(this.menu);
            const menuMargin = parseFloat(menuStyles.marginTop) + parseFloat(menuStyles.marginBottom);
            this.menuHeight = Math.ceil(this.menu.offsetHeight + menuMargin);
        }

        return this.menuHeight;
    }

    handleMouseEnter = () => {
        if (this.closetimer) clearTimeout(this.closetimer);

        if (this.props.disabled || this.state.visible) return;

        this.opentimer = setTimeout(() => this.setState({ visible: true }), this.props.hoverDelay);
    }

    handleMouseLeave = () => {
        if (this.opentimer) clearTimeout(this.opentimer);

        if (!this.state.visible) return;

        this.closetimer = setTimeout(() => this.setState({ visible: false }), this.props.hoverDelay);
    }

    menuRef = (c) => {
        this.menu = c;
    }

    subMenuRef = (c) => {
        this.subMenu = c;
    }

    render() {
        const { children, disabled, title, menuItem } = this.props;
        const { visible } = this.state;
        const menuProps = {
            ref: this.menuRef,
            onMouseEnter: this.handleMouseEnter,
            onMouseLeave: this.handleMouseLeave,
            className: cx(cssClasses.menuItem, cssClasses.subMenu),
            style: {
                position: 'relative'
            }
        };
        const menuItemProps = assign({ attributes: {} }, menuItem);
        menuItemProps.attributes.className = cx(menuItemProps.attributes.className, {
            [cssClasses.menuItemActive]: visible
        });
        menuItemProps.disabled = menuItemProps.disabled || disabled;
        const subMenuProps = {
            ref: this.subMenuRef,
            style: {
                position: 'absolute',
                top: 0,
                left: '100%'
            },
            className: cx(cssClasses.menu, this.props.className)
        };

        return (
            <nav {...menuProps} role='menuitem' tabIndex='-1' aria-haspopup='true'>
                <MenuItem {...menuItemProps}>
                    {title}
                </MenuItem>
                <nav {...subMenuProps} role='menu' tabIndex='-1'>
                    {children}
                </nav>
            </nav>
        );
    }
}
