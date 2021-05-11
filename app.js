const express = require("express");
const app = express();
const cors = require("cors");
const models = require("./models/models.js");
const controllers = require("./controllers/controllers");

app.use(cors());
app.use(express.json());

app.route("/").get((req, res, next) => res.send("HELLO WORLD base - GETTING"));

// getAllMembersSummary = async (req, res, next) => {
//   const results = await models.fetchSummary().catch(console.dir);
//   res.send({ status: 200, results });
// };

app.route("/members").get(controllers.getAllMembersSummary);

// getMembersInterestsById = async (req, res, next) => {
//   const { memberId } = req.params;
//   const results = await models
//     .fetchMembersInterestsById(memberId)
//     .catch(console.dir);
//   res.send({ status: 200, results });
// };

app.route("/members/member/:memberId").get(controllers.getMembersInterestsById);
app.route("/members/member/:memberId").patch(controllers.addClick);
// getMembersInterestsByIdAndDate = async (req, res, next) => {
//   const { memberId, date } = req.params;
//   const results = await models
//     .fetchMembersInterestsByIdAndDate(memberId, date)
//     .catch(console.dir);
//   res.send({ status: 200, results });
// };

app
  .route("/interests/member/:memberId/year/:date")
  .get(controllers.getMembersInterestsByIdAndDate);

// getMembersInterestsByIdAndDateAndCategory = async (req, res, next) => {
//   const { memberId, date, category } = req.params;
//   const results = await models
//     .fetchMembersInterestsByIdAndDateAndCategory(memberId, date, category)
//     .catch(console.dir);
//   res.send({ status: 200, results });
// };

app
  .route("/interests/:memberId/year/:date/category/:category")
  .get(controllers.getMembersInterestsByIdAndDateAndCategory);

// getMembersInterestsByIdAndCategory = async (req, res, next) => {
//   const { memberId, category } = req.params;
//   const results = await models.fetchMembersInterestsByIdAndCategory(
//     memberId,
//     category
//   );
//   res.send({ status: 200, results });
// };

app
  .route("/interests/member/:memberId/category/:category")
  .get(controllers.getMembersInterestsByIdAndCategory);

app
  .route("/interests/member/:memberId/category/:category/year/:date")
  .get(controllers.getMembersInterestsByIdAndDateAndCategory);

module.exports = app;
