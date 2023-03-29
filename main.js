const { selection } = require("scenegraph");
let clipboard = require("clipboard");
let panel;
let debug;
let keyframes;
let submitbutton;

class Debug {
    body;
    constructor(element) {
        this.body = element;
        this.body.className = 'debug';
        panel.appendChild(this.body);
    }
    clear() {
        this.body.innerHTML = '';
    }
    add(content) {
        let newparagraph = document.createElement('p');
        newparagraph.className = 'debug-paragraph';
        newparagraph.innerHTML = content;
        this.body.appendChild(newparagraph);
    }
}
class Keyframes {
    body;
    constructor(element) {
        this.body = element;
    }
    add(kf) {

        let frame = document.createElement('li');
        frame.innerHTML = kf;
        this.body.appendChild(frame);
    };
    clear() {
        this.body.innerHTML = '';
    }
}
function flattenArtboards(artboards) {
    let result = [];

    artboards.forEach(artboard => {

        let flattened = [];
        const traverse = (node) => {
            flattened.push(node);
            if (node.children) {
                node.children.forEach((child) => traverse(child));
            }
        };
        artboard.children.forEach((obj) => traverse(obj));

        result.push({
            keyframe: artboard,
            keyframeNodes: flattened
        })
    })
    return result;
}
function getCSS(keyframes) {

    const Color = require("scenegraph").Color;

    let cssRuleset = {
        from: [],
        to: []
    };
    let firstFrame = keyframes[0];

    function createCSSItem(node) {

        return {
            id: node.name,
            path: node.pathData || false,
            translateX: node.translation.x,
            translateY: node.translation.y,
            rotation: node.rotation,
            fill: node.fill.toHex()
        }
    }
    keyframes.forEach((keyframe, keyframeIndex) => {

        keyframe.keyframeNodes.forEach(node => {
            let prevKeyframe = keyframes[keyframeIndex - 1];
            if (keyframeIndex == 0) {
                cssRuleset.from.push(createCSSItem(node))
            }
            else {

                if (prevKeyframe.keyframeNodes.find(pkfn => pkfn.name == node.name)) {
                    cssRuleset.to.push(createCSSItem(node))
                }
            }
        });


    })
    let cssString = ``;
    cssRuleset.to.forEach(to => {
        let from = cssRuleset.from.find(from => from.id == to.id);
        cssString += `\u0040keyframes animation-${to.id}{
                from {
                    d:path("${from.path}");
                    fill:${from.fill};
                    transform:translate(${from.translateX}px, ${from.translateY}px);
                }
                to {
                    d:path("${to.path}");
                    fill:${to.fill};
                    transform:translate(${to.translateX}px, ${to.translateY}px);

                    
                }
            }
            #${to.id}{
                animation: 2s infinite alternate animation-${to.id};
            }
            `;

    })

    return cssString;
}
function SVGTemplate(firstFrame, cssCode) {

    let svgstring = ``;

    svgstring += `<svg width="${firstFrame.keyframe.width}" height="${firstFrame.keyframe.height}" viewBox="0 0 ${firstFrame.keyframe.width} ${firstFrame.keyframe.height}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">`
    svgstring += `
    <defs>
        <style>
        ${cssCode}
        </style>
    </defs>`;

    firstFrame.keyframeNodes.forEach(node => {
        svgstring += `<path id="${node.name}"`
        if (node.pathData) svgstring += ` d="${node.pathData}"`
        svgstring += ` transform="translate(${node.translation.x} ${node.translation.y})"`
        svgstring += `/>`
    })

    svgstring += `</svg>`;
    return svgstring;
}
function generateCode() {
    let string = ``
    let keyframes = flattenArtboards(selection.items);
    let cssCode = getCSS(keyframes).toString();

    clipboard.copyText(SVGTemplate(keyframes[0], cssCode));

}
function create() {
    const HTML =
        `<style> 
             label {
                color: #8E8E8E;  
                font-size: 9px;
                display:block;
            } 
            h1 {
                margin:1rem 0 .5rem 0;
            }
            label span {
                vertical-align:middle;
            }
            .show {
                display: block;
            }
            .hide {
                display: none;
            }
            .radio {
                vertical-align:middle;
            }
            .debug {
               
                font-family:Courier;
                padding:1rem;
            }
            .debug-paragraph {
                border:1px solid pink;
            }
            ul li {
                list-style:none;
                padding:0.5rem 1rem;
                margin-bottom:.5rem;
                background-color:#fefefe;
            }
        </style> 
        <form method="dialog" id="main">
                <label> 
                    <input class="radio" type="radio" name="exportType" uxp-quiet="true" id="smil" />
                    <span>Export SMIL animation</span>
                </label>
                <label> 
                    <input class="radio" type="radio" name="exportType" uxp-quiet="true" id="CSS" />
                    <span>Export CSS animation</span>
                </label>
                <h1> Please select at least two artboards   </h1>
                <ul id="artboard-list"></ul>
            <footer><button id="ok" type="submit" disabled uxp-variant="cta">Get</button></footer>
        </form>
        
        `


    panel = document.createElement("div");
    panel.innerHTML = HTML;
    panel.querySelector("form").addEventListener("submit", generateCode);
    submitbutton = panel.querySelector("#ok");
    keyframes = new Keyframes(panel.querySelector("#artboard-list"));
    debug = new Debug(document.createElement("div"));
    return panel;
}

function show(event) {
    if (!panel) event.node.appendChild(create());
}

function update() {
    const { Artboard } = require("scenegraph");
    let form = document.querySelector("form");
    let warning = document.querySelector("#warning");

    debug.clear();
    keyframes.clear();

    let artboardCount = selection.items.filter(item => item instanceof Artboard).length;

    submitbutton.disabled = artboardCount < 2;


    selection.items.forEach(selected => { 
        keyframes.add(selected.name);
    })

}

module.exports = {
    panels: {
        enlargeRectangle: {
            show,
            update
        }
    }
};
