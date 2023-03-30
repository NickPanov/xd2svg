class Timeline {
    Keyframes;
    duration;
    iterations;
    easing;
    constructor(artboards, options) {
        this.Keyframes = artboards.map(artboard => new Keyframe(artboard));
        
    }
    css(){

    }
    svg(){

    }

}
class Keyframe {
    NodeList;
    width;
    height;
    fill;
    constructor(artboard) {
        this.NodeList = this.flatten(artboard).map(node => new Node(node))
    }
    flatten(artboard) {
        let flattened = [];
        const traverse = (node) => {
            flattened.push(node);
            if (node.children) {
                node.children.forEach((child) => traverse(child));
            }
        };
        artboard.children.forEach((obj) => traverse(obj));
        return flattened;
    }
}

class Node {
    constructor(node) {
        this.id = node.name;
        this.path = node.pathData || false;
        this.translateX = node.translation.x;
        this.translateY = node.translation.y;
        this.rotation = node.rotation;
        this.fill = node.fillEnabled ? node.fill.toRgba() : false;
        this.stroke = node.stroke.toRgba();
    }
}
module.exports = {
    Timeline,
    Keyframe,
    Node
};