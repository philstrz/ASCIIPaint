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
let width = 48;
let height = 24;
let grid = false;

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
let state_idx = 0;
let state_lim = 0;

// Store last target to reduce unnecessary processing
let last_target = null;

// Line weight settings
let square_size = 0;
let eraser_size = 0;
let circle_size = 0;


// Does not include some initial setup, called by setup
function reset() {
    // Store current option
    if (mode) button = mode;

    // Redraw the canvas
    let html = '';
    for (let i = 0; i < height; i++) {
        for (let j = 0; j < width; j++) {
            html += '<span class="pixel" style="display:inline"';
            html += 'id="x' + j + 'y' + i + '">'
            html += '&nbsp';
            html += '</span>';
        }
        html += '<br>';
    }
    canvas.innerHTML = html;

    // Reset undo/redo
    state_idx = 0;
    state_lim = 0;
    states[state_idx] = canvas.innerHTML;
}

// Initial setup
function setup() {
    canvas = document.getElementById("canvas");

    reset();

    canvas.addEventListener('mousedown', mouseDown);
    canvas.addEventListener('mousemove', mouseMove);

    // Set starting widths of relevant elements
    let sizes = ['square-size', 'eraser-size', 'circle-size'];
    for (let size of sizes){
        updateSlider(size);
    }

    // Start with pencil selected
    buttonClick(button);

    setBGColor(bgcolor);
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

// Adjust the canvas
function scaleCanvas(amount) {
    scale *= amount;
    canvas.style.transform = "scale(" + scale + "%)";
}

// Set the character to draw with
function setChar(key) {
    if (key != " ") {
        // if (key.length > 1) key = key[0];
        document.getElementById("symbol").innerHTML = key;
        char = key;
    }
}

// Set a unicode character
function enterUnicode(code) {
    code = code.trim();
    if (code.includes('U+')) code = code.slice(2);
    code = parseInt(code, 16);
    if (code != code) return;
    let char = '';
    char = '&#x' + code;
    setChar(char);
}

function buttonUp(id) {
    let element = document.getElementById(id);
    element.style.borderStyle = 'outset';
    element.children[0].style.color = 'var(--dark)';
}
function buttonDown(id) {
    let element = document.getElementById(id);
    element.style.borderStyle = 'inset';
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
            if (grid) {
                for (let elem of canvas.children) {
                    elem.style.outline = '1px dashed' + gridcolor;
                }
            } else {
                for (let elem of canvas.children) {
                    elem.style.outline = null;
                }
            }
            break;
        case 'redo':
            state_idx += 1;
            state_idx = state_idx > state_lim? state_lim : state_idx;
            canvas.innerHTML = states[state_idx];
            if (grid) {
                for (let elem of canvas.children) {
                    elem.style.outline = '1px dashed' + gridcolor;
                }
            } else {
                for (let elem of canvas.children) {
                    elem.style.outline = null;
                }
            }
            break;
        case 'reset':
            reset();
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
    }
}

function buttonClickToggle(id) {
    switch (id) {
        case 'grid':
            toggleGrid(id);
            break;
    }
}

function toggleGrid(id) {
    if (grid) {
        for (let elem of canvas.children) {
            elem.style.outline = null;
        }
        grid = false;
        buttonUp(id);
    } else {
        for (let elem of canvas.children) {
            elem.style.outline = '1px dashed' + gridcolor;
        }
        grid = true;
        buttonDown(id);
    }
}

function mouseDown(event) {
    // Handle mouse button press
    mouse_down = true;
    switch (mode) {
        case 'pencil':
            startPencil(event.target);
            break;
        case 'square-brush':
            startSquare(event.target);
            break;
        case 'eraser':
            startEraser(event.target);
            break;
        case 'circle-brush':
            startCircle(event.target);
            break;
        case 'line':
            startLine(event.target);
            break;
        case 'fill':
            startFill(event.target);
            break;
    }
    last_target = event.target;
}

