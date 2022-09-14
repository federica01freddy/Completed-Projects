"use strict";

var shadedCube = function() {

	var canvas;
	var gl;

	var numPositions = 120; // [(2*3)*6]*2+(4*3)*4   
							//	2 parallelepipedi, ogni parallelepipedi 6 facce, ogni faccia 2 triangoli, ogni triangolo 3 vertici; 
							//  4 piramidi, ogni piramide 4 triangoli, ogni triangolo 3 vertici
	var positionsArray = [];
	var normalsArray = [];
	var textCoordArray = [];


	var vertices = [
			vec4(-0.5, -0.5,  0.25, 1.0),		//0			
			vec4(-0.5, 0.0, 0.25, 1.0),			//1				
			vec4(0.5,  0.0,  0.25, 1.0),		//2			
			vec4(0.5, -0.5,  0.25, 1.0),		//3			
			vec4(-0.5, -0.5, -0.25, 1.0),		//4				
			vec4(-0.5,  0.0, -0.25, 1.0),		//5			
			vec4(0.5,  0.0, -0.25, 1.0),		//6			
			vec4(0.5, -0.5, -0.25, 1.0),		//7				
			
			vec4(-0.25, -0.5,  0.25, 1.0),		//8			
			vec4(-0.25, 0.5, 0.25, 1.0),		//9			
			vec4(0.25,  0.5,  0.25, 1.0),		//10		
			vec4(0.25, -0.5,  0.25, 1.0),		//11		
			vec4(-0.25, -0.5, -0.25, 1.0),		//12		
			vec4(-0.25,  0.5, -0.25, 1.0),		//13		
			vec4(0.25,  0.5, -0.25, 1.0),		//14		
			vec4(0.25, -0.5, -0.25, 1.0),		//15		
			
			vec4(-0.75, -0.25, 0.0, 1.0),		//16			
			vec4(0.75, -0.25, 0.0, 1.0),		//17
			vec4(0.0, 0.75, 0.0, 1.0),			//18	
			vec4(0.0, -0.75, 0.0, 1.0),			//19
			
			vec4(-0.25, 0, 0.25, 1.0),			//20
			vec4(0.25, 0, 0.25, 1.0),			//21
			vec4(0.25, 0, -0.25, 1.0),			//22
			vec4(-0.25, 0, -0.25, 1.0)			//23	
		]

	var textureCoordinates = [
			vec2(0, 0),
			vec2(0, 1),
			vec2(1, 1),
			vec2(1, 0)
		]

	//********************************************************************	POINT LIGHTS FOR THE CYLINDRICAL NEON
	var neonLightPosition1 = vec4(0.15, 0.3, 2.0, 1.0 );	//I
	var neonLightPosition2 = vec4(0.15, 0.1, 2.0, 1.0 );	//L
	var neonLightPosition3 = vec4(0.15, -0.1, 2.0, 1.0 );	//M

	// HERE THE PARAMETERS AMBIENT, DIFFUSE, SPECULAR ARE THE SAME FOR ALL THE 3 LIGHTS BECAUSE THEY MAKE A UNIQUE NEON LIGHT
	var neonLightAmbient = vec4(1.0, 0.0, 0.0, 1.0 );	
	var neonLightDiffuse = vec4(1.0, 0.2, 0.0, 1.0 );
	var neonLightSpecular = vec4(0.3, 0.7, 0.5, 1.0 );

	//********************************************************************	MATERIAL PROPERTIES 
	var materialAmbient = vec4(1.0,0.05,0.0,1.0);
	var materialDiffuse = vec4(0.4,0.5,0.4,1.0);
	var materialSpecular = vec4(1.0,1.0,1.0,1.0);
	var materialShininess = 40.0;

	var neonEmission = vec4(1.0, 0.5, 0.0, 1.0);    //ONLY FOR THE CYLINDER BECAUSE IT IS LIKE A LIGHT SOURCE


	//********************************************************************	MATRICES
	var modelViewMatrix, projectionMatrix, rotationalMatrix;
	var modelViewMatrixLoc, projectionMatrixLoc;


	var program;

	var xAxis = 0;
	var yAxis = 1;
	var zAxis = 2;
	var axis = 0;
	var theta = vec3(0, 0, 0);

	//********************************************************************	FLAGS
	var flag = false;
	var switchFlag = false;
	var neonFlag = false;
	var cFlag = false;
	var texFlag = false;
	var direction_flag = false;

	//***************************************** 

	var barycenter; 

	//********************************************************************	MODEL VIEW MATRIX COMPUTATION
	var eye; 
	var at = vec3(0.0, 0.0, 0.0);
	var up = vec3(0.0, 1.0, 0.0);

	//********************************************************************	EYE POSITION COMPUTATION
	var radius = 2.5;
	var thetaV = 0.0; 
	var phi = 0.2;

	//********************************************************************	PROJECTION MATRIX COMPUTATION
	var near = 0.3;
	var far = 3.0;
	var dr = 5.0 * Math.PI/180.0;
	var fovy = 45.0;  		// Field-of-view in Y direction angle (in degrees)
	var aspect = 1.0;       // Viewport aspect ratio



	//******************************************************************	VARIABLES FOR CYLIDER
	var pointsCyl = [];	
	var normalsCyl = [];
	var texCoordCyl = [];
	var nCylinder;

	//******************************************************************	FOR BUMP MAPPING + APPLYING TEXTURE
	var texCoorSize = 256;
	var rawData = new Uint32Array(texCoorSize*texCoorSize);
		for (var i=0; i<texCoorSize*texCoorSize; i++) rawData[i] = Math.floor(Math.random()* 500)+1;	// ritorna un numero random tra 1 e 500

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

	function configureTexture( image ) {
		var texture = gl.createTexture();
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, texture);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, texCoorSize, texCoorSize, 0, gl.RGB, gl.UNSIGNED_BYTE, image);
		gl.generateMipmap(gl.TEXTURE_2D);
	}


	init();



	function quad(a, b, c, d) {
		
		var t1 = subtract(vertices[b], vertices[a]);
		var t2 = subtract(vertices[c], vertices[b]);	
		var normal = vec3(cross(t1, t2));
		var normalized = normalize(normal);
		normal = normalized;

		positionsArray.push(vertices[a]);
		normalsArray.push(normal);
		textCoordArray.push(textureCoordinates[0]);


		positionsArray.push(vertices[b]);
		normalsArray.push(normal);
		textCoordArray.push(textureCoordinates[1]);

		positionsArray.push(vertices[c]);
		normalsArray.push(normal);
		textCoordArray.push(textureCoordinates[2]);

		positionsArray.push(vertices[a]);
		normalsArray.push(normal);
		textCoordArray.push(textureCoordinates[0]);

		positionsArray.push(vertices[c]);
		normalsArray.push(normal);
		textCoordArray.push(textureCoordinates[2]);

		positionsArray.push(vertices[d]);
		normalsArray.push(normal);
		textCoordArray.push(textureCoordinates[3]);
	}

	function triangle(a, b, c) {
		
		var t1 = subtract(vertices[b], vertices[a]);
		var t2 = subtract(vertices[c], vertices[b]);
		var normal = vec3(cross(t1, t2));
		var normalized = normalize(normal);
		normal = normalized;

		positionsArray.push(vertices[a]);
		normalsArray.push(normal);
		textCoordArray.push(textureCoordinates[0]);

		positionsArray.push(vertices[b]);
		normalsArray.push(normal);
		textCoordArray.push(textureCoordinates[1]);

		positionsArray.push(vertices[c]);
		normalsArray.push(normal);
		textCoordArray.push(textureCoordinates[2]);
	}

	function compBarycenter(){
		var x = 0;
		var y = 0;
		var z = 0;
		for (let v of vertices){
			x += v[0];
			y += v[1];
			z += v[2];
		}
		barycenter = vec3(x/vertices.length, y/vertices.length, z/vertices.length);
		//console.log(barycenter);
	}


	function colorCube()
	{	
		// FRONT OF THE OBJECT
		quad(1,0,3,2);	
		quad(9, 8, 11, 10);	
		triangle(18,9,10); 
		triangle(16,0,1); 
		triangle(17,2,3);	
		triangle(19,11,8); 
		
		// BACK
		quad(12, 13, 14, 15);	
		quad(4,5,6,7);	
		triangle(18,14,13);
		triangle(19,12,15); 
		triangle(17,7,6); 
		triangle(16,5,4); 
		
		// LEFT
		quad(0,1,5,4);	
		quad(13, 12, 8, 9);		
		triangle(16,1,5);	
		
		// RIGHT
		quad(10, 11, 15, 14);	
		quad(2,3,7,6);	
		triangle(17,6,2);
		
		// UNDER
		quad(11, 8, 12, 15);	
		quad(4,7,3,0);	
		triangle(16,4,0);	
		triangle(17,3,7);
		triangle(19,8,12);
		triangle(19,15,11);
			
		// TOP
		quad(14, 13, 9, 10);	
		quad(5,1,2,6);   
		triangle(18,13,9);
		triangle(18,10,14);
	}

	function init() {
		canvas = document.getElementById("gl-canvas");

		gl = canvas.getContext('webgl2');
		if (!gl) alert( "WebGL 2.0 isn't available");


		gl.viewport(0, 0, canvas.width, canvas.height);
		gl.clearColor(1.0, 1.0, 1.0, 1.0);

		gl.enable(gl.DEPTH_TEST);

		//
		//  Load shaders and initialize attribute buffers
		//
		program = initShaders(gl, "vertex-shader", "fragment-shader");
		gl.useProgram(program);

		colorCube();

		var myCylinder = cylinder(72, 3, true);  //cylinder(numSlices, numStacks, caps)
		myCylinder.translate(0.20, 0.0, 1.0);	 //translate(dx, dy, dz)
		pointsCyl = myCylinder.TriangleVertices;
		normalsCyl = myCylinder.TriangleNormals;
		texCoordCyl = myCylinder.TextureCoordinates;
		
		nCylinder = myCylinder.TriangleVertices.length;
		
		positionsArray = positionsArray.concat(pointsCyl);
		textCoordArray = textCoordArray.concat(texCoordCyl);
		normalsArray = normalsArray.concat(normalsCyl);

		//console.log(positionsArray.length);
		//console.log(normalsArray.length);
		//console.log(textCoordArray.length);
		
	//********************************************************************************************
		compBarycenter();
	//********************************************************************************************
		

		var nBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, flatten(normalsArray), gl.STATIC_DRAW);

		var normalLoc = gl.getAttribLocation(program, "aNormal");
		gl.vertexAttribPointer(normalLoc, 3, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(normalLoc);

		var vBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, flatten(positionsArray), gl.STATIC_DRAW);

		var positionLoc = gl.getAttribLocation(program, "aPosition");
		gl.vertexAttribPointer(positionLoc, 4, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(positionLoc);
		
		var tBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, tBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, flatten(textCoordArray), gl.STATIC_DRAW);

		var tLoc = gl.getAttribLocation(program, "aTextCoord");
		gl.vertexAttribPointer(tLoc, 2, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(tLoc);
		
	//********************************************************************************	SLIDERS
		document.getElementById("radiusSlider").onchange = function(event) {
			radius = event.target.value;
		};
		document.getElementById("thetaSlider").onchange = function(event) {
			thetaV = event.target.value * Math.PI/180.0;
		};
		document.getElementById("phiSlider").onchange = function(event) {
			phi = event.target.value * Math.PI/180.0;
		};
		document.getElementById("zFarSlider").onchange = function(event) {
			far = event.target.value;
		};
		document.getElementById("zNearSlider").onchange = function(event) {
			near = event.target.value;
		};
		document.getElementById("aspectSlider").onchange = function(event) {
			aspect = event.target.value;
		};
		document.getElementById("fovSlider").onchange = function(event) {
			fovy = event.target.value;
		};
		
	//********************************************************************************	BUTTONS	
		document.getElementById("ButtonS").onclick = function(){
		  var idButton = document.getElementById("ButtonS");
		  if(idButton.innerHTML == "Switch on per-fragment shading"){
			  idButton.innerHTML = "Switch off per-fragment shading";
		  }
		  else{
			  idButton.innerHTML = "Switch on per-fragment shading";
		  }
		  switchFlag = !switchFlag;
		  gl.uniform1f(gl.getUniformLocation(program,"uFflag"), switchFlag);
		};
		document.getElementById("ButtonN").onclick = function(){
		  var idButton = document.getElementById("ButtonN");
		  if(idButton.innerHTML == "Turn on neon light"){
			  idButton.innerHTML = "Turn off neon light";
		  }
		  else{
			  idButton.innerHTML = "Turn on neon light";
		  }
		  neonFlag = !neonFlag;
		  gl.uniform1f(gl.getUniformLocation(program,"uNflag"), neonFlag);
		};
		document.getElementById("ButtonTex").onclick = function(){
			configureTexture(normals);
			var idButton = document.getElementById("ButtonTex");
			if(idButton.innerHTML == "Activate texture"){
				idButton.innerHTML = "Deactivate texture";
			}
			else{
				idButton.innerHTML = "Activate texture";
			}
			texFlag=!texFlag;
			gl.uniform1f(gl.getUniformLocation(program,"uTflag"), texFlag);
		};
		document.getElementById("ButtonX").onclick = function(){axis = xAxis;};
		document.getElementById("ButtonY").onclick = function(){axis = yAxis;};
		document.getElementById("ButtonZ").onclick = function(){axis = zAxis;};
		document.getElementById("ButtonT").onclick = function(){flag = !flag;};
		document.getElementById("ButtonD").onclick = function(){direction_flag = !direction_flag;};
		
		
	//********************************************************************************		FOR THE THREE POINT LIGHTS IN THE NEON
		var ambientProductNeon = mult(neonLightAmbient, materialAmbient);
		var diffuseProductNeon = mult(neonLightDiffuse, materialDiffuse);
		var specularProductNeon = mult(neonLightSpecular, materialSpecular);
		
		gl.uniform4fv(gl.getUniformLocation(program, "uAmbientProductNeon"), ambientProductNeon );
		gl.uniform4fv(gl.getUniformLocation(program, "uDiffuseProductNeon"), diffuseProductNeon );
		gl.uniform4fv(gl.getUniformLocation(program, "uSpecularProductNeon"), specularProductNeon );
		gl.uniform4fv(gl.getUniformLocation(program, "uNeonPosition1"), neonLightPosition1 );
		gl.uniform4fv(gl.getUniformLocation(program, "uNeonPosition2"), neonLightPosition2 );
		gl.uniform4fv(gl.getUniformLocation(program, "uNeonPosition3"), neonLightPosition3 );
		
		gl.uniform1f(gl.getUniformLocation(program, "uShininess"), materialShininess);



		modelViewMatrixLoc = gl.getUniformLocation(program, "uModelViewMatrix");
		projectionMatrixLoc = gl.getUniformLocation(program, "uProjectionMatrix");
		gl.uniform4fv( gl.getUniformLocation(program, "uNormal"), vec4(0.0, 1.0, 0.0, 0.0));
		gl.uniform3fv( gl.getUniformLocation(program, "uObjTangent"), vec3(1.0, 0.0, 0.0));

		render();
	}

	function render(){

		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		
		
		if(flag && direction_flag) theta[axis] += 2.0;
		if(flag && !direction_flag) theta[axis] -= 2.0;

		rotationalMatrix = mat4(); 
		rotationalMatrix = mult(translate(barycenter[0],barycenter[1],barycenter[2]), rotationalMatrix);
		rotationalMatrix = mult(rotationalMatrix, rotate(theta[xAxis], vec3(1, 0, 0)));
		rotationalMatrix = mult(rotationalMatrix, rotate(theta[yAxis], vec3(0, 1, 0)));
		rotationalMatrix = mult(rotationalMatrix, rotate(theta[zAxis], vec3(0, 0, 1)));
		rotationalMatrix = mult(rotationalMatrix, translate(-barycenter[0],-barycenter[1],-barycenter[2]));
		gl.uniformMatrix4fv(gl.getUniformLocation(program, "uRotationalMatrix"), false, flatten(rotationalMatrix));
		
		var NormalMatrix = normalMatrix(rotationalMatrix, true);
		gl.uniformMatrix3fv( gl.getUniformLocation(program, "uNormalMatrix"), false, flatten(NormalMatrix));
		
		eye = vec3(radius*Math.sin(thetaV) * Math.cos(phi), radius * Math.sin(thetaV) * Math.sin(phi), radius * Math.cos(thetaV));
		var modelViewMatrixCyl = lookAt(eye, at, up);
		gl.uniformMatrix4fv(gl.getUniformLocation(program, "uModelViewMatrixCyl"), false, flatten(modelViewMatrixCyl));
		
		projectionMatrix = perspective(fovy, aspect, near, far);
		gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix));
		
		modelViewMatrix = mult(modelViewMatrixCyl, rotationalMatrix);	// model view matrix of the object
		gl.uniformMatrix4fv(gl.getUniformLocation(program, "uModelViewMatrix"), false, flatten(modelViewMatrix));

		gl.drawArrays(gl.TRIANGLES, 0, numPositions);	// DRAW THE OBJECT
		
		//******************************************************************	WORKING ON THE CYLINDER
		cFlag=!cFlag;	
		gl.uniform1f(gl.getUniformLocation(program,"uCflag"), cFlag);
		
		gl.uniform4fv( gl.getUniformLocation(program, "uEmission"), neonEmission );
		
		gl.drawArrays( gl.TRIANGLES, numPositions, nCylinder);	//DRAW THE CYLINDER
		
		cFlag=!cFlag;
		gl.uniform1f(gl.getUniformLocation(program,"uCflag"), cFlag);

		requestAnimationFrame(render);
	}

}

