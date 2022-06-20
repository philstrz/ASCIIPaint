window.addEventListener("load", setup);
window.addEventListener("keypress", function(event) {
    press(event.key);
    return false;
})
window.addEventListener("keydown", function(event) {
    down(event.key);
    return false;
})
window.addEventListener("wheel", function(event) {
    scroll(event);
    return false;
})
window.addEventListener("mouseup", mouseUp);

// Adjusting the 'canvas' element
var canvas = null;
var scale = 100;
let width = 72;
let height = 24;
let grid = false;
let gridlock = false;
let gridstyle = '1px dashed';

// Properties for tracking interaction
let mode = null;
let mouse_down = false;
let char = 'X';
let button = 'pencil';

// Colors
let color = "#000000";
let bgcolor = "#ffffff"
let gridcolor = "#000000";

// Keep track of current and previous states
let states = [];
let widths = [];
let heights = [];
let state_idx = 0;
let state_lim = 0;

// Store last target to reduce unnecessary processing
let last_target = null;

// Line weight settings
let square_size = 0;
let eraser_size = 0;
let circle_size = 0;

// Called reset
function restart() {
    if(confirm("This will clear the canvas. Are you sure?")) {
        reset();
    }
}

// Does not include some initial setup, called by setup
function reset() {
    // Store current option
    if (mode) button = mode;

    // Redraw the canvas
    let html = '';
    for (let i = 0; i < height; i++) {
        for (let j = 0; j < width; j++) {
            html += '<span class="pixel" style="display:inline"';
            html += 'id="x' + j + 'y' + i + '">';
            html += '&nbsp';
            html += '</span>';
        }
        html += '<br>';
    }
    canvas.innerHTML = html;

    regrid();

    // Reset undo/redo
    state_idx = 0;
    state_lim = 0;
    states[state_idx] = canvas.innerHTML;
    widths[state_idx] = width;
    heights[state_idx] = height;
}

function nextState() {
    state_idx += 1;
    state_lim = state_idx;
    states[state_idx] = canvas.innerHTML;
    widths[state_idx] = width;
    heights[state_idx] = height;
}

// Initial setup
function setup() {
    canvas = document.getElementById("canvas");

    reset();

    canvas.addEventListener('mousedown', mouseDown);
    canvas.addEventListener('mousemove', mouseMove);
    // canvas.addEventListener('mouseleave', mouseUp);

    // Set starting widths of relevant elements
    let sizes = ['square-size', 'eraser-size', 'circle-size'];
    for (let size of sizes){
        updateSlider(size);
    }

    // Start with pencil selected
    buttonClick(button);

    setBGColor(bgcolor);

    // scaleCanvas(0.8);
    fitCanvas();
}

// Handle keyboard input
function press(key) {
    switch (key) {
        case "ArrowUp":
            scaleCanvas(1.1);
            break;
        case "ArrowDown":
            scaleCanvas(0.9);
            break;
        default:
            setChar(key);
    }
}

function down(key) {
    switch (key) {
        case "ArrowUp":
            scaleCanvas(1.1);
            break;
        case "ArrowDown":
            scaleCanvas(0.9);
            break;
        case "ArrowLeft":
            scaleCanvas(0.9);
            break;
        case "ArrowRight":
            scaleCanvas(1.1);
            break;
    }
}

// Handle mousewheel input
function scroll(event) {
    if (event.deltaY < 0) {
        scaleCanvas(1.05);
    } else {
        scaleCanvas(0.95);
    }
}

// Change width based on input
function setWidth (value) {
    value = parseInt(value);
    if (value != value) return;
    if (value <= 0) return;
    width = value;
    if (width > 120) lockGrid();
    else if (gridlock && height <= 40) lockGrid(false);
    resize();
}

// Change height based on input
function setHeight (value) {
    value = parseInt(value);
    if (value != value) return;
    if (value <= 0) return;
    height = value;
    if (height > 40) lockGrid();
    else if (gridlock && width <= 120) lockGrid(false);
    resize();
}

