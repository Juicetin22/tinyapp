const express = require("express");
const app = express();
const PORT = 8080; // default port 8080

const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.set("view engine", "ejs");

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = { 
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: "purple-monkey-dinosaur"
  },
 "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
  }
}


/*app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});*/

//GET webpages //
//list of URL page
app.get("/urls", (req, res) => {
  const templateVars = { urls: urlDatabase, user: users[req.cookies.user_id] };
  res.render("urls_index", templateVars);
});

//new URL page
app.get("/urls/new", (req, res) => {
  const templateVars = { user: users[req.cookies['user_id']] }
  res.render("urls_new", templateVars);
});

//specific URL page / edit URL page
app.get("/urls/:shortURL", (req, res) => {
  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL], user: users[req.cookies['user_id']] };
  if (!urlDatabase[req.params.shortURL]) {
    res.send("This path is not associated with any URL. Please make sure you have typed it in correctly!");
    return;
  }
  res.render("urls_show", templateVars);
});

//registration page
app.get('/register', (req, res) => {
  const templateVars = { user: users[req.cookies.user_id] };
  res.render('register', templateVars);
});

app.post("/urls/:shortURL", (req, res) => {
  console.log(req.body); //to check what is in reg body- hopefully longURL
  const shortURL = req.params.shortURL;
  const longURL = req.body.longURL;
  urlDatabase[shortURL] = longURL;
  res.redirect('/urls');
});

app.post("/urls", (req, res) => {
  console.log(req.body);  // Log the POST request body to the console
  let shorten = generateRandomString();
  console.log(urlDatabase); //to check the list prior to adding new URL
  urlDatabase[shorten] = req.body.longURL;
  console.log(urlDatabase); //to check whether new URL got added to list
  res.redirect(`/urls/${shorten}`); 
});

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

app.post("/urls/:shortURL/delete", (req, res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect("/urls");
});

app.post("/login", (req, res) => {
  console.log(req.body); //check what the req.body is
  const user = req.body.username;
  res.cookie('username', user);
  res.redirect('/urls');
  
});

app.post("/logout", (req, res) => {
  res.clearCookie('username');
  res.redirect('/urls');
});

app.post('/register', (req, res) => {
  const userID = generateRandomString();
  const userEmail = req.body.email;
  const userPassword = req.body.password;

  users[userID] = { 
    id: userID, 
    email: userEmail, 
    password: userPassword 
  };
  console.log(users); //check to see if user is added to list

  res.cookie('user_id', userID);
  res.redirect('/urls');
});

//server listening port
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

function generateRandomString() {
  let random = "";
  let characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (let i = 0; i < 6; i++) {
    random += characters[Math.floor(Math.random() * characters.length)];
  }
  return random;
}