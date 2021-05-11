const MongoClient = require("mongodb").MongoClient;
const fs = require("fs");

const rawMembersTestData = fs.readFileSync(
  "./data/test_data/datesAndNamesTally.JSON"
);

const membersTestData = JSON.parse(rawMembersTestData);

const arrayOfMembers = [];

for (member in membersTestData) {
  console.log(member);
  arrayOfMembers.push({
    memberName: member,
    yearsOfRecordsHeld: membersTestData[member],
  });
}

const uriMembersTest = process.env.DB_CONNECTION_STRING_MEMBERS_TEST;
async function main() {
  const client = new MongoClient(uriMembersTest, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  try {
    await client.connect();
    await listDatabases(client);
    await dropCollection(client, "members_test");
    await createCollection(client, "members_test");
    await createMultipleListing(client, arrayOfMembers);
  } catch (e) {
    console.error(e);
  } finally {
    await client.close();
  }
}

main().catch(console.error);

async function listDatabases(client) {
  databasesList = await client.db().admin().listDatabases();
  console.log("Databases:");
  databasesList.databases.forEach((db) => console.log(` - ${db.name}`));
}

async function createListing(client, newListing) {
  const result = await client
    .db("mp_registered_interests")
    .collection("members_test")
    .insertOne(newListing);
  console.log(
    `new listing created with the following id: ${result.insertedId}`
  );
}

async function createMultipleListing(client, newListings) {
  const result = await client
    .db("mp_registered_interests")
    .collection("members_test")
    .insertMany(newListings);

  console.log(
    `${result.insertedCount} new listing(s) created with the following id(s)`
  );
  console.log(result.insertedIds);
}

async function findOneListingByName(client, nameOfListing) {
  const result = await client
    .db("mp_registered_interests")
    .collection("members_test")
    .findOne({ name: nameOfListing });

  if (result) {
    console.log(
      `Found a listing in the collection with the name ${nameOfListing}`
    );
    console.log(result);
  } else {
    console.log(`No listings found with name '${nameOfListing}'`);
  }
}

async function findListingsWithMinimumBedroomsBathroomsAndMostRecentReviews(
  client,
  {
    minimumNumberOfBedrooms = 4,
    minimumNumberOfBathrooms = 4,
    maximumNumberOfResults = Number.MAX_SAFE_INTEGER,
  } = {}
) {
  //this function return a 'cursor' which allows traversal over a result set over a query. You can also modigy what is returned in the results (eg, sort)
  //we can also call cursor.toArray
  const cursor = client
    .db("mp_registered_interests")
    .collection("members_test")
    .find({
      bedrooms: { $gte: minimumNumberOfBedrooms },
      bathrooms: { $gte: minimumNumberOfBathrooms },
    })
    .sort({ last_review: -1 })
    .limit(maximumNumberOfResults);

  const results = await cursor.toArray();

  if (results.length > 0) {
    console.log(
      `Found listing(s) with at least ${minimumNumberOfBedrooms} bedrooms and ${minimumNumberOfBathrooms} bathrooms:`
    );
    results.forEach((result, i) => {
      date = new Date(result.last_review).toDateString();
      console.log();
      console.log(`${i + 1}. name: ${result.name}`);
      console.log(`   _id: ${result._id}`);
      console.log(`   bedrooms: ${result.bedrooms}`);
      console.log(`   bathrooms: ${result.bathrooms}`);
      console.log(
        `   most recent review date: ${new Date(
          result.last_review
        ).toDateString()}`
      );
    });
  } else {
    console.log(
      `No listings found with at least ${minimumNumberOfBedrooms} bedrooms and ${minimumNumberOfBathrooms} bathrooms`
    );
  }
}

async function updateListingByName(client, nameOfListing, updatedListing) {
  //set
  result = await client
    .db("mp_registered_interests")
    .collection("members_test")
    //passing the filter first and then the set operator updates anything that is new (does not replace) but anything the same will staty the same
    .updateOne({ name: nameOfListing }, { $set: updatedListing });

  console.log(`${result.matchedCount} matched the query criteria`);
  console.log(`${result.modifiedCount} document(s) was/were updated`);
}

async function upsertListingByName(client, nameOfListing, updatedListing) {
  //passing the filter first and then the set operator updates anything that is new (does not replace) but anything the same will staty the same
  result = await client
    .db("mp_registered_interests")
    .collection("members_test")
    .updateOne(
      { name: nameOfListing },
      { $set: updatedListing },
      { upsert: true }
    );

  console.log(`${result.matchedCount} documents matched the query criteria`);
  if (result.upsertedCount > 0) {
    console.log(
      `One document was inserted with the id ${result.upsertedId._id}`
    );
  } else {
    console.log(`${result.modifiedCount} document(s) was/were updated`);
  }
}

async function updateAllListingsToHavePropertyType(client) {
  const result = await client
    .db("mp_registered_interests")
    .collection("members_test")
    .updateMany(
      { property_type: { $exists: false } },
      { $set: { property_type: "Unknown" } }
    );
  console.log(`${result.matchedCount} document(s) macthed the query criteria `);
  console.log(`${result.modifiedCount} document(s) was/were updated`);
}

async function deleteListingByName(client, nameOfListing) {
  result = await client
    .db("mp_registered_interests")
    .collection("members_test")
    .deleteOne({ name: nameOfListing });

  console.log(`${result.deletedCount} document(s) were/was deleted`);
}

async function deleteListingsScrapedBeforeDate(client, date) {
  result = await client
    .db("mp_registered_interests")
    .collection("members_test")
    .deleteMany({ last_scraped: { $lt: date } });
  console.log(`${result.deletedCount} document(s) was/were deleted`);
}

async function dropCollection(client, collectionName) {
  result = await client
    .db("mp_registered_interests")
    .collection(collectionName)
    .drop();
  console.log(`DELETED COLLECTION: ${collectionName}`);
}

async function createCollection(client, newCollectionName) {
  result = await client
    .db("mp_registered_interests")
    .createCollection(newCollectionName);

  console.log(`CREATED COLLECTION: ${newCollectionName}`);
}