function resize() {
    let html = '';
    let id = null;
    let was = null;
    for (let i = 0; i < height; i++) {
        for (let j = 0; j < width; j++) {
            id = 'x' + j + 'y' + i;
            was = document.getElementById(id);
            if (was) {
                html += was.outerHTML;
            } else {
                html += '<span class="pixel" style="display:inline"';
                html += 'id="x' + j + 'y' + i + '">';
                html += '&nbsp';
                html += '</span>';
            }
        }
        html += '<br>';
    }
    canvas.innerHTML = html;

    fitCanvas();

    // Adjust grid
    regrid();
        
    nextState();
}

// Redraw the grid if enabled, otherwise clear it
function regrid(){
    if (gridlock) return;
    if (grid) {
        for (let elem of canvas.children) {
            elem.style.outline = gridstyle + gridcolor;
        }
    } else {
        for (let elem of canvas.children) {
            elem.style.outline = null;
        }
    }
}

function fitCanvas() {
    let w = 83 / width;
    let h = 27 / height;
    let m = 80 * Math.min(w, h);
    setCanvas(m);
}

function setCanvas(amount) {
    scale = amount;
    canvas.style.transform = "scale(" + scale + "%)";
}

// Adjust the canvas
function scaleCanvas(amount) {
    // scale *= amount;
    // canvas.style.transform = "scale(" + scale + "%)";
}

// Set the character to draw with
function setChar(key) {
    if (key != " ") {
        if (key.slice(0,3) == '&#x') {
            if (key.length <= 3) return;
        } else {
            if (key.length > 1) return;
        }
        document.getElementById("symbol").innerHTML = key;
        char = key;
    }
}

// Set a unicode character
function enterUnicode(code) {
    code = code.trim();
    if (code.includes('U+')) code = code.slice(2);
    if (parseInt(code, 16) != parseInt(code, 16)) return;
    if (code != code) return;
    code = '&#x' + code;
    setChar(code);
}

function buttonUp(id) {
    let element = document.getElementById(id);
    element.children[0].style.color = 'var(--dark)';
}
function buttonDown(id) {
    let element = document.getElementById(id);
    element.children[0].style.color = 'var(--complement)';
}

function buttonClick(id) {
    // On button click, press or unpress it
    if (mode == id) {
        buttonUp(id);
        mode = null;
    } else {
        if (mode) {
            buttonUp(mode);
        }
        mode = id;
        buttonDown(id);
    }
}

function buttonClickOnce(id) {
    // For buttons like undo, redo, etc. that are activated immediately on clicking
    let current_button =  document.getElementById(id).children[0];
    current_button.style.color = "var(--complement)";
    setTimeout(function() {
        current_button.style.color = "var(--dark)";
    }, 100);
    switch (id) {
        case 'undo':
            state_idx -= 1;
            state_idx = state_idx < 0? 0 : state_idx;
            canvas.innerHTML = states[state_idx];
            width = widths[state_idx];
            height = heights[state_idx];
            console.log(canvas);
            regrid()
            fitCanvas();
            preview();
            break;
        case 'redo':
            state_idx += 1;
            state_idx = state_idx > state_lim? state_lim : state_idx;
            canvas.innerHTML = states[state_idx];
            width = widths[state_idx];
            height = heights[state_idx];
            regrid()
            fitCanvas();
            preview();
            break;
        case 'reset':
            restart();
            break;
        case 'save-png':
            savePNG();
            break;
        case 'save-text':
            saveText();
            break;
        case 'save-html':
            saveHTML();
            break;
        case 'import-text':
            importText();
            break;
    }
}

function buttonClickToggle(id) {
    switch (id) {
        case 'grid':
            toggleGrid(id);
            break;
    }
}

function lockGrid(bool=true) {
    let id = 'grid';
    let element = document.getElementById(id);
    if (bool) {
        grid = false;
        regrid();
        element.children[0].style.color = 'var(--lightest)';
        element.title = 'Grid (disabled for large canvas)';
    } else {
        buttonUp(id);
        element.title = 'Grid';
    }
    element.disabled = bool;
    gridlock = bool;
}

function toggleGrid(id) {
    if (gridlock) {
        grid = false;
        return;
    }
    if (grid) {
        grid = false;
        buttonUp(id);
    } else {
        grid = true;
        buttonDown(id);
    }
    regrid();
}

