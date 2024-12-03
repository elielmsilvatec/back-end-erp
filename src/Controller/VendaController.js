const express = require("express");
const router = express.Router();
const Venda = require("../Model/VendaModel");
const { Op, where } = require("sequelize");
const Processando = require("../../database/database"); // Ajuste o caminho conforme necessário
const Pedido = require("../Model/PedidosModel");
const Produto = require("../Model/ProdutoModel");
const Auth = require("../auth");
const ItemPedido = require("../Model/itensPedidosModel");
const Cliente = require("../Model/ClienteModel");
const User = require("../User/UserModel");

const moment = require("moment");

// gerar pdf com puppeteer
const puppeteer = require("puppeteer");

// ler
router.get("/venda/vendas", Auth, async (req, res) => {
  try {
    const venda_finalizada = await Venda.findAll({
      where: { usuario: req.session.user.id },
    });
    res.render("venda/vendas", {
      venda_finalizada,
      moment,
    });
  } catch (error) {
    req.flash("erro_msg", "Erro ao carregar vendas!");
    res.redirect("/");
  }
});

// lista todos  pedidos
router.get("/venda/pedido/buscar", Auth, async (req, res) => {
  //res.render("pedido/pedidos")
  try {
    // const venda = await Venda.findAll({ where: { usuario: req.session.user.id } });

    const pedidos = await Pedido.findAll({
      where: { status: 2, usuario: req.session.user.id },
    });

    const clientes = await Cliente.findAll({
      where: { usuario: req.session.user.id },
    });

    return res.status(200).json({ pedidos, clientes });
  } catch (error) {
    return res.status(500).json({ error: "Erro ao buscar pedidos" });
  }
});
//--------------------------------------------------------------------
// adicionando nova venda quando escolhe o pedido
router.get("/venda/pedido/adicionar/:id", Auth, async (req, res) => {
  const id = req.params.id;
  let lucro;
  try {
    const pedido = await Pedido.findOne({
      where: { id: id, usuario: req.session.user.id },
    });

    const venda_verifica = await Venda.findOne({
      where: { id_pedido: pedido.id },
    });
    if (!venda_verifica) {
      await Venda.create({
        // data_venda: new Date(),
        valor_total_venda: pedido.valor_total_pedido,
        numero_pedido: pedido.num_pedido,
        usuario: req.session.user.id,
        id_pedido: pedido.id,
      });
    }

    const cliente = await Cliente.findOne({
      where: { id: pedido.cliente_pedido, usuario: req.session.user.id },
    });

    const venda = await Venda.findOne({
      where: { id_pedido: id, usuario: req.session.user.id },
    });

    const itens = await ItemPedido.findAll({
      where: { pedido: id, usuario: req.session.user.id },
    });

    // descobrindo o lucro
    // Buscando itens do pedido
    // Extraindo os IDs dos produtos dos itens
    const produtoIDs = itens.map((item) => item.produtoID);

    if (produtoIDs.length > 0) {
      // Buscando os produtos usando os IDs extraídos
      const produtos = await Produto.findAll({
        where: {
          id: { [Op.in]: produtoIDs },
          usuario: req.session.user.id,
        },
      });

      // Calculando o total do valor de compra e valor de venda considerando a quantidade de itens
      // calculando o valor de compra
      const totalValores = itens.reduce(
        (totals, item) => {
          const produto = produtos.find((prod) => prod.id === item.produtoID);
          if (produto) {
            totals.valorCompra += produto.valorCompra * item.quant_itens;
            totals.valorVenda += produto.valorVenda * item.quant_itens;
          }
          return totals;
        },
        { valorCompra: 0, valorVenda: 0 }
      );

      let totalValorCompra = totalValores.valorCompra;
      let totalValorVenda = totalValores.valorVenda;

      // Calculando o lucro
      // lucro = totalValorVenda - totalValorCompra;
      lucro = pedido.valor_total_pedido - totalValorCompra;
    } else {
      console.log("Nenhum produto encontrado para os itens do pedido.");
    }

    res.render("venda/vendas", {
      pedido,
      cliente,
      venda,
      itens,
      moment,
      lucro,
    });
  } catch (error) {
    return res.status(500).json({ error: "Erro ao adicionar pedido a venda" });
  }
});