shadedCube();

//********************************************************************************	CYLINDER FUNCTION
function cylinder(numSlices, numStacks, caps) {

	var slices = 36;
	if(numSlices) slices = numSlices;
	var stacks = 1;
	if(numStacks) stacks = numStacks;
	var capsFlag = true;
	if(caps==false) capsFlag = caps;

	var data = {};

	var top = 0.4; //0.6; //0.5;
	var bottom = -0.2; //-0.4; //-0.5;
	var radius = 0.05; //0.2; //0.5;
	var topCenter = [0.15, top, 1]; //[0.0, top, 0.0];
	var bottomCenter = [0.15, bottom, 1]; //[0.0, bottom, 0.0];


	var sideColor = [1.0, 0.0, 0.0, 1.0];
	var topColor = [0.0, 1.0, 0.0, 1.0];
	var bottomColor = [0.0, 0.0, 1.0, 1.0];


	var cylinderVertexCoordinates = [];
	var cylinderNormals = [];
	var cylinderVertexColors = [];
	var cylinderTextureCoordinates = [];

	// side

	for(var j=0; j<stacks; j++) {
	  var stop = bottom + (j+1)*(top-bottom)/stacks;
	  var sbottom = bottom + j*(top-bottom)/stacks;
	  var topPoints = [];
	  var bottomPoints = [];
	  var topST = [];
	  var bottomST = [];
	  for(var i =0; i<slices; i++) {
		var theta = 2.0*i*Math.PI/slices;
		topPoints.push([radius*Math.sin(theta), stop, radius*Math.cos(theta), 1.0]);
		bottomPoints.push([radius*Math.sin(theta), sbottom, radius*Math.cos(theta), 1.0]);
	  };

	  topPoints.push([0.0, stop, radius, 1.0]);
	  bottomPoints.push([0.0,  sbottom, radius, 1.0]);


	  for(var i=0; i<slices; i++) {
		var a = topPoints[i];
		var d = topPoints[i+1];
		var b = bottomPoints[i];
		var c = bottomPoints[i+1];
		var u = [b[0]-a[0], b[1]-a[1], b[2]-a[2]];
		var v = [c[0]-b[0], c[1]-b[1], c[2]-b[2]];

		var normal = [
		  u[1]*v[2] - u[2]*v[1],
		  u[2]*v[0] - u[0]*v[2],
		  u[0]*v[1] - u[1]*v[0]
		];

		var mag = Math.sqrt(normal[0]*normal[0] + normal[1]*normal[1] + normal[2]*normal[2])
		normal = [normal[0]/mag, normal[1]/mag, normal[2]/mag];
		cylinderVertexCoordinates.push([a[0], a[1], a[2], 1.0]);
		cylinderVertexColors.push(sideColor);
		cylinderNormals.push([normal[0], normal[1], normal[2]]);
		cylinderTextureCoordinates.push([(i+1)/slices, j*(top-bottom)/stacks]);

		cylinderVertexCoordinates.push([b[0], b[1], b[2], 1.0]);
		cylinderVertexColors.push(sideColor);
		cylinderNormals.push([normal[0], normal[1], normal[2]]);
		cylinderTextureCoordinates.push([i/slices, (j-1)*(top-bottom)/stacks]);

		cylinderVertexCoordinates.push([c[0], c[1], c[2], 1.0]);
		cylinderVertexColors.push(sideColor);
		cylinderNormals.push([normal[0], normal[1], normal[2]]);
		cylinderTextureCoordinates.push([(i+1)/slices, (j-1)*(top-bottom)/stacks]);

		cylinderVertexCoordinates.push([a[0], a[1], a[2], 1.0]);
		cylinderVertexColors.push(sideColor);
		cylinderNormals.push([normal[0], normal[1], normal[2]]);
		cylinderTextureCoordinates.push([(i+1)/slices, j*(top-bottom)/stacks]);

		cylinderVertexCoordinates.push([c[0], c[1], c[2], 1.0]);
		cylinderVertexColors.push(sideColor);
		cylinderNormals.push([normal[0], normal[1], normal[2]]);
		cylinderTextureCoordinates.push([(i+1)/slices, (j-1)*(top-bottom)/stacks]);

		cylinderVertexCoordinates.push([d[0], d[1], d[2], 1.0]);
		cylinderVertexColors.push(sideColor);
		cylinderNormals.push([normal[0], normal[1], normal[2]]);
		cylinderTextureCoordinates.push([(i+1)/slices, j*(top-bottom)/stacks]);
	  };
	};

	  var topPoints = [];
	  var bottomPoints = [];
	  for(var i =0; i<slices; i++) {
		var theta = 2.0*i*Math.PI/slices;
		topPoints.push([radius*Math.sin(theta), top, radius*Math.cos(theta), 1.0]);
		bottomPoints.push([radius*Math.sin(theta), bottom, radius*Math.cos(theta), 1.0]);
	  };
	  topPoints.push([0.0, top, radius, 1.0]);
	  bottomPoints.push([0.0,  bottom, radius, 1.0]);

	if(capsFlag) {

	//top

	for(i=0; i<slices; i++) {
	  normal = [0.0, 1.0, 0.0];
	  var a = [0.0, top, 0.0, 1.0];
	  var b = topPoints[i];
	  var c = topPoints[i+1];
	  cylinderVertexCoordinates.push([a[0], a[1], a[2], 1.0]);
	  cylinderVertexColors.push(topColor);
	  cylinderNormals.push(normal);
	  cylinderTextureCoordinates.push([0, 1]);

	  cylinderVertexCoordinates.push([b[0], b[1], b[2], 1.0]);
	  cylinderVertexColors.push(topColor);
	  cylinderNormals.push(normal);
	  cylinderTextureCoordinates.push([0, 1]);

	  cylinderVertexCoordinates.push([c[0], c[1], c[2], 1.0]);
	  cylinderVertexColors.push(topColor);
	  cylinderNormals.push(normal);
	  cylinderTextureCoordinates.push([0, 1]);
	};

	//bottom

	for(i=0; i<slices; i++) {
	  normal = [0.0, -1.0, 0.0];
	  var a = [0.0, bottom, 0.0, 1.0];
	  var b = bottomPoints[i];
	  var c = bottomPoints[i+1];
	  cylinderVertexCoordinates.push([a[0], a[1], a[2], 1.0]);
	  cylinderVertexColors.push(bottomColor);
	  cylinderNormals.push(normal);
	  cylinderTextureCoordinates.push([0, 1]);

	  cylinderVertexCoordinates.push([b[0], b[1], b[2], 1.0]);
	  cylinderVertexColors.push(bottomColor);
	  cylinderNormals.push(normal);
	  cylinderTextureCoordinates.push([0, 1]);

	  cylinderVertexCoordinates.push([c[0], c[1], c[2], 1.0]);
	  cylinderVertexColors.push(bottomColor);
	  cylinderNormals.push(normal);
	  cylinderTextureCoordinates.push([0, 1]);
	};

	};
	function translate(x, y, z){
	   for(var i=0; i<cylinderVertexCoordinates.length; i++) {
		 cylinderVertexCoordinates[i][0] += x;
		 cylinderVertexCoordinates[i][1] += y;
		 cylinderVertexCoordinates[i][2] += z;
	   };
	}


	data.TriangleVertices = cylinderVertexCoordinates;
	data.TriangleNormals = cylinderNormals;
	data.TriangleVertexColors = cylinderVertexColors;
	data.TextureCoordinates = cylinderTextureCoordinates;
	data.translate = translate;
	return data;

}