function mouseDown(event) {
    // Handle mouse button press
    mouse_down = true;
    switch (mode) {
        case 'pencil':
            startPencil(event.target);
            break;
        case 'square-brush':
            startSquareBrush(event.target);
            break;
        case 'eraser':
            startEraser(event.target);
            break;
        case 'circle-brush':
            startCircleBrush(event.target);
            break;
        case 'line':
            startLine(event.target);
            break;
        case 'fill':
            startFill(event.target);
            break;
        case 'rectangle':
            startRectangle(event.target);
            break;
        case 'filled-rectangle':
            startRectangle(event.target);
            break;
        case 'circle':
            startCircle(event.target);
            break;
        case 'filled-circle':
            startCircle(event.target);
            break;
    }
    preview();
    last_target = event.target;
}

function mouseUp() {
    // Handle mouse button release
    switch (mode) {
        case 'pencil':
            stopPencil();
            break;
        case 'square-brush':
            stopSquareBrush();
            break;
        case 'eraser':
            stopEraser();
            break;
        case 'circle-brush':
            stopCircleBrush();
            break;
        case 'line':
            stopLine();
            break;
        case 'rectangle':
            stopRectangle();
            break;
        case 'filled-rectangle':
            stopRectangle();
            break;
        case 'circle':
            stopCircle();
            break;
        case 'filled-circle':
            stopCircle();
            break;
    }
    mouse_down = false;
    preview();
    last_target = null;
}

function mouseMove(event) {
    // Handle mouse movement
    if (event.target == last_target) return;
    if (mouse_down) {
        switch (mode) {
            case 'pencil':
                movePencil(event.target);
                break;
            case 'fill':
                startFill(event.target);
                break;
            case 'square-brush':
                moveSquareBrush(event.target);
                break;
            case 'eraser':
                moveEraser(event.target);
                break;
            case 'circle-brush':
                moveCircleBrush(event.target);
                break;
            case 'line':
                moveLine(event.target);
                break;
            case 'rectangle':
                moveRectangle(event.target, false);
                break;
            case 'filled-rectangle':
                moveRectangle(event.target, true);
                break;
            case 'circle':
                moveCircle(event.target);
                break;
            case 'filled-circle':
                moveCircle(event.target, true);
                break;
        }
    }
    updateCoordinates(event.target);
    preview();
    last_target = event.target;
}

function updateCoordinates(target) {
    // Get the x,y,z coordinates of mouse position and update the indicator
    if (target.className == 'pixel') {
        let id = target.id;
        id = id.split('y')
        let x = parseInt(id[0].slice(1)) + 1;
        let y = parseInt(id[1]) + 1;

        let text = '';
        text += 'x: ' + x;
        text += '<br>';
        text += 'y: ' + y;
        text += '<br>';
        text += 'z: ' + (height - y + 1);

        document.getElementById('coords').innerHTML = text;
    }
}

function updateSlider(id) {
    // Change the size of brushes using sliders
    let slider = document.getElementById(id);
    // slider.title = slider.value;
    switch (id) {
        case 'square-size':
            square_size = parseInt(slider.value);
            if (mode != 'square-brush'){
                buttonClick('square-brush');
            }
            break;
        case 'eraser-size':
            eraser_size = parseInt(slider.value);
            if (mode != 'eraser') {
                buttonClick('eraser');
            }
            break;
        case 'circle-size':
            circle_size = parseInt(slider.value);
            if (mode != 'circle-brush') {
                buttonClick('circle-brush');
            }
            break;
    }
}

function preview() {
    let text = '';
    try {
        text = canvas.innerText;
    } catch (e) {
        text = canvas.innerHTML;
        text = text.replace(/<br>/g, '\n');
        text = text.replace(/<[^>]*>/g, '');
        var re = new RegExp('\&nbsp;', "g");
        text = text.replace(re, ' ');
    }
    // Clean up any html code that shows up
    text = text.replace(/</, '&lt');
    text = text.replace(/>/, '&rt');

    let img = document.getElementById('preview-image');
    img.innerHTML = text;

    let w = 92 / width;
    let h = 43 / height;
    let m = 10 * Math.min(w, h);

    img.style.transform = "scale(" + m + "%)";
}

