const fs = require("fs");
const path = require("path");
const xlsx = require("node-xlsx");
const { getPropMatrix, getRatingMatrix } = require("./read.mjs");
const K = 8;
const MAX_USER = 100;
const MAX_LOOP_COUNT = 1000;
/**
 *
 * @param {number[]} arr1
 * @param {number[]} arr2
 */
const isSameCenters = (centers, newCenters) => {
  if (centers.length !== newCenters.length) return false;
  let tempCenters = [];
  for (let i = 0; i < centers.length; i++) {
    tempCenters[i] = centers[i].toString();
  }
  let tempNewCenters = [];
  for (let i = 0; i < newCenters.length; i++) {
    tempNewCenters[i] = newCenters[i].toString();
  }
  for (let i = 0; i < tempCenters.length; i++) {
    if (!tempNewCenters.includes(tempCenters[i])) return false;
  }
  return true;
};
const getDistance = (a, b) => {
  try {
    let sum = 0;
    for (let i = 0; i < a.length; i++) {
      let s = a[i] - b[i];
      sum += Math.sqrt(s * s);
    }
    return sum;
  } catch (error) {
    console.log(a, b);
    throw error;
  }
};
const getRMatrix = ({ ratingMatrix, propMatrix, len }) => {
  const R = [];
  for (let i = 0; i < MAX_USER; i++) {
    const ratingRow = ratingMatrix[i];
    if (!ratingRow) continue;
    const CR = [];
    for (let j = 0; j < propMatrix.length; j++) {
      const propRow = propMatrix[j];
      if (!propRow) continue;
      const CRRow = [];
      if (ratingRow[j]) {
        for (let k = 0; k < propRow.length; k++) {
          if (propRow[k]) {
            CRRow[k] = propRow[k] * ratingRow[j];
          }
        }
        CR.push(CRRow);
      }
    }
    const ICR = new Array(len).fill(0);
    for (let j = 0; j < len; j++) {
      for (let k = 0; k < CR.length; k++) {
        if (!CR[k]) continue;
        if (!CR[k][j]) continue;
        ICR[j] += CR[k][j];
      }
    }
    let sum = 0;
    for (let j = 0; j < ratingRow.length; j++) {
      if (ratingRow[j]) sum += ratingRow[j];
    }
    for (let j = 0; j < ICR.length; j++) {
      ICR[j] = ICR[j] / sum;
    }
    R[i] = ICR;
  }
  return R;
};
const kMeans = ({ R, len }) => {
  let centers = [];
  let groups = [];
  // 初始化聚类中心
  let k = 0;
  for (let i = 0; i < R.length; i++) {
    if (R[i]) {
      centers.push(R[i]);
      k++;
    }
    if (k === K) break;
  }
  let loopCount = 0;
  while (true) {
    loopCount++;
    // console.log(loopCount);
    // 将各个数据按照距离远近分配到各自的簇中
    console.log("将各个数据按照距离远近分配到各自的簇中");
    groups = [];
    for (let i = 0; i < R.length; i++) {
      // console.log(`正在计算${i}的簇`);
      const row = R[i];
      if (!row) continue;
      let minCenter = 0;
      let minCenterDis = Infinity;
      for (let j = 0; j < centers.length; j++) {
        const dis = getDistance(centers[j], row);
        if (dis < minCenterDis) {
          minCenter = j;
          minCenterDis = dis;
        }
      }
      if (!groups[minCenter]) {
        groups[minCenter] = [];
      }
      groups[minCenter].push(i);
    }

    // console.log(centers);
    // 计算新的聚类中心
    console.log("计算新的聚类中心");
    const newCenters = [];
    for (let i = 0; i < groups.length; i++) {
      const group = groups[i];
      if (!group) continue;
      // console.log(`正在计算${i}的聚类中心`);
      let newCenter = new Array(len).fill(0);
      for (let j = 0; j < len; j++) {
        for (let k = 0; k < group.length; k++) {
          newCenter[j] += R[group[k]][j];
        }
      }
      for (let j = 0; j < newCenter.length; j++) {
        newCenter[j] = newCenter[j] / group.length;
      }
      newCenters.push(newCenter);
    }

    // console.log(centers);
    // 聚类中心是否改变
    if (isSameCenters(centers, newCenters)) {
      console.log("k-means计算完毕");
      return groups;
    } else {
      centers = newCenters;
    }
    if (loopCount > MAX_LOOP_COUNT) {
      console.log("达到最大循环次数了！");
      return groups;
    }
  }
};
const main = async () => {
  const ratingMatrix = await getRatingMatrix();
  const propMatrix = await getPropMatrix();
  const len = propMatrix[28].length;
  const R = getRMatrix({ ratingMatrix, propMatrix, len });
  const groups = kMeans({ R, len });
  R[0] = [
    "属性1",
    "属性2",
    "属性3",
    "属性4",
    "属性5",
    "属性6",
    "属性7",
    "属性8",
    "属性9",
    "属性10",
    "属性11",
    "属性12",
    "属性13",
    "属性14",
    "属性15",
    "属性16",
    "属性17",
    "属性18",
    "属性19",
  ];
  for (let i = 0; i < groups.length; i++) {
    groups[i] = [`分组${i + 1}`].concat(groups[i]);
  }
  fs.writeFileSync(
    path.resolve("src/k-means/R.xlsx"),
    xlsx.build([{ name: "用户偏好矩阵", data: R }])
  );
  fs.writeFileSync(
    path.resolve("src/k-means/groups.xlsx"),
    xlsx.build([{ name: "分类情况", data: groups }])
  );
};
main();
