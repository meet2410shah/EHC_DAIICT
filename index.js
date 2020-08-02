const path = require(`path`);

// Database Connection
const connection = require(`./database/connection`);

// Required 3rd Party Modules
const cookieParser = require(`cookie-parser`);

// Configuration Setup
const config = require(`config`);
const PORT = process.env.PORT || config.get(`SERVER.PORT`);

// Express App Setup
const express = require(`express`);
const app = express();

const DURATION = config.get(`COOKIES.DURATION`);

const Member = require("./models/Member");

// Express App Settings
app.set(`view engine`, `ejs`);

// Express App Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(`public`));
app.use(cookieParser());

const userOut = (req, res, next) => {
  const { Token } = req.cookies;
  if (Token) {
    return res.redirect("/dashboard");
  }
  return next();
};

app.get(`/`, userOut, (req, res) => {
  return res.render("home");
});

app.get(`/dashboard`, (req, res) => {
  const { Token } = req.cookies;
  if (!Token) {
    return res.redirect("/");
  }
  return res.render("dashboard");
});

app.get(`/login`, userOut, (req, res) => {
  res.render("login");
});

app.post(`/login`, userOut, (req, res) => {
  const { 
    your_username,
    password
  } = req.body;
  Member.findOne({ your_username }, (err, member) => {
    if (err || !member) {
      return res.redirect("/login?error='usernotfound'");
    }
    if (member.password === password) {
      res.cookie(`Token`, member._id, { maxAge: DURATION });
      return res.redirect("/dashboard");
    } else {
      res.redirect('/login?error="wrongpassword"');
    }
  });
});

app.get(`/register`, userOut, (req, res) => {
  return res.render("register");
});

app.post(`/register`, userOut, (req, res) => {
  const {
    first_name,
    last_name,
    your_email,
    your_username,
    password,
    confirm_password,
    checkbox,
  } = req.body;
  if(password !== confirm_password) {
    return res.redirect("/register?error='password doesn't match'");
  }
  if(checkbox === 'on') {
    const newMember = new Member({
      first_name,
      last_name,
      your_email,
      your_username,
      password,
    });
    newMember.save().then((member, err) => {
      if (err) {
        return res.redirect(`/register`);
      }
      res.cookie(`Token`, member._id, { maxAge: DURATION });
      return res.redirect("/dashboard");
    }).catch(e => {
      return res.redirect("/register?error='user already exists'");
    })
  } else {
    return res.redirect("/register?error='please accept the TandC'");
  }
});

app.post(`/logout`, (req, res) => {
  res.clearCookie("Token");
  return res.redirect("/");
});

const projects = require("./routes/projects");

app.use(`/projects`, projects);

app.listen(3000, () => {
  console.log("Server Started on PORT 3000");
});
