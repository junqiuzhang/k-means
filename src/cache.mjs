const fs = require("fs");
const path = require("path");
const csvCreate = require("csvtojson");
const { sim, simKernel } = require("./utils.mjs");

const LAMBDA = 1.0;

const csv = csvCreate({
  noheader: true,
  output: "csv",
});

const main = async () => {
  let dataSource = await csv.fromFile(path.resolve("src/k-means/rate.csv"));
  dataSource = dataSource.slice(1);

  for (let i = 0; i < dataSource.length; i++) {
    dataSource[i] = new Float32Array(dataSource[i]);
  }

  let dataMatrix = new Array();
  for (let i = 0; i < dataSource.length; i++) {
    const row = dataSource[i];
    if (!dataMatrix[row[0]]) {
      dataMatrix[row[0]] = new Array();
    }
    dataMatrix[row[0]].push(row.slice(1));
  }
  dataMatrix = dataMatrix.slice(1);

  let userLength = dataMatrix.length;
  let ratingLength = 0;
  for (let i = 0; i < dataMatrix.length; i++) {
    const row = dataMatrix[i];
    if (row.length > ratingLength) {
      ratingLength = row.length;
    }
  }

  const rest = [0, 0, 0];
  for (let i = 0; i < dataMatrix.length; i++) {
    for (let j = 0; j < ratingLength; j++) {
      if (!dataMatrix[i][j]) {
        dataMatrix[i][j] = rest;
        break;
      }
    }
  }

  console.log(userLength, "userLength", ratingLength, "ratingLength");
  // console.log(dataMatrix, "dataMatrix");
  let cacheSim = [];

  if (1) {
    const calcNum = userLength;
    const sim = simKernel
      .setConstants({
        LAMBDA,
        MAX_LENGTH: ratingLength,
      })
      .setOutput([calcNum, calcNum]);
    cacheSim = sim(dataMatrix.slice(0, calcNum));
  } else {
    for (let i = 0; i < 10; i++) {
      for (let j = 0; j < 10; j++) {
        if (!cacheSim[i]) {
          cacheSim[i] = [];
        }
        console.log(`正在计算${i}和${j}`);
        cacheSim[i][j] = sim.bind({
          constants: { LAMBDA, MAX_LENGTH: ratingLength },
        })(dataMatrix.slice(0, 10), i, j);
      }
    }
  }
  fs.writeFileSync(
    path.resolve("src/k-means/cache-data.mjs"),
    "export const data = " + JSON.stringify(cacheSim.map((c) => Array.from(c)))
  );
};
main();
