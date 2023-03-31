class Timeline {
    Keyframes;
    SceneNodes;
    Layers;
    duration;
    iterations;
    easing;
    animationOptions;
    constructor(artboards, OPTIONS) {
        let _self = this;
        this.Keyframes = artboards.map(artboard => new Keyframe(artboard));

        this.SceneNodes = (() => {
            let arr = [];
            this.Keyframes.forEach(keyframe => {
                keyframe.ChildNodeList.forEach(node => {
                    node.parentKeyframe = this.Keyframes.indexOf(keyframe);
                    arr.push(node);
                })
            })
            return arr;
        })();
        //return Unique nodes as Layers;
        this.Layers = [...new Set(this.SceneNodes.map(item => item.id))].map(nodeid => new Layer(nodeid, _self))
        let iterations  = OPTIONS.iterations > 0 ? OPTIONS.iterations : 'infinite';
        this.animationOptions = `${OPTIONS.duration}s ${OPTIONS.easing} 0s ${iterations} ${OPTIONS.direction};` 

    }
    css() {

        let cssString = ``;

        this.Layers.forEach(layer => {
            cssString += layer.css;
        });
        this.Layers.forEach(layer => {
            cssString += `#${layer.id} {animation: keyframes-${layer.id} ${this.animationOptions} }`
        })

        return cssString;
    }
    svg() {
        let firstFrame = this.Keyframes[0];
        let cssCode = this.css();
 
        let svgstring = ``;
      

        svgstring += `<svg width="${firstFrame.width}" height="${firstFrame.height}" viewBox="0 0 ${firstFrame.width} ${firstFrame.height}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">`
        svgstring += `
            <defs>
                <style>
                ${cssCode}
                </style>
            </defs>`;

            console.log("GETTING SVG");

        firstFrame.ChildNodeList.forEach(node => {
            svgstring += `<path id="${node.id}"`
            if (node.rawPath) svgstring += ` d="${node.rawPath}"`
            svgstring += ` fill="${node.fill}"` 
            svgstring += ` transform="translate(${node.translation.x} ${node.translation.y})"`
            svgstring += `/>`
        })

        svgstring += `</svg>`;
        return svgstring;

    }

}
class Keyframe {
    id;
    ChildNodeList;
    width;
    height;
    fill;
    constructor(artboard) {
        this.id = artboard.name.split(' ').join('_');

        this.ChildNodeList = this.flatten(artboard).map(node => new ChildNode(node))
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
class Layer {
    KeyframeNodes;
    id;
    css = ``;
    constructor(layerID, timeline) {

        this.id = layerID;

        this.KeyframeNodes = timeline.SceneNodes.filter(scenenode => scenenode.id == layerID);
        let keyframeCount = (timeline.Keyframes.length);
        let keyframeStep = 100 / (keyframeCount - 1);

        function cssKeyframes(keyframeContent) { 
            return `@keyframes keyframes-${layerID}{
                        ${keyframeContent}
                    }`
        }
        function cssKeyframesStep(index, content) {

            return `${index * keyframeStep}%{
                ${content}
            }`
        }
        function cssKeyframesRule(property, value) {
            return `${property}:${value};`
        }

        var stepset = ``;
        var lastmatch;
        for (var i = 0; i < keyframeCount; i++) {

            let match = this.KeyframeNodes.find(node => node.parentKeyframe == i);
            lastmatch = match;
            if (match) {
                var ruleset = ``;
                for (const [key, value] of Object.entries(match.cssRules)) {
                    let rule = cssKeyframesRule(key, value);
                    ruleset += rule;
                }
                stepset += cssKeyframesStep(i, ruleset);
            }
            else {
                stepset += cssKeyframesStep(i, ruleset);
            }
            
        }
        
        this.css += cssKeyframes(stepset).replace(':undefined', '');


    }
}
class ChildNode {
    //represents single node as a child;
    cssRules;
    constructor(node /* XD Layer */) {
        this.id = node.name.split(' ').join('_'); 
        this.rawPath = node.pathData; 
        this.translation = node.translation; 
        this.rotation = node.rotation;
        this.fill = node.fillEnabled ? node.fill.toRgba() : false;
        this.stroke = node.strokeEnabled ? node.stroke.toRgba(): false;
        this.opacity = node.opacity;
         
        this.cssRules = {
            d:`path("${node.pathData}")` || false,
            transform:`translate(${node.translation.x}px,${node.translation.y}px) rotate(${this.rotation}deg)`,
            fill:`rgba(${this.fill.r},${this.fill.g},${this.fill.b},${this.fill.a/100})`,
            stroke:`rgba(${this.stroke.r},${this.stroke.g},${this.stroke.b},${this.stroke.a/100})`,
            opacity: this.opacity
          
        }
    }
    
}
module.exports = {
    Timeline,
    Keyframe,
    Node
};