// ------------------------------------------------------------
// finalizando a venda apartir que clica no botão "finalizar"
router.post("/venda/pedido/finalizar", Auth, async (req, res) => {
  const transaction = await Processando.transaction();
  try {
    const {
      IDpedido,
      IDvenda,
      form_pagamento,
      quant_parcelas,
      val_desconto,
      valor_total_pedido,
      entrega,
      data_entrega,
      val_taxas,
      lucro,
      imprimir,
    } = req.body;

    // já vem formatado apensas converter de String para Float
    let lucro_total = parseFloat(lucro);

    const valor_total_pedido_num = parseFloat(
      valor_total_pedido.replace("R$", "").replace(".", "").replace(",", ".")
    );
    let valor_total_venda = valor_total_pedido_num;

    if (val_desconto) {
      const desconto_num = parseFloat(
        val_desconto.replace(/(\.|,)/g, (match, p1) => (p1 === "." ? "" : "."))
      );
      valor_total_venda -= desconto_num;
      lucro_total = lucro_total - desconto_num;
    }
    if (val_taxas) {
      const val_taxas_num = parseFloat(
        val_taxas.replace(/(\.|,)/g, (match, p1) => (p1 === "." ? "" : "."))
      );
      valor_total_venda += val_taxas_num;
    }

    // para garantir que será apenas duas casas decimais
    lucro_total = lucro_total.toFixed(2);

    await Venda.update(
      {
        data_venda: new Date(),
        tipo_pagamento: form_pagamento,
        quant_parcelas: quant_parcelas,
        valor_total_venda: valor_total_venda,
        entrega: entrega,
        data_entrega: data_entrega,
        lucro: lucro_total,
        fechado: 1,
        desconto: val_desconto
          ? parseFloat(
              val_desconto.replace(/(\.|,)/g, (match, p1) =>
                p1 === "." ? "" : "."
              )
            )
          : null,
        taxas: val_taxas
          ? parseFloat(
              val_taxas.replace(/(\.|,)/g, (match, p1) =>
                p1 === "." ? "" : "."
              )
            )
          : null,
      },
      {
        where: {
          id: IDvenda,
          usuario: req.session.user.id,
        },
        transaction,
      }
    );

    await Pedido.update(
      {
        status: 3,
        valor_total_pedido: valor_total_venda,
      },
      {
        where: {
          id: IDpedido,
          usuario: req.session.user.id,
        },
        transaction,
      }
    );

    // atualizando o estoque
    const itens = await ItemPedido.findAll({
      where: { pedido: IDpedido, usuario: req.session.user.id },
      transaction,
    });

    const produtoIDs = itens.map((item) => item.produtoID);
    const quantidadesItens = itens.reduce((acc, item) => {
      acc[item.produtoID] = item.quant_itens;
      return acc;
    }, {});

    const produtos = await Produto.findAll({
      where: { id: produtoIDs, usuario: req.session.user.id },
      transaction,
    });

    for (const produto of produtos) {
      const quantidadeEstoqueAtualizada =
        produto.quantidadeEstoque - quantidadesItens[produto.id];
      // console.log(" Estoque " ,  produto.quantidadeEstoque  , " Nova quant ",quantidadesItens[produto.id] )
      await Produto.update(
        { quantidadeEstoque: quantidadeEstoqueAtualizada },
        { where: { id: produto.id, usuario: req.session.user.id }, transaction }
      );
    }

    await transaction.commit();

    const venda_finalizada = await Venda.findAll({
      where: { usuario: req.session.user.id },
    });

    if (imprimir == 1) {
      res.redirect(`/venda/ver/${IDpedido}`);
    } else {
      res.render("venda/vendas", {
        venda_finalizada,
        moment,
      });
    }
  } catch (error) {
    await transaction.rollback();
    return res.status(500).json({ error: "Erro ao finalizar venda! " });
  }
});

// pagina ver todas as vendas finalizadas
router.get("/venda/vendas_finalizadas", Auth, async (req, res) => {
  try {
    const pedido = await Pedido.findAll({
      where: { usuario: req.session.user.id },
    });
    const cliente = await Cliente.findAll({
      where: { usuario: req.session.user.id },
    });

    // filtrando apenas as vendas de hoje
    const data_inicial = new Date();
    const data_final = new Date();
    // Converter as datas para objetos Date
    const startDate = new Date(data_inicial);
    startDate.setUTCHours(0, 0, 0, 0); // Define a primeira hora do dia (00:00:00) em UTC
    const endDate = new Date(data_final);
    endDate.setUTCHours(23, 59, 59, 999); // Define a última hora do dia (23:59:59.999) em UTC

    const venda_finalizada = await Venda.findAll({
      where: {
        // fechado: 1,
        usuario: req.session.user.id,
        data_venda: {
          [Op.between]: [startDate, endDate],
        },
      },
      limit: 100,
      order: [["data_venda", "DESC"]],
    });

    res.render("venda/vendas_finalizadas", {
      venda_finalizada,
      moment,
      pedido,
      cliente,
    });
  } catch (error) {
    req.flash("erro_msg", "Erro ao carregar vendas!");
    res.redirect("/");
  }
});

