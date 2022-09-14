"use strict";

var canvas;
var gl;
var program;

var projectionMatrix;
var modelViewMatrix;
var nMatrix;

var lightDiffuse = vec4(1.0, 1.0, 1.0, 1.0);
var materialDiffuse = vec4(0.7, 0.7, 0.7, 1.0);

var instanceMatrix;

var modelViewMatrixLoc;

var normalsArray = [];
var tangentsArray = [];
var texCoordsArray = [];

var pointsArray = [];
var vertices = [
    vec4( -0.5, -0.5,  0.5, 1.0 ),
    vec4( -0.5,  0.5,  0.5, 1.0 ),
    vec4( 0.5,  0.5,  0.5, 1.0 ),
    vec4( 0.5, -0.5,  0.5, 1.0 ),
    vec4( -0.5, -0.5, -0.5, 1.0 ),
    vec4( -0.5,  0.5, -0.5, 1.0 ),
    vec4( 0.5,  0.5, -0.5, 1.0 ),
    vec4( 0.5, -0.5, -0.5, 1.0 ),
];

//*************************************	TORSO
var torsoId = 0;

var torsoHeight = 4.0;
var torsoWidth = 6.0;
//*************************************	HEAD
var headId  = 1;

var headHeight = 2.0;
var headWidth = 2.0;
//*************************************	LEGS
var leftFrontUpperLegId = 2;
var rightFrontUpperLegId = 4;
var leftBackUpperLegId = 6;
var rightBackUpperLegId = 8;

var upperLegHeight = 2.5;
var upperLegWidth  = 0.5;

var leftFrontLowerLegId = 3;
var rightFrontLowerLegId = 5;
var leftBackLowerLegId = 7;
var rightBackLowerLegId = 9;

var lowerLegHeight = 0.5; 
var lowerLegWidth  = 0.5;
//*************************************	TAIL
var tailId = 10;
var tailHeight = 1.0;
var tailWidth = 1.0;
//*************************************	FENCE
var fenceId1 = 11;
var fenceId2 = 12;
var fenceId3 = 13;
var fenceId4 = 14;

var fenceVerHeight = 2.5;
var fenceVerWidth = 1.0;
var fenceVerDepth = 1.5;
var fenceHorHeight = 0.5;
var fenceHorWidth = 1.0;
var fenceHorDepth = 9.0;

//*************************************	GRASS
var grassId = 15;
var grassHeight = 2.0;
var grassWidth = 200.0;

//********************************************************************	TO MOVE THE CAMERA
var radius = 50.0; 
var thetaV = 0.6;  
var phi = 0.0; 
var eye; 
var at = vec3(-1.0, -1.0, 1.0);
var up = vec3(0.0, 0.5, 0.0);

var near = 5.0;
var far = 100.0;
var fovy = 45.0;  		// Field-of-view in Y direction angle (in degrees)
var aspect = 1.0; 

//****************************************************************** TO TRANSLATE THE TORSO: 
//****************************************************************** mTorso[0]=x-axis mTorso[1]=y-axis mTorso[2]=z-axis
var mTorso = [-0.8, -3.5, 0]; 


//****************************************************************** NODES
var numNodes = 16; 
var theta = [0, 0, -180, 0, -180, 0, 180, 0, 180, 0, -45, 0, 180, 180, 180, 0];
		  //[to, h, l,   l,   l,  l,  l,  l,  l,  l, ta, f1, f2,   f3,  f4, g]
			
var stack = [];
var figure = [];

for( var i=0; i<numNodes; i++) figure[i] = createNode(null, null, null, null);


//****************************************************************** FOR TEXTURES
var texCoord = [
    vec2(0, 0),
    vec2(0, 1),
    vec2(1, 1),
    vec2(1, 0)
];

var textureWool;
var textureGrass;
var textureWood; 
var textureFace;
var textureBump;

var flagDownLeg = false;	
var flagGrass = false;
var flagWool = false;

