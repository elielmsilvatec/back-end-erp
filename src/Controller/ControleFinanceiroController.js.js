
const express = require('express')
const router = express.Router()
const Controle_Financeiro = require("../Model/ControleFinanceiroModel")
const Auth = require("../auth")
const Auth_cargo = require("../auth_cargo")
const { Op } = require('sequelize');
const moment = require('moment');


//LER mês atual
router.get('/financeiro/contas', Auth, Auth_cargo,  async (req, res) => {
  try {
    moment.locale('pt-br');
    const mesAtual = moment().format('YYYY-MM'); // Obtém o mês e ano atuais no formato MM-YYYY
    const mesReferencia = moment(mesAtual, 'YYYY-MM').toDate(); // Convertendo o mês_ano para um objeto Date

    const controle = await Controle_Financeiro.findAll({
      where: {
        [Op.or]: [
          {
            vencimento: {
              [Op.gte]: moment(mesReferencia).startOf('month').toDate(),
              [Op.lte]: moment(mesReferencia).endOf('month').toDate()
            }
          },
          {
            recorrente: true
          }
        ],
        user_id: req.session.user.id
      }
    });

    // Faça algo com as contasDoMes, como passá-las para um template EJS e renderizar a página   
    res.render("financeiro/contas", {
      controle,
      moment
    });
  } catch (error) {
    req.flash('erro_msg', 'Erro ao localizar conta');
    res.redirect('/financeiro/contas');
  }
});

// ler todas as contas 
router.get('/financeiro/todas', Auth, async (req, res) => {
  try {
    // Carregando a localização em português do Brasil
    moment.locale('pt-br');
    const controle = await Controle_Financeiro.findAll({
      where: {
        user_id: req.session.user.id,
        status: 0
      },
      // limit: 100
    });

    res.render("financeiro/contas", {
      controle,
      moment
    });
  } catch (error) {
    req.flash('erro_msg', 'Erro ao buscar contas a pagar');
    res.redirect('/');
  }
});


// Criação (C)
router.post('/financeiro/contas/add', Auth, async (req, res) => {
  try {
    const { nome, mes_referencia, vencimento, valor, status, obs, quantidadeParcelas, recorrente } = req.body;

    // Definindo a hora padrão para 12:00 PM
    const horaPadrao = '12:00:00';
    const novo_vencimento = moment(vencimento + ' ' + horaPadrao, 'YYYY-MM-DD HH:mm:ss').toDate();


    if (!nome || !vencimento || !valor) {
      req.flash('erro_msg', 'Preencha todos os campos corretamente');
      return res.redirect('/financeiro/contas');
    }


    if (quantidadeParcelas > 0) {
      const valorParcela = valor / quantidadeParcelas;
      const dataVencimento = new Date(novo_vencimento);

      for (let i = 0; i < quantidadeParcelas; i++) {  // o indice 0 pega o valor total por isso começo com o 1
        const novaDataVencimento = new Date(dataVencimento);
        novaDataVencimento.setMonth(novaDataVencimento.getMonth() + i);

        const controle = await Controle_Financeiro.create({
          nome,
          recorrente: false,
          mes_referencia: new Date,
          vencimento: novaDataVencimento,
          valor: valorParcela,
          status: 0,
          obs,
          user_id: req.session.user.id,

        });
      }
      req.flash('sucesso_msg', 'Conta adicionada com sucesso!');
      res.redirect('/financeiro/contas');
    }

    if (recorrente) {
      try {
        const controle = await Controle_Financeiro.create({
          nome,
          recorrente: true,
          mes_referencia: new Date,
          vencimento: novo_vencimento,
          valor,
          status: 0,
          obs,
          user_id: req.session.user.id,
        });
        req.flash('sucesso_msg', 'Conta recorrente adicionada com sucesso!');
        res.redirect('/financeiro/contas');
      } catch (error) {
        req.flash('erro_msg', 'Erro ao adicionar conta');
        res.redirect('/financeiro/contas');
      }
    }

    if (quantidadeParcelas === '' && !recorrente) {
      try {
        const controle = await Controle_Financeiro.create({
          nome,
          recorrente: false,
          mes_referencia: new Date,
          vencimento: novo_vencimento,
          valor,
          status: 0,
          obs,
          user_id: req.session.user.id,
        });
        req.flash('sucesso_msg', 'Conta adicionada com sucesso!');
        res.redirect('/financeiro/contas');
      } catch (error) {
        req.flash('erro_msg', 'Erro ao adicionar conta');
        res.redirect('/financeiro/contas');
      }

    }
  } catch (error) {
    req.flash('erro_msg', 'Erro ao adicionar conta');
    res.redirect('/financeiro/contas');
  }
});





