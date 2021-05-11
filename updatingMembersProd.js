const MongoClient = require("mongodb").MongoClient;
const fs = require("fs");

const pathToDatesAndNamesTally =
  "/Users/rfd/CODING/ONGOING_PROJECTS/mpRegInterests/datesAndNamesTally.JSON";

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
    for (let i = 0; i < arrayOfMembers.length; i++) {
      const iteratedMemberName = arrayOfMembers[i].memberName;
      await upsertListingByName(client, iteratedMemberName, arrayOfMembers[i]);
    }
  } catch (e) {
    console.error(e);
  } finally {
    await client.close();
  }
}

async function upsertListingByName(client, nameOfListing, updatedListing) {
  //passing the filter first and then the set operator updates anything that is new (does not replace) but anything the same will staty the same
  //   console.log(nameOfListing);
  //   console.log(updatedListing);
  result = await client
    .db("mp_registered_interests")
    .collection("members_production")
    .updateOne(
      { memberName: nameOfListing },
      { $set: updatedListing },
      { upsert: true }
    );
  //   console.log(`${result.matchedCount} documents matched the query criteria`);
  //   if (result.upsertedCount > 0) {
  //     console.log(
  //       `One document was inserted with the id ${result.upsertedId._id}`
  //     );
  //   } else {
  //     console.log(`${result.modifiedCount} document(s) was/were updated`);
  //   }
}

main().catch(console.error);
