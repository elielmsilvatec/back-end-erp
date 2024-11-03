const express = require('express')
const router = express.Router();
const { Op } = require('sequelize');
const Pedido = require('../Model/PedidosModel')
//const Produto = require("../Controller/ProdutoController")
const Produto = require("../Model/ProdutoModel")
const Auth = require("../auth")
const ItemPedido = require('../Model/itensPedidosModel')
const Cliente = require('../Model/ClienteModel')

// replace(/(\.|,)/g, (match, p1) => p1 === "." ? "" : ".").replace("R$", "");


// rota principal de pedidos
router.get('/pedido/pedidos', Auth, async (req, res) => {
  //res.render("pedido/pedidos")
  try {
    // const pedidos = await Pedido.findAll();
    const pedidos = await Pedido.findAll({ where: { status: 1, usuario: req.session.user.id }, limit: 100, });
    const cliente = await Cliente.findAll({ where: { usuario: req.session.user.id } });
    res.render("pedido/pedidos", {
      pedidos,
      cliente
    })
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao buscar pedidos' });
  }
})


// Rota dos pedidos Fechados 
router.get('/pedido/pedidos_fechados', Auth, async (req, res) => {
  //res.render("pedido/pedidos")
  try {
    // const pedidos = await Pedido.findAll();
    const pedidos = await Pedido.findAll({ where: { status: 2, usuario: req.session.user.id }, limit: 100, });

    const cliente = await Cliente.findAll({ where: { usuario: req.session.user.id } });

    res.render("pedido/pedidos_fechados", {
      pedidos,
      cliente
    })
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao buscar pedidos' });
  }
})



// adiciono novo pedido criando um item pedido
router.post('/pedido/add_novo', Auth, async (req, res) => {
  var quantidade = 0
  var status = 1
  var valor_total_pedido = 0

  var ultimoId = await Pedido.max('num_pedido', { where: { usuario: req.session.user.id } });
  ultimoId = ultimoId + 1

  await Pedido.create({
    num_pedido: ultimoId,
    quantidade: quantidade,
    status: status,
    valor_total_pedido: valor_total_pedido,
    usuario: req.session.user.id
  })

  const pedido = await Pedido.findOne({ where: { num_pedido: ultimoId, usuario: req.session.user.id  } });
  res.render("pedido/itemPedido", {
    pedido
  })
})

// deletando um pedido
router.get('/pedido/delet/:id', Auth, async (req, res) => {
  const id = req.params.id;
  try {
    const pedido = await Pedido.findByPk(id);
    if (!pedido) {
      return res.status(404).json({ error: 'Pedido não encontrado.' });
    }

    // Deleta todos os itemPedido associados ao pedido
    await ItemPedido.destroy({ where: { pedido: id, usuario: req.session.user.id } });

    // Deleta o pedido
    await pedido.destroy();

    // Redireciona para a página de pedidos
    res.redirect("/pedido/pedidos");
  } catch (error) {
    return res.status(500).json({ error: 'Ocorreu um erro ao excluir o pedido.' });
  }
});


// Recebendo os dados enviar a tela de itens_Pedidos
router.get('/pedido/ver/:id', Auth, async (req, res) => {
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

    // Renderiza a página e passa as informações do pedido e dos produtos como variáveis para a view
    res.render("pedido/itemPedido", {
      pedido,
      id,
      itemPedido,
      cliente
    });
  } catch (error) {
    //res.redirect('/pedido/pedidos')
    return res.status(500).json({ error: 'Erro ao buscar pedido' });
  }
});

///  buscando produtos 
router.post('/pedido/buscar/produto', Auth, async (req, res) => {
  // const { busca } = req.body;
  const busca = req.body.busca
  const id = req.body.id_pedido

  try {

    const produtos = await Produto.findAll({
      where: {
        nomeProduto: {
          [Op.like]: `%${busca}%`
        },
        usuario: req.session.user.id
      },
      limit: 20 // Limita para 20 resultados
    });

    const [pedido] = await Promise.all([
      Pedido.findOne({ where: { id } }),
    ]);

    if (produtos.length > 0) {    // Verifica se algum produto foi encontdora
      res.render("pedido/itemPedido", {
        produtos,
        pedido,
      })
    } else {
      const erro_msg = "Produto não encontrado!"
      res.render("pedido/itemPedido", {
        pedido,
        erro_msg
      })
    }
  } catch (error) {
    res.send("Erro cath")
    const pedido = Pedido.findOne({ where: { id } })
    //req.flash('erro_msg', 'Erro ao buscar produto!')
    res.render("pedido/itemPedido", {
      pedido,
      erro_msg: "Erro ao buscar produtos"
    })
  }
});

