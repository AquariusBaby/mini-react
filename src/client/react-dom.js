

let nextUnitOfWork = null;
let wipRoot = null;
let currentRoot = null;

let wipFiber = null;
let hookIndex = null;

let deletions = null; // 要删除的项的数组

/**
 * 
 * @param {Object} element 
 * @param {Element} container 
 */
function render(element, container) {
    wipRoot = {
        dom: container,
        props: {
            children: [element]
        },
        alternate: currentRoot,
    }
    deletions = [];

    nextUnitOfWork = wipRoot;
}

function _createNode(fiber) {
    let node = null;
    let { type, props } = fiber;

    if (type === 'TEXT_ELEMENT' ) {
        node = document.createTextNode(props.nodeValue);
    } else {
        node = document.createElement(type);
        _updateNode(node, {}, props);
    }

    // container.appendChild(node);
    return node;
}

const isProperty = key => key !== 'children' && !isEvent(key);
const isNew = (prev, next) => key => prev[key] !== next[key];
const isGone = (prev, next) => key => !(key in next);
const isEvent = key => key.startsWith('on');

function _updateNode(node, prevProps, nextProps) {
    // remove old event or change event listeners
    Object.keys(prevProps)
        .filter(isEvent)
        .filter(
            key => !(key in nextProps) || isNew(prevProps, nextProps)(key)
        )
        .forEach(key => {
            const eventType = key.toLocaleLowerCase().substring(2);
            node.removeEventListener(eventType, prevProps[key]);
        })
    
    // add new event listeners
    Object.keys(nextProps)
        .filter(isEvent)
        .filter(isNew(prevProps, nextProps))
        .forEach(
            key => {
                const eventType = key.toLocaleLowerCase().substring(2);
                node.addEventListener(eventType, nextProps[key]);
            }
        )

    // remove old properties
    Object.keys(prevProps)
        .filter(isProperty)
        .filter(isGone(prevProps, nextProps))
        .forEach(key => {
            node[key] = ''
        })

    // set new properties or change properties
    Object.keys(nextProps)
        .filter(isProperty)
        .filter(isNew(prevProps, nextProps))
        .forEach(key => {
            node[key] = nextProps[key];
        });
    // nextProps.children.forEach(child => _createNode(child, node));
}

requestIdleCallback(workLoop);

function workLoop(deadline) {
    let shouldYield = false;
    // 循环任务
    while(nextUnitOfWork && !shouldYield) {
        nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
        shouldYield = deadline.timeRemaining() < 1;
    }

    // 提交任务
    if (!nextUnitOfWork && wipRoot) {
        commitRoot();
    }

    requestIdleCallback(workLoop);
}

// 执行任务，并返回下一个任务
function performUnitOfWork(fiber) {
    const isFunctionComponent = fiber.type instanceof Function;

    if (isFunctionComponent) {
        _updateFunctionComponent(fiber);
    } else {
        _updateHostComponent(fiber);
    }

    // add dom node
    // if (!fiber.dom) {
    //     fiber.dom = _createNode(fiber);
    // }

    // create new fibers
    // const elements = fiber.props.children;

    // reconcileChildren(fiber, elements);

    // return next unit of work
    if (fiber.child) {
        return fiber.child;
    }
    let nextFiber = fiber;
    while(nextFiber) {
        if (nextFiber.sibling) {
            return nextFiber.sibling;
        }
        nextFiber = nextFiber.parent;
    }
}

function reconcileChildren(fiber, elements) {
    let index = 0;
    let oldFiber = fiber.alternate && fiber.alternate.child;

    let prevSibling = null;

    while(index < elements.length || oldFiber != null) {
        const element = elements[index];
        let newFiber = null;

        // compare oldFiber and newFiber
        const isSameType = oldFiber && element && element.type === oldFiber.type;

        if (isSameType) { // 相同的type ===》 update
            newFiber = {
                type: oldFiber.type,
                props: element.props,
                parent: fiber,
                dom: oldFiber.dom,
                alternate: oldFiber,
                effectTag: "UPDATE"
            }
        }
        if (!isSameType && element) { // 不同的type，且有element ===》 add
            newFiber = {
                type: element.type,
                props: element.props,
                parent: fiber,
                dom: null,
                alternate: null,
                effectTag: "PLACEMENT"
            }
        }
        if (!isSameType && oldFiber) { // 不同的type，且有oldFiber ===》 delete
            oldFiber.effectTag = "DELETE";
            deletions.push(oldFiber);
        }

        if (index === 0) {
            fiber.child = newFiber;
        } else {
            prevSibling.sibling = newFiber
        }

        if (oldFiber) {
            oldFiber = oldFiber.sibling;
        }

        prevSibling = newFiber;
        index ++;
    }
}

function _updateHostComponent(fiber) {
    // add dom node
    if (!fiber.dom) {
        fiber.dom = _createNode(fiber);
    }

    // create new fibers
    const elements = fiber.props.children;
    reconcileChildren(fiber, elements);
}

function _updateFunctionComponent(fiber) {
    wipFiber = fiber;
    hookIndex = 0;
    wipFiber.hooks = [];

    const elements = [fiber.type(fiber.props)];
    reconcileChildren(fiber, elements);
}

function commitRoot() {
    deletions.forEach(commitWork); // 删除

    commitWork(wipRoot.child);
    currentRoot = wipRoot;
    wipRoot = null; // 置空wipRoot
}

// 递归wipRoot
function commitWork(fiber) {
    if (!fiber) {
        return;
    }
    // const domParent = fiber.parent.dom;
    let domParentFiber = fiber.parent;
    while(!domParentFiber.dom) {
        domParentFiber = domParentFiber.parent;
    }
    const domParent = domParentFiber.dom;

    if (fiber.effectTag === 'PLACEMENT' && fiber.dom != null) {
        domParent.appendChild(fiber.dom);
    }
    if (fiber.effectTag === 'DELETE') {
        // domParent.removeChild(fiber.dom);
        commitDeletion(fiber, domParent);
    }
    if (fiber.effectTag === 'UPDATE' && fiber.dom !== null) {
        _updateNode(fiber.dom, fiber.alternate.props, fiber.props);
    }

    commitWork(fiber.child);
    commitWork(fiber.sibling);
}

function commitDeletion(fiber, domParent) {
    if (fiber.dom) {
        domParent.removeChild(fiber.dom);
    } else {
        commitDeletion(fiber.child, domParent);
    }
}

export function useState(initial) {
    // return [val, setVal]
    const oldHook = wipFiber.alternate && wipFiber.alternate.hooks && wipFiber.alternate.hooks[hookIndex];
    const hook = {
        state: oldHook ? oldHook.state : initial,
        queue: []
    }

    const actions = oldHook ? oldHook.queue : [];
    actions.forEach(action => {
        action instanceof Function ?
            hook.state = action(hook.state) :
            hook.state = action
    })


    const setState = action => {
        hook.queue.push(action);
        wipRoot = {
            dom: currentRoot.dom,
            props: currentRoot.props,
            alternate: currentRoot
        }

        nextUnitOfWork = wipRoot;
        deletions = [];

        // requestIdleCallback(workLoop);
    }

    wipFiber.hooks.push(hook)
    hookIndex ++;
    return [hook.state, setState];
}

export default {
    render
}