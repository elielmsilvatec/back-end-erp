const Sequelize = require("sequelize");
const connection = require("../../database/database");

const User = connection.define("user", {
  id: {
    type: Sequelize.INTEGER,
    allowNull: false,
    autoIncrement: true,
    primaryKey: true,
  },
  nome: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  email: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  senha: {
    type: Sequelize.STRING,
    allowNull: false,
  },

  cnpj: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  telefone: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  rua: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  bairro: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  cidade: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  uf: {
    type: Sequelize.STRING,
    allowNull: true,
  },
});

module.exports = User;