// ------------------------ Color methods ------------------------ //

function setColor(value) {
    color = value;
}

function setBGColor(value) {
    bgcolor = value;
    canvas.style.backgroundColor = bgcolor;
    // Set grid color as well, based on bgcolor

    gridcolor = '#';
    let color = 0;
    for (let i = 0; i < 3; i++) {
        color = bgcolor.slice(1+2*i, 3+2*i);
        color = parseInt(color, 16);
        color = color >= 128? color - 64: color + 64;
        gridcolor += color.toString(16, 2);
    }
    regrid();
}

function setPreviewColor(value) {
    let pi = document.getElementById('preview-image');
    pi.style.color = value;
}

function setPreviewBGColor(value) {
    let p = document.getElementById('preview');
    let pi = document.getElementById('preview-image');

    p.style.backgroundColor = value;
    pi.style.backgroundColor = value;
}

// ------------------------ Import/export methods ------------------------ //

let timeout = null;
let opacity = 2;
let fade_scale = 100;

function fadeMsg() {
    opacity -= 1 / fade_scale;
    let msg = document.getElementById("copy-msg");
    msg.style.opacity = opacity;
    if (opacity < 0) clearInterval(timeout);
}

function saveHTML() {
    let html = '';
    html += '<div style="display: inline; text-align: center; font-family: monospace; background-color: ' + canvas.style.backgroundColor + ';">';
    html += canvas.innerHTML;
    html += '</div>';

    navigator.clipboard.writeText(html);

    let msg = document.getElementById("copy-msg");
    msg.innerHTML = "Copied HTML to clipboard";
    opacity = 2;
    if (timeout) clearInterval(timeout);
    timeout = setInterval(fadeMsg, 10);
}

function saveText() {
    let text = '';
    try {
        text = canvas.innerText;
    } catch (e) {
        text = canvas.innerHTML;
        text = text.replace(/<br>/g, '\n');
        text = text.replace(/<[^>]*>/g, '');
        var re = new RegExp('\&nbsp;', "g");
        text = text.replace(re, ' ');
    }
    text = text.slice(0, text.length-1);
    navigator.clipboard.writeText(text);

    let msg = document.getElementById("copy-msg");
    msg.innerHTML = "Copied text to clipboard";
    opacity = 2;
    if (timeout) clearInterval(timeout);
    timeout = setInterval(fadeMsg, 10);
}

function savePNG() {
    let border = canvas.style.border;
    canvas.style.border = 'none';
    html2canvas(canvas).then(function(canvas) {
        let a = document.createElement("a");
        a.download = "ascii.png";
        a.href = canvas.toDataURL("image/png");
        a.click();
    })
    canvas.style.border = border;

    let msg = document.getElementById("copy-msg");
    msg.innerHTML = "Downloading PNG file...";
    opacity = 2;
    if (timeout) clearInterval(timeout);
    timeout = setInterval(fadeMsg, 10);
}

function importText() {
    if (state_idx > 0 && !confirm('This will replace the current canvas. Are you sure?')) {
        return;
    }
    reset();
    // Pull text from textarea
    let text = document.getElementById('text-input').value;
    console.log(text);
    // Break up lines
    text = text.split('\n');
    if (!text[text.length-1]) {
        // Remove empty last line
        text.pop();
    }

    // Size canvas
    height = text.length;
    width = 0;
    for (let line of text) {
        width = Math.max(width, line.length);
    }

    // Reset canvas if no input
    if (width <= 0 || height <= 0) {
        width = 72;
        height = 24;
        document.getElementById('width').value = width;
        document.getElementById('height').value = height;
        reset();
        fitCanvas();
        return;
    }

    document.getElementById('width').value = width;
    document.getElementById('height').value = height;

    // Populate the canvas
    let html = '';
    for (let i = 0; i < height; i++) {
        for (let j = 0; j < width; j++) {
            html += '<span class="pixel" style="display:inline"';
            html += 'id="x' + j + 'y' + i + '">';
            if (text[i][j]) {
                if (text[i][j] == ' ') {
                    html += '&nbsp';
                } else {
                    html += text[i][j];
                }
            } else {
                html += '&nbsp';
            }
            html += '</span>';
        }
        html += '<br>';
    }
    canvas.innerHTML = html;

    fitCanvas();
    regrid();
    states[state_idx] = canvas.innerHTML;
    widths[state_idx] = width;
    heights[state_idx] = height;
}

