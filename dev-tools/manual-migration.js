require("dotenv").config();
const _ = require("lodash");
const knex = require("knex");
const utf8 = require("utf8");

const ROW_CONCURRENCY = 25;
const INSERT_BATCH_SIZE = 3000;

const sourceConfig = {
  client: "mysql",
  connection: process.env.SOURCE_DATABASE_URL,
  pool: {
    min: ROW_CONCURRENCY,
    max: ROW_CONCURRENCY,
    afterCreate(conn, done) {
      const setCollation = "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;";
      conn.query(setCollation, function (error, _results, _fields) {
        done(error, conn);
      });
    }
  }
};

const targetConfig = {
  client: "postgresql",
  connection: process.env.TARGET_DATABASE_URL,
  pool: {
    min: ROW_CONCURRENCY,
    max: ROW_CONCURRENCY,
    afterCreate(conn, done) {
      const setCollation = "set session_replication_role = replica";
      conn.query(setCollation, function (error, _results, _fields) {
        done(error, conn);
      });
    }
  }
};

const source = knex(sourceConfig);
const target = knex(targetConfig);

const TABLES = [
  // 'user',
  // 'organization',
  // 'user_organization',
  // 'campaign',
  // 'assignment',
  // 'opt_out',
  // 'interaction_step',
  // 'canned_response',
  // 'question_response',
  // 'user_cell',
  // 'pending_message_part',
  // 'job_request',
  // 'campaign_contact',
  "message"
  // 'deliverability_report'
];

// const SHOULD_TRUNCATE = false
const SHOULD_TRUNCATE = true;

async function main() {
  for (const table of TABLES) {
    if (SHOULD_TRUNCATE) await truncateTargetTable(target, table);
    await copyAll(source, target, table);
  }

  process.exit();
}

main().then(console.log).catch(console.error);

async function truncateTargetTable(target, table) {
  const countToDelete = await target(table).count("id");
  console.log(`[${table}]: To delete, `, countToDelete);
  console.log(`[${table}]: Truncating table ${table} on target`);
  const countDeleted = await target(table).del();
  console.log(`[${table}]: Delete result: `, countDeleted);
}

async function copyAll(source, target, table) {
  const greatestTarget = await target(table)
    .select("id")
    .orderBy("id", "desc")
    .limit(1);
  const greatestTargetId = greatestTarget[0] ? greatestTarget[0].id : 0;

  console.log(`[${table}]: Syncing since `, greatestTargetId);

  const countToTransfer = Object.values(
    (await source(table).count("id").where("id", ">", greatestTargetId))[0]
  )[0];

  console.log(`[${table}]: To transfer `, countToTransfer);

  const batchCount = Math.ceil(countToTransfer / INSERT_BATCH_SIZE);
  console.log(`[${table}]: ${batchCount} batches`);
  if (batchCount == 0) {
    console.log(`[${table}]: nothing to do`);
    return true;
  }

  const allBatches = new Array(batchCount).fill(null).map((_i, n) => ({
    offset: n * INSERT_BATCH_SIZE,
    limit: INSERT_BATCH_SIZE,
    batch: n
  }));

  let lastBatchQueued = 0;

  return new Promise((resolve, reject) => {
    const allPromises = [];

    function queueBatch() {
      lastBatchQueued++;

      const batch = allBatches[lastBatchQueued - 1];

      if (!batch) return resolve(Promise.all(allPromises));
      console.log(`[${table}] Doing batch `, lastBatchQueued - 1);

      allPromises.push(
        copyBetween(
          source,
          target,
          table,
          greatestTargetId,
          batch.offset,
          batch.limit
        ).then((rowsCopied) => {
          console.log(
            `[${table}] Did ${batch.batch} / ${batchCount}:`,
            lastBatchQueued * INSERT_BATCH_SIZE
          );
          const result = queueBatch();
          return result;
        })
      );
    }

    // Queue an initial ROW_CONCURRENCY
    const initialRowConcurrency = Math.min(ROW_CONCURRENCY, batchCount);
    console.log(
      `[${table}] Initial row concurrency is ${initialRowConcurrency}`
    );
    let queuedSoFar = 0;
    while (queuedSoFar < initialRowConcurrency) {
      queueBatch();
      queuedSoFar++;
    }
  });
}

async function copyBetween(
  source,
  target,
  table,
  greatestTargetId,
  offset,
  limit
) {
  let rowsToCopy = [];

  async function fetchNextBatch() {
    rowsToCopy = await source(table)
      .select("*")
      .where("id", ">", greatestTargetId + offset)
      .where("id", "<=", greatestTargetId + offset + limit);

    if (tableMappings[table]) rowsToCopy = rowsToCopy.map(tableMappings[table]);
    // console.log(`[${table}]: Found ${rowsToCopy.length} more rows to copy`)
    offset += rowsToCopy.length;
  }

  async function copyBatch() {
    try {
      const insertResult = await target(table).insert(rowsToCopy);
      // console.log(`[${table}]: Inserted `, insertResult.rowCount)
      return insertResult.rowCount;
    } catch (ex) {
      // console.error(rowsToCopy)
      console.error(ex);
      process.exit(1);
    }
  }

  await fetchNextBatch();

  try {
    return await copyBatch();
  } catch (ex) {
    if (ex.code == "08P01") {
      console.log(`[${table}]: caught 08P01, retrying`);
      return await copyBatch();
    }
    throw ex;
  }
}

const tableMappings = {
  message: (row) => {
    const result = Object.assign(row, { text: row.text.replace(/\0/g, "") });
    return result;
  }
};