//****************************************************************** FOR BUMP MAPPING
var texCoorSize = 256;
var rawData = new Uint32Array(texCoorSize*texCoorSize);
	for (var i=0; i<texCoorSize*texCoorSize; i++) rawData[i] = Math.floor(Math.random()* 250)+1;	// ritorna un numero random tra 1 e 500

// Bump Data
var data = new Array()
	for (var i = 0; i<= texCoorSize; i++)  data[i] = new Array();
	for (var i = 0; i<= texCoorSize; i++) for (var j=0; j<=texCoorSize; j++)
		data[i][j] = rawData[i*texCoorSize+j];
	

// Bump Map Normals
var normalst = new Array()
	for (var i=0; i<texCoorSize; i++)  normalst[i] = new Array();
	for (var i=0; i<texCoorSize; i++) for ( var j = 0; j < texCoorSize; j++)
		normalst[i][j] = new Array();
	for (var i=0; i<texCoorSize; i++) for ( var j = 0; j < texCoorSize; j++) {
		normalst[i][j][0] = data[i][j]-data[i+1][j];
		normalst[i][j][1] = data[i][j]-data[i][j+1];
		normalst[i][j][2] = 1;
	}
// Scale to Texture Coordinates
	for (var i=0; i<texCoorSize; i++) for (var j=0; j<texCoorSize; j++) {
	   var d = 0;
	   for(k=0;k<3;k++) d+=normalst[i][j][k]*normalst[i][j][k];
	   d = Math.sqrt(d);
	   for(k=0;k<3;k++) normalst[i][j][k]= 0.5*normalst[i][j][k]/d + 0.5;
	}

// Normal Texture Array
var normals = new Uint8Array(3*texCoorSize*texCoorSize);
	for (var i = 0; i < texCoorSize; i++)
		for (var j = 0; j < texCoorSize; j++)
		   for(var k =0; k<3; k++)
				normals[3*texCoorSize*i+3*j+k] = (texCoorSize-1)*normalst[i][j][k];
			
//*************************************	TEXTURE CONFIGURATION FUNCTION
function configureTexture(imageGrass, imageWood, imageWool, imageFace, bump) {

    textureGrass = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, textureGrass);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, imageGrass);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.uniform1i(gl.getUniformLocation(program, "uTextureGrass"), 0);
	
	textureWood = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, textureWood);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, imageWood);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.uniform1i(gl.getUniformLocation(program, "uTextureWood"), 1);
	
	textureWool = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, textureWool);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, imageWool);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.uniform1i(gl.getUniformLocation(program, "uTextureWool"), 2);
	
	textureFace = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, textureFace);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, imageFace);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.uniform1i(gl.getUniformLocation(program, "uTextureFace"), 3);
	
	textureBump = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, textureBump);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, texCoorSize, texCoorSize, 0, gl.RGB, gl.UNSIGNED_BYTE, bump);
	gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.uniform1i(gl.getUniformLocation(program, "uTextureBump"), 4);
}
//************************************* NODE CREATING FUNCTION
function createNode(transform, render, sibling, child){
    var node = {
		transform: transform,
		render: render,
		sibling: sibling,
		child: child,
    }
    return node;
}

