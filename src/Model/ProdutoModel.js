const Sequelize = require("sequelize");
const connection = require("../../database/database");
const User = require("../User/UserModel")


const Produto = connection.define('produto', {

    id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true
    },
    nomeProduto: {
        type: Sequelize.STRING,
        allowNull: false
    },
    unidadeMedida: {
        type: Sequelize.STRING,
        allowNull: true
    },
    marca: {
        type: Sequelize.STRING,
        allowNull: true
    },
    quantidadeEstoque: {
        type: Sequelize.FLOAT,
        allowNull: false
    },
    valorCompra: {
        type: Sequelize.FLOAT,
        allowNull: false
    },
    valorVenda: {
        type: Sequelize.FLOAT,
        allowNull: false
    },
    observacoes: {
        type: Sequelize.TEXT,
        allowNull: true
    }
},
{
  indexes: [
    {
      fields: ["nomeProduto"], // Índice na coluna 'nome'
    },

    // Adicione mais índices conforme necessário
  ],
})

Produto.belongsTo(User, {
    constraint: true,
    foreignKey: 'usuario'

}) // produto pertence ao um usuario

//Produto.hasMany(User);  //um para muitos
//Produto.sync({force: true})

module.exports = Produto;
