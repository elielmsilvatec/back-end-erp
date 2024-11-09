const express = require("express");
const router = express.Router();
const Produto = require("../Model/ProdutoModel");
const User = require("../User/userController");
const { Op } = require("sequelize");
const Auth = require("../auth");


router.get('/produto/listar', async (req, res) => {
  const user = req.headers['user']; // Captura o header 'User-Name'

  if (!user) {
    return res.status(400).json({ message: 'Usuario não autenticado' });
  }

  // Aqui você pode usar o userName para filtrar ou buscar dados específicos
  console.log(`Usuario autenticado: ${user}`);



  try {
    const produtos = await Produto.findAll({
      where: { usuario: user },
      limit: 100,
    });

    // console.log('Produtos encontrados:', produtos);

    return res.status(200).json({ produtos });
  } catch (error) {
    console.error("Erro ao buscar produtos:", error);
    return res.status(500).json({ error: "Erro ao buscar produtos" });
  }


});


// ler
// router.get("/produto/produtos", Auth, async (req, res) => {
//   try {
//     const produtos = await Produto.findAll({
//       where: { usuario: req.session.user.id },
//       limit: 100,
//     });

//     // console.log('Produtos encontrados:', produtos);

//     return res.status(200).json({ produtos });
//   } catch (error) {
//     console.error("Erro ao buscar produtos:", error);
//     return res.status(500).json({ error: "Erro ao buscar produtos" });
//   }
// });

// ler estoque baixo
router.get("/produto/estoque_baixo", Auth, async (req, res) => {
  try {
    const produtos = await Produto.findAll({
      where: {
        quantidadeEstoque: {
          [Op.lt]: 10,
        },
        usuario: req.session.user.id,
      },
      order: [["quantidadeEstoque", "ASC"]],
      limit: 100,
    });

    return res.status(200).json(produtos);
  } catch (error) {
    return res.status(500).json({ error: "Erro ao buscar produtos" });
  }
});

///   buscar produtos
router.post("/produto/buscar", Auth, async (req, res) => {
  const { buscarProduto } = req.body;
  // console.log(req.body)
  // console.log(buscarProduto);
  // UserID = req.session.user.id // Adiciona a condição para verificar o usuário logado

  try {
    const produtos = await Produto.findAll({
      where: {
        nomeProduto: {
          [Op.like]: `%${buscarProduto}%`,
        },
        usuario: req.session.user.id, // segundaverificação praverificar o id do usuario
      },
      // include: User.busca({ where: { id: req.session.user.id } }) // Inclui a referência ao modelo User na consulta
    });

    return res.status(200).json({ produtos });

    //res.json(produtos)
  } catch (error) {
    console.log(error);
    const produtos = await Produto.findAll({
      where: { usuario: req.session.user.id },
    });
    // const produtos = await Produto.findAll({ where: { id: req.session.user.id } });
    return res.status(500).json({
      produtos,
      mensagem: false,
      message: "Erro ao buscar produto",
      error: error.message,
    });
  }
});

// Criar novo - Está recebendo os dados do formulário via post
router.post("/produtos/save", Auth, async (req, res) => {
  var nomeProduto = req.body.nomeProduto;
  var marca = req.body.marca;

  if (nomeProduto != undefined) {
    // Consulta para verificar se já existe um produto com o mesmo nome
    const produtoExistente = await Produto.findOne({
      where: { nomeProduto: nomeProduto, usuario: req.session.user.id },
    });

    if (produtoExistente) {
      // Produto com o mesmo nome já existe, exiba uma mensagem de erro ou tome a ação apropriada
      req.flash("erro_msg", "Produto com o mesmo nome já existe");
      res.redirect("/produto/produtos");
    } else {
      // Se não existe um produto com o mesmo nome, insira ao banco de dados
      var unidadeMedida = req.body.unidadeMedida;
      var quantidadeEstoque = req.body.quantidadeEstoque.replace(
        /(\.|,)/g,
        (match, p1) => (p1 === "." ? "" : ".")
      );
      var valorCompra = req.body.valorCompra.replace(/(\.|,)/g, (match, p1) =>
        p1 === "." ? "" : "."
      );
      var valorVenda = req.body.valorVenda.replace(/(\.|,)/g, (match, p1) =>
        p1 === "." ? "" : "."
      );
      var observacoes = req.body.observacoes;

      Produto.create({
        nomeProduto: nomeProduto,
        marca,
        unidadeMedida: unidadeMedida,
        quantidadeEstoque: quantidadeEstoque,
        valorCompra: valorCompra,
        valorVenda: valorVenda,
        observacoes: observacoes,
        usuario: req.session.user.id,
      }).then(() => {
        return res.status(200).json({ message: "Produto criado com sucesso!" });
      });
    }
  } else {
    return res.status(500).json({
      message: "Erro ao criar produto",
      error: error.message,
    });
  }
});