// ------------------------ All Pencil methods ------------------------ //

let lastPencil = null;
let lastIndex = 0;

function startPencil(target) {
    if (target.className == 'pixel') {
        target.innerHTML = char;
        target.style.color = color;
        lastPencil = target;
    }
}

function stopPencil() {
    if (mouse_down) {
        nextState();
    }
}

function movePencil(target) {
    if (!lastPencil) startPencil(target);
    if (target.className == 'pixel') {
        let id = lastPencil.id.split('y');
        x_start = parseInt(id[0].slice(1));
        y_start = parseInt(id[1]);

        id = target.id.split('y');
        let x = parseInt(id[0].slice(1));
        let y = parseInt(id[1]);

        let line_width = x-x_start;
        let line_height = y-y_start;
        let length = Math.max(Math.abs(line_width), Math.abs(line_height));

        if (length <= 0) {
            startPencil(target);
        } else {
            let w = 0, h = 0;
            for (let t = 0; t <= length; t++) {
                w = Math.round(line_width * t / length);
                h = Math.round(line_height * t / length);
                id = 'x' + (x_start + w) + 'y' + (y_start + h);
                target = document.getElementById(id);
                startPencil(target);
            }
        }
    }
}

// ------------------------ Line methods ------------------------ //

let x_start = 0, y_start = 0;

function startLine(target) {
    if (target.className == 'pixel') {
        target.innerHTML = char;
        target.style.color = color;
        let id = target.id.split('y');
        x_start = parseInt(id[0].slice(1));
        y_start = parseInt(id[1]);
    }
}

function moveLine(target) {
    canvas.innerHTML = states[state_idx];
    target = document.getElementById(target.id);
    if (target.className == 'pixel') {
        let id = target.id.split('y');
        let x = parseInt(id[0].slice(1));
        let y = parseInt(id[1]);

        let line_width = x-x_start;
        let line_height = y-y_start;
        let length = Math.max(Math.abs(line_width), Math.abs(line_height));

        if (length <= 0) {
            startPencil(target);
        } else {
            let w = 0, h = 0;
            for (let t = 0; t <= length; t++) {
                w = Math.round(line_width * t / length);
                h = Math.round(line_height * t / length);
                id = 'x' + (x_start + w) + 'y' + (y_start + h);
                target = document.getElementById(id);
                startPencil(target);
            }
        }
    }
    regrid();
}

function stopLine() {
    stopPencil();
}

// ------------------------ Fill ------------------------ //

function rgb2hex(rgb) {
    if (!rgb) return '#000000';
    rgb = rgb.slice(4).split(',');
    let r = parseInt(rgb[0]);
    let g = parseInt(rgb[1]);
    let b = parseInt(rgb[2]);

    r = r.toString(16);
    g = g.toString(16);
    b = b.toString(16);

    if (r.length < 2) r = '0' + r;
    if (g.length < 2) g = '0' + g;
    if (b.length < 2) b = '0' + b;
    
    return '#' + r + g + b;
}

function startFill(target) {
    if (target.className != 'pixel') return;
    let startColor = target.style.color;
    let startChar = target.innerHTML;
    startColor = startColor;

    if (startChar == char && rgb2hex(startColor) == color) return;

    while (target) {
        console.log(target);
        target = spread(target);
    }

    function spread(target) {
        let next = null;
        if (target.innerHTML == char && target.style.color == color) {
            return null;
        }
        target.innerHTML = char;
        target.style.color = color;

        let id = target.id.split('y');
        let x = parseInt(id[0].slice(1));
        let y = parseInt(id[1]);

        for (let i of [-1, 0, 1]) {
            for (let j of [-1, 0, 1]) {
                if (i == 0 && j == 0) {
                    continue;
                }
                if (i * j != 0) {
                    continue;
                }
                if (x+j < 0 || x+j >= width) {
                    continue;
                }
                if (y+i < 0 || y+i >= height) {
                    continue;
                }
                id = 'x' + (x+j) + 'y' + (y+i);
                target = document.getElementById(id);
                if (!target) continue;
                if (target.innerHTML == startChar && target.style.color == startColor) {
                    try{
                        next = spread(target);
                        if (next) return next;
                    } catch {
                        return target;
                    }
                }
            }
        }
        return;
    }
    stopPencil();
}

