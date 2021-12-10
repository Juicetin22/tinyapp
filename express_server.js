const express = require("express");
const app = express();
const PORT = 8080;
const bodyParser = require("body-parser");
//const cookieParser = require('cookie-parser');
const cookieSession = require('cookie-session');
const bcrypt = require('bcryptjs');
const { reset } = require("nodemon");
const { generateRandomString, getUserByEmail, urlsForUser } = require("./helpers");

app.use(bodyParser.urlencoded({extended: true}));
//app.use(cookieParser());
app.use(
  cookieSession({
    name: 'session',
    keys: ["secretKey1", "secretKey2"]
  })
);

app.set("view engine", "ejs");

//List of sample URLs and users
const urlDatabase = {
  "b2xVn2": {
    longURL: "http://www.lighthouselabs.ca",
    userID: "userRandomID"
  },
  "9sm5xK": {
    longURL: "http://www.google.com",
    userID: "userRandomID"
  }
};

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: bcrypt.hashSync("purple", 10)
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: bcrypt.hashSync("dish", 10)
  }
};

//Get list of URL page for each specific user
app.get("/urls", (req, res) => {
  const listOfUserUrls = urlsForUser(req.session.user_id, urlDatabase);
  const templateVars = {
    urls: listOfUserUrls,
    user: users[req.session.user_id]
  };

  res.render("urls_index", templateVars);
});

//'Create new shortURL' page, accessible to only logged in users
app.get("/urls/new", (req, res) => {
  const templateVars = { user: users[req.session.user_id] };

  if (!users[req.session.user_id]) {
    res.redirect("/login");
    return;
  }

  res.render("urls_new", templateVars);
});

//Create new shortURL, adding to urlDatabase
app.post("/urls", (req, res) => {
  
  if (!users[req.session.user_id]) {
    res.status(401).send("Cannot create new URLs when not logged in. Please login!");
    return;
  }
  
  const shortURL = generateRandomString();
  const longURL = req.body.longURL;
  
  urlDatabase[shortURL] = {
    longURL,
    userID: req.session.user_id
  };

  res.redirect(`/urls/${shortURL}`);
});

//to reach a specific URL page
app.get("/urls/:shortURL", (req, res) => {
  const templateVars = {
    shortURL: req.params.shortURL,
    shortUrlInfo: urlDatabase[req.params.shortURL],
    user: users[req.session.user_id]
  };

  if (!urlDatabase[req.params.shortURL]) {
    res.status(404).send("This URL is not associated with any page. Please make sure you have typed it in correctly!");
    return;
  }

  res.render("urls_show", templateVars);
});

//editing longURL for a specific shortURL
app.post("/urls/:shortURL", (req, res) => {
  console.log(req.body); //to check what is in reg body- hopefully longURL
  
  const shortURL = req.params.shortURL;
  const longURL = req.body.longURL;
  const user = users[req.session.user_id];

  if (!user) {
    res.status(401).send("Cannot edit the URL when not logged in!");
    return;
  }

  if (user["id"] !== urlDatabase[shortURL]["userID"]) {
    res.status(403).send('Unauthorized to edit URL');
    return;
  }

  urlDatabase[shortURL]['longURL'] = longURL;
  res.redirect('/urls');
});

//redirect shortURL to longURL site
app.get("/u/:shortURL", (req, res) => {
  const shortUrlInfo = urlDatabase[req.params.shortURL];

  if (!urlDatabase[req.params.shortURL]) {
    res.status(404).send("This URL is not associated with any page. Please make sure you have typed it in correctly!");
    return;
  }

  res.redirect(shortUrlInfo['longURL']);
});

//delete a shortURL
app.post("/urls/:shortURL/delete", (req, res) => {
  const user = users[req.session.user_id];

  if (!user) {
    res.status(401).send('Unauthorized to delete URL.');
    return;
  }

  if (user["id"] !== urlDatabase[req.params.shortURL]["userID"]) {
    res.status(403).send('Unauthorized to delete URL.');
    return;
  }

  delete urlDatabase[req.params.shortURL];
  res.redirect("/urls");
});

//LOGIN
//login page
app.get('/login', (req, res) => {
  const templateVars = { user: users[req.session.user_id] };
  if (users[req.session.user_id]) {
    res.redirect('/urls');
    return;
  }

  res.render('login', templateVars);
});

//login to user, set cookie for user
app.post("/login", (req, res) => {
  const loginUserEmail = req.body.email;
  const loginUserPassword = req.body.password;
  const checkForUser = getUserByEmail(loginUserEmail, users);

  if (!checkForUser.email) {
    res.status(403).send('Unregistered email. Please register this email.');
    return;
  }

  console.log(bcrypt.compareSync(loginUserPassword, checkForUser.password));
  if (!bcrypt.compareSync(loginUserPassword, checkForUser.password)) {
    res.status(403).send('Password is incorrect. Please carefully re-enter your password.');
    return;
  }

  //res.cookie('user_id', checkForUser.id);
  req.session['user_id'] = checkForUser.id;
  res.redirect('/urls');
});

//logout of user, clear user cookie info
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect('/urls');
});

//REGISTRATION
//register page
app.get('/register', (req, res) => {
  const templateVars = { user: users[req.session.user_id] };
  if (users[req.session.user_id]) {
    res.redirect('/urls');
    return;
  }

  res.render('register', templateVars);
});

//register a new user, setting user cookie
app.post('/register', (req, res) => {
  const id = generateRandomString();
  const email = req.body.email;
  const password = req.body.password;
  const hashedPassword = bcrypt.hashSync(password, 10);
  const checkForUser = getUserByEmail(email, users);

  if (email === "" || password === "") {
    res.status(400).send('Invalid email or password.');
    return;
  }

  if (checkForUser.email === email) {
    res.status(400).send('Email is already registered. Please use a different email to register.');
    return;
  }

  users[id] = {
    id,
    email,
    password: hashedPassword
  };

  console.log(users); //check to see if user is added to list
  
  //res.cookie('user_id', id);
  req.session['user_id'] = id;
  res.redirect('/urls');
});

//server listening port
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});