///  buscando cliente 
router.post('/pedido/buscar/cliente', Auth, async (req, res) => {
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

    if (clientes.length > 0) {    // Verifica se algum produto foi encontdora
      res.render("pedido/itemPedido", {
        clientes,
        pedido,

      })
    } else {
      const erro_msg = "Cliente não encontrado!"
      res.render("pedido/itemPedido", {
        pedido,
        erro_msg
      })
    }

  } catch (error) {
    res.send("Erro cath")
    const pedido = Pedido.findOne({ where: { id } })
    const erro_msg = "Erro ao buscar cliente!"
    res.render("pedido/itemPedido", {
      pedido,
      erro_msg
    })
  }


});

// adiciono cliente ao pedido 
router.post('/pedido/cliente/add_novo', Auth, async (req, res) => {
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

    res.render("pedido/itemPedido", {
      pedido,
      itemPedido,
      cliente
    });

  } catch (error) {
    res.send("Erro ao tentar adicionar cliente ao pedido!")
  }
});



///  Adicionando produto ao item pedido produtos 
router.post('/pedido/add/produto_item', Auth, async (req, res) => {
  try {
    const { nome, undMedidas, marca, sub_total_itens, valor_compra, IDpedido, itens_produto } = req.body;

    const itemPedidoExistente = await ItemPedido.findOne({ where: { produtoID: itens_produto, pedido: IDpedido, usuario: req.session.user.id } });
    const itemProduto = await Produto.findOne({ where: { id: itens_produto, usuario: req.session.user.id } });

    if (itemPedidoExistente) {
      const itemPedidoAtualizado = await ItemPedido.update({
        quant_itens: itemPedidoExistente.quant_itens + 1,
        valor_unitario: itemProduto.valorVenda,
        sub_total_itens: (itemPedidoExistente.quant_itens + 1) * sub_total_itens,
        valor_compra: (itemPedidoExistente.quant_itens + 1) * valor_compra,
        lucro: (itemProduto.valorVenda - itemProduto.valorCompra)  * ( itemPedidoExistente.quant_itens + 1)
      }, { where: { id: itemPedidoExistente.id } });

      // Atualizando quantidade em estoque
      //  await Produto.update({
      //   quantidadeEstoque :  itemProduto.quantidadeEstoque - 1
      // }, {
      //   where: { id: itemProduto.id }
      // });
    } else {
      await ItemPedido.create({
        nome,
        undMedidas,
        marca,
        quant_itens: 1,
        valor_compra: valor_compra,
        valor_unitario: sub_total_itens,
        sub_total_itens,
        lucro: (itemProduto.valorVenda - itemProduto.valorCompra),
        pedido: IDpedido,
        produtoID: itens_produto,
        itens_produto,
        usuario: req.session.user.id
      });

      // await Produto.update({
      //   quantidadeEstoque :  itemProduto.quantidadeEstoque - 1
      // }, {
      //   where: { id: itemProduto.id }
      // });
    }

    

    const pedido = await Pedido.findOne({ where: { id: IDpedido, usuario: req.session.user.id } })

    const itemPedido = await ItemPedido.findAll({ where: { pedido: IDpedido, usuario: req.session.user.id } })

    let cliente ;
      cliente = await Cliente.findOne({ where: { id: pedido.cliente_pedido, usuario: req.session.user.id } });

    // Calcula o novo valor total do pedido somando o sub_total_itens de todos os itemPedido
    const novoValorTotal = itemPedido.reduce((total, item) => total + item.sub_total_itens, 0);

    // Atualiza o valor_total_pedido no banco de dados
    await Pedido.update({ valor_total_pedido: novoValorTotal }, { where: { id: IDpedido } });
  

    res.render("pedido/itemPedido", {
      pedido,
      itemPedido,
      cliente  
    })

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Ocorreu um erro ao adicionar o item ao pedido.' });
  }

});