//*************************************	INIT NODE FUNCTION
function initNodes(nodeId) {

    var m = mat4();	//to build the sheep
	var f = mat4();	//to build the fence
	var g = mat4();	//to build the grass

    switch(nodeId) {
		
		//*******************************************	BUILDING SHEEP HIERARCHICAL MODEL
		case torsoId:
			m = translate(mTorso[0], mTorso[1], mTorso[2])
			m = mult(m, rotate(theta[torsoId], vec3(0, 1, 0)));
			figure[torsoId] = createNode( m, torso, null, headId );
			break;

		case headId:
			m = translate(3.0, torsoHeight-0.5, 0.0);  
			m = mult(m, rotate(theta[headId], vec3(1, 0, 0)));
			figure[headId] = createNode( m, head, leftFrontUpperLegId, null);
			break;


		case leftFrontUpperLegId:
			m = translate ((torsoWidth/2)-0.3, 0.05*torsoWidth, 1.0); 
			m = mult(m, rotate(theta[leftFrontUpperLegId], vec3(0, 0, 1))); 
			figure[leftFrontUpperLegId] = createNode( m, leftFrontUpperLeg, rightFrontUpperLegId, leftFrontLowerLegId );
			break;

		case rightFrontUpperLegId: 
			m = translate((torsoWidth/2)-1.0, 0.05*torsoWidth, -1.0);
			m = mult(m, rotate(theta[rightFrontUpperLegId], vec3(0, 0, 1)));
			figure[rightFrontUpperLegId] = createNode( m, rightFrontUpperLeg, leftBackUpperLegId, rightFrontLowerLegId );
			break;

		case leftBackUpperLegId:
			m = translate(-((torsoWidth/2)-0.3), 0.05*torsoWidth, -1.0);
			m = mult(m , rotate(theta[leftBackUpperLegId], vec3(0, 0, 1)));
			figure[leftBackUpperLegId] = createNode( m, leftBackUpperLeg, rightBackUpperLegId, leftBackLowerLegId );
			break;

		case rightBackUpperLegId: 
			m = translate(-((torsoWidth/2)-1.0), 0.05*torsoWidth, 1.0);
			m = mult(m, rotate(theta[rightBackUpperLegId], vec3(0, 0, 1)));
			figure[rightBackUpperLegId] = createNode( m, rightBackUpperLeg, tailId, rightBackLowerLegId );
			break;
			
		case leftFrontLowerLegId:
			m = translate(0.0, upperLegHeight, 0.0);
			m = mult(m, rotate(theta[leftFrontLowerLegId], vec3(0, 0, 1)));
			figure[leftFrontLowerLegId] = createNode( m, leftFrontLowerLeg, null, null );
			break;
			
		case rightFrontLowerLegId:
			m = translate(0.0, upperLegHeight, 0.0);
			m = mult(m, rotate(theta[rightFrontLowerLegId], vec3(0, 0, 1)));
			figure[rightFrontLowerLegId] = createNode( m, rightFrontLowerLeg, null, null );
			break;

		case leftBackLowerLegId:
			m = translate(0.0, upperLegHeight, 0.0);
			m = mult(m, rotate(theta[leftBackLowerLegId],vec3(0, 0, 1)));
			figure[leftBackLowerLegId] = createNode( m, leftBackLowerLeg, null, null );
			break;

		case rightBackLowerLegId:
			m = translate(0.0, upperLegHeight, 0.0);
			m = mult(m, rotate(theta[rightBackLowerLegId],vec3(0, 0, 1)));
			figure[rightBackLowerLegId] = createNode( m, rightBackLowerLeg, null, null );
			break;
		
		case tailId:
			m = translate(-3.0, tailHeight+0.3*torsoHeight, 0.0);
			m = mult(m, rotate(theta[tailId], vec3(0, 0, 1)));
			figure[tailId] = createNode( m, tail, null, null );
			break;
			
		//*******************************************	BUILDING FENCE HIERARCHICAL MODEL
		case fenceId1:
			f = translate(5, -6.20, -1.0);
			f = mult(f, rotate(theta[fenceId1], vec3(0, 0, 1)));
			figure[fenceId1] = createNode( f, fenceHor, null, fenceId2 );
			break;
		case fenceId2:
			f = translate(0.0, fenceVerHeight+1.5, -3.5);
			f = mult(f, rotate(theta[fenceId2], vec3(0, 0, 1)));
			figure[fenceId2] = createNode( f, fenceVer, fenceId3, null );
			break;
		case fenceId3:
			f = translate(0.0, fenceVerHeight+1.5, 0.0);
			f = mult(f, rotate(theta[fenceId3], vec3(0, 0, 1)));
			figure[fenceId3] = createNode( f, fenceVer, fenceId4, null );
			break;
		case fenceId4:
			f = translate(0.0, fenceVerHeight+1.5, 3.5);
			f = mult(f, rotate(theta[fenceId4], vec3(0, 0, 1)));
			figure[fenceId4] = createNode( f, fenceVer, null, null );
			break;
		//*******************************************	BUILDING GRASS HIERARCHICAL MODEL
		case grassId:
			g = translate(5, -8.20, -1.0);
			g = mult(g, rotate(theta[grassId], vec3(0, 0, 1)));
			figure[grassId] = createNode( g, grass, null, null );
			break;
    }
}


