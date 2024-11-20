
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

      return res.status(200).json({
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

// Buscar cliente pelo nome 
router.post('/cliente/buscar', Auth, async (req, res) => {
  try {
    const { pesquisar } = req.body; // Extrai o termo de busca do corpo da requisição
    const userId = req.session.user.id; // Obtém o ID do usuário autenticado

    // Busca clientes com o nome correspondente
    const clientes = await Cliente.findAll({
      where: {
        nome: {
          [Op.like]: `%${pesquisar}%`
        },
        usuario: userId
      },
      limit: 20, // Limita para 20 resultados
    });

    // Retorna os clientes encontrados
    if (clientes.length > 0) {
      return res.status(200).json({ success: true, clientes });
    }

    // Caso nenhum cliente seja encontrado, retorna todos os clientes do usuário
    const todosClientes = await Cliente.findAll({
      where: { usuario: userId },
      limit: 100,
    });

    return res.status(404).json({
      success: false,
      message: "Cliente não encontrado!",
      clientes: todosClientes,
    });

  } catch (error) {
    console.error("Erro ao buscar cliente:", error);
    return res.status(500).json({
      success: false,
      message: "Erro ao buscar cliente!",
    });
  }
});




// pagina cliente visualizar
router.get('/cliente/view/:id', Auth, async (req, res) => {
  const clienteId = req.params.id;

  try {
    const cliente = await Cliente.findByPk(clienteId);
    if (!cliente) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }

    res.status(200).json({ cliente });

  } catch (error) {
    return res.status(500).json({ error: 'Erro ao carregar a pagina!' });
  }
});


// editar um cliente
router.put('/cliente/edit/save/:id', Auth, async (req, res) => {
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

    return res.status(200).json({ mensagem: 'Dados do cliente atualizados com sucesso!' });
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

    res.status(200).json({ message: 'Cliente deletado com sucesso!' });


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