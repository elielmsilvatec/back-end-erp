module.exports = (req, res, next) => {
    if (!req.session.user) {
      return res.status(401).json({ message: 'Usuário não autenticado' });    }
  
    // console.log("***************************************", req.session.user)
    next();
  };