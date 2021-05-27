const gl = require("gl");
const { initWebglProgram } = require("./utils.mjs");
const width = 4;
const height = 4;
const glContext = gl(width, height, { preserveDrawingBuffer: true });
const vsSource = `
attribute vec3 a_Position;
void main() {
  gl_Position = a_Position;
}
`;
const fsSource = `
precision mediump float;
void main() {
  gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
}
`;
const glProgram = initWebglProgram({
  gl: glContext,
  vsSource,
  fsSource,
});

glContext.clearColor(0, 0, 0, 0);
glContext.clear(glContext.COLOR_BUFFER_BIT);

const vertices = new Float32Array([
  -1.0,  1.0,  0.0,
   1.0,  1.0,  0.0,
  -1.0, -1.0,  0.0,
   1.0, -1.0,  0.0
]);

const buffer = glContext.createBuffer();

glContext.bindBuffer(glContext.ARRAY_BUFFER, buffer);
glContext.bufferData(glContext.ARRAY_BUFFER, vertices, glContext.STATIC_DRAW);

const a_Position = glContext.getAttribLocation(glProgram, 'a_Position');

glContext.vertexAttribPointer(a_Position, 3, glContext.FLOAT, false, 0, 0);
glContext.enableVertexAttribArray(a_Position);

glContext.drawArrays(glContext.TRIANGLE_STRIP, 0, 4);

const pixels = new Float32Array(width * height * 4);
glContext.readPixels(
  0,
  0,
  width,
  height,
  glContext.RGBA,
  glContext.MEDIUM_FLOAT,
  pixels
);
console.log(pixels);
