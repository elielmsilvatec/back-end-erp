const express = require("express");
const router = express.Router();
const { Op } = require("sequelize");
const Pedido = require("../Model/PedidosModel");
const User = require("../User/UserModel");
const Produto = require("../Model/ProdutoModel");
const Auth = require("../auth");
const ItemPedido = require("../Model/itensPedidosModel");
const Cliente = require("../Model/ClienteModel");
// const html_to_pdf = require("html-pdf-node"); // desistalado
// replace(/(\.|,)/g, (match, p1) => p1 === "." ? "" : ".").replace("R$", "");

// gerar pdf com puppeteer
const puppeteer = require("puppeteer");

// rota principal de pedidos
router.get("/pedido/pedidos", Auth, async (req, res) => {
  //res.render("pedido/pedidos")
  try {
    // const pedidos = await Pedido.findAll();
    const pedidos = await Pedido.findAll({
      where: { status: 1, usuario: req.session.user.id },
      limit: 100,
    });
    const clientes = await Cliente.findAll({
      where: { usuario: req.session.user.id },
    });

    return res.status(200).json({
      pedidos,
      clientes,
    });
  } catch (error) {
    return res.status(500).json({ error: "Erro ao buscar pedidos" });
  }
});

// Rota dos pedidos Fechados
router.get("/pedido/pedidos_fechados", Auth, async (req, res) => {
  //res.render("pedido/pedidos")
  try {
    // const pedidos = await Pedido.findAll();
    const pedidos = await Pedido.findAll({
      where: { status: 2, usuario: req.session.user.id },
      limit: 100,
    });

    const cliente = await Cliente.findAll({
      where: { usuario: req.session.user.id },
    });

    return res.status(500).json({
      pedidos,
      cliente,
    });
  } catch (error) {
    return res.status(500).json({ error: "Erro ao buscar pedidos" });
  }
});

// adiciono novo pedido criando um item pedido
router.post("/pedido/add_novo", Auth, async (req, res) => {
  try {
    var quantidade = 0;
    var status = 1;
    var valor_total_pedido = 0;

    var ultimoId = await Pedido.max("num_pedido", {
      where: { usuario: req.session.user.id },
    });
    ultimoId = ultimoId + 1;

    await Pedido.create({
      num_pedido: ultimoId,
      quantidade: quantidade,
      status: status,
      valor_total_pedido: valor_total_pedido,
      usuario: req.session.user.id,
    });

    const pedido = await Pedido.findOne({
      where: { num_pedido: ultimoId, usuario: req.session.user.id },
    });

    return res.status(200).json({ pedido });
  } catch (error) {
    return res
      .status(500)
      .json({ error: "Ocorreu um erro ao adicionar o pedido." });
  }
});

// deletando um pedido
router.get("/pedido/delet/:id", Auth, async (req, res) => {
  const id = req.params.id;
  try {
    const pedido = await Pedido.findByPk(id);
    if (!pedido) {
      return res.status(404).json({ error: "Pedido não encontrado." });
    }

    // Deleta todos os itemPedido associados ao pedido
    await ItemPedido.destroy({
      where: { pedido: id, usuario: req.session.user.id },
    });

    // Deleta o pedido
    await pedido.destroy();

    return res.status(200).json({ message: "Pedido excluído com sucesso." });
  } catch (error) {
    return res
      .status(500)
      .json({ error: "Ocorreu um erro ao excluir o pedido." });
  }
});

// Recebendo os dados enviar a tela de itens_Pedidos
router.get("/pedido/ver/:id", Auth, async (req, res) => {
  const id = req.params.id;
  try {
    // ver se tem produtos no item
    const itemPedido = await ItemPedido.findAll({
      where: { pedido: id, usuario: req.session.user.id },
    });
    // Busca o pedido e os produtos e aguarda o resultado
    const [pedido] = await Promise.all([Pedido.findOne({ where: { id } })]);
    if (!pedido) {
      // Caso o pedido não seja encontrado, retorna um erro 404
      return res.status(404).render("404");
    }
    const cliente = await Cliente.findOne({
      where: { id: pedido.cliente_pedido, usuario: req.session.user.id },
    });

    return res.status(200).json({ pedido, itemPedido, cliente });
  } catch (error) {
    //res.redirect('/pedido/pedidos')
    return res.status(500).json({ error: "Erro ao buscar pedido" });
  }
});

