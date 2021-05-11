const MongoClient = require("mongodb").MongoClient;
const fs = require("fs");

const pathToDatesAndNamesTally = "../mpRegInterests/datesAndNamesTally.JSON";

const rawMembersProductionData = fs.readFileSync(pathToDatesAndNamesTally);

const membersProductionData = JSON.parse(rawMembersProductionData);

const arrayOfMembers = [];

for (member in membersProductionData) {
  console.log(member);
  arrayOfMembers.push({
    memberName: member,
    yearsOfRecordsHeld: membersProductionData[member].datesSummary,
    categoriesOfInterestsRegistered:
      membersProductionData[member].categorySummary,
    dateAddedToDB: new Date(),
    numberOfClicks: 0,
  });
}

const uriMembersProduction =
  process.env.DB_CONNECTION_STRING_MEMBERS_PRODUCTION;
async function main() {
  const client = new MongoClient(uriMembersProduction, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  try {
    await client.connect();
    await dropCollection(client, "members_production");
    await createCollection(client, "members_production");
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
    .collection("members_production")
    .insertOne(newListing);
  console.log(
    `new listing created with the following id: ${result.insertedId}`
  );
}

async function createMultipleListing(client, newListings) {
  const result = await client
    .db("mp_registered_interests")
    .collection("members_production")
    .insertMany(newListings, { ordered: "false" });

  console.log(
    `${result.insertedCount} new listing(s) created with the following id(s)`
  );
  console.log(result.insertedIds);
}

async function findOneListingByName(client, nameOfListing) {
  const result = await client
    .db("mp_registered_interests")
    .collection("members_production")
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
    .collection("members_production")
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
    .collection("members_production")
    //passing the filter first and then the set operator updates anything that is new (does not replace) but anything the same will staty the same
    .updateOne({ name: nameOfListing }, { $set: updatedListing });

  console.log(`${result.matchedCount} matched the query criteria`);
  console.log(`${result.modifiedCount} document(s) was/were updated`);
}

async function upsertListingByName(client, nameOfListing, updatedListing) {
  //passing the filter first and then the set operator updates anything that is new (does not replace) but anything the same will staty the same
  result = await client
    .db("mp_registered_interests")
    .collection("members_production")
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
    .collection("members_production")
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
    .collection("members_production")
    .deleteOne({ name: nameOfListing });

  console.log(`${result.deletedCount} document(s) were/was deleted`);
}

async function deleteListingsScrapedBeforeDate(client, date) {
  result = await client
    .db("mp_registered_interests")
    .collection("members_production")
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