//*************************************	TO VISIT HIERARCHICAL MODELS
function traverse(Id) {
   if(Id == null) return;
   stack.push(modelViewMatrix);
   modelViewMatrix = mult(modelViewMatrix, figure[Id].transform);
   figure[Id].render();
   if(figure[Id].child != null) traverse(figure[Id].child);
   modelViewMatrix = stack.pop();
   if(figure[Id].sibling != null) traverse(figure[Id].sibling);
}

//************************************* SHEEP BUILDING RENDERS
function torso() {
	flagWool = true;
	gl.uniform1f( gl.getUniformLocation(program, "uFlagTextureWool"), flagWool );
	
	instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.35*torsoWidth  , 0.0) );
    instanceMatrix = mult(instanceMatrix, scale( torsoWidth, torsoHeight, torsoHeight));
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix) );
    for(var i =0; i<6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4*i, 4);
	
	flagWool = false;
	gl.uniform1f( gl.getUniformLocation(program, "uFlagTextureWool"), flagWool );
}

function head() {
	flagWool = true;
	gl.uniform1f( gl.getUniformLocation(program, "uFlagTextureWool"), flagWool );
	
    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * headHeight, 0.0 ));
	instanceMatrix = mult(instanceMatrix, scale(headWidth, headHeight, headWidth) );
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix) );
    for(var i =0; i<6; i++){
		var flagFace = false;
		if(i==1){	// 	FACE OF THE CUBE CORRESPONDING TO SHEEP FACE (found with tests on cube faces number)
			flagFace = true;	
		}
		gl.uniform1f( gl.getUniformLocation(program, "uFlagTextureFace"), flagFace );
		gl.drawArrays(gl.TRIANGLE_FAN, 4*i, 4);
	}
	flagWool = false;
	gl.uniform1f( gl.getUniformLocation(program, "uFlagTextureWool"), flagWool );
}

function leftFrontUpperLeg() {
    flagWool = true;
	gl.uniform1f( gl.getUniformLocation(program, "uFlagTextureWool"), flagWool );
	
    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * upperLegHeight, 0.0) );
	instanceMatrix = mult(instanceMatrix, scale(upperLegWidth, upperLegHeight, upperLegWidth) );
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix) );
    for(var i =0; i<6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4*i, 4);
	
	flagWool = false;
	gl.uniform1f( gl.getUniformLocation(program, "uFlagTextureWool"), flagWool );
}

function leftFrontLowerLeg() {
    flagDownLeg = true;
    gl.uniform1f( gl.getUniformLocation(program, "uFlagTextureDownLeg"), flagDownLeg );
	
    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * lowerLegHeight, 0.0) );
	instanceMatrix = mult(instanceMatrix, scale(lowerLegWidth, lowerLegHeight, lowerLegWidth) );
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix) );
    for(var i =0; i<6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4*i, 4);
	
	flagDownLeg = false;
    gl.uniform1f( gl.getUniformLocation(program, "uFlagTextureDownLeg"), flagDownLeg );
}

