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

const urlsForUser = (id, urlDatabase) => {
  const listOfUrls = {};
  
  for (let shortURL in urlDatabase) {
    if (urlDatabase[shortURL]['userID'] === id) {
      listOfUrls[shortURL] = urlDatabase[shortURL]
    }
  }
  return listOfUrls;
};

module.exports = {
  generateRandomString,
  getUserByEmail,
  urlsForUser
}