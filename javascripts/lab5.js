var gl;
var shaderProgram;     // shader program for the object
var shaderProgramSB;   // shader program for the sky box (environment cube)
var use_texture = 2;


// set up the parameters for lighting 
var light_ambient = [0.5, 0.5, 0.5, 1];
var light_diffuse = [1, 1, 1, 1];
var light_specular = [1, 1, 1, 1];
var light_pos = [0, 0, 0, 1];   // eye space position 

var mat_ambient = [0.5, 0.5, 0.5, 1];
var mat_diffuse = [1, 1, 1, 1];
var mat_specular = [0.8, 0.8, 0.8, 1];
var mat_shine = [50];

var skyboxVertexPositionBuffer;
var skyboxVertexIndexBuffer; 

var teapotVertexPositionBuffer;
var teapotVertexNormalBuffer;
var teapotVertexTextureCoordBuffer;
var teapotVertexIndexBuffer;

var xmin, xmax, ymin, ymax, zmin, zmax;

var mMatrix = mat4.create();    // model matrix
var vMatrix = mat4.create();    // view matrix
var pMatrix = mat4.create();    // projection matrix
var nMatrix = mat4.create();    // normal matrix
var v2wMatrix = mat4.create();  // eye space to world space matrix 
var trackball;
//////////// Init OpenGL Context etc. ///////////////

function initGL(canvas) {
    try {
        gl = canvas.getContext("experimental-webgl");
        gl.viewportWidth = canvas.width;
        gl.viewportHeight = canvas.height;
    } catch (e) {
    }
    if (!gl) {
        alert("Could not initialise WebGL, sorry :-(");
    }
}


///////////////////////////////////////////////////////////////

var cubemapTexture;

function initCubeMap(){
    var k = 0;
    var img = new Array(6);
    var urls = [
       "images/skybox/posx.jpg", "images/skybox/negx.jpg",
       "images/skybox/posy.jpg", "images/skybox/negy.jpg",
       "images/skybox/posz.jpg", "images/skybox/negz.jpg"
    ];
    var targets = [
       gl.TEXTURE_CUBE_MAP_POSITIVE_X, gl.TEXTURE_CUBE_MAP_NEGATIVE_X, 
       gl.TEXTURE_CUBE_MAP_POSITIVE_Y, gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, 
       gl.TEXTURE_CUBE_MAP_POSITIVE_Z, gl.TEXTURE_CUBE_MAP_NEGATIVE_Z 
    ];
    for (var i = 0; i < 6; i++) {
        img[i] = new Image();
        img[i].onload = function() {
            k++;
            if (k == 6) {
                cubemapTexture = gl.createTexture();
                gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubemapTexture);
                for (var j = 0; j < 6; j++) {
                    gl.texImage2D(targets[j], 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img[j]);
                    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
                    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
                }
                gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
                drawScene();
            }
        }
        img[i].src = urls[i];
    }  
}

///////////////////////////////////////////////////////////////

var sampleTexture;

function initTextures() {
    sampleTexture = gl.createTexture();
    sampleTexture.image = new Image();
    sampleTexture.image.onload = function () { handleTextureLoaded(sampleTexture);}
    sampleTexture.image.src = "images/marble.jpg";
    console.log("loading texture....")
}

function handleTextureLoaded(texture) {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture.image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.bindTexture(gl.TEXTURE_2D, null);
}

///////////////////////////////////////////////////////////



function find_range(positions) {
    console.log("hello!");
    xmin = xmax = positions[0];
    ymin = ymax = positions[1];
    zmin = zmax = positions[2];
    for (i = 0; i < positions.length / 3; i++) {
        if (positions[i * 3] < xmin) xmin = positions[i * 3];
        if (positions[i * 3] > xmax) xmax = positions[i * 3];

        if (positions[i * 3 + 1] < ymin) ymin = positions[i * 3 + 1];
        if (positions[i * 3 + 1] > ymax) ymax = positions[i * 3 + 1];

        if (positions[i * 3 + 2] < zmin) zmin = positions[i * 3 + 2];
        if (positions[i * 3 + 2] > zmax) zmax = positions[i * 3 + 2];
    }
    console.log("*****xmin = " + xmin + "xmax = " + xmax);
    console.log("*****ymin = " + ymin + "ymax = " + ymax);
    console.log("*****zmin = " + zmin + "zmax = " + zmax);
}

////////////////    Initialize JSON geometry file ///////////

function initJSON() {
    var request = new XMLHttpRequest();
    request.open("GET", "teapot.json");
    request.onreadystatechange =
      function () {
          if (request.readyState == 4) {
              console.log("state =" + request.readyState);
              handleLoadedTeapot(JSON.parse(request.responseText));
          }
      }
    request.send();
}

