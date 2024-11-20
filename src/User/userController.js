const express = require("express");
const router = express.Router();
const User = require("./UserModel");
const { Op } = require("sequelize");
//cryptografia de senhas com bcrypt
const bcrypt = require("bcryptjs");
const Auth = require("../auth");
const nodemailer = require("nodemailer");

const jwt = require("jsonwebtoken"); // Adiciona jsonwebtoken
const { has } = require("browser-sync");
const secret = "kakdhkasjdkhajkdhkajsdhjkshdjkahskdh";

// ler
// router.get("/user/login", (req, res) => {
//   try {
//     res.render("user/login");
//   } catch (error) {
//     return res.status(500).json({ error: "Erro ao carregar" });
//   }
// });

// Rota de verificação da sessão
router.get("/session-info", (req, res) => {
  if (req.session.user) {
    // Se o usuário estiver logado, retorna as informações da sessão   
    res.status(200).json({ loggedIn: true, user: req.session.user });
 } else {
    // Se o usuário não estiver logado, retorna status não autorizado
    res.status(401).json({ loggedIn: false, user: null });
  }
});


// login
router.post("/user/login", async (req, res) => {
  var email = req.body.email;
  var senha = req.body.senha;

  try {
    if (!email || email.trim() === "") {
      req.flash("erro_msg_login", "Email ou senha incorretos...!");
      return res.redirect("login");
    }

    User.findOne({ where: { email: email } }).then((user) => {
      if (user != undefined) {
        var correct = bcrypt.compareSync(senha, user.senha);
        if (correct) {
          // Gerar o JWT
          // const token = jwt.sign(
          //   { id: user.id, nome: user.nome, email: user.email, cargo: "vendedor" },
          //   secret,
          //   { expiresIn: '2d' } // Define o tempo de expiração do token (1 hora nesse caso)
          // );

          req.session.user = {
            id: user.id,
            nome: user.nome,
            email: user.email,
            cargo: "vendedor",
          };


          // Retornar o token no corpo da resposta
          // return res.status(200).json({ message: "Login bem-sucedido", token, user: req.session.user });
          return res.status(200).json({ message: "Login bem-sucedido",  user: req.session.user });
          //res.json(req.session.user)
        } else {
          return res.json({
            mensagem: false,
            message: "Email ou senha incorretos.",
          });
        }
      } else {
        return res.json({
          mensagem: false,
          message: "Email ou senha incorretos.",
        });
      }
    });
  } catch (error) {
    return res
      .status(500)
      .json({
        mensagem: false,
        message: "Erro ao logar",
        error: error.message,
      });
  }
});


//  Criando User
router.post("/user/new", async (req, res) => {
  var nome = req.body.nome;
  var email = req.body.email;
  var senha = req.body.senha;
  console.log(nome, email, senha);
  var salt = bcrypt.genSaltSync(10);
  var hash = bcrypt.hashSync(senha, salt);
  // se nome não estiver vazio ele insere ao banco de dados
  if (!email || email.trim() === "") {
    var vazio = 1;
    return res.json({ message: "Email ou senha estão vazios...!" });
  }

  User.findOne({ where: { email: email } }).then((user) => {
    if (user == undefined) {
      //if (email != undefined && email != null && typeof email) {
      if (typeof email === "string") {
        User.create({
          nome: nome,
          email: email,
          senha: hash,
        }).then(() => {

          return res
            .status(200)
            .json({ message: "Cadastrado com sucesso. Faça login!" });
        });
      } else {
        return   res.status(409).json({ message: "Por favor, insira um email válido." });
      }
    } else {
      if (vazio != 1) {
        return   res.status(500).json({ message: "O email já está cadastrado." });
      }
    }
  });
});

// Rota de logout
router.post("/user/logout", (req, res) => {
  // Destrói a sessão do usuário
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: "Erro ao encerrar a sessão" });
    }
    // Se a sessão for destruída com sucesso, remove o cookie de sessão
    res.clearCookie("connect.sid"); // O nome do cookie pode variar dependendo da configuração

    return res.status(200).json({ message: "Logout bem-sucedido" });
  });
});

// Ver perfil do usuário
router.get("/user/perfil", Auth, async (req, res) => {
  try {
    const userId = req.session.user.id;
    const user = await User.findOne({ where: { id: userId } }); // Use "id" em vez de "usuario"
    if (user) {
      res.render("user/perfil", { user });
    } else {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }
  } catch (error) {
    return res
      .status(500)
      .json({ error: "Erro ao carregar o perfil do usuário" });
  }
});