///  buscando produtos
router.post("/pedido/buscar/produto", Auth, async (req, res) => {
  // const { busca } = req.body;
  const busca = req.body.busca;
  const id = req.body.id_pedido;

  try {
    const produtos = await Produto.findAll({
      where: {
        nomeProduto: {
          [Op.like]: `%${busca}%`,
        },
        usuario: req.session.user.id,
      },
      limit: 20, // Limita para 20 resultados
    });

    const [pedido] = await Promise.all([Pedido.findOne({ where: { id } })]);

    if (produtos.length > 0) {
      return res.status(200).json({ produtos, pedido });
    } else {
      return res.status(404).json({ error: "Produto não encontrado!" });
    }
  } catch (error) {
    res.send("Erro cath");
    const pedido = Pedido.findOne({ where: { id } });
    //req.flash('erro_msg', 'Erro ao buscar produto!')
    return res.status(500).json({ pedido, error: "Erro ao buscar produtos!" });
  }
});

///  buscando cliente
router.post("/pedido/buscar/cliente", Auth, async (req, res) => {
  // const { busca } = req.body;
  const busca = req.body.busca;
  const id = req.body.id_pedido;

  try {
    const clientes = await Cliente.findAll({
      where: {
        nome: {
          [Op.like]: `%${busca}%`,
        },
        usuario: req.session.user.id,
      },
      limit: 20, // Limita para 20 resultados
    });

    const [pedido] = await Promise.all([Pedido.findOne({ where: { id } })]);

    if (clientes.length > 0) {
      return res.status(200).json({ clientes, pedido });
    } else {
      return res.status(404).json({ pedido, error: "Cliente não encontrado!" });
    }
  } catch (error) {
    const pedido = Pedido.findOne({ where: { id } });
    return res.status(500).json({ pedido, error: "Erro ao buscar clientes!" });
  }
});

// adiciono cliente ao pedido
router.post("/pedido/cliente/add_novo", Auth, async (req, res) => {
  try {
    const { id_cliente, id_pedido } = req.body;

    const pedido = await Pedido.findOne({
      where: { id: id_pedido, usuario: req.session.user.id },
    });

    if (pedido) {
      // Verifica se o pedido já possui um cliente associado
      if (pedido.cliente_pedido) {
        // Se já tiver um cliente, faz o upgrade do cliente
        await pedido.update({ cliente_pedido: id_cliente });
      } else {
        // Se não tiver um cliente, insere o novo cliente
        await pedido.update({ cliente_pedido: id_cliente });
      }
    }
    const cliente = await Cliente.findOne({
      where: { id: pedido.cliente_pedido, usuario: req.session.user.id },
    });
    const itemPedido = await ItemPedido.findAll({
      where: { pedido: id_pedido, usuario: req.session.user.id },
    });

    return res.status(200).json({
      pedido,
      itemPedido,
      cliente,
      message: "Item adicionado ao pedido com sucesso.",
    });
  } catch (error) {
    return res.status(400).json({message: "Erro ao tentar adicionar cliente ao pedido!"});
  }
});