function initSkybox(){
    var vertices = [ -100, -100, -100, 100, -100, -100, -100, 100, -100, 100, 100, -100, -100, -100, 100, 100, -100, 100, -100, 100, 100, 100, 100, 100];
    var indices = [2, 1, 0, 1, 2, 3, 4, 2, 0, 2, 4, 6, 1, 4, 0, 4, 1, 5, 6, 5, 7, 5, 6, 4, 3, 6, 7, 6, 3, 2,
        5, 3, 7, 3, 5, 1];
    skyboxVertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, skyboxVertexPositionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    skyboxVertexPositionBuffer.itemSize = 3;
    skyboxVertexPositionBuffer.numItems = vertices.length / 3;
    
    skyboxVertexIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, skyboxVertexIndexBuffer); 
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);  
    skyboxVertexIndexBuffer.itemsize = 1;
    skyboxVertexIndexBuffer.numItems = indices.length;  
    
}


function handleLoadedTeapot(teapotData) {
    console.log(" in hand LoadedTeapot");
    teapotVertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, teapotVertexPositionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(teapotData.vertexPositions), gl.STATIC_DRAW);
    teapotVertexPositionBuffer.itemSize = 3;
    teapotVertexPositionBuffer.numItems = teapotData.vertexPositions.length / 3;

    teapotVertexNormalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, teapotVertexNormalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(teapotData.vertexNormals), gl.STATIC_DRAW);
    teapotVertexNormalBuffer.itemSize = 3;
    teapotVertexNormalBuffer.numItems = teapotData.vertexNormals.length / 3;

    teapotVertexTextureCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, teapotVertexTextureCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(teapotData.vertexTextureCoords),
		  gl.STATIC_DRAW);
    teapotVertexTextureCoordBuffer.itemSize = 2;
    teapotVertexTextureCoordBuffer.numItems = teapotData.vertexTextureCoords.length / 2;

    teapotVertexIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, teapotVertexIndexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(teapotData.indices), gl.STATIC_DRAW);
    teapotVertexIndexBuffer.itemSize = 1;
    teapotVertexIndexBuffer.numItems = teapotData.indices.length;

    find_range(teapotData.vertexPositions);

    drawScene();

}

///////////////////////////////////////////////////////////////

function setMatrixUniforms() {
    gl.uniformMatrix4fv(shaderProgram.mMatrixUniform, false, mMatrix);
    gl.uniformMatrix4fv(shaderProgram.vMatrixUniform, false, vMatrix);
    gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);
    gl.uniformMatrix4fv(shaderProgram.nMatrixUniform, false, nMatrix);
    gl.uniformMatrix4fv(shaderProgram.v2wMatrixUniform, false, v2wMatrix);
}

function degToRad(degrees) {
    return degrees * Math.PI / 180;
}

///////////////////////////////////////////////////////////////

function drawScene() {

    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);


    if (teapotVertexPositionBuffer == null || teapotVertexNormalBuffer == null || teapotVertexIndexBuffer == null) {
        return;
    }

    mat4.identity(mMatrix);
    mMatrix = mat4.scale(mMatrix, [1 / 10, 1 / 10, 1 / 10]);

    vMatrix = trackball.getViewMatrix();
    mat4.identity(nMatrix);
    nMatrix = mat4.multiply(nMatrix, vMatrix);
    nMatrix = mat4.multiply(nMatrix, mMatrix);
    nMatrix = mat4.inverse(nMatrix);
    nMatrix = mat4.transpose(nMatrix);

    mat4.identity(v2wMatrix);
    v2wMatrix = mat4.multiply(v2wMatrix, vMatrix);   
    v2wMatrix = mat4.transpose(v2wMatrix);
    

    gl.useProgram(shaderProgram);
    shaderProgram.light_posUniform = gl.getUniformLocation(shaderProgram, "light_pos");

    gl.uniform4f(shaderProgram.light_posUniform, light_pos[0], light_pos[1], light_pos[2], light_pos[3]);
    gl.uniform4f(shaderProgram.ambient_coefUniform, mat_ambient[0], mat_ambient[1], mat_ambient[2], 1.0);
    gl.uniform4f(shaderProgram.diffuse_coefUniform, mat_diffuse[0], mat_diffuse[1], mat_diffuse[2], 1.0);
    gl.uniform4f(shaderProgram.specular_coefUniform, mat_specular[0], mat_specular[1], mat_specular[2], 1.0);
    gl.uniform1f(shaderProgram.shininess_coefUniform, mat_shine[0]);

    gl.uniform4f(shaderProgram.light_ambientUniform, light_ambient[0], light_ambient[1], light_ambient[2], 1.0);
    gl.uniform4f(shaderProgram.light_diffuseUniform, light_diffuse[0], light_diffuse[1], light_diffuse[2], 1.0);
    gl.uniform4f(shaderProgram.light_specularUniform, light_specular[0], light_specular[1], light_specular[2], 1.0);


    gl.bindBuffer(gl.ARRAY_BUFFER, teapotVertexPositionBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, teapotVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, teapotVertexNormalBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, teapotVertexNormalBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, teapotVertexTextureCoordBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexTexCoordsAttribute, teapotVertexTextureCoordBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, teapotVertexIndexBuffer);

    setMatrixUniforms();   // pass the modelview mattrix and projection matrix to the shader
    gl.uniform1i(shaderProgram.use_textureUniform, use_texture);

    gl.activeTexture(gl.TEXTURE1);   // set texture unit 1 to use 
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubemapTexture);    // bind the texture object to the texture unit 
    gl.uniform1i(shaderProgram.cube_map_textureUniform, 1);   // pass the texture unit to the shader

    gl.activeTexture(gl.TEXTURE0);   // set texture unit 0 to use 
    gl.bindTexture(gl.TEXTURE_2D, sampleTexture);    // bind the texture object to the texture unit 
    gl.uniform1i(shaderProgram.textureUniform, 0);   // pass the texture unit to the shader

    gl.drawElements(gl.TRIANGLES, teapotVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
    
    // draw skybox
    gl.useProgram(shaderProgramSB);
    gl.bindBuffer(gl.ARRAY_BUFFER, skyboxVertexPositionBuffer);
    gl.vertexAttribPointer(shaderProgramSB.vertexPositionAttribute, skyboxVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
    
    gl.uniformMatrix4fv(shaderProgramSB.mMatrixUniform, false, mMatrix);
    gl.uniformMatrix4fv(shaderProgramSB.vMatrixUniform, false, vMatrix);
    gl.uniformMatrix4fv(shaderProgramSB.pMatrixUniform, false, pMatrix);
    
    gl.activeTexture(gl.TEXTURE0);   // set texture unit 0 to use 
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubemapTexture);    // bind the texture object to the texture unit 
    gl.uniform1i(shaderProgramSB.cube_map_textureUniform, 0);   // pass the texture unit to the shader


    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, skyboxVertexIndexBuffer);
    gl.drawElements(gl.TRIANGLES, skyboxVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
    
    

}

