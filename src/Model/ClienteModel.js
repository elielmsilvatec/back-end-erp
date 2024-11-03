const Sequelize = require("sequelize");
const connection = require("../../database/database");
const User = require("../User/UserModel");

const Cliente = connection.define(
  "cliente",
  {
    id: {
      type: Sequelize.INTEGER,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
    },
    nome: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    telefone: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    cep: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    rua: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    numero: {
      type: Sequelize.INTEGER,
      allowNull: true,
    },
    bairro: {
      type: Sequelize.TEXT,
      allowNull: true,
    },
    cidade: {
      type: Sequelize.TEXT,
      allowNull: true,
    },
    observacoes: {
      type: Sequelize.TEXT,
      allowNull: true,
    },

    // email_user: {
    //     type: Sequelize.STRING,
    //     allowNull: false
    // },
  },  {
    indexes: [
      {
        fields: ["nome"], // Índice na coluna 'nome'
      },

      // Adicione mais índices conforme necessário
    ],
  }
);

Cliente.belongsTo(User, {
  constraint: true,
  foreignKey: "usuario",
}); // produto pertence ao um usuario

module.exports = Cliente;