// ------------------------ Rectangle/filled rect ------------------------ //

function startRectangle(target) {
    if (target.className == 'pixel') {
        target.innerHTML = char;
        target.style.color = color;
        let id = target.id.split('y');
        x_start = parseInt(id[0].slice(1));
        y_start = parseInt(id[1]);
    }
}

function moveRectangle(target, filled=false) {
    canvas.innerHTML = states[state_idx];
    target = document.getElementById(target.id);
    if (target.className == 'pixel') {
        let id = target.id.split('y');
        let x = parseInt(id[0].slice(1));
        let y = parseInt(id[1]);
        
        let left = 0;
        let right = 0;
        let top = 0;
        let bottom = 0;
        
        if (x >= x_start) {
            left = x_start;
            right = x;
        } else {
            left = x;
            right = x_start;
        }
        if (y >= y_start) {
            top = y_start;
            bottom = y;
        } else {
            top = y;
            bottom = y_start;
        }
        if (filled) {
            for (x = left; x <= right; x++) {
                for (y = top; y <= bottom; y++) {
                    id = 'x' + x + 'y' + y;
                    target = document.getElementById(id);
                    startPencil(target);
                }
            }
        } else {
            for (y of [top, bottom]) {
                for (x = left; x <= right; x++) {
                    id = 'x' + x + 'y' + y;
                    target = document.getElementById(id);
                    startPencil(target);
                }
            }
            for (x of [left, right]) {
                for (y = top; y <= bottom; y++) {
                    id = 'x' + x + 'y' + y;
                    target = document.getElementById(id);
                    startPencil(target);
                }
            }
        }
        regrid();
    }
}

function stopRectangle() {
    stopPencil();
}

// ------------------------ Circle/filled circ ------------------------ //

function startCircle(target) {
    if (target.className == 'pixel') {
        target.innerHTML = char;
        target.style.color = color;
        let id = target.id.split('y');
        x_start = parseInt(id[0].slice(1));
        y_start = parseInt(id[1]);
    }
}

function moveCircle(target, filled=false) {
    canvas.innerHTML = states[state_idx];
    target = document.getElementById(target.id);
    if (target.className == 'pixel') {
        let id = target.id.split('y');
        let x = parseInt(id[0].slice(1));
        let y = parseInt(id[1]);

        let r = Math.pow(x-x_start, 2) + 4*Math.pow(y-y_start, 2);
        r = Math.sqrt(r);
        let left = 0, right = 0;
        for (let theta = 0; theta <= 2 * Math.PI; theta += Math.PI / (8*r)) {
            x = x_start + r * Math.cos(theta);
            x = Math.round(x);
            y = y_start + 0.5 * r * Math.sin(theta);
            y = Math.round(y);

            id = 'x' + x + 'y' + y;
            target = document.getElementById(id);
            if (target) startPencil(target);

            if (filled) {
                left = x_start - r * Math.abs(Math.cos(theta));
                left = Math.round(left);
                right = x_start + r * Math.abs(Math.cos(theta));
                right = Math.round(right);
                for (x = left; x < right; x++) {
                    id = 'x' + x + 'y' + y;
                    target = document.getElementById(id);
                    if (target) startPencil(target);
                }
            }
        }
    }
    regrid();
}

function stopCircle() {
    stopPencil();
}

// ------------------------ Eraser ------------------------ //

function startEraser(target) {
    if (target.className == 'pixel') {
        let coordinates = target.id.split('y');
        let x = parseInt(coordinates[0].slice(1));
        let y = parseInt(coordinates[1]);

        let left = Math.max(0, x - eraser_size);
        let right = Math.min(width-1, x + eraser_size) + 1;

        // Adjust the height for the character height, otherwise brush is rectangular
        let top = Math.max(0, (Math.floor(y - eraser_size*1/2)));
        let bottom = Math.min(height-1, Math.ceil(y + eraser_size*1/2)) + 1;


        let square = null;
        let name = '';
        for (i = top; i < bottom; i++) {
            for (j = left; j < right; j++) {
                name = 'x' + j + 'y' + i;
                square = document.getElementById(name);
                square.innerHTML = '\&nbsp';
                square.style.color = color;
            }
        }
    }
}