///////////////////////////////////////////////////////////////

function webGLStart() {
    var canvas = document.getElementById("lab5-canvas");
    initGL(canvas);
    initShaders();

    gl.enable(gl.DEPTH_TEST);

    shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
    gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);
    shaderProgram.vertexNormalAttribute = gl.getAttribLocation(shaderProgram, "aVertexNormal");
    gl.enableVertexAttribArray(shaderProgram.vertexNormalAttribute);
    shaderProgram.vertexTexCoordsAttribute = gl.getAttribLocation(shaderProgram, "aVertexTexCoords");
    gl.enableVertexAttribArray(shaderProgram.vertexTexCoordsAttribute);

    shaderProgram.mMatrixUniform = gl.getUniformLocation(shaderProgram, "uMMatrix");
    shaderProgram.vMatrixUniform = gl.getUniformLocation(shaderProgram, "uVMatrix");
    shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
    shaderProgram.nMatrixUniform = gl.getUniformLocation(shaderProgram, "uNMatrix");
    shaderProgram.v2wMatrixUniform = gl.getUniformLocation(shaderProgram, "uV2WMatrix");
    shaderProgram.light_posUniform = gl.getUniformLocation(shaderProgram, "light_pos");
    shaderProgram.ambient_coefUniform = gl.getUniformLocation(shaderProgram, "ambient_coef");
    shaderProgram.diffuse_coefUniform = gl.getUniformLocation(shaderProgram, "diffuse_coef");
    shaderProgram.specular_coefUniform = gl.getUniformLocation(shaderProgram, "specular_coef");
    shaderProgram.shininess_coefUniform = gl.getUniformLocation(shaderProgram, "mat_shininess");
    shaderProgram.light_ambientUniform = gl.getUniformLocation(shaderProgram, "light_ambient");
    shaderProgram.light_diffuseUniform = gl.getUniformLocation(shaderProgram, "light_diffuse");
    shaderProgram.light_specularUniform = gl.getUniformLocation(shaderProgram, "light_specular");
    shaderProgram.textureUniform = gl.getUniformLocation(shaderProgram, "myTexture");
    shaderProgram.cube_map_textureUniform = gl.getUniformLocation(shaderProgram, "cubeMap");
    shaderProgram.use_textureUniform = gl.getUniformLocation(shaderProgram, "use_texture");

    
    shaderProgramSB.vertexPositionAttribute = gl.getAttribLocation(shaderProgramSB, "aVertexPosition");
    gl.enableVertexAttribArray(shaderProgramSB.vertexPositionAttribute);
    
    shaderProgramSB.mMatrixUniform = gl.getUniformLocation(shaderProgramSB, "uMMatrix");
    shaderProgramSB.vMatrixUniform = gl.getUniformLocation(shaderProgramSB, "uVMatrix");
    shaderProgramSB.pMatrixUniform = gl.getUniformLocation(shaderProgramSB, "uPMatrix");
    shaderProgramSB.cube_map_textureUniform = gl.getUniformLocation(shaderProgramSB, "cubeMap");
    
    
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    console.log('start! ');
    pMatrix = mat4.perspective(60, 1.0, 0.1, 100, pMatrix);  // set up the projection matrix 
    
    trackball = new TrackballRotator(canvas,drawScene, 5, [0, 0, 1], [0, 1, 0]);
    initJSON();
    initSkybox();
    initTextures();
    initCubeMap();
}


function redraw() 
{
    trackball.setView(5, [0, 0, 1], [0, 1, 0]);
    drawScene();
}


function texture(value) {

    use_texture = value;
    drawScene();

}
