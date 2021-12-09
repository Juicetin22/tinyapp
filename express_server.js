const express = require("express");
const app = express();
const PORT = 8080; // default port 8080

const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');
const { reset } = require("nodemon");

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.set("view engine", "ejs");

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

  const urlsForUserId = (list) => {
    let listOfUrls = {};
    for (let smallURL in list) {
      if (list[smallURL]["userID"] === users[req.cookies.user_id]["id"]) {
        listOfUrls[smallURL] = urlDatabase[smallURL]
      }
    }
    return listOfUrls;
  };
  
  if (users[req.cookies['user_id']]) {
    const listOfUserUrls = urlsForUserId(urlDatabase);
    const templateVars = { urls: listOfUserUrls, user: users[req.cookies['user_id']] };
    res.render("urls_index", templateVars);
    return;
  }
  res.render('urls_index', { user: users[req.cookies['user_id']] });
});

//new URL page
app.get("/urls/new", (req, res) => {
  const templateVars = { user: users[req.cookies['user_id']] }

  if (!users[req.cookies.user_id]) {
    res.redirect("/login");
  }

  res.render("urls_new", templateVars);
});

//specific URL page / edit URL page
app.get("/urls/:shortURL", (req, res) => {
  const templateVars = { shortURL: req.params.shortURL, shortUrlObject: urlDatabase[req.params.shortURL], user: users[req.cookies['user_id']] };
  if (!urlDatabase[req.params.shortURL]) {
    res.send("This path is not associated with any URL. Please make sure you have typed it in correctly!");
    return;
  }
  res.render("urls_show", templateVars);
});

//get registration page
app.get('/register', (req, res) => {
  const templateVars = { user: users[req.cookies.user_id] };
  res.render('register', templateVars);
});

//get login page
app.get('/login', (req, res) => {
  const templateVars = { user: users[req.cookies.user_id] };
  res.render('login', templateVars);
});

//editing longURL
app.post("/urls/:shortURL", (req, res) => {
  console.log(req.body); //to check what is in reg body- hopefully longURL
  const shortURL = req.params.shortURL;
  const longURL = req.body.longURL;

  if (!users[req.cookies.user_id]) {
    res.send("Cannot edit the URL when not logged in!");
    return;
  }

  if (users[req.cookies.user_id]["id"] !== urlDatabase[req.params.shortURL]["userID"]) {
    res.send('Unauthorized to edit URL');
    return;
  }

  urlDatabase[shortURL]['longURL'] = longURL;
  res.redirect('/urls');
});

app.post("/urls", (req, res) => {
  
  if (!users[req.cookies.user_id]) {
    res.send("Cannot add new URLs when not logged in!");
    return;
  }
  
  console.log(req.body);  // Log the POST request body to the console
  const shorten = generateRandomString();
  const longURL = req.body.longURL
  console.log(urlDatabase); //to check the list prior to adding new URL
  
  urlDatabase[shorten] = {
    longURL,
    userID: req.cookies.user_id
  }

  console.log(urlDatabase); //to check whether new URL got added to list
  res.redirect(`/urls/${shorten}`); 
});

app.get("/u/:shortURL", (req, res) => {
  const shortUrlObject = urlDatabase[req.params.shortURL];

  if (!urlDatabase[req.params.shortURL]) {
    res.send("This path is not associated with any URL. Please make sure you have typed it in correctly!");
    return;
  }
  res.redirect(shortUrlObject['longURL']);
});

app.post("/urls/:shortURL/delete", (req, res) => {
  
  if (!users[req.cookies.user_id]) {
    res.send('Unauthorized to delete URL');
    return;
  }

  if (users[req.cookies.user_id]["id"] !== urlDatabase[req.params.shortURL]["userID"]) {
    res.send('Unauthorized to delete URL');
    return;
  }

  delete urlDatabase[req.params.shortURL];
  res.redirect("/urls");
});

app.post("/login", (req, res) => {
  const loginUserEmail = req.body.email;
  const loginUserPassword = req.body.password;

  for (let userID in users) { 
    if (findUserEmail(userID) === loginUserEmail) {
      if (users[userID]['password'] === loginUserPassword) {
        res.cookie('user_id', userID);
        // console.log(userID);
        res.redirect('/urls');
        return;
      } 
    }
  } 
  res.status(403).send('Incorrect email or password!');
});

app.post("/logout", (req, res) => {
  res.clearCookie('user_id');
  res.redirect('/urls');
  console.log(users); //check if user is still in users object list
});

//register a new user, setting user cookie
app.post('/register', (req, res) => {
  const id = generateRandomString();
  const email = req.body.email;
  const password = req.body.password;

  if (req.body.email === "" || req.body.password === "") {
    console.log(users); //check that no new user is added
    res.send('400 status code: Bad Request <br> <br> Invalid email or password');
    return;
  }
  for (let userID in users) { 
    if (findUserEmail(userID) === req.body.email) {
      console.log(users); //check that no new user is added
      res.send('400 status code: Bad Request <br> <br> Email is already registered');
      return;
    }
  }

  users[id] = { 
    id, 
    email,
    password
  };
  console.log(users); //check to see if user is added to list
  
  res.cookie('user_id', id);
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

const findUserEmail = (userID) => {
  let email = users[userID]['email'];
  return email;
};