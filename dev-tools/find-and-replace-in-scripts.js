require("dotenv").config();
const _ = require("lodash");

const config = {
  client: "mysql",
  connection: process.env.DATABASE_URL,
  pool: {
    min: 2,
    max: 10
  }
};

const db = require("knex")(config);

async function main(find, replace) {
  const campaign_ids = await db("campaign")
    .where({ is_archived: false })
    .select("id")
    .pluck("id");

  const interactionStepsToChange = await db("interaction_step")
    .where("script", "like", `%${find}%`)
    .whereIn("campaign_id", campaign_ids);

  for (const step of interactionStepsToChange) {
    const newText = step.script.replace(new RegExp(find, "g"), replace);
    console.log(step.script);
    console.log(newText);

    console.log(
      await db("interaction_step")
        .update({ script: newText })
        .where({ id: step.id })
    );
  }
}

main("b2020.me", "notme2020.us")
  .then(console.log)
  .catch(console.error);
