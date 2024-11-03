const express = require('express')
const router = express.Router();
const Venda = require("../Model/VendaModel")
const { Op, where } = require('sequelize');
const Pedido = require('../Model/PedidosModel')
const Produto = require("../Model/ProdutoModel")
const Auth = require("../auth")
const ItemPedido = require('../Model/itensPedidosModel')
const Cliente = require('../Model/ClienteModel')

const moment = require('moment');


// ler 
router.get('/entrega/entregas', Auth, async (req, res) => {
  try {
    const pedido = await Pedido.findAll({ where: { usuario: req.session.user.id } })
    const cliente = await Cliente.findAll({ where: { usuario: req.session.user.id } })

    const venda_finalizada = await Venda.findAll({
      where: { fechado: 1, entrega: 1, usuario: req.session.user.id }, limit: 100,
      order: [['data_entrega', 'ASC']] // Ordena os resultados por data_entrega em ordem crescente
    });

    res.render("entrega/entregas", {
      venda_finalizada,
      moment,
      pedido,
      cliente
    })
  } catch (error) {
    req.flash('erro_msg', 'Erro ao carregar vendas!')
    res.redirect('/')
  }
});



// Recebendo os dados enviar a tela de ver_entrega
router.get('/entrega/ver/:id', Auth, async (req, res) => {
  const id = req.params.id;
  try {
    // ver se tem produtos no item 
    const itemPedido = await ItemPedido.findAll({ where: { pedido: id, usuario: req.session.user.id } })
    // Busca o pedido e os produtos e aguarda o resultado
    const [pedido] = await Promise.all([
      Pedido.findOne({ where: { id } }),
    ]);
    if (!pedido) {
      // Caso o pedido não seja encontrado, retorna um erro 404
      return res.status(404).render("404");
    }

    const cliente = await Cliente.findOne({ where: { id: pedido.cliente_pedido, usuario: req.session.user.id } });
    const venda = await Venda.findOne({ where: { id_pedido: pedido.id, usuario: req.session.user.id } })

    // Renderiza a página e passa as informações do pedido e dos produtos como variáveis para a view
    res.render("entrega/ver_entrega", {
      pedido,
      id,
      itemPedido,
      cliente,
      venda,
      moment
    });
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao buscar entrega' }); req.flash('erro_msg', 'Erro ao carregar entrega!')
    res.redirect('/')
  }
});


// Recebendo os dados para atualizar OBS
router.post('/entrega/obs', Auth, async (req, res) => {
  const id = req.body.id_pedido;
  const obs = req.body.obs;
  const data_entrega = req.body.data_entrega;
  try {
    // ver se tem produtos no item 
    const itemPedido = await ItemPedido.findAll({ where: { pedido: id, usuario: req.session.user.id } })
    // Busca o pedido e os produtos e aguarda o resultado
    const [pedido] = await Promise.all([
      Pedido.findOne({ where: { id } }),
    ]);
    if (!pedido) {
      // Caso o pedido não seja encontrado, retorna um erro 404
      return res.status(404).render("404");
    }

    // atualiza obs de vendas 
    await Venda.update(
      {
        obs: obs,
        data_entrega
      },
      { where: { id_pedido: pedido.id, usuario: req.session.user.id } }
    )

    // const cliente = await Cliente.findOne({ where: { id: pedido.cliente_pedido, usuario: req.session.user.id } });
    // const venda = await Venda.findOne({ where: { id_pedido: pedido.id, usuario: req.session.user.id } })

    req.flash('sucesso_msg', 'Entrega atualizada com sucesso!')
    // Renderiza a página e passa as informações do pedido e dos produtos como variáveis para a view
    // res.render("entrega/ver_entrega", {
    //   pedido,
    //   id,
    //   itemPedido,
    //   cliente,
    //   venda,
    //   moment 
    // });
    res.redirect('/entrega/entregas')

  } catch (error) {
    return res.status(500).json({ error: 'Erro ao buscar entrega' }); req.flash('erro_msg', 'Erro ao carregar entrega!')
    res.redirect('/')
  }
});

// mudanndo o STATUS para entregue
router.post('/entrega/entregue', Auth, async (req, res) => {
  try {
    const venda_id = req.body.id_venda
    console.log(venda_id)
    const pedido = await Pedido.findAll({ where: { usuario: req.session.user.id } })
    const cliente = await Cliente.findAll({ where: { usuario: req.session.user.id } })
    // atualiza obs de vendas 
    await Venda.update(
      {
        entrega: 2
      },
      { where: { id: venda_id, usuario: req.session.user.id } }
    )

    const venda_finalizada = await Venda.findAll({ where: { entrega: 1, usuario: req.session.user.id } });


    res.render("entrega/entregas", {
      venda_finalizada,
      moment,
      pedido,
      cliente
    })

  } catch (error) {
    req.flash('erro_msg', 'Erro ao carregar entregas!')
    res.redirect('/')
  }
});

// entregas já entregue
router.get('/entrega/entregue', Auth, async (req, res) => {
  try {
    const pedido = await Pedido.findAll({ where: { usuario: req.session.user.id } })
    const cliente = await Cliente.findAll({ where: { usuario: req.session.user.id } })

    const venda_finalizada = await Venda.findAll({ where: { entrega: 2, usuario: req.session.user.id } });
    res.render("entrega/entregue", {
      venda_finalizada,
      moment,
      pedido,
      cliente
    })
  } catch (error) {
    req.flash('erro_msg', 'Erro ao carregar vendas!')
    res.redirect('/')
  }
});

///  buscando cliente 
router.post('/entrega/buscar/cliente', Auth, async (req, res) => {
  // const { busca } = req.body;
  const busca = req.body.busca
  const id = req.body.id_pedido

  try {

    const clientes = await Cliente.findAll({
      where: {
        nome: {
          [Op.like]: `%${busca}%`
        },
        usuario: req.session.user.id
      },
      limit: 20 // Limita para 20 resultados
    });

    const [pedido] = await Promise.all([
      Pedido.findOne({ where: { id } }),
    ]);

    const venda = await Venda.findOne({ where: { id_pedido: pedido.id, usuario: req.session.user.id } })

    if (clientes.length > 0) {    // Verifica se algum produto foi encontdora
      res.render("entrega/ver_entrega", {
        clientes,
        pedido,
        moment,
        venda

      })
    } else {
      const erro_msg = "Cliente não encontrado!"
      res.render("entrega/ver_entrega", {
        pedido,
        erro_msg,
        moment,
        venda
      })
    }
  } catch (error) {
    res.send("Erro cath")
    const pedido = Pedido.findOne({ where: { id } })
    const erro_msg = "Erro ao buscar cliente!"
    res.render("entrega/entregas", {
      pedido,
      erro_msg
    })
  }
});

// adiciono cliente ao pedido 
router.post('/entrega/cliente/add_novo', Auth, async (req, res) => {
  try {
    const { id_cliente, id_pedido } = req.body;

    const pedido = await Pedido.findOne({ where: { id: id_pedido, usuario: req.session.user.id } });

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
    const cliente = await Cliente.findOne({ where: { id: pedido.cliente_pedido, usuario: req.session.user.id } });
    const itemPedido = await ItemPedido.findAll({ where: { pedido: id_pedido, usuario: req.session.user.id } })
    const venda = await Venda.findOne({ where: { id_pedido: pedido.id, usuario: req.session.user.id } })

    res.render("entrega/ver_entrega", {
      pedido,
      itemPedido,
      cliente,
      moment,
      venda
    });

  } catch (error) {
    res.send("Erro ao tentar adicionar cliente ao pedido!")
  }
});

module.exports = router;


