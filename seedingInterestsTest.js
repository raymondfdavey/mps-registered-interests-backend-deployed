const MongoClient = require("mongodb").MongoClient;
const fs = require("fs");

const pathToRefactoredJSONDir = "./data/test_data/test_JSON/";
const allJSONFileNames = fs.readdirSync(pathToRefactoredJSONDir);
let alreadyAdded = fs.readFileSync("./data/test_data/alreadyAddedTest.json");
alreadyAdded = JSON.parse(alreadyAdded);
arrayOfAlreadyAdded = [...alreadyAdded.datesAddedToDatabase];

const filesToProcess = getArrayOfFilesThatHaveNotBeenUploaded(
  allJSONFileNames,
  arrayOfAlreadyAdded
);

function getArrayOfFilesThatHaveNotBeenUploaded(
  allFileNames,
  alreadyUploadedFileNames
) {
  return allFileNames
    .map((name) => {
      if (alreadyUploadedFileNames.includes(name) == true) return null;
      else {
        return name;
      }
    })
    .filter((returnedValues) => {
      return returnedValues != null;
    });
}

console.log(filesToProcess);

const uriInterestsTest = process.env.DB_CONNECTION_STRING_INTERESTS_TEST;

async function main() {
  const client = new MongoClient(uriInterestsTest, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  let arrayOfAllInterestsToBeUploadedThisSession = [];
  if (filesToProcess.length == 0) {
    console.log("NO NEW FILES TO UPLOAD");
    throw "exiting - no new files to upload";
  }
  try {
    await client.connect();
    await dropCollection(client, "interests_test");
    await createCollection(client, "interests_test");

    // let count = 0;
    // for (let i = 0; i < filesToProcess.length; i++) {
    //   JSONfilePath = pathToRefactoredJSONDir + filesToProcess[i];
    //   interestsJSON = getInterestsJSON(JSONfilePath);
    //   interestsJsObject = convertToJsObject(interestsJSON);
    //   for (member in interestsJsObject) {
    //     for (date in interestsJsObject[member]) {
    //       for (category in interestsJsObject[member][date]) {
    //         count++;
    //       }
    //     }
    //   }
    // }
    // else {

    for (let i = 0; i < filesToProcess.length; i++) {
      let arrayOfAllInterestsInFile = [];
      JSONfilePath = pathToRefactoredJSONDir + filesToProcess[i];
      interestsJSON = getInterestsJSON(JSONfilePath);
      interestsJsObject = convertToJsObject(interestsJSON);
      for (member in interestsJsObject) {
        const memberId = await getIdByName(client, member);
        const arrayOfMembersInterestObjects = getArrayOfmembersInterestsObjects(
          memberId,
          member,
          interestsJsObject[member]
        );
        arrayOfAllInterestsInFile.push(arrayOfMembersInterestObjects);
      }
      const flattenedFileInterests = arrayOfAllInterestsInFile.flat();
      arrayOfAllInterestsToBeUploadedThisSession.push(flattenedFileInterests);
      arrayOfAlreadyAdded.push(filesToProcess[i]);
    }
    const finalArrayForUpload =
      arrayOfAllInterestsToBeUploadedThisSession.flat();

    await createMultipleListing(client, finalArrayForUpload);
    newObj = { datesAddedToDatabase: arrayOfAlreadyAdded };
    let data = JSON.stringify(newObj);
    fs.writeFileSync("./data/test_data/alreadyAddedTest.json", data);
    console.log("FINISHEDDDD UPLOADING");
    // }
    //* Loop through the list of file names
    //* for every file
    //* Read in the data
    //* Go through every member - GET MEMBER ID
    //* Go through every interest
    //* Creat an interest object including member ID
    //* create an array of interest objects for that file
    //* upload that array for that file via createMultiple Listing
    //* continue loop for next file
    // for (member in interestsTestData) {
    //   memberId = await getIdByName(client, member);
    //   for (date in interestsTestData[member]) {
    //     for (category in interestsTestData[member][date]) {
    //       newObj = {
    //         memberName: member,
    //         memberId,
    //         date,
    //         category,
    //         interest: interestsTestData[member][date][category],
    //       };
    //       arrayOfInterests.push(newObj);
    //     }
    //   }
    // }

    // await createMultipleListing(client, arrayOfInterests);
  } catch (e) {
    console.error(e);
  } finally {
    await client.close();
  }
}

main().catch(console.error);

function getArrayOfmembersInterestsObjects(
  idOfMember,
  memberName,
  membersInterestsObject
) {
  //   console.log("IN MAKING MEMBER ARRAY OF OBJECT");
  date = Object.keys(membersInterestsObject)[0];
  //   console.log(membersInterestsObject);
  arrayOfMembersInterests = [];
  for (category in membersInterestsObject[date]) {
    newObj = {
      memberName,
      memberId: idOfMember,
      registerDate: new Date(date),
      uploadDate: new Date(),
      category,
      interest: membersInterestsObject[date][category],
    };
    // console.log(newObj);
    arrayOfMembersInterests.push(newObj);
  }
  return arrayOfMembersInterests;
}

function convertToJsObject(interestsInJSON) {
  const interestTestDataAsObject = JSON.parse(interestsInJSON);
  return interestTestDataAsObject;
}

function getInterestsJSON(JSONpath) {
  console.log(JSONpath);
  const rawInterestTestData = fs.readFileSync(JSONpath);
  return rawInterestTestData;
}

async function getIdByName(client, name) {
  const result = await client
    .db("mp_registered_interests")
    .collection("members_production")
    .findOne({ memberName: name });

  if (result) {
    // console.log(`Found a listing in the collection with the name ${name}`);
    return result._id;
  } else {
    console.log(`No listings found with name '${name}'`);
  }
}
async function listDatabases(client) {
  databasesList = await client.db().admin().listDatabases();
  console.log("Databases:");
  databasesList.databases.forEach((db) => console.log(` - ${db.name}`));
}

async function createListing(client, newListing) {
  const result = await client
    .db("mp_registered_interests")
    .collection("interests_test")
    .insertOne(newListing);
  console.log(
    `new listing created with the following id: ${result.insertedId}`
  );
}

async function createMultipleListing(client, newListings) {
  const result = await client
    .db("mp_registered_interests")
    .collection("interests_test")
    .insertMany(newListings, { ordered: false });

  console.log(
    `${result.insertedCount} new listing(s) created with the following id(s)`
  );
}

async function findOneListingByName(client, nameOfListing) {
  const result = await client
    .db("mp_registered_interests")
    .collection("interests_test")
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
    .collection("interests_test")
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
    .collection("interests_test")
    //passing the filter first and then the set operator updates anything that is new (does not replace) but anything the same will staty the same
    .updateOne({ name: nameOfListing }, { $set: updatedListing });

  console.log(`${result.matchedCount} matched the query criteria`);
  console.log(`${result.modifiedCount} document(s) was/were updated`);
}

async function upsertListingByName(client, nameOfListing, updatedListing) {
  //passing the filter first and then the set operator updates anything that is new (does not replace) but anything the same will staty the same
  result = await client
    .db("mp_registered_interests")
    .collection("interests_test")
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
    .collection("interests_test")
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
    .collection("interests_test")
    .deleteOne({ name: nameOfListing });

  console.log(`${result.deletedCount} document(s) were/was deleted`);
}

async function deleteListingsScrapedBeforeDate(client, date) {
  result = await client
    .db("mp_registered_interests")
    .collection("interests_test")
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