// Deletar
router.delete("/produtos/del/:id", Auth, async (req, res) => {
  const { id } = req.params;
  try {
    const produto = await Produto.findByPk(id);
    if (!produto) {
      return res.status(404).json({ error: "Produto não encontrado." });
    }
    await produto.destroy();
    return res.status(200).json({ message: "Produto excluid com sucesso!" });
  } catch (error) {
    return res
      .status(500)
      .json({ error: "Ocorreu um erro ao excluir o produto." });
  }
});

// Recebendo os dados enviar a tela de editar
router.get("/produtos/view/:id", Auth, async (req, res) => {
  const id = req.params.id;
  try {
    const produto = await Produto.findOne({
      where: { id, usuario: req.session.user.id },
    });
    if (produto) {
      return res.status(200).json(produto);
    } else {
      return res.status(500).json({ error: "ID do produto não encontrado" });
    }
  } catch (error) {
    return res.status(500).json({ error: "Erro ao carregar o produto" });
  }
});

// Recebendo os dados da tela de editar produtos e atualizando (update)
router.post("/produtos/edit/save/:id", Auth, async (req, res) => {
  // console.log(req.body);
  // console.log(req.params);
  const id = req.params.id;
  const {
    nomeProduto,
    marca,
    unidadeMedida,
    observacoes,
    // quantidadeEstoque,
    // valorCompra,
    // valorVenda,
  } = req.body;
  var quantidadeEstoque = String(req.body.quantidadeEstoque).replace(/(\.|,)/g, (match, p1) => p1 === "." ? "" : ".");
  var quantidadeEstoque = String(req.body.quantidadeEstoque).replace(",", ".");
  var valorCompra = String(req.body.valorCompra).replace(/(\.|,)/g, (match, p1) =>
    p1 === "." ? "" : "."
  );

  var valorVenda = String(req.body.valorVenda).replace(/(\.|,)/g, (match, p1) =>
    p1 === "." ? "" : "."
  );

  if (nomeProduto) {
    await Produto.update(
      {
        nomeProduto,
        marca,
        unidadeMedida,
        quantidadeEstoque,
        valorCompra,
        valorVenda,
        observacoes,
      },
      {
        where: { id: id },
      }
    );
    return res.status(200).json({ message: "Produto editado com sucesso!" });
  } else {
    return res.status(500).json({ error: "Erro ao editar!" });
  }
});

// essa função possibilita que eu possa passar o Produtos pra qualquer controller / view
router.findAll = async () => {
  try {
    const produtos = await Produto.findAll({
      where: { usuario: req.session.user.id },
    });
    return produtos;
  } catch (err) {
    console.error(err);
    throw new Error("Erro ao buscar produtos");
  }
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

router.get("/api/produtos/pesquisa", async (req, res) => {
  const termo = req.query.termo;
  try {
    const produtos = await Produto.findAll({
      where: {
        nomeProduto: {
          [Op.like]: `%${termo}%`,
        },
      },
    });
    res.render("produto/produtos", { produtos });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Erro ao buscar produtos." });
  }
});

// ler
router.get("/produto/ler", async (req, res) => {
  try {
    const produtos = await Produto.findAll({});
    return res.status(200).json(produtos);
  } catch (error) {
    return res.status(500).json({ error: "Erro ao buscar produtos" });
  }
});

// RODA DE EXEMPLO API
// router.get('/produto/ler', async (req, res) => {

//   try {
//     const produtos = await Produto.findAll({});
//     return res.status(200).json(produtos);
//   } catch (error) {
//     return res.status(500).json({ error: 'Erro ao buscar produtos' });
//   }
// });
module.exports = router;