// Vendas finalizadas filtrada por data
router.post("/venda/vendas_finalizadas/buscar", Auth, async (req, res) => {
  try {
    const { data_inicial, data_final } = req.body;

    // Converter as datas para objetos Date
    const startDate = new Date(data_inicial);
    startDate.setUTCHours(0, 0, 0, 0); // Define a primeira hora do dia (00:00:00) em UTC

    const endDate = new Date(data_final);
    endDate.setUTCHours(23, 59, 59, 999); // Define a última hora do dia (23:59:59.999) em UTC

    const pedido = await Pedido.findAll({
      where: { usuario: req.session.user.id },
    });
    const cliente = await Cliente.findAll({
      where: { usuario: req.session.user.id },
    });

    const venda_finalizada = await Venda.findAll({
      where: {
        fechado: 1,
        usuario: req.session.user.id,
        data_venda: {
          [Op.between]: [startDate, endDate],
        },
      },
      limit: 100,
      order: [["data_venda", "DESC"]],
    });

    if (venda_finalizada.length > 0) {
      res.render("venda/vendas_finalizadas", {
        venda_finalizada,
        moment,
        pedido,
        cliente,
      });
    } else {
      req.flash("erro_msg", "Não foram encontradas vendas nesse período !");
      res.redirect("/venda/vendas_finalizadas");
    }
  } catch (error) {
    req.flash("erro_msg", "Erro ao carregar vendas!");
    res.redirect("/");
  }
});

// Recebendo os dados para  enviar a tela de ver_venda
router.get("/venda/ver/:id", Auth, async (req, res) => {
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
    const venda = await Venda.findOne({
      where: { id_pedido: pedido.id, usuario: req.session.user.id },
    });

    // Renderiza a página e passa as informações do pedido e dos produtos como variáveis para a view
    res.render("venda/ver_venda", {
      pedido,
      id,
      itemPedido,
      cliente,
      venda,
      moment,
    });
  } catch (error) {
    return res.status(500).json({ error: "Erro ao buscar entrega" });
    req.flash("erro_msg", "Erro ao carregar entrega!");
    res.redirect("/");
  }
});

// // Recebendo os dados para  enviar a tela de imprimir_venda
// router.get("/venda/imprimir/:id", Auth, async (req, res) => {
//   const id = req.params.id;
//   try {
//     // ver se tem produtos no item
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
//     const venda = await Venda.findOne({
//       where: { id_pedido: pedido.id, usuario: req.session.user.id },
//     });

//     //recebendo os dados de cadastro do usuario
//     const userId = req.session.user.id;
//     const user = await User.findOne({ where: { id: userId } }); // Use "id" em vez de "usuario"

//     // Renderiza a página e passa as informações do pedido e dos produtos como variáveis para a view
//     res.render("venda/imprimir_venda", {
//       pedido,
//       id,
//       itemPedido,
//       cliente,
//       venda,
//       moment,
//       user,
//     });
//   } catch (error) {
//     return res.status(500).json({ error: "Erro ao buscar venda" });
//     req.flash("erro_msg", "Erro ao carregar entrega!");
//     res.redirect("/");
//   }
// });