///  Adicionando produto ao item pedido produtos
router.post("/pedido/add/produto_item", Auth, async (req, res) => {
  try {
    const {
      nome,
      undMedidas,
      marca,
      sub_total_itens,
      valor_compra,
      IDpedido,
      itens_produto,
    } = req.body;

    const itemPedidoExistente = await ItemPedido.findOne({
      where: {
        produtoID: itens_produto,
        pedido: IDpedido,
        usuario: req.session.user.id,
      },
    });
    const itemProduto = await Produto.findOne({
      where: { id: itens_produto, usuario: req.session.user.id },
    });

    if (itemPedidoExistente) {
      const itemPedidoAtualizado = await ItemPedido.update(
        {
          quant_itens: itemPedidoExistente.quant_itens + 1,
          valor_unitario: itemProduto.valorVenda,
          sub_total_itens:
            (itemPedidoExistente.quant_itens + 1) * sub_total_itens,
          valor_compra: (itemPedidoExistente.quant_itens + 1) * valor_compra,
          lucro:
            (itemProduto.valorVenda - itemProduto.valorCompra) *
            (itemPedidoExistente.quant_itens + 1),
        },
        { where: { id: itemPedidoExistente.id } }
      );

    } else {
      await ItemPedido.create({
        nome,
        undMedidas,
        marca,
        quant_itens: 1,
        valor_compra: valor_compra,
        valor_unitario: sub_total_itens,
        sub_total_itens,
        lucro: itemProduto.valorVenda - itemProduto.valorCompra,
        pedido: IDpedido,
        produtoID: itens_produto,
        itens_produto,
        usuario: req.session.user.id,
      });

    }

    const pedido = await Pedido.findOne({
      where: { id: IDpedido, usuario: req.session.user.id },
    });

    const itemPedido = await ItemPedido.findAll({
      where: { pedido: IDpedido, usuario: req.session.user.id },
    });

    let cliente;
    cliente = await Cliente.findOne({
      where: { id: pedido.cliente_pedido, usuario: req.session.user.id },
    });

    // Calcula o novo valor total do pedido somando o sub_total_itens de todos os itemPedido
    const novoValorTotal = itemPedido.reduce(
      (total, item) => total + item.sub_total_itens,
      0
    );

    // Atualiza o valor_total_pedido no banco de dados
    await Pedido.update(
      { valor_total_pedido: novoValorTotal },
      { where: { id: IDpedido } }
    );

    return res.status(200).json({
      pedido,
      itemPedido,
      cliente,
      message: "Item adicionado ao pedido com sucesso.",
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Ocorreu um erro ao adicionar o item ao pedido." });
  }
});

// atualizando quantidades
router.post("/pedido/editar/quant", Auth, async (req, res) => {
  try {
    const id = req.body.id;
    const IDpedido = req.body.IDpedido;
    const quant = req.body.quant.replace(/(\.|,)/g, (match, p1) =>
      p1 === "." ? "" : "."
    );
    // const valor_compra = req.body.valor_compra.replace(/(\.|,)/g, (match, p1) =>
    //   p1 === "." ? "" : "."
    // );
    // const valor_unitario = req.body.valor_unitario
    //   .replace(/(\.|,)/g, (match, p1) => (p1 === "." ? "" : "."))
    //   .replace("R$", "");

    

    const itemPedidoExistente = await ItemPedido.findOne({
      where: { id: id, pedido: IDpedido, usuario: req.session.user.id },
    });
    const itemProduto = await Produto.findOne({
      where: {
        id: itemPedidoExistente.produtoID,
        usuario: req.session.user.id,
      },
    });

    if (quant) {
      await ItemPedido.update(
        {
          quant_itens: quant,
          sub_total_itens: quant * itemPedidoExistente.valor_unitario,
        },
        { where: { id: itemPedidoExistente.id } }
      );

      const pedido = await Pedido.findOne({
        where: { id: IDpedido, usuario: req.session.user.id },
      });

      const itemPedido = await ItemPedido.findAll({
        where: { pedido: IDpedido, usuario: req.session.user.id },
      });

      const cliente = await Cliente.findOne({
        where: { id: pedido.cliente_pedido, usuario: req.session.user.id },
      });

      // Calcula o novo valor total do pedido somando o sub_total_itens de todos os itemPedido
      const novoValorTotal = itemPedido.reduce(
        (total, item) => total + item.sub_total_itens,
        0
      );

      // Atualiza o valor_total_pedido no banco de dados
      await Pedido.update(
        { valor_total_pedido: novoValorTotal },
        { where: { id: IDpedido } }
      );

      return res.status(200).json({
        pedido,
        itemPedido,
        cliente,
      });

    } else {
      return res
        .status(201)
        .json({ pedido, itemPedido, cliente, error: "Quantidade inválida." });
    }
  } catch (error) {
 return res
      .status(500)
      .json({ error, message: "Ocorreu um erro ao adicionar o item ao pedido." });
  }
});

// mudando os preços unitario de pedido
router.post("/pedido/editar/valor_unitario", Auth, async (req, res) => {
  try {
    const { id, IDpedido } = req.body;
    const valor_unitario = req.body.valor_unitario.replace(
      /(\.|,)/g,
      (match, p1) => (p1 === "." ? "" : ".")
    );
    const itemPedidoExistente = await ItemPedido.findOne({
      where: { id: id, pedido: IDpedido, usuario: req.session.user.id },
    });

    if (valor_unitario) {
      // verifica se o valor mudado é maior que o valor de compra se for devolve o erro
      if (valor_unitario > itemPedidoExistente.valor_compra) {
        await ItemPedido.update(
          {
            valor_unitario: valor_unitario,
            sub_total_itens: itemPedidoExistente.quant_itens * valor_unitario,
          },
          { where: { id: itemPedidoExistente.id } }
        );

        const pedido = await Pedido.findOne({
          where: { id: IDpedido, usuario: req.session.user.id },
        });
        const itemPedido = await ItemPedido.findAll({
          where: { pedido: IDpedido, usuario: req.session.user.id },
        });
        const cliente = await Cliente.findOne({
          where: { id: pedido.cliente_pedido, usuario: req.session.user.id },
        });

        // Calcula o novo valor total do pedido somando o sub_total_itens de todos os itemPedido
        const novoValorTotal = itemPedido.reduce(
          (total, item) => total + item.sub_total_itens,
          0
        );

        // Atualiza o valor_total_pedido no banco de dados
        await Pedido.update(
          { valor_total_pedido: novoValorTotal },
          { where: { id: IDpedido } }
        );

        return res.status(200).json({
          pedido,
          itemPedido,
          cliente,
        });
      } else {
        const pedido = await Pedido.findOne({
          where: { id: IDpedido, usuario: req.session.user.id },
        });
        const itemPedido = await ItemPedido.findAll({
          where: { pedido: IDpedido, usuario: req.session.user.id },
        });
        const cliente = await Cliente.findOne({
          where: { id: pedido.cliente_pedido, usuario: req.session.user.id },
        });
        const erro_msg = "Valor do produto menor que o permitido! ";

        return res
          .status(201)
          .json({ pedido, itemPedido, cliente, error: erro_msg });
      }
    } else {
      return res
        .status(400)
        .json({ error: "Ocorreu um erro ao atualizar valor unitario!" });
    }
  } catch (error) {
    return res
      .status(500)
      .json({ error: "Ocorreu um erro ao atualizar o item." });
  }
});

// Finalizando item pedido
router.post("/pedido/finalizar/item", Auth, async (req, res) => {
  const id = req.body.IDpedido;
  const finalizar_venda = req.body.finalizar_venda;
  try {
    const item = await Pedido.findByPk(id);
    if (!item.valor_total_pedido) {
      return res.status(404).json({
        error:
          "Ocorreu um erro ao finalizar pedido, verifica se já existe produto a esse pedido!.",
      });
    } else {
      // atualiza o status do pedido
      await item.update({ status: 2 });

      if (finalizar_venda == 1) {
        return res
          .status(200)
          .json({ message: "Pedido finalizado com sucesso!" });
      } else {
        return res
          .status(200)
          .json({ message: "Pedido finalizado com sucesso!" });
      }

      // const pedido = await Pedido.findOne({ where: { id: id, usuario: req.session.user.id } })
      // const itemPedido = await ItemPedido.findAll({ where: { pedido: id, usuario: req.session.user.id } })
      // // Calcula o novo valor total do pedido somando o sub_total_itens de todos os itemPedido
      // const novoValorTotal = itemPedido.reduce((total, item) => total + item.sub_total_itens, 0);
      // // Atualiza o valor_total_pedido no banco de dados
      // await Pedido.update({ valor_total_pedido: novoValorTotal }, { where: { id: id } });
    }
  } catch (error) {
    return res
      .status(500)
      .json({ error: "Ocorreu um erro ao finalizar pedido!" });
  }
});

// deletando item pedido
router.delete("/pedido/delet/item", Auth, async (req, res) => {
  const id = req.body.id;
  const IDpedido = req.body.IDpedido;

  try {
    const item = await ItemPedido.findByPk(id);
    if (!item) {
      return res.status(404).json({ error: "Item não encontrado." });
    }
    await item.destroy();

    const pedido = await Pedido.findOne({
      where: { id: IDpedido, usuario: req.session.user.id },
    });

    const itemPedido = await ItemPedido.findAll({
      where: { pedido: IDpedido, usuario: req.session.user.id },
    });

    // Calcula o novo valor total do pedido somando o sub_total_itens de todos os itemPedido
    const novoValorTotal = itemPedido.reduce(
      (total, item) => total + item.sub_total_itens,
      0
    );
    // Atualiza o valor_total_pedido no banco de dados
    await Pedido.update(
      { valor_total_pedido: novoValorTotal },
      { where: { id: IDpedido } }
    );

    return res
      .status(200)
      .json({ pedido, itemPedido, message: "Item excluido com sucesso!" });
  } catch (error) {
    return res
      .status(500)
      .json({ error: "Ocorreu um erro ao excluir o pedido." });
  }
});

// deletando cliente do pedido
router.post("/pedido/delet/cliente", Auth, async (req, res) => {
  const id = req.body.IDpedido;

  try {
    const item = await Pedido.findByPk(id);
    if (!item) {
      return res.status(404).json({ error: "Item não encontrado." });
    }
    await item.update({ cliente_pedido: null });

    const pedido = await Pedido.findOne({
      where: { id: id, usuario: req.session.user.id },
    });

    const itemPedido = await ItemPedido.findAll({
      where: { pedido: id, usuario: req.session.user.id },
    });

    // Calcula o novo valor total do pedido somando o sub_total_itens de todos os itemPedido
    const novoValorTotal = itemPedido.reduce(
      (total, item) => total + item.sub_total_itens,
      0
    );
    // Atualiza o valor_total_pedido no banco de dados
    await Pedido.update(
      { valor_total_pedido: novoValorTotal },
      { where: { id: id } }
    );

    res.render("pedido/itemPedido", {
      pedido,
      itemPedido,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ error: "Ocorreu um erro ao excluir o cliente." });
  }
});

// Recebendo os dados enviar a tela de imprimir orçamento
router.get("/pedido/imprimir_ver/:id", Auth, async (req, res) => {
  const id = req.params.id;
  const userId = req.session.user.id;
  try {
    // ver se tem produtos no item
    const itemPedido = await ItemPedido.findAll({
      where: { pedido: id, usuario: req.session.user.id },
    });
    // Busca o pedido e os produtos e aguarda o resultado
    const [pedido] = await Promise.all([Pedido.findOne({ where: { id } })]);
    if (!pedido) {
      // Caso o pedido não seja encontrado, retorna um erro 404
      return res.status(404).render("404");
    }
    const cliente = await Cliente.findOne({
      where: { id: pedido.cliente_pedido, usuario: req.session.user.id },
    });

    const user = await User.findOne({ where: { id: userId } });

    // Renderiza a página e passa as informações do pedido e dos produtos como variáveis para a view
    res.render("pedido/imprimir_ocamento", {
      pedido,
      id,
      itemPedido,
      cliente,
      user,
    });
  } catch (error) {
    //res.redirect('/pedido/pedidos')
    return res.status(500).json({ error: "Erro ao buscar pedido" });
  }
});

// esse esta funcionando normal
router.get("/pedido/imprimir/:id", Auth, async (req, res) => {
  const id = req.params.id;
  const userId = req.session.user.id;

  try {
    const itemPedido = await ItemPedido.findAll({
      where: { pedido: id, usuario: req.session.user.id },
    });

    if (!itemPedido) {
      return res.status(404).render("404");
    }

    const pedido = await Pedido.findOne({ where: { id } });
    if (!pedido) {
      return res.status(404).render("404");
    }

    const cliente = await Cliente.findOne({
      where: { id: pedido.cliente_pedido, usuario: req.session.user.id },
    });

    const user = await User.findOne({ where: { id: userId } });

    const html = await new Promise((resolve, reject) => {
      res.render(
        "pedido/imprimir_ocamento",
        { pedido, id, itemPedido, cliente, user },
        (err, html) => {
          if (err) {
            console.error("Erro ao renderizar HTML:", err);
            return reject(err);
          } else {
            return resolve(html);
          }
        }
      );
    });

    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox"],
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });

    // Gera o PDF sem margens
    const pdfBuffer = await page.pdf({
      // format: "A4",
      // width: '80mm',
      // height: 'auto',
      margin: { top: 0, right: 0, bottom: 0, left: 0 }, // Remove as margens
      width: "70mm", // Largura de 70mm, o tamanho do papel da impressora térmica
      height: "200mm", // Defina uma altura apropriada (dependendo do seu conteúdo)
      printBackground: true,
    });
    await browser.close();

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="orcamento_${pedido.num_pedido}.pdf"`
    );

    res.end(pdfBuffer, "binary");
  } catch (error) {
    console.error("Erro ao buscar pedido:", error);
    return res.status(500).json({ error: "Erro ao buscar pedido" });
  }
});

// router.get("/pedido/imprimir2/:id", Auth, async (req, res) => {
//   const id = req.params.id;
//   const user = req.session.user.id;
//   try {
//     // Ver se tem produtos no item
//     const itemPedido = await ItemPedido.findAll({
//       where: { pedido: id, usuario: req.session.user.id },
//     });

//     // Busca o pedido e os produtos e aguarda o resultado
//     const [pedido] = await Promise.all([Pedido.findOne({ where: { id } })]);
//     if (!pedido) {
//       // Caso o pedido não seja encontrado, retorna um erro 404
//       return res.status(404).render("404");
//     }

//     const cliente = await Cliente.findOne({
//       where: { id: pedido.cliente_pedido, usuario: req.session.user.id },
//     });

//     // Renderiza a página e passa as informações do pedido e dos produtos como variáveis para a view
//     const html = await new Promise((resolve, reject) => {
//       res.render(
//         "pedido/imprimir_ocamento",
//         {
//           pedido,
//           id,
//           itemPedido,
//           cliente,
//           user,
//         },
//         (err, html) => {
//           if (err) {
//             return reject(err);
//           } else {
//             return resolve(html);
//           }
//         }
//       );
//     });

//     // Criação do PDF com html-pdf-node
//     const file = { content: html };
//     const pdfOptions = {
//       format: "A4",
//       args: ["--no-sandbox", "--disable-setuid-sandbox"], // Adicionando a opção --no-sandbox
//     };

//     // Gera o PDF com o conteúdo HTML
//     const pdfBuffer = await html_to_pdf.generatePdf(file, pdfOptions);

//     // Envia o PDF gerado como resposta
//     res.setHeader("Content-Type", "application/pdf");
//     res.setHeader(
//       "Content-Disposition",
//       `attachment; filename="orcamento_${pedido.num_pedido}.pdf"`
//     );
//     return res.send(pdfBuffer);
//   } catch (error) {
//     return res.status(500).json({ error: "Erro ao buscar pedido" });
//   }
// });

module.exports = router;
