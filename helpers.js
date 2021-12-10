const generateRandomString = () => {
  let random = "";
  let characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (let i = 0; i < 6; i++) {
    random += characters[Math.floor(Math.random() * characters.length)];
  }
  return random;
};

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