// Login Cargo
router.get("/user/cargo", Auth, async (req, res) => {
  res.render("user/cargo");
});

router.post("/user/cargo/login", Auth, async (req, res) => {
  var email = req.body.email;
  var senha = req.body.senha;
  var cargo = req.body.form_cargo;
  try {
    if (!email || email.trim() === "") {
      req.flash("erro_msg_login", "Email ou senha incorretos...!");
      return res.redirect("login");
    }

    User.findOne({ where: { email: email } }).then((user) => {
      if (user != undefined) {
        var correct = bcrypt.compareSync(senha, user.senha);
        if (correct) {
          req.session.user = {
            id: user.id,
            email: user.email,
            cargo: cargo,
          };
          req.flash("sucesso_msg", "Agora você tem acesso de ", cargo);
          return res.redirect("/");
          //res.json(req.session.user)
        } else {
          req.flash("erro_msg", "Senha incorreta...!");
          return res.redirect("/");
        }
      } else {
        req.flash("erro_msg", "Email ou senha incorretos...!");
        return res.redirect("/");
      }
    });
  } catch (error) {
    return res.status(500).json({ error: "Erro ao logar" });
  }
});

// --------------Solicitação de Recuperação de Senha-------------------------------------------------------------------------------------------

router.post("/user/recuperar-senha", async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      req.flash("erro_msg_login", "E-mail não encontrado.");
      return res.redirect("/user/login");
    }
    // Gerar um token de recuperação de senha com 6 números
    const generateRandomToken = () => {
      const min = 100000;
      const max = 999999;
      const randomNumber = Math.floor(Math.random() * (max - min + 1)) + min;
      return randomNumber.toString(); // Converter para string
    };
    // Usar a função para gerar o token
    const token = generateRandomToken();

    const smtp = nodemailer.createTransport({
      host: "smtp-mail.outlook.com",
      port: 587,
      secure: false,
      auth: {
        user: "eliel.silva.lider@hotmail.com",
        pass: "eliza2018",
      },
    });

    var message = {
      from: "eliel.silva.lider@hotmail.com",
      to: email,
      subject: "Código de verificação ContruERP",
      text:
        "Segue sua senha provisória, mudar assim que entrar no sistema: \n" +
        token,
      html:
        "<p>Segue sua senha provisória, mudar assim que entrar no sistema:</p>" +
        token,
    };

    smtp.sendMail(message, function (err) {
      if (err) {
        // res.status(400).json({
        //   error: true,
        //   mensagem: "erro ao enviar email" + err
        // })
        req.flash("erro_msg_login", "Erro ao enviar e-mail.");
        res.redirect("/user/login");
      } else {
        const salt = bcrypt.genSaltSync(10);
        const hash = bcrypt.hashSync(token, salt);

        // atualizando a senha
        if (email) {
          User.update(
            {
              senha: hash,
            },
            {
              where: { email: email },
            }
          );
          req.flash(
            "sucesso_msg_login",
            "Sua nova senha foi enviada para seu email!"
          );
          res.redirect("/user/login");
        } else {
          req.flash("erro_msg_login", "Houve um erro ao enviar sua senha!");
          res.redirect("/");
        }
      }
    });
  } catch (error) {
    console.error(error);
    req.flash(
      "erro_msg_login",
      "Ocorreu um erro ao processar sua solicitação."
    );
    res.redirect("/user/login");
  }
});

// atualizando a senha
router.post("/user/nova-senha", Auth, async (req, res) => {
  try {
    const senha = req.body.senha;

    if (!senha || senha.trim() === "") {
      req.flash("erro_msg", "campo senha invalido!");
      return res.redirect("/user/perfil");
    }

    if (senha) {
      const salt = bcrypt.genSaltSync(10);
      const hash = bcrypt.hashSync(senha, salt);
      // atualizando a senha
      User.update(
        {
          senha: hash,
        },
        {
          where: { id: req.session.user.id },
        }
      );
      req.flash("sucesso_msg", "Sua nova senha foi atualizada!");
      res.redirect("/user/perfil");
    } else {
      req.flash("erro_msg", "Erro ao atualizar senha!");
      res.redirect("/user/perfil");
    }
  } catch (error) {
    return res.status(500).json({ error: "Erro..." });
  }
});

module.exports = router;

// essa função possibilita que eu possa passar o User pra qualquer controller / view
// router.busca = async () => {
//   try {
//     const produtos = await Produto.findAll();
//     return produtos;
//   } catch (err) {
//     console.error(err);
//     throw new Error('Erro ao buscar produtos');
//   }
// }
