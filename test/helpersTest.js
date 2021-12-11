const { assert } = require('chai');

const { getUserByEmail, urlsForUser } = require('../helpers.js');

const testUsers = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dish"
  }
};

const testUrlDatabase = {
  "b2xVn2": {
    longURL: "http://www.lighthouselabs.ca",
    userID: "userRandomID"
  },
  "9sm5xK": {
    longURL: "http://www.google.com",
    userID: "user2RandomID"
  },
  "9w3r4t": {
    longURL: "http://www.facebook.com",
    userID: "userRandomID"
  }
};

describe('getUserByEmail', function() {
  it('should return a user with valid email', function() {
    const user = getUserByEmail("user@example.com", testUsers);
    const expectedUserID = "userRandomID";
    assert.equal(user.id, expectedUserID);
  });

  it('should return undefined with an email not in the database', function() {
    const user = getUserByEmail("hello@hi.com", testUsers);
    const expectedUserID = undefined;
    assert.equal(user.id, expectedUserID);
  });

  it('should return a user object with valid email', function() {
    const user = getUserByEmail("user2@example.com", testUsers);
    const expectedUser = testUsers.user2RandomID;
    assert.deepEqual(user, expectedUser);
  });
});

describe('urlsForUser', function() {
  it('should return a list of URLs for a user as an object given their id', function() {
    const listOfUrls = urlsForUser('userRandomID', testUrlDatabase);
    const expectedList = {
      "b2xVn2": {
        longURL: "http://www.lighthouselabs.ca",
        userID: "userRandomID"
      },
      "9w3r4t": {
        longURL: "http://www.facebook.com",
        userID: "userRandomID"
      }
    };
    assert.deepEqual(listOfUrls, expectedList);
  });

  it('should return am empty object for an unregistered user', function() {
    const listOfUrls = urlsForUser('user3RandomID', testUrlDatabase);
    const expectedList = {};
    assert.deepEqual(listOfUrls, expectedList);
  });
});
