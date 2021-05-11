const MongoClient = require("mongodb").MongoClient;
const fs = require("fs");

const pathToRefactoredJSONDir = "../mpRegInterests/regInterestsJsonRefactored/";
const allJSONFileNames = fs.readdirSync(pathToRefactoredJSONDir);
let alreadyAdded = fs.readFileSync("./alreadyAdded.json");
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

const uriInterestsProduction =
  process.env.DB_CONNECTION_STRING_INTERESTS_PRODUCTION;

function getInterestsJSON(JSONpath) {
  console.log(JSONpath);
  const rawInterestTestData = fs.readFileSync(JSONpath);
  return rawInterestTestData;
}
function convertToJsObject(interestsInJSON) {
  const interestTestDataAsObject = JSON.parse(interestsInJSON);
  return interestTestDataAsObject;
}
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

async function main() {
  const client = new MongoClient(uriInterestsProduction, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  let arrayOfAllInterestsToBeUploadedThisSession = [];
  if (filesToProcess.length == 0) {
    console.log("NO NEW FILES TO UPLOAD");
    throw "exiting - no new filed to upload";
  }
  try {
    await client.connect();
    await dropCollection(client, "interests_production");
    await createCollection(client, "interests_production");
    //    else {
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
    fs.writeFileSync("./alreadyAdded.json", data);
    console.log("FINISHEDDDD UPLOADING");
    // }
  } catch (e) {
    console.error(e);
  } finally {
    await client.close();
  }
}

main().catch(console.error);

async function createMultipleListing(client, newListings) {
  const result = await client
    .db("mp_registered_interests")
    .collection("interests_production")
    .insertMany(newListings, { ordered: false });

  console.log(
    `${result.insertedCount} new listing(s) created with the following id(s)`
  );
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