function rightFrontUpperLeg() {
	flagWool = true;
	gl.uniform1f( gl.getUniformLocation(program, "uFlagTextureWool"), flagWool );
	
    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * upperLegHeight, 0.0) );
	instanceMatrix = mult(instanceMatrix, scale(upperLegWidth, upperLegHeight, upperLegWidth) );
	gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix) );
    for(var i =0; i<6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4*i, 4);
	
	flagWool = false;
	gl.uniform1f( gl.getUniformLocation(program, "uFlagTextureWool"), flagWool );
}

function rightFrontLowerLeg() {
	flagDownLeg = true;
    gl.uniform1f( gl.getUniformLocation(program, "uFlagTextureDownLeg"), flagDownLeg );
	
    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * lowerLegHeight, 0.0) );
	instanceMatrix = mult(instanceMatrix, scale(lowerLegWidth, lowerLegHeight, lowerLegWidth) );
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix) );
    for(var i =0; i<6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4*i, 4);
	
	flagDownLeg = false;
    gl.uniform1f( gl.getUniformLocation(program, "uFlagTextureDownLeg"), flagDownLeg );
}

function  leftBackUpperLeg() {
	flagWool = true;
	gl.uniform1f( gl.getUniformLocation(program, "uFlagTextureWool"), flagWool );
	
    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * upperLegHeight, 0.0) );
	instanceMatrix = mult(instanceMatrix, scale(upperLegWidth, upperLegHeight, upperLegWidth) );
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix) );
    for(var i =0; i<6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4*i, 4);
	
	flagWool = false;
	gl.uniform1f( gl.getUniformLocation(program, "uFlagTextureWool"), flagWool );
}

function leftBackLowerLeg() {
    flagDownLeg = true;
    gl.uniform1f( gl.getUniformLocation(program, "uFlagTextureDownLeg"), flagDownLeg );
    instanceMatrix = mult(modelViewMatrix, translate( 0.0, 0.5 * lowerLegHeight, 0.0) );
	instanceMatrix = mult(instanceMatrix, scale(lowerLegWidth, lowerLegHeight, lowerLegWidth) );
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix) );
    for(var i =0; i<6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4*i, 4);
	
	flagDownLeg = false;
    gl.uniform1f( gl.getUniformLocation(program, "uFlagTextureDownLeg"), flagDownLeg );
}

function rightBackUpperLeg() {
	flagWool = true;
	gl.uniform1f( gl.getUniformLocation(program, "uFlagTextureWool"), flagWool );
	
    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * upperLegHeight, 0.0) );
	instanceMatrix = mult(instanceMatrix, scale(upperLegWidth, upperLegHeight, upperLegWidth) );
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix) );
    for(var i =0; i<6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4*i, 4);
	
	flagWool = false;
	gl.uniform1f( gl.getUniformLocation(program, "uFlagTextureWool"), flagWool );
}

function rightBackLowerLeg() {
    flagDownLeg = true;
    gl.uniform1f( gl.getUniformLocation(program, "uFlagTextureDownLeg"), flagDownLeg );
	
    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * lowerLegHeight, 0.0) );
	instanceMatrix = mult(instanceMatrix, scale(lowerLegWidth, lowerLegHeight, lowerLegWidth) )
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix) );
    for(var i =0; i<6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4*i, 4);
	
	flagDownLeg = false;
    gl.uniform1f( gl.getUniformLocation(program, "uFlagTextureDownLeg"), flagDownLeg );
}

