const Sequelize = require("sequelize");
const connection = require("../../database/database");


const Controle_Financeiro = connection.define('controle_financeiro', {
    id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true
    },
    nome: {
        type: Sequelize.STRING(100),
        allowNull: true
    }, 
    recorrente  : {
        type: Sequelize.BOOLEAN,
        allowNull: true
    },
    mes_referencia: {
        type: Sequelize.DATE,
        allowNull: true
    },
    vencimento: {
        type: Sequelize.DATE,
        allowNull: true
    },
    valor: {
        type: Sequelize.FLOAT,
        allowNull: true
    },
    status: {
        type: Sequelize.INTEGER,
        allowNull: true,
    },   

     obs: {
        type: Sequelize.STRING(100),
        allowNull: true
    },
    user_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
    },
  });



module.exports = Controle_Financeiro;