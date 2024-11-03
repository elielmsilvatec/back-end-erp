const Auth = require('./auth')
const express = require('express')
const router = express.Router();



router.get('/', Auth, (req, res) => {
 
  res.render('app', {
    User :  req.session.user
  })
})






module.exports = router;


