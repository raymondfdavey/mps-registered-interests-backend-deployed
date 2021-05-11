const models = require("../models/models.js");

exports.getAllMembersSummary = async (req, res, next) => {
  const results = await models.fetchSummary().catch(console.dir);
  res.send({ status: 200, results });
};

exports.getMembersInterestsById = async (req, res, next) => {
  const { memberId } = req.params;
  const results = await models
    .fetchMembersInterestsById(memberId)
    .catch(console.dir);
  res.send({ status: 200, results });
};

exports.getMembersInterestsByIdAndDate = async (req, res, next) => {
  const { memberId, date } = req.params;
  const results = await models
    .fetchMembersInterestsByIdAndDate(memberId, date)
    .catch(console.dir);
  res.send({ status: 200, results });
};

exports.getMembersInterestsByIdAndDateAndCategory = async (req, res, next) => {
  let { memberId, date, category } = req.params;
  if (category == "Land") {
    category =
      "Land and property portfolio: (i) value over £100,000 and/or (ii) giving rental income of over £10,000 a year";
  }
  const results = await models
    .fetchMembersInterestsByIdAndDateAndCategory(memberId, date, category)
    .catch(console.dir);
  res.send({ status: 200, results });
};

exports.getMembersInterestsByIdAndCategory = async (req, res, next) => {
  let { memberId, category } = req.params;
  if (category == "Land") {
    category =
      "Land and property portfolio: (i) value over £100,000 and/or (ii) giving rental income of over £10,000 a year";
  }
  console.log(category);
  const results = await models.fetchMembersInterestsByIdAndCategory(
    memberId,
    category
  );
  res.send({ status: 200, results });
};

exports.addClick = async (req, res, next) => {
  console.log("adding click");
  let { memberId } = req.params;
  const results = await models.patchClick(memberId);
  res.send({ status: 200, results });
  // const results = await models.fetchMembersInterestsByIdAndCategory(
  //   memberId,
  //   category
  // );
  // res.send({ status: 200, results });
};
