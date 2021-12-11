//generates a random 6 character ID for the shortURL
const generateRandomString = () => {
  let random = "";
  let characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (let i = 0; i < 6; i++) {
    random += characters[Math.floor(Math.random() * characters.length)];
  }
  return random;
};

//returns a user's info by using their email
const getUserByEmail = (email, database) => {
  const user = {};

  for (let id in database) {
    if (database[id]["email"] === email) {
      user.email = email;
      user.password = database[id]["password"];
      user.id = id;
    }
  }
  return user;
};

//grabs a list of URLs from the database specific to each user using their id
const urlsForUser = (id, database) => {
  const listOfUrls = {};
  
  for (let shortURL in database) {
    if (database[shortURL]['userID'] === id) {
      listOfUrls[shortURL] = database[shortURL]
    }
  }
  return listOfUrls;
};

module.exports = {
  generateRandomString,
  getUserByEmail,
  urlsForUser
}