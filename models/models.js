// const client = require("../connection");
var ObjectId = require("mongodb").ObjectId;
const connection = require("../connection");
exports.fetchSummary = async () => {
  try {
    const cursor = await connection
      .db("mp_registered_interests")
      .collection("members_production")
      .find();
    const results = await cursor.toArray();
    return results;
  } catch (e) {
    console.error(e);
  }
};

exports.fetchMembersInterestsById = async (memberId) => {
  console.log("in fetch Members, ID:", memberId);
  try {
    const cursor = await connection
      .db("mp_registered_interests")
      .collection("interests_production")
      .find({ memberId: ObjectId(memberId) });
    const results = await cursor.toArray();
    return results;
  } catch (e) {
    console.error(e);
  }
};

exports.fetchMembersInterestsByIdAndDate = async (memberId, date) => {
  try {
    const cursor = await connection
      .db("mp_registered_interests")
      .collection("interests_production")
      .find({
        memberId: ObjectId(memberId),
        registerDate: {
          $gte: new Date(`${date}-01-01T00:00:00.000Z`),
          $lt: new Date(
            `${(parseInt(date) + 1).toString()}-01-01T00:00:00.000Z`
          ),
        },
      });
    const results = await cursor.toArray();
    return results;
  } catch (e) {
    console.error(e);
  }
};
exports.fetchMembersInterestsByIdAndDateAndCategory = async (
  memberId,
  date,
  category
) => {
  console.log(memberId, date, category);
  const cursor = await connection
    .db("mp_registered_interests")
    .collection("interests_production")
    .find({
      memberId: ObjectId(memberId),
      registerDate: {
        $gte: new Date(`${date}-01-01T00:00:00.000Z`),
        $lt: new Date(`${(parseInt(date) + 1).toString()}-01-01T00:00:00.000Z`),
      },
      category: category,
    });
  const results = await cursor.toArray();
  return results;
};

exports.fetchMembersInterestsByIdAndCategory = async (memberId, category) => {
  console.log("IN MODEL");
  console.log(memberId, category);

  const cursor = await connection
    .db("mp_registered_interests")
    .collection("interests_production")
    .find({
      memberId: ObjectId(memberId),
      category: category,
    });
  const results = await cursor.toArray();
  return results;
};

exports.patchClick = async (memberId) => {
  console.log("IN PATCH CLICK MODEL");
  try {
    const cursor = await connection
      .db("mp_registered_interests")
      .collection("members_production")
      .updateOne(
        { _id: ObjectId(memberId) },
        { $inc: { numberOfClicks: 1 } },
        false,
        true
      );

    const results = await cursor;
    return results;
  } catch (e) {
    console.error(e);
  }
};
