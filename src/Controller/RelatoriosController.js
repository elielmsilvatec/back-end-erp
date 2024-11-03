const express = require("express");
const router = express.Router();
const Cliente = require("../Model/ClienteModel");
const Pedido = require("../Model/PedidosModel");
const ItemPedido = require("../Model/itensPedidosModel");
const Venda = require("../Model/VendaModel");
const Produto = require("../Model/ProdutoModel");
const Auth = require("../auth");
const Auth_cargo = require("../auth_cargo");
const { Op } = require("sequelize");
const moment = require("moment");

// ler
router.get("/relatorio/relatorios", Auth, async (req, res) => {
  try {
    const vendas = await Venda.findAll({
      where: { fechado: 1, usuario: req.session.user.id },
    });

    // Coletar os números de pedido das vendas
    const numerosPedidos = vendas.map((venda) => venda.numero_pedido);

    // Buscar os pedidos relacionados aos números de pedido das vendas
    const pedidos = await Pedido.findAll({
      where: { num_pedido: numerosPedidos, usuario: req.session.user.id },
    });
    // buscando item pedido
    const item_pedido = await ItemPedido.findAll({
      where: { pedido: numerosPedidos, usuario: req.session.user.id },
    });

    // buscando os produtos
    const produtos = await Produto.findAll({
      where: { usuario: req.session.user.id },
    });

    // const currentDate = new Date();
    // const currentMonth = currentDate.getMonth() + 1; // Lembrando que os meses no JavaScript são baseados em zero (janeiro é 0, fevereiro é 1, etc.)
    // const currentYear = currentDate.getFullYear();
    // // Filtrar as vendas do mês atual
    // const vendas_total = await Venda.findAll({
    //   where: {
    //     usuario: req.session.user.id,
    //     data_venda: {
    //       [Op.and]: [
    //         { [Op.gte]: new Date(currentYear, currentMonth - 1, 1) }, // Primeiro dia do mês
    //         { [Op.lt]: new Date(currentYear, currentMonth, 1) } // Primeiro dia do próximo mês
    //       ]
    //     }
    //   }
    // });
    // // Calcular o valor total das vendas deste mês
    // const valorTotalVendasMes = vendas_total.reduce((total, venda) => total + venda.valor_total_venda, 0);

    // buscando os clientes
    const cliente = await Cliente.findAll({
      where: { usuario: req.session.user.id },
    });

    res.render("relatorio/relatorios", {
      moment,
      vendas,
      pedidos,
      item_pedido,
      produtos,
      cliente,

      // valorTotalVendasMes,
    });
  } catch (error) {
    req.flash("erro_msg", "Erro ao carregar relatórios");
    res.redirect("/");
  }
});

///  lendo relatorios com os filtros ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
router.post("/relatorio/buscar", Auth, async (req, res) => {
  try {
    const { data_inicial, data_final, form_pagamento } = req.body;

    // Converter as datas para objetos Date
    const startDate = new Date(data_inicial);
    startDate.setUTCHours(0, 0, 0, 0); // Define a primeira hora do dia (00:00:00) em UTC

    const endDate = new Date(data_final);
    endDate.setUTCHours(23, 59, 59, 999); // Define a última hora do dia (23:59:59.999) em UTC

    // Consulta de vendas no intervalo de datas fornecido
    const whereClause = {
      usuario: req.session.user.id,
      fechado: 1,
      data_venda: {
        [Op.between]: [startDate, endDate],
      },
    };

    if (form_pagamento !== "") {
      whereClause.tipo_pagamento = form_pagamento;
    }

    const vendas = await Venda.findAll({
      where: whereClause,
    });

    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1; // Lembrando que os meses no JavaScript são baseados em zero (janeiro é 0, fevereiro é 1, etc.)
    const currentYear = currentDate.getFullYear();
    // Filtrar as vendas do mês atual
    const vendas_total = await Venda.findAll({
      where: {
        fechado: 1,
        usuario: req.session.user.id,
        data_venda: {
          [Op.and]: [
            { [Op.gte]: new Date(currentYear, currentMonth - 1, 1) }, // Primeiro dia do mês
            { [Op.lt]: new Date(currentYear, currentMonth, 1) }, // Primeiro dia do próximo mês
          ],
        },
      },
    });

    // Calcular o valor total das vendas deste mês
    const valorTotalVendasMes = vendas_total.reduce(
      (total, venda) => total + venda.valor_total_venda,
      0
    );
    // somando o lucro
   

    // Coletar os números de pedido das vendas
    const numerosPedidos = vendas.map((venda) => venda.numero_pedido);

    // Consulta dos pedidos relacionados aos números de pedido das vendas
    const pedidos = await Pedido.findAll({
      where: {
        num_pedido: numerosPedidos,
        usuario: req.session.user.id,
      },
    });

    // Consulta dos itens de pedido relacionados aos pedidos
    const item_pedido = await ItemPedido.findAll({
      where: {
        pedido: numerosPedidos,
        usuario: req.session.user.id,
      },
    });

    // Consulta de todos os produtos
    const produtos = await Produto.findAll({
      where: {
        usuario: req.session.user.id,
      },
    });

    // Cálculo do valor total das vendas no período
    const valorTotalVendasPeriodo = vendas.reduce(
      (total, venda) => total + venda.valor_total_venda,
      0
    );

    // calculando os lucros
    const lucro_total = vendas.reduce((acumulador, venda) => {
      return acumulador + venda.lucro;
    }, 0); // O segundo argumento '0' é o valor inicial do acumulador
    

    // buscando os clientes
    const cliente = await Cliente.findAll({
      where: { usuario: req.session.user.id },
    });

    res.render("relatorio/relatorios", {
      vendas,
      pedidos,
      valorTotalVendasMes,
      moment,
      item_pedido,
      produtos,
      valorTotalVendasPeriodo,
      cliente,
      lucro_total,
    });
  } catch (error) {
    req.flash("erro_msg", "Erro ao carregar relatórios");
    res.redirect("/");
  }
});

module.exports = router;
