/* eslint-disable no-useless-constructor */
class Component {
    static isReactComponent = {}
    constructor(props, context, updater) {
        this.props = props;
        this.context = context;
        this.updater = updater;
        this.refs = {}
    }

    /**
     * 
     * @param {Object | Function} params 
     * @param {Function} callback 
     */
    setState(params, callback) {
        // TODO
    }

    forceUpdate(callback) {
        // TODO
    }
}

function createElement(type, props, ...children) {
    if (props) {
        delete props.__self;
        delete props.__source;
    }

    let defaultProps = {};
    if (type && type.defaultProps) {
        defaultProps = type.defaultProps;
    }

    return {
        type,
        props: {
            ...defaultProps,
            ...props,
            children: children.map(child => {
                return typeof child === 'object' ? 
                    child :
                    _createTextElement(child)
            })
        }
    }
}

function _createTextElement(text) {
    return {
        type: "TEXT_ELEMENT",
        props: {
            // nodeText: text,
            nodeValue: text,
            children: []
        }
    }
}

export default {
    Component,
    createElement
}