const path = require("path");
const csvCreate = require("csvtojson");
const xlsx = require("node-xlsx");
const csv = csvCreate({
  noheader: true,
  output: "csv",
});
const getRatingMatrix = async () => {
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
    dataMatrix[row[0]][row[1]] = row[2];
  }

  return dataMatrix;
};
const getPropMatrix = async () => {
  const sheets = xlsx.parse(`src/k-means/prop.xlsx`);
  const sheet = sheets[0].data;
  const table = sheet.slice(2);

  const dataMatrix = [];
  for (let i = 0; i < table.length; i++) {
    const row = table[i];
    dataMatrix[row[0]] = row.slice(2);
  }
  return dataMatrix;
};
module.exports = { getRatingMatrix, getPropMatrix };
