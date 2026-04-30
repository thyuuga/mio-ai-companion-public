// src/services/candidates/hits.cjs
const crypto = require("crypto");
const { toTagArray } = require("./key.cjs");

// memory_candidate_hits 写入错误节流
let mchSchemaErrorLogged = globalThis.mchSchemaErrorLogged || {};
globalThis.mchSchemaErrorLogged = mchSchemaErrorLogged;

async function insertCandidateHit(db, {
  /* — core logic omitted for preview — */
}

module.exports = {
  insertCandidateHit,
  mchSchemaErrorLogged,
};