// atualizando quantidades
router.post('/pedido/editar/quant', Auth, async (req, res) => {
  try {

    const id = req.body.id;
    const IDpedido = req.body.IDpedido
    const quant = req.body.quant.replace(/(\.|,)/g, (match, p1) => p1 === "." ? "" : ".");
    const valor_compra = req.body.valor_compra.replace(/(\.|,)/g, (match, p1) => p1 === "." ? "" : ".");
    const valor_unitario = req.body.valor_unitario.replace(/(\.|,)/g, (match, p1) => p1 === "." ? "" : ".").replace("R$", "");


    const itemPedidoExistente = await ItemPedido.findOne({ where: { id: id, pedido: IDpedido, usuario: req.session.user.id } });
    const itemProduto = await Produto.findOne({ where: { id: itemPedidoExistente.produtoID, usuario: req.session.user.id } });

    if (quant) {
      await ItemPedido.update({
        quant_itens: quant,
        sub_total_itens: quant * itemPedidoExistente.valor_unitario
      }, { where: { id: itemPedidoExistente.id } });


      const pedido = await Pedido.findOne({ where: { id: IDpedido, usuario: req.session.user.id } })

      const itemPedido = await ItemPedido.findAll({ where: { pedido: IDpedido, usuario: req.session.user.id } })

      const cliente = await Cliente.findOne({ where: { id: pedido.cliente_pedido, usuario: req.session.user.id } });

      // Calcula o novo valor total do pedido somando o sub_total_itens de todos os itemPedido
      const novoValorTotal = itemPedido.reduce((total, item) => total + item.sub_total_itens, 0);

      // Atualiza o valor_total_pedido no banco de dados
      await Pedido.update({ valor_total_pedido: novoValorTotal }, { where: { id: IDpedido } });

      res.render("pedido/itemPedido", {
        pedido,
        itemPedido,
        cliente
      })
    } else {
      res.render("pedido/itemPedido", {
        pedido,
        itemPedido,
        cliente
      })
    }

  } catch (error) {
    req.flash('erro_msg', 'Ocorreu um erro ao atualizar a quantidade!');
    res.redirect('/pedido/pedidos')
  }
})

// mudando os preços unitario de pedido
router.post('/pedido/editar/valor_unitario', Auth, async (req, res) => {
  try {
    const { id, IDpedido } = req.body
    const valor_unitario = req.body.valor_unitario.replace(/(\.|,)/g, (match, p1) => p1 === "." ? "" : ".");
    const itemPedidoExistente = await ItemPedido.findOne({ where: { id: id, pedido: IDpedido, usuario: req.session.user.id } });

    if (valor_unitario) {
      // verifica se o valor mudado é maior que o valor de compra se for devolve o erro
      if (valor_unitario > itemPedidoExistente.valor_compra) {
        await ItemPedido.update({
          valor_unitario: valor_unitario,
          sub_total_itens: itemPedidoExistente.quant_itens * valor_unitario
        }, { where: { id: itemPedidoExistente.id } });

        const pedido = await Pedido.findOne({ where: { id: IDpedido, usuario: req.session.user.id } })
        const itemPedido = await ItemPedido.findAll({ where: { pedido: IDpedido, usuario: req.session.user.id } })
        const cliente = await Cliente.findOne({ where: { id: pedido.cliente_pedido, usuario: req.session.user.id } });

        // Calcula o novo valor total do pedido somando o sub_total_itens de todos os itemPedido
        const novoValorTotal = itemPedido.reduce((total, item) => total + item.sub_total_itens, 0);

        // Atualiza o valor_total_pedido no banco de dados
        await Pedido.update({ valor_total_pedido: novoValorTotal }, { where: { id: IDpedido } });
        res.render("pedido/itemPedido", {
          pedido,
          itemPedido,
          cliente
        })
      } else {
        const pedido = await Pedido.findOne({ where: { id: IDpedido, usuario: req.session.user.id } })
        const itemPedido = await ItemPedido.findAll({ where: { pedido: IDpedido, usuario: req.session.user.id } })
        const cliente = await Cliente.findOne({ where: { id: pedido.cliente_pedido, usuario: req.session.user.id } });
        const erro_msg = "Valor do produto menor que o permitido! "
        res.render("pedido/itemPedido", {
          pedido,
          itemPedido,
          cliente,
          erro_msg
        })
      }
    } else {
      res.send("Ocorreu um erro ao atualizar valor unitario!")
    }
  } catch (error) {
    return res.status(500).json({ error: 'Ocorreu um erro ao atualizar o item.' });
  }
})

