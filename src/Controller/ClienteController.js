
const express = require('express')
const router = express.Router()
const Cliente = require("../Model/ClienteModel")
const Auth = require("../auth")
const { Op } = require('sequelize');

// ler 
router.get('/cliente/clientes', Auth, async (req, res) => {
  try {
    const clientes = await Cliente.findAll({
      where: { usuario: req.session.user.id },
      limit: 100,
    });
    return res.status(200).json({ clientes });
  } catch (error) {
    return res.status(500).json({ error: "Erro ao buscar produtos" });
  }
});



// Cadastrar novo cliente

router.post('/cliente/save',  Auth, async (req, res) => {
  const nome = req.body.nome;

  if (!nome) {
    return res.status(400).json({
      message: 'O nome do cliente é obrigatório',
    });
  }

  try {
    // Consulta para verificar se já existe um cliente com o mesmo nome
    const clienteExistente = await Cliente.findOne({ where: { usuario: req.session.user.id, nome: nome } });

    if (clienteExistente) {
      return res.status(200).json({
        message: 'Já existe um cliente com este nome',
      });
    } else {
      // Se não existe um cliente com o mesmo nome, insira ao banco de dados
      const telefone = req.body.telefone;
      const cep = req.body.cep ?? null;
      const rua = req.body.rua ?? null;
      const numero = req.body.numero ?? null;
      const bairro = req.body.bairro ?? null;
      const cidade = req.body.cidade ?? null;
      const observacoes = req.body.observacoes ?? null;

      const novoCliente = await Cliente.create({
        nome: nome,
        telefone: telefone,
        cep: cep,
        rua: rua,
        numero: numero,
        bairro: bairro,
        cidade: cidade,
        observacoes: observacoes,
        usuario: req.session.user.id,
      });

      return res.status(201).json({
        message: 'Cliente criado com sucesso!',
        cliente: novoCliente,
      });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: 'Erro ao cadastrar cliente',
    });
  }
});
// router.post('/cliente/save', Auth, async (req, res) => {
//   var nome = req.body.nome;

//   if (nome != undefined) {
//     // Consulta para verificar se já existe um cliente com o mesmo nome
//     const clienteExistente = await Cliente.findOne({ where: {usuario: req.session.user.id , nome: nome } });

//     if (clienteExistente) {
//       // Cliente com o mesmo nome já existe, exiba uma mensagem de erro ou tome a ação apropriada
//       req.flash('erro_msg', 'Cliente com o mesmo nome já existe');
//       res.redirect('/cliente/clientes');
//     } else {
//       // Se não existe um cliente com o mesmo nome, insira ao banco de dados
//       var telefone = req.body.telefone;
//       var cep = req.body.cep ?? null;
//       var rua = req.body.rua ?? null;
//       var numero = req.body.numero ?? null;
//       var bairro = req.body.bairro ?? null;
//       var cidade = req.body.cidade ?? null;
//       var observacoes = req.body.observacoes ?? null;

//       Cliente.create({
//         nome: nome,
//         telefone: telefone,
//         cep: cep,
//         rua: rua,
//         numero: numero,
//         bairro: bairro,
//         cidade: cidade,
//         observacoes: observacoes,
//         usuario: req.session.user.id
//       }).then(() => {
//         req.flash('sucesso_msg', 'Cliente criado com sucesso!');
//         res.redirect('/cliente/clientes');
//       });
//     }
//   } else {
//     req.flash('erro_msg', 'Erro ao cadastrar clientes');
//     res.redirect('/cliente/clientes');
//   }
// });


// Buscar cliente pelo nome 
router.post('/cliente/buscar', Auth, async (req, res) => {
  try {
    // const { busca } = req.body;
    const busca = req.body.busca
    const clientes = await Cliente.findAll({
      where: {
        nome: {
          [Op.like]: `%${busca}%`
        },
        usuario: req.session.user.id
      },
      limit: 20 // Limita para 20 resultados
    });
    if (clientes.length > 0) {    // Verifica se algum cliente foi encontrado
      res.render("cliente/clientes", {
        clientes,
      })
    } else {
      const clientes = await Cliente.findAll({
        where: { usuario: req.session.user.id },
        limit: 100,
      });
      const erro_msg = "Cliente não encontrado!"
      res.render("cliente/clientes", {
        clientes,
        erro_msg
      })
    }
  } catch (error) {
    const erro_msg = "Erro ao buscar cliente!"
    res.render("cliente/clientes", {
      erro_msg
    })
  }
});




// pagina cliente
router.get('/cliente/editar/:id', Auth, async (req, res) => {
  const clienteId = req.params.id;

  try {
    const cliente = await Cliente.findByPk(clienteId);
    if (!cliente) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }

    res.render("cliente/editar_cliente", {
      cliente,
    })

  } catch (error) {
    return res.status(500).json({ error: 'Erro ao carregar a pagina!' });
  }
});


// editar um cliente
router.post('/cliente/edit/save/:id', Auth, async (req, res) => {
  try {
    const { nome, telefone, cep, rua, numero, bairro, cidade, observacoes } = req.body;
    const id = req.params.id;

    // Verifica se o cliente existe no banco de dados antes de atualizá-lo
    const clienteExistente = await Cliente.findByPk(id);

    if (!clienteExistente) {
      return res.status(404).json({ mensagem: 'Cliente não encontrado.' });
    }

    // Atualiza os dados do cliente com as informações fornecidas
    await Cliente.update(
      {
        nome,
        telefone,
        cep,
        rua,
        numero,
        bairro,
        cidade,
        observacoes
      },
      {
        where: {
          id: id
        }
      }
    );

    return res.redirect("/cliente/clientes")
  } catch (err) {
    console.error('Erro ao atualizar dados do cliente:', err);
    return res.status(500).json({ mensagem: 'Ocorreu um erro ao atualizar os dados do cliente.' });
  }
});



// deletar um cliente
router.get('/cliente/del/:id', Auth, async (req, res) => {
  const clienteId = req.params.id;

  try {
    const cliente = await Cliente.findByPk(clienteId);
    if (!cliente) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }

    await cliente.destroy();

    res.redirect('/cliente/clientes')


  } catch (error) {
    return res.status(500).json({ error: 'Erro ao deletar cliente' });
  }
});

// essa função possibilita que eu possa passar o Cliente pra qualquer controller / view
router.findAll = async () => {
  try {
    const produtos = await Produto.findAll();
    return produtos;
  } catch (err) {
    console.error(err);
    throw new Error('Erro ao buscar produtos');
  }
}

module.exports = router;