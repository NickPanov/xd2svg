const { selection } = require("scenegraph");
const fs = require("uxp").storage.localFileSystem;
const { Timeline } = require("./xd2svg"); 
   
let clipboard = require("clipboard");
let panel;
let debug; 
let keyframes;
let submitbutton;
let warning;


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

    let cssRuleset = {
        from: [],
        to: []
    };

    function createCSSItem(node) {

        return {
            id: node.name,
            path: node.pathData || false,
            translateX: node.translation.x,
            translateY: node.translation.y,
            rotation: node.rotation,
            fill: node.fillEnabled ? node.fill.toRgba() : false,
            stroke: node.stroke.toRgba()
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
                    stroke:${from.stroke};`
        cssString += from.fill ? `fill:${from.fill};` : ``;
        cssString += `transform:translate(${from.translateX}px, ${from.translateY}px);
                }
                to {
                    d:path("${to.path}");
                    stroke:${to.stroke};`
        cssString += to.fill ? `fill:${to.fill};` : ``;
        cssString += `transform:translate(${to.translateX}px, ${to.translateY}px);

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
        if (node.fillEnabled) svgstring += ` fill="${node.fill.toRgba()}"`

        svgstring += ` transform="translate(${node.translation.x} ${node.translation.y})"`
        svgstring += `/>`
    })

    svgstring += `</svg>`;
    return svgstring;
}
async function generateCode() {

    //we have the global selection.items; 
     let timeline = new Timeline(selection.items);  

    let keyframes = flattenArtboards(selection.items);

    //keyframes.map(keyframe => new XD2SVG.Keyframe)

    let cssCode = getCSS(keyframes).toString();
    let SVGContent = SVGTemplate(keyframes[0], cssCode);

    clipboard.copyText(SVGContent);
    const svgfile = await fs.getFileForSaving("animation.svg");
    await svgfile.write(SVGContent);

}
async function getHtmlTemplate(template) {
    let pluginFolder = await fs.getPluginFolder();
    const entries = await pluginFolder.getEntries();
    const entry = entries.find(entry => entry.name === `${template}.html`);
    let html = await entry.read()
    return html
}
async function create() {

    let HTML = await getHtmlTemplate('panel');
    panel = document.createElement("div");
    panel.innerHTML = HTML;
    panel.querySelector("form").addEventListener("submit", generateCode);
    warning = panel.querySelector(".alert-warning");
    submitbutton = panel.querySelector("#ok");
    keyframes = new Keyframes(panel.querySelector("#artboard-list"));
    debug = new Debug(document.createElement("div"));
    return panel;
}

async function show(event) {
    if (!panel) event.node.appendChild(await create());
}

function update() {
    const { Artboard } = require("scenegraph"); 
     
    debug.clear();
    keyframes.clear();

    let artboardCount = selection.items.filter(item => item instanceof Artboard).length;
    if (artboardCount < 2) {
        warning.classList.remove('hide')
        warning.classList.add('show')
        submitbutton.disabled = true
    }
    else { 
        warning.classList.remove('show')
        warning.classList.add('hide')
        submitbutton.disabled = false
    }



    selection.items.forEach(selected => {
        keyframes.add(selected.name);
    })

}

module.exports = {
    panels: {
        animatedSVG: {
            show,
            update
        }
    }
};