router.get("/venda/imprimir/:id", Auth, async (req, res) => {
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
    const venda = await Venda.findOne({
      where: { id_pedido: pedido.id, usuario: req.session.user.id },
    });

    //recebendo os dados de cadastro do usuario
    const userId = req.session.user.id;
    const user = await User.findOne({ where: { id: userId } }); // Use "id" em vez de "usuario"

    const html = await new Promise((resolve, reject) => {
      res.render(
        "venda/imprimir_venda",
        { pedido, id, itemPedido, cliente, user, venda },
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
      `attachment; filename="venda_${venda.id}.pdf"`
    );

    res.end(pdfBuffer, "binary");
  } catch (error) {
    return res.status(500).json({ error: "Erro ao buscar venda" });
    req.flash("erro_msg", "Erro ao carregar entrega!");
    res.redirect("/");
  }
});

// deletando venda APENAS MUDANDO O STATUS
router.post("/vendas/deletar/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const IDpedido = req.body.id_pedido;
    const obs = req.body.obs;
    // atualiza o status para 2 da tabela "vendas" indica que é uma venda cancelada
    // await Venda.update(
    //   {
    //     fechado: 2,
    //     obs: obs,
    //   },
    //   {
    //     where: {
    //       id: id,
    //       usuario: req.session.user.id,
    //     },
    //   }
    // );

    // atualizando o estoque
    const itens = await ItemPedido.findAll({
      where: { pedido: IDpedido, usuario: req.session.user.id },
    });
    // Extrair todos os produtoIDs dos itens em uma matriz
    const produtoIDs = itens.map((item) => item.produtoID);
    const quantidadesItens = itens.map((item) => item.quant_itens);
    // Consultar produtos com base nos produtoIDs e no usuário
    const produtos = await Produto.findAll({
      where: { id: produtoIDs, usuario: req.session.user.id },
    });
    // Atualizar o estoque para cada produto com base na quantidade de itens
    for (let i = 0; i < produtos.length; i++) {
      const produto = produtos[i];
      const quantidadeEstoqueAtualizada =
        produto.quantidadeEstoque + quantidadesItens[i];
      // Atualizar o estoque do produto
      await Produto.update(
        { quantidadeEstoque: quantidadeEstoqueAtualizada },
        { where: { id: produto.id, usuario: req.session.user.id } }
      );
    }

    // const venda_finalizada = await Venda.findAll({
    //   where: { usuario: req.session.user.id },
    // });
    // res.render("venda/vendas", {
    //   venda_finalizada,
    //   moment,
    // });

    const id_pedido = await Pedido.findByPk(IDpedido, {
      where: { id: IDpedido, usuario: req.session.user.id },
    });

    const id_item = await ItemPedido.findAll({
      where: { pedido: id_pedido.id, usuario: req.session.user.id },
    });

    const venda = await Venda.findByPk(id);
    if (!venda) {
      return res.status(404).json({ error: "Produto não encontrado." });
    }

    // Deleta todos os itens do pedido
    if (id_item && id_item.length > 0) {
      for (const item of id_item) {
        await item.destroy(); // Deleta cada item individualmente
      }
    }

    // Deleta o pedido e a venda
    await venda.destroy();
    await id_pedido.destroy();

    req.flash("erro_msg", "Venda apagada com sucesso!");
    res.redirect("/venda/vendas_finalizadas");
  } catch (err) {
    console.error("Erro ao deletar os dados de vendas:", err);
    return res
      .status(500)
      .json({ mensagem: "Ocorreu um erro ao deletar os dados de vendas." });
  }
});

// deletando venda DEFINITIVAMENTE
router.post("/vendas/delet/:id", async (req, res) => {
  try {
    // atualiza o status para 2 da tabela "vendas" indica que é uma venda cancelada

    const { id } = req.params;

    const venda = await Venda.findByPk(id);
    if (!venda) {
      return res.status(404).json({ error: "Produto não encontrado." });
    }
    await venda.destroy();

    req.flash("erro_msg", "Venda apagada com sucesso!");
    res.redirect("/venda/vendas_finalizadas");
  } catch (err) {
    console.error("Erro ao deletar os dados de vendas:", err);
    return res
      .status(500)
      .json({ mensagem: "Ocorreu um erro ao deletar os dados de vendas." });
  }
});

// Ir para pagina visualizar vendas canceladas
router.post("/venda/vendas_finalizadas", Auth, async (req, res) => {
  try {
    const pedido = await Pedido.findAll({
      where: { usuario: req.session.user.id },
    });
    const cliente = await Cliente.findAll({
      where: { usuario: req.session.user.id },
    });

    const venda_finalizada = await Venda.findAll({
      where: {
        fechado: 2,
        usuario: req.session.user.id,
      },
      limit: 100,
      order: [["data_venda", "DESC"]], // Ordena os resultados por data_entrega em ordem decrescente
    });

    res.render("venda/vendas_finalizadas", {
      venda_finalizada,
      moment,
      pedido,
      cliente,
    });
  } catch (error) {
    req.flash("erro_msg", "Erro ao carregar vendas!");
    res.redirect("/");
  }
});

module.exports = router;

//  // const itemPedido = await ItemPedido.findAll({ where: { pedido: item, usuario: req.session.user.id } })

//     //await ItemPedido.sum('valor_unitario', { where: { pedido: item, usuario: req.session.user.id } });

//     const total = await Produto.sum('valorCompra', {
//       include: [{
//           model: ItemPedido,
//           where: { pedido: item, usuario: req.session.user.id }
//       }]
//   });
//   console.log(total);
