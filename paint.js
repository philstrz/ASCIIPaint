window.addEventListener("load", setup);
window.addEventListener("keydown", function(event) {
    press(event.key);
    return false;
})
window.addEventListener("wheel", function(event) {
    scroll(event);
    return false;
})

var canvas = null;
var scale = 100;

function setup() {
    canvas = document.getElementById("canvas");
}

function press(key) {
    console.log(key);
    switch (key) {
        case "ArrowUp":
            scaleCanvas(10);
            break;
        case "ArrowDown":
            scaleCanvas(-10);
            break;
    }
}

function scroll(event) {
    console.log(event.deltaY);
    if (event.deltaY < 0) {
        scaleCanvas(5);
    } else {
        scaleCanvas(-5);
    }
}

function scaleCanvas(amount) {
    scale += amount;
    canvas.style.transform = "scale(" + scale + "%)";
}