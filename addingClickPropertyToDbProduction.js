const MongoClient = require("mongodb").MongoClient;
const fs = require("fs");

const uriMembersProduction =
  process.env.DB_CONNECTION_STRING_MEMBERS_PRODUCTION;
async function main() {
  const client = new MongoClient(uriMembersProduction, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  propertyToAdd = { numberOfClicks: 0 };

  try {
    await client.connect();
    await addProperty(client, propertyToAdd);
  } catch (e) {
    console.error(e);
  } finally {
    await client.close();
  }
}

main().catch(console.error);

async function addProperty(client, propertyToAdd) {
  result = await client
    .db("mp_registered_interests")
    .collection("members_test")
    .updateMany({}, { $set: propertyToAdd }, false, true);

  console.log(`RESULT = ${result}`);
}