function tail(){
    flagWool = true;
	gl.uniform1f( gl.getUniformLocation(program, "uFlagTextureWool"), flagWool );
    
    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * tailHeight, 0.0) );
	instanceMatrix = mult(instanceMatrix, scale(tailWidth, tailHeight, tailWidth) )
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix) );
    for(var i =0; i<6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4*i, 4);
	
	flagWool = false;
	gl.uniform1f( gl.getUniformLocation(program, "uFlagTextureWool"), flagWool );
}
//************************************* FENCE BUILDING RENDERS
function fenceHor(){
	instanceMatrix = mult(modelViewMatrix, translate(0.0, fenceVerHeight, 0.0) );
	instanceMatrix = mult(instanceMatrix, scale(fenceHorWidth, fenceHorHeight, fenceHorDepth) )
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix) );
    for(var i =0; i<6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4*i, 4);
}
function fenceVer(){
	instanceMatrix = mult(modelViewMatrix, translate(0.0, fenceVerHeight, 0.0) );
	instanceMatrix = mult(instanceMatrix, scale(fenceVerWidth, fenceVerHeight, fenceVerDepth) )
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix) );
    for(var i =0; i<6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4*i, 4);
}

//************************************* GRASS BUILDING RENDERS
function grass() {
	flagGrass = true;
	gl.uniform1f( gl.getUniformLocation(program, "uFlagTextureGrass"), flagGrass );

    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * grassHeight, 0.0) );
	instanceMatrix = mult(instanceMatrix, scale(grassWidth, grassHeight, grassWidth) )
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix) );
    for(var i =0; i<6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4*i, 4);
	
	flagGrass = false;
	gl.uniform1f( gl.getUniformLocation(program, "uFlagTextureGrass"), flagGrass );
}


function quad(a, b, c, d) {
	var t1 = subtract(vertices[b], vertices[a]);
	var t2 = subtract(vertices[c], vertices[b]);	
	var normal = vec3(cross(t1, t2));
	var normalized = normalize(normal);
	normal = normalized;
	var tangent = vec3(t1[0],t1[1],t1[2]);
	
	
    pointsArray.push(vertices[a]);
	texCoordsArray.push(texCoord[0]);
	normalsArray.push(normal);
	tangentsArray.push(tangent);
	
    pointsArray.push(vertices[b]);
	texCoordsArray.push(texCoord[1]);
	normalsArray.push(normal);
	tangentsArray.push(tangent);
	
    pointsArray.push(vertices[c]);
	texCoordsArray.push(texCoord[2]);
	normalsArray.push(normal);
	tangentsArray.push(tangent);
	
    pointsArray.push(vertices[d]);
	texCoordsArray.push(texCoord[3]);
	normalsArray.push(normal);
	tangentsArray.push(tangent);
	
}


function cube(){
    quad( 1, 0, 3, 2 );
    quad( 2, 3, 7, 6 );
    quad( 3, 0, 4, 7 );
    quad( 6, 5, 1, 2 );
    quad( 4, 5, 6, 7 );
    quad( 5, 4, 0, 1 );
}


