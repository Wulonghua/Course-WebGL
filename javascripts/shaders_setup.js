
function getShader(gl, id) {
    var shaderScript = document.getElementById(id);
    if (!shaderScript) {
        return null;
    }

    var str = "";
    var k = shaderScript.firstChild;
    while (k) {
        if (k.nodeType == 3) {
            str += k.textContent;
        }
        k = k.nextSibling;
    }

    var shader;
    if (shaderScript.type == "x-shader/x-fragment") {
        shader = gl.createShader(gl.FRAGMENT_SHADER);
    } else if (shaderScript.type == "x-shader/x-vertex") {
        shader = gl.createShader(gl.VERTEX_SHADER);
    } else {
        return null;
    }

    gl.shaderSource(shader, str);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert(gl.getShaderInfoLog(shader));
        return null;
    }

    return shader;
}


function initShaders() {

    shaderProgram = gl.createProgram();

    var fragmentShader = getShader(gl, "shader-fs");
    var vertexShader = getShader(gl, "shader-vs");

    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        alert("Could not initialise shaders");
    }

    shaderProgramSB = gl.createProgram();
    var fragmentShader2 = getShader(gl, "shader-fs-skybox");
    var vertexShader2 = getShader(gl, "shader-vs-skybox");

    gl.attachShader(shaderProgramSB, vertexShader2);
    gl.attachShader(shaderProgramSB, fragmentShader2);
    gl.linkProgram(shaderProgramSB);

    if (!gl.getProgramParameter(shaderProgramSB, gl.LINK_STATUS)) {
        alert("Could not initialise shaders");
    }
    

}