// Finalizando item pedido
router.post('/pedido/finalizar/item', Auth, async (req, res) => {
  const id = req.body.IDpedido

  try {
    const item = await Pedido.findByPk(id);
    if (!item.valor_total_pedido) {
      return res.status(404).json({ error: 'Ocorreu um erro ao finalizar pedido, verifica se já existe produto a esse pedido!.' });
    } else {
      await item.update({ status: 2 });
      res.redirect('/pedido/pedidos')

      // const pedido = await Pedido.findOne({ where: { id: id, usuario: req.session.user.id } })
      // const itemPedido = await ItemPedido.findAll({ where: { pedido: id, usuario: req.session.user.id } })
      // // Calcula o novo valor total do pedido somando o sub_total_itens de todos os itemPedido
      // const novoValorTotal = itemPedido.reduce((total, item) => total + item.sub_total_itens, 0);
      // // Atualiza o valor_total_pedido no banco de dados
      // await Pedido.update({ valor_total_pedido: novoValorTotal }, { where: { id: id } });
    }
  } catch (error) {
    return res.status(500).json({ error: 'Ocorreu um erro ao finalizar pedido!' });
  }

})




// deletando item pedido
router.post('/pedido/delet/item', Auth, async (req, res) => {
  const id = req.body.id;
  const IDpedido = req.body.IDpedido

  try {
    const item = await ItemPedido.findByPk(id);
    if (!item) {
      return res.status(404).json({ error: 'Item não encontrado.' });
    }
    await item.destroy();

    const pedido = await Pedido.findOne({ where: { id: IDpedido, usuario: req.session.user.id } })

    const itemPedido = await ItemPedido.findAll({ where: { pedido: IDpedido, usuario: req.session.user.id } })

    // Calcula o novo valor total do pedido somando o sub_total_itens de todos os itemPedido
    const novoValorTotal = itemPedido.reduce((total, item) => total + item.sub_total_itens, 0);
    // Atualiza o valor_total_pedido no banco de dados
    await Pedido.update({ valor_total_pedido: novoValorTotal }, { where: { id: IDpedido } });

    res.render("pedido/itemPedido", {
      pedido,
      itemPedido
    })

  } catch (error) {
    return res.status(500).json({ error: 'Ocorreu um erro ao excluir o pedido.' });
  }

})

// deletando cliente do pedido
router.post('/pedido/delet/cliente', Auth, async (req, res) => {
  const id = req.body.IDpedido

  try {


    const item = await Pedido.findByPk(id);
    if (!item) {
      return res.status(404).json({ error: 'Item não encontrado.' });
    }
    await item.update({ cliente_pedido: null });

    const pedido = await Pedido.findOne({ where: { id: id, usuario: req.session.user.id } })

    const itemPedido = await ItemPedido.findAll({ where: { pedido: id, usuario: req.session.user.id } })

    // Calcula o novo valor total do pedido somando o sub_total_itens de todos os itemPedido
    const novoValorTotal = itemPedido.reduce((total, item) => total + item.sub_total_itens, 0);
    // Atualiza o valor_total_pedido no banco de dados
    await Pedido.update({ valor_total_pedido: novoValorTotal }, { where: { id: id } });

    res.render("pedido/itemPedido", {
      pedido,
      itemPedido
    })

  } catch (error) {
    return res.status(500).json({ error: 'Ocorreu um erro ao excluir o cliente.' });
  }

})

module.exports = router;