window.onload = function init() {

    canvas = document.getElementById( "gl-canvas" );

    gl = canvas.getContext('webgl2');
    if (!gl) { alert( "WebGL 2.0 isn't available" ); }

    gl.viewport( 0, 0, canvas.width, canvas.height );
	gl.clearColor( 0.53, 0.80, 0.92, 1.0 );			//TO SET THE SKY COLOR

    //
    //  Load shaders and initialize attribute buffers
    //
    program = initShaders( gl, "vertex-shader", "fragment-shader");

    gl.useProgram(program);
	
	gl.enable(gl.DEPTH_TEST);

    instanceMatrix = mat4();

	projectionMatrix = mat4();
	
    modelViewMatrix = mat4();


    gl.uniformMatrix4fv(gl.getUniformLocation( program, "modelViewMatrix"), false, flatten(modelViewMatrix)  );
    gl.uniformMatrix4fv( gl.getUniformLocation( program, "projectionMatrix"), false, flatten(projectionMatrix)  );

    modelViewMatrixLoc = gl.getUniformLocation(program, "modelViewMatrix")

	//****************************************************************** IMAGES FOR TEXTURE 

    var imageGrass = document.getElementById("textureGrass");
	var imageWood = document.getElementById("textureWood");
    var imageWool = document.getElementById("textureWool");
	var imageFace = document.getElementById("textureFace");

	

    cube();

    var vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
    gl.bufferData(gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW);
	
	var positionLoc = gl.getAttribLocation( program, "aPosition" );
    gl.vertexAttribPointer( positionLoc, 4, gl.FLOAT, false, 0, 0 );
	gl.enableVertexAttribArray( positionLoc );
	
	//****************************************************************** TEXTURE COORDINATES
	var tBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, tBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(texCoordsArray), gl.STATIC_DRAW);
	
    var texCoordLoc = gl.getAttribLocation(program, "aTexCoord");
    gl.vertexAttribPointer(texCoordLoc, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(texCoordLoc);
	
	//****************************************************************** NORMAL COORDINATES
	var nBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(normalsArray), gl.STATIC_DRAW);
	
	var normalLoc = gl.getAttribLocation(program, "aNormal");
	gl.vertexAttribPointer(normalLoc, 3, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(normalLoc);
	
	//****************************************************************** TANGENT ARRAY
	var tBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, tBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(tangentsArray), gl.STATIC_DRAW);
	
	var tangentLoc = gl.getAttribLocation(program, "aTangent");
	gl.vertexAttribPointer(tangentLoc, 3, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(tangentLoc);
	
	
	//****************************************************************** LIGHT COMPUTATION
	
	var diffuseProduct = mult(lightDiffuse, materialDiffuse);
    gl.uniform4fv( gl.getUniformLocation(program, "uDiffuseProduct"), diffuseProduct);
	
	//****************************************************************** BUTTONS + SLIDERS
	document.getElementById("Start").onclick = function(event) {
        setInterval(function() { go(); }, 120);
    };

    document.getElementById("Reset").onclick = function(event) {
        reset();
    };
	
	document.getElementById("radiusSlider").onchange = function(event) {
		radius = parseFloat(event.target.value);
	};
	
	document.getElementById("thetaSlider").onchange = function(event) {
		thetaV = parseFloat(event.target.value) * Math.PI/180.0;
	};
	
	document.getElementById("phiSlider").onchange = function(event) {
		phi = parseFloat(event.target.value) * Math.PI/180.0;
	};

	document.getElementById("zFarSlider").onchange = function(event) {
		far = parseFloat(event.target.value);
	};
	document.getElementById("zNearSlider").onchange = function(event) {
		near = parseFloat(event.target.value);
	};
	document.getElementById("fovSlider").onchange = function(event) {
		fovy = parseFloat(event.target.value);
	};
	
	//****************************************************************** CONFIGURATION TEXTURES
	configureTexture(imageGrass, imageWood, imageWool, imageFace, normals);
	
	gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, textureGrass);
	
	gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, textureWood);
	
	gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, textureWool);
	
	gl.activeTexture(gl.TEXTURE3);
    gl.bindTexture(gl.TEXTURE_2D, textureFace);
	
	gl.activeTexture(gl.TEXTURE4);
    gl.bindTexture(gl.TEXTURE_2D, textureBump);
	
    for(i=0; i<numNodes; i++) initNodes(i);

    render();
}

