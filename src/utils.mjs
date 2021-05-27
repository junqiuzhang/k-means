const { GPU } = require("gpu.js");

const gpu = new GPU();

function h(tij, tmin, tmax, LAMBDA) {
  let temp = (tij - tmin) / (tmax - tmin);
  return 1 - LAMBDA + LAMBDA * (temp * temp);
}
function sim(dataMatrix, u, v) {
  if (u == v) return 0;
  let utmin = Infinity;
  let utmax = -Infinity;
  let vtmin = Infinity;
  let vtmax = -Infinity;
  let i = 0;
  while (dataMatrix[u][i][2] != 0 && dataMatrix[v][i][2] != 0) {
    if (dataMatrix[u][i][2] < utmin) {
      utmin = dataMatrix[u][i][2];
    }
    if (dataMatrix[u][i][2] > utmax) {
      utmax = dataMatrix[u][i][2];
    }
    if (dataMatrix[v][i][2] < vtmin) {
      vtmin = dataMatrix[v][i][2];
    }
    if (dataMatrix[v][i][2] > vtmax) {
      vtmax = dataMatrix[v][i][2];
    }
    i++;
  }
  let sum1 = 0;
  let sum2 = 0;
  let sum3 = 0;
  let m = 0;
  let n = 0;
  while (dataMatrix[u][m][0] != 0 && dataMatrix[v][n][0] != 0) {
    if (dataMatrix[u][m][0] == dataMatrix[v][n][0]) {
      let tempU =
        dataMatrix[u][m][1] *
        h(dataMatrix[u][m][1], utmin, utmax, this.constants.LAMBDA);
      let tempV =
        dataMatrix[v][n][1] *
        h(dataMatrix[v][n][1], vtmin, vtmax, this.constants.LAMBDA);
      sum1 += tempU * tempV;
      sum2 += tempU * tempU;
      sum3 += tempV * tempV;
      m++;
      n++;
    } else if (dataMatrix[u][m][0] > dataMatrix[v][n][0]) {
      n++;
    } else {
      m++;
    }
  }
  return Math.max(sum1 / Math.sqrt(sum2 * sum3), 0);
}
gpu.addFunction(h);
gpu.addFunction(sim);
const simKernel = gpu
  .createKernel(function (dataMatrix) {
    const u = this.thread.x;
    const v = this.thread.y;
    return sim(dataMatrix, u, v);
  })
  .setDynamicOutput(true);

/**
 *
 * @param {{
 *   gl: WebGLRenderingContext | WebGL2RenderingContext;
 *   vsSource: string;
 *   fsSource: string;
 * }}
 * @returns {WebGLProgram | undefined}
 */
function initWebglProgram({ gl, vsSource, fsSource }) {
  // 创建shader
  const vertexShaderObject = gl.createShader(gl.VERTEX_SHADER);
  const fragmentShaderObject = gl.createShader(gl.FRAGMENT_SHADER);
  // 绑定shader
  gl.shaderSource(vertexShaderObject, vsSource);
  gl.shaderSource(fragmentShaderObject, fsSource);
  // 编译shader
  gl.compileShader(vertexShaderObject);
  gl.compileShader(fragmentShaderObject);
  // 错误处理
  if (!gl.getShaderParameter(vertexShaderObject, gl.COMPILE_STATUS)) {
    console.log(
      "Error: vertexShaderObject compile error!",
      gl.getShaderInfoLog(vertexShaderObject)
    );
    return;
  }
  if (!gl.getShaderParameter(fragmentShaderObject, gl.COMPILE_STATUS)) {
    console.log(
      "Error: fragmentShaderObject compile error!",
      gl.getShaderInfoLog(fragmentShaderObject)
    );
    return;
  }
  // 创建program
  const programObject = gl.createProgram();
  if (!programObject) {
    console.log("Error: programObject create error!");
    return;
  }
  // 绑定program
  gl.attachShader(programObject, vertexShaderObject);
  gl.attachShader(programObject, fragmentShaderObject);
  // 链接program
  gl.linkProgram(programObject);
  // 错误处理
  if (!gl.getProgramParameter(programObject, gl.LINK_STATUS)) {
    console.log(
      "Error: programObject link error!",
      gl.getProgramInfoLog(programObject)
    );
    return;
  }
  // 使用program
  gl.useProgram(programObject);
  return programObject;
}

module.exports = { sim, simKernel, initWebglProgram };
