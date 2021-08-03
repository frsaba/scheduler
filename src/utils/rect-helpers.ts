function getCenter(element: Element | DOMRect) {
    // if(!element) return new DOMRect(0,0)
    if (element instanceof Element) element = element.getBoundingClientRect()
    const { x, y, width, height } = element
    return new DOMRect(x + width / 2, y + height / 2)
}

function getDistance(a: Element | DOMRect, b: Element | DOMRect) {
    a = getCenter(a)
    b = getCenter(b)

    return Math.hypot(a.x - b.x, a.y - b.y);
}

export {
    getCenter,
    getDistance
}