var walk = true;
var forth = true;
function go(){
	if(walk){
		if(mTorso[0]<0.52){
			
			mTorso[0] += 0.2;
            initNodes(torsoId);
			
			if(forth){
				
				theta[leftFrontUpperLegId] += -10;
				initNodes(leftFrontUpperLegId);

				theta[rightFrontUpperLegId] += 10;
				initNodes(rightFrontUpperLegId);

				theta[leftBackUpperLegId] += -10;
				initNodes(leftBackUpperLegId);

				theta[rightBackUpperLegId] += 10;
				initNodes(rightBackUpperLegId);
				
				if (theta[leftFrontUpperLegId] == -190) forth = false;
			}
			else{
				
				theta[leftFrontUpperLegId] += 10;
				initNodes(leftFrontUpperLegId);

				theta[rightFrontUpperLegId] += -10;
				initNodes(rightFrontUpperLegId);

				theta[leftBackUpperLegId] += 10;
				initNodes(leftBackUpperLegId);

				theta[rightBackUpperLegId] += -10;
				initNodes(rightBackUpperLegId);
				
				if (theta[leftFrontUpperLegId] == -180) forth = true;
			}
		}
		else{			// at the end of the walk, sheep stands on straight legs
			theta[leftFrontUpperLegId] += 10;
			initNodes(leftFrontUpperLegId);

			theta[rightFrontUpperLegId] += -10;
			initNodes(rightFrontUpperLegId);

			theta[leftBackUpperLegId] += 10;
			initNodes(leftBackUpperLegId);

			theta[rightBackUpperLegId] += -10;
			initNodes(rightBackUpperLegId);
			
			walk = false;
		}
	}
	else{
		
		if (mTorso[0] < 9.77) {
			mTorso[1] = -4.5 + 6.5* Math.sin(0.305*mTorso[0]);
			mTorso[0] += 0.25;
			initNodes(torsoId);
			if(mTorso[0] <= 5.0){			// till the jump doesn't get the maximum height, the legs are back sloped
				theta[leftFrontUpperLegId] += 2;
				initNodes(leftFrontUpperLegId);

				theta[rightFrontUpperLegId] += 2;
				initNodes(rightFrontUpperLegId);

				theta[leftBackUpperLegId] += 2;
				initNodes(leftBackUpperLegId);

				theta[rightBackUpperLegId] += 2;
				initNodes(rightBackUpperLegId);
			}
			if(mTorso[0] > 5.0){
				theta[leftFrontUpperLegId] += -2;
				initNodes(leftFrontUpperLegId);
				
				theta[rightFrontUpperLegId] += -2;
				initNodes(rightFrontUpperLegId);

				theta[leftBackUpperLegId] += -2;
				initNodes(leftBackUpperLegId);

				theta[rightBackUpperLegId] += -2;
				initNodes(rightBackUpperLegId);
			}

		}
		else{
			mTorso[1] = -3.5;	// look at the report for the explanation of this part
			initNodes(torsoId);
			theta[leftFrontUpperLegId] = -180;
			initNodes(leftFrontUpperLegId);

			theta[rightFrontUpperLegId] = -180;
			initNodes(rightFrontUpperLegId);

			theta[leftBackUpperLegId] = 180;
			initNodes(leftBackUpperLegId);

			theta[rightBackUpperLegId] = 180;
			initNodes(rightBackUpperLegId);
		}
	}
}

function reset(){
    window.location.reload();
}

var render = function() {

        gl.clear( gl.COLOR_BUFFER_BIT| gl.DEPTH_BUFFER_BIT  );

		gl.uniform1f( gl.getUniformLocation(program, "uFlagTextureGrass"), flagGrass );
		gl.uniform1f( gl.getUniformLocation(program, "uFlagTextureWool"), flagWool );
		gl.uniform1f( gl.getUniformLocation(program, "textureDownLeg"), flagDownLeg );
		
		
		eye = vec3(radius*Math.sin(thetaV) * Math.cos(phi), radius * Math.sin(thetaV) * Math.sin(phi), radius * Math.cos(thetaV));
		modelViewMatrix = lookAt(eye, at, up);
		gl.uniformMatrix4fv(gl.getUniformLocation(program, "modelViewMatrix"), false, flatten(modelViewMatrix));
		
		projectionMatrix = perspective(fovy, aspect, near, far);
		gl.uniformMatrix4fv(gl.getUniformLocation(program, "projectionMatrix"), false, flatten(projectionMatrix));
		
		nMatrix = normalMatrix(modelViewMatrix, true);
		gl.uniformMatrix3fv( gl.getUniformLocation(program, "uNormalMatrix"), false, flatten(nMatrix));
		
		
		traverse(grassId);
        traverse(torsoId);
		traverse(fenceId1);
        requestAnimationFrame(render);
}
