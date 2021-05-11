const MongoClient = require("mongodb").MongoClient;
require("dotenv").config();
const username = process.env.DB_USERNAME;
const pw = process.env.DB_PASSWORD;

const uri = `mongodb+srv://${username}:${pw}@cluster0.usilp.mongodb.net/interests_production?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const connection = client.connect();
module.exports = client;
