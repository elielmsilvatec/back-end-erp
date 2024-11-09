//auth.js


module.exports = (req, res, next) => {
  if (req.session && req.session.user) {
        console.log("Sessão de usuário autenticada:", req.session.user);
        return next();
      } else {
        console.log("Usuário não autenticado");
        return res.status(401).json({ message: "Usuário não autenticado" });
      }
  };



  // function Auth(req, res, next) {
  //   if (req.session && req.session.user) {
  //     console.log("Sessão de usuário autenticada:", req.session.user);
  //     return next();
  //   } else {
  //     console.log("Usuário não autenticado");
  //     return res.status(401).json({ message: "Usuário não autenticado" });
  //   }
  // }
  