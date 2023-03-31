const { selection } = require("scenegraph");
const fs = require("uxp").storage.localFileSystem;
const { Timeline } = require("./xd2svg");

let clipboard = require("clipboard");
let panel; 
let keyframes;
let submitbutton;
let warning;
let animationOptions = {};
 
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
 



async function generateCode() {

    animationOptions.duration = panel.querySelector('#duration').value;
    animationOptions.interations = panel.querySelector('#iterations').value;
    animationOptions.direction = panel.querySelector('#direction').value; 
    animationOptions.easing = panel.querySelector('#easing').value;
    //we have the global selection.items; 
    let timeline = new Timeline(selection.items,animationOptions);

    let SVGContent = timeline.svg();

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

   
       
    return panel; 
}

async function show(event) {
    if (!panel) event.node.appendChild(await create());
}

function update() {
    const { Artboard } = require("scenegraph");
 
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
