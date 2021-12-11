const express = require("express");
const app = express();
const PORT = 8080;
const bodyParser = require("body-parser");
const cookieSession = require('cookie-session');
const bcrypt = require('bcryptjs');
const { reset } = require("nodemon");
const { generateRandomString, getUserByEmail, urlsForUser } = require("./helpers");

app.use(bodyParser.urlencoded({extended: true}));
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

//Get / page
app.get("/", (req, res) => {
  //if user is not logged in then redirect to login page
  if (!users[req.session.user_id]) {
    res.redirect("/login");
  //if they are then redirect them to their list of URL page
  } else {
    res.redirect("/urls");
  }
});

//Get list of URL page for each specific user
app.get("/urls", (req, res) => {
  //using helper function to grab list of user specific URLs
  const listOfUserUrls = urlsForUser(req.session.user_id, urlDatabase);
  const templateVars = {
    urls: listOfUserUrls,
    user: users[req.session.user_id]
  };

  //rendering the HTML page with the help of templateVars
  res.render("urls_index", templateVars);
});

//'Create new shortURL' page, accessible to only logged in users
app.get("/urls/new", (req, res) => {
  const templateVars = { user: users[req.session.user_id] };

  //redirect to login page if user is not logged in
  if (!users[req.session.user_id]) {
    res.redirect("/login");
  } else {
    //rendering the url/new HTML page with the help of templateVars
    res.render("urls_new", templateVars);
  }
});

//Create new shortURL, adding to urlDatabase
app.post("/urls", (req, res) => {
  
  //prevent users who are no logged in to create a new shortURL
  if (!users[req.session.user_id]) {
    res.status(401).send("<h1>Cannot create new URLs when not logged in. Please login!</h1>");
  } else {
    //generate the random ID for the new shortURL
    const shortURL = generateRandomString();
    //obtain the URL of the actual site from the submission of the form
    const longURL = req.body.longURL;
  
    //add the new shortURL information to the database
    urlDatabase[shortURL] = {
      longURL,
      userID: req.session.user_id
    };
    console.log(urlDatabase);
    //redirect users to the new shortURL page
    res.redirect(`/urls/${shortURL}`);
  }
});

//to reach a specific URL page
app.get("/urls/:shortURL", (req, res) => {
  const templateVars = {
    shortURL: req.params.shortURL,
    shortUrlInfo: urlDatabase[req.params.shortURL],
    user: users[req.session.user_id]
  };

  //if the shortURL is not in the database, send an error message
  if (!urlDatabase[req.params.shortURL]) {
    res.status(404);
  }

  //render the urls_show HTML page with the help of templateVars
  res.render("urls_show", templateVars);
});

//editing longURL for a specific shortURL
app.post("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const longURL = req.body.longURL;
  const user = users[req.session.user_id];

  //prevent individuals who are not logged in to edit the URL
  if (!user) {
    res.status(401).send("Cannot edit the URL when not logged in!");

  //prevent users who are not the URL's owner to edit the URL
  } else if (user["id"] !== urlDatabase[shortURL]["userID"]) {
    res.status(403).send('Unauthorized to edit URL');

  //if the two conditions are not met, then the person accessing the URL is the owner and can edit the URL
  } else {
    urlDatabase[shortURL]['longURL'] = longURL;
    res.redirect('/urls');
  }
});

//redirect shortURL to longURL site
app.get("/u/:shortURL", (req, res) => {
  const shortUrlInfo = urlDatabase[req.params.shortURL];

  /*if the shortURL is not in the database,
    send the user an error page, outside of the tinyapp website*/
  if (!urlDatabase[req.params.shortURL]) {
    res.status(404).send("<h2>This URL is not associated with any site. Please make sure you have typed it in correctly!</h2>");
  
  //otherwise, redirect to the site associated with the shortURL
  } else {
    res.redirect(shortUrlInfo['longURL']);
  }
});

//delete a shortURL
app.post("/urls/:shortURL/delete", (req, res) => {
  const user = users[req.session.user_id];

  //if the individual is not logged in, prevents them from deleting a URL
  if (!user) {
    res.status(401).send('Unauthorized to delete URL.');
  
  //if the id of the user logged in is not the same as the id associated with the URL, prevent them from deleting
  } else if (user["id"] !== urlDatabase[req.params.shortURL]["userID"]) {
    res.status(403).send('Unauthorized to delete URL.');
  
  // if both the checks above pass, allow the deletion of the URL
  } else {
    delete urlDatabase[req.params.shortURL];
    //redirect to user's main URL page
    res.redirect("/urls");
  }
});

//LOGIN
//login page
app.get('/login', (req, res) => {
  const templateVars = { user: users[req.session.user_id] };

  //redirect a user that is logged in to their main URLs page
  if (users[req.session.user_id]) {
    res.redirect('/urls');
  //otherwise, load up the login page
  } else {
    res.render('login', templateVars);
  }
});

//login to user, set cookie for user
app.post("/login", (req, res) => {
  const loginUserEmail = req.body.email;
  const loginUserPassword = req.body.password;
  //checks for a user in the database using their email
  const checkForUser = getUserByEmail(loginUserEmail, users);
  
  //if user can't be found from the email inputted, return error message
  if (!checkForUser.email) {
    res.status(403).send('<h2>Unregistered email. Please register this email.</h2>');
  
  //if the password inputted does not correspond to the email in the database, return error message
  } else if (!bcrypt.compareSync(loginUserPassword, checkForUser.password)) {
    console.log(bcrypt.compareSync(loginUserPassword, checkForUser.password));
    res.status(403).send('<h2>Password is incorrect. Please carefully re-enter your password.</h2>');
  
  //if both checks pass, then set user to an encrypted cookie and redirect them to their main URL page
  } else {
    req.session['user_id'] = checkForUser.id;
    res.redirect('/urls');
  }
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
  //if user is logged in and goes to the register page, redirect to their main URL page
  if (users[req.session.user_id]) {
    res.redirect('/urls');
  } else {
    res.render('register', templateVars);
  }
});

//register a new user, setting user cookie
app.post('/register', (req, res) => {
  const id = generateRandomString();
  const email = req.body.email;
  const password = req.body.password;
  //encrypt password with bcrypt
  const hashedPassword = bcrypt.hashSync(password, 10);
  //returns user info using their email
  const checkForUser = getUserByEmail(email, users);

  //if email or password is left blank when submitting, return error
  if (email === "" || password === "") {
    res.status(400).send('<h2>Invalid email or password.</h2>');
  
  //if email is already in the database, return an error
  } else if (checkForUser.email === email) {
    res.status(400).send('<h2>Email is already registered. Please use a different email to register.</h2>');
  
  //if both these checks pass, register the user info, log user in with an encrypted cookie, and redirect to their main URL page
  } else {
    users[id] = {
      id,
      email,
      password: hashedPassword
    };

    console.log(users); //check to see if user is added to list
    req.session['user_id'] = id;
    res.redirect('/urls');
  }
});

//server listening port
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});