// rota para pesquisar contas pelo mês
router.post('/contas/pesquisar', Auth, async (req, res) => {
  try {
    const { mes_ano } = req.body;
    const mesReferencia = moment(mes_ano, 'MM-YYYY').toDate(); // Convertendo o mês_ano para um objeto Date

    const controle = await Controle_Financeiro.findAll({
      where: {
        [Op.or]: [
          {
            vencimento: {
              [Op.gte]: moment(mesReferencia).startOf('month').toDate(),
              [Op.lte]: moment(mesReferencia).endOf('month').toDate()
            }
          },
          {
            recorrente: true
          }
        ],
        user_id: req.session.user.id
      }
    });


    // Faça algo com as contasDoMes, como passá-las para um template EJS e renderizar a página   
    res.render("financeiro/contas", { controle, moment })
  } catch (error) {
    req.flash('erro_msg', 'Erro ao localizar conta');
    res.redirect('/financeiro/contas');
  }
});


// Recebendo os dados enviar a tela de editar
router.get('/financeiro/ver/:id', Auth, async (req, res) => {
  const id = req.params.id;
  try {
    const controle = await Controle_Financeiro.findOne({ where: { id } });
    //return res.status(200).json(produtos);
    res.render("financeiro/ver", {
      controle, id, moment
    })
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao buscar produtos' });
  }
});

// Rota para buscar dados financeiros com base no ID AJAX
router.get('/financeiro/editar/:id', Auth, async (req, res) => {
  const id = req.params.id;
  console.log('Acessando rota /financeiro/editar/' + id);

  try {
    const controle = await Controle_Financeiro.findOne({ where: { id } });
    res.render("financeiro/editar", {
      controle, id, moment
    });
  } catch (error) {
    console.error('Erro ao buscar dados financeiros para edição:', error);
    return res.status(500).json({ error: 'Erro ao buscar dados financeiros para edição' });
  }
});

// Atualização (U):
router.post('/financeiro/contas/edit', Auth, async (req, res) => {

  try {
    const { vencimento, status, obs, id } = req.body;

    let valor = req.body.valor.replace(/(\.|,)/g, (match, p1) => p1 === "." ? "" : ".").replace("R$", "") 


    await Controle_Financeiro.update(
      {
        valor,
        vencimento,
        obs,
      },
      {
        where: {
          id,
          user_id: req.session.user.id,
        },
      }
    );
    req.flash('sucesso_msg', 'Conta atualizada com sucesso!');
    res.redirect('/financeiro/contas');
  } catch (error) {
    req.flash('erro_msg', 'Erro ao atualizar conta');
    res.redirect('/financeiro/contas');
  }

});

// Remoção (D):

router.get('/financeiro/contas/delete/:id', Auth, async (req, res) => {
  try {
    await Controle_Financeiro.destroy({
      where: {
        id: req.params.id,
        user_id: req.session.user.id,
      },
    });
    req.flash('sucesso_msg', 'Conta removida com sucesso !');
    res.redirect('/financeiro/contas');
  } catch (error) {
    req.flash('erro_msg', 'Erro ao remover conta');
    res.redirect('/financeiro/contas');
  }
});













module.exports = router;