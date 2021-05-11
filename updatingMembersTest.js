const MongoClient = require("mongodb").MongoClient;
const fs = require("fs");

const rawMembersTestData = fs.readFileSync(
  "./data/test_data/datesAndNamesTally.JSON"
);

/*
updated info
 "Richard Gordon Thomson": ["2020", "38782378273"],
  "Jamie Hamilton Wallis": ["2020", "10000000000"],
  "RAYMOND DAVEY": [1984, 1982]
*/
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

main().catch(console.error);

async function upsertListingByName(client, nameOfListing, updatedListing) {
  //passing the filter first and then the set operator updates anything that is new (does not replace) but anything the same will staty the same
  //   console.log(nameOfListing);
  //   console.log(updatedListing);
  result = await client
    .db("mp_registered_interests")
    .collection("members_test")
    .updateOne(
      { memberName: nameOfListing },
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