function mouseUp(event) {
    // Handle mouse button release
    switch (mode) {
        case 'pencil':
            stopPencil(event.target);
            break;
        case 'square-brush':
            stopSquare(event.target);
            break;
        case 'eraser':
            stopEraser(event.target);
            break;
        case 'circle-brush':
            stopCircle(event.target);
            break;
        case 'line':
            stopLine(event.target);
            break;
        
    }
    mouse_down = false;
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
            case 'square-brush':
                moveSquare(event.target);
                break;
            case 'eraser':
                moveEraser(event.target);
                break;
            case 'circle-brush':
                moveCircle(event.target);
                break;
            case 'line':
                moveLine(event.target);
                break;
            
        }
    }
    last_target = event.target;
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
    if (grid) {
        for (let elem of canvas.children) {
            elem.style.outline = '1px dashed' + gridcolor;
        }
    }
}


// ------------------------ Import/export methods ------------------------ //


function saveHTML() {
    let html = '';
    // html += '<div style="display: inline; text-align: center; font-family: monospace; font-size: ' + font + 'px; background-color: ' + easel.style.backgroundColor + ';">';
    html += '<div style="display: inline; text-align: center; font-family: monospace; background-color: ' + easel.style.backgroundColor + ';">';
    html += easel.innerHTML;
    html += '</div>';

    navigator.clipboard.writeText(html);
}

function saveText() {
    let text = '';
    try {
        text = easel.innerText;
    } catch (e) {
        text = easel.innerHTML;
        text = text.replace(/<br>/g, '\n');
        text = text.replace(/<[^>]*>/g, '');
        var re = new RegExp('\&nbsp;', "g");
        text = text.replace(re, ' ');
    }
    
    navigator.clipboard.writeText(text);
}

function savePNG() {
    html2canvas(easel).then(function(canvas) {
        let a = document.createElement("a");
        a.download = "ascii.png";
        a.href = canvas.toDataURL("image/png");
        a.click();
    })
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

function stopPencil(target) {
    if (mouse_down) {
        state_idx += 1;
        state_lim = state_idx;
        states[state_idx] = canvas.innerHTML;
    }
}

function movePencil(target) {
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
        if (grid) {
            for (let elem of canvas.children) {
                elem.style.outline = '1px dashed' + gridcolor;
            }
        }
        

    }
}

function stopLine(target) {
    stopPencil(null);
}

// ------------------------ Fill ------------------------ //

function startFill(target) {
    if (target.className != 'pixel') return;
    let startColor = target.style.color;
    let startChar = target.innerHTML;

    spread(target);

    function spread(target) {
        if (target.innerHTML == char && target.style.color == color) {
            return;
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
                if (target.innerHTML == startChar && target.style.color == startColor) {
                    spread(target);
                }
            }
        }
    }
    stopPencil(null);
}

// ------------------------ Rectangle/filled rect ------------------------ //


// ------------------------ Circle/filled circ ------------------------ //


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

function stopEraser(target) {
    stopPencil(null);
}

// ------------------------ Square Brush ------------------------ //


function startSquare(target) {
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

function stopSquare(target) {
    stopPencil(null);
}

function moveSquare(target) {
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
            startSquare(target);
        } else {
            let w = 0, h = 0;
            for (let t = 0; t <= length; t++) {
                w = Math.round(line_width * t / length);
                h = Math.round(line_height * t / length);
                id = 'x' + (x_start + w) + 'y' + (y_start + h);
                target = document.getElementById(id);
                startSquare(target);
            }
        }
    }
}


// ------------------------ Circle Brush ------------------------ //

function startCircle(target) {
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

function moveCircle(target) {
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
            startCircle(target);
        } else {
            let w = 0, h = 0;
            for (let t = 0; t <= length; t++) {
                w = Math.round(line_width * t / length);
                h = Math.round(line_height * t / length);
                id = 'x' + (x_start + w) + 'y' + (y_start + h);
                target = document.getElementById(id);
                startCircle(target);
            }
        }
    }
}

function stopCircle(target) {
    stopPencil(null);
}