function moveEraser(target) {
    startEraser(target);
}

function stopEraser() {
    stopPencil();
}

// ------------------------ Square Brush ------------------------ //


function startSquareBrush(target) {
    startPencil(target);
    if (target.className == 'pixel') {
        let coordinates = target.id.split('y');
        let x = parseInt(coordinates[0].slice(1));
        let y = parseInt(coordinates[1]);

        let left = Math.max(0, x - square_size);
        let right = Math.min(width-1, x + square_size) + 1;

        // Adjust the height for the character height, otherwise brush is rectangular
        let top = Math.max(0, (Math.floor(y - square_size*1/2)));
        let bottom = Math.min(height-1, Math.ceil(y + square_size*1/2)) + 1;

        let square = null;
        let name = '';
        for (i = top; i < bottom; i++) {
            for (j = left; j < right; j++) {
                name = 'x' + j + 'y' + i;
                square = document.getElementById(name);
                square.innerHTML = char;
                square.style.color = color;
            }
        }
    }
    
}

function stopSquareBrush() {
    stopPencil();
}

function moveSquareBrush(target) {
    if (target.className == 'pixel') {
        let id = lastPencil.id.split('y');
        x_start = parseInt(id[0].slice(1));
        y_start = parseInt(id[1]);

        id = target.id.split('y');
        let x = parseInt(id[0].slice(1));
        let y = parseInt(id[1]);

        let line_width = x-x_start;
        let line_height = y-y_start;
        let length = Math.max(Math.abs(line_width), Math.abs(line_height));

        if (length <= 0) {
            startSquareBrush(target);
        } else {
            let w = 0, h = 0;
            for (let t = 0; t <= length; t++) {
                w = Math.round(line_width * t / length);
                h = Math.round(line_height * t / length);
                id = 'x' + (x_start + w) + 'y' + (y_start + h);
                target = document.getElementById(id);
                startSquareBrush(target);
            }
        }
    }
}


// ------------------------ Circle Brush ------------------------ //

function startCircleBrush(target) {
    startPencil(target);
    if (target.className == 'pixel') {
        let coordinates = target.id.split('y');
        let x = parseInt(coordinates[0].slice(1));
        let y = parseInt(coordinates[1]);

        let left = Math.max(0, x - circle_size);
        let right = Math.min(width-1, x + circle_size) + 1;

        let h = 0;
        let top = 0, bottom = 0;

        let square = null;
        let name = '';
        for (j = left; j < right; j++) {
            h = (1/2) * Math.sqrt( Math.pow(circle_size,2) - Math.pow((j-x),2) );
            h = Math.floor(h) + 1;
            top = Math.max(0, y-h);
            bottom = Math.min(height-1, y+h);
            for (i = top; i < bottom; i++) {
                name = 'x' + j + 'y' + i;
                square = document.getElementById(name);
                square.innerHTML = char;
                square.style.color = color;
            }
        }

    }
}

function moveCircleBrush(target) {
    if (target.className == 'pixel') {
        let id = lastPencil.id.split('y');
        x_start = parseInt(id[0].slice(1));
        y_start = parseInt(id[1]);

        id = target.id.split('y');
        let x = parseInt(id[0].slice(1));
        let y = parseInt(id[1]);

        let line_width = x-x_start;
        let line_height = y-y_start;
        let length = Math.max(Math.abs(line_width), Math.abs(line_height));

        if (length <= 0) {
            startCircleBrush(target);
        } else {
            let w = 0, h = 0;
            for (let t = 0; t <= length; t++) {
                w = Math.round(line_width * t / length);
                h = Math.round(line_height * t / length);
                id = 'x' + (x_start + w) + 'y' + (y_start + h);
                target = document.getElementById(id);
                startCircleBrush(target);
            }
        }
    }
}

function stopCircleBrush() {
    stopPencil();
}

