const Sequelize = require("sequelize");
const connection = require("../../database/database");
const User = require("../User/UserModel");
const Pedido = require("./PedidosModel");
const Produto = require("./ProdutoModel");

const ItensPedidos = connection.define('itens_pedidos', {
    id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true
    },
    nome: {
        type: Sequelize.STRING,
        allowNull: true
    },
    undMedidas: {
        type: Sequelize.STRING,
        allowNull: false
    },
    marca: {
        type: Sequelize.STRING,
        allowNull: false
    },
    quant_itens: {
        type: Sequelize.FLOAT(50),
        allowNull: true
    },
    valor_compra: {
        type:  Sequelize.FLOAT(50),
        allowNull: true
    },
    valor_unitario: {
        type:  Sequelize.FLOAT(50),
        allowNull: true
    },
    lucro: {
        type:  Sequelize.FLOAT(50),
        allowNull: true
    },
    sub_total_itens: {
        type:  Sequelize.FLOAT(50),
        allowNull: false
    },
    pedido: {
        type:  Sequelize.INTEGER,
        allowNull: false
    },
    produtoID: {
        type:  Sequelize.INTEGER,
        allowNull: false
    }
},
  {
    indexes: [
      {
        fields: ["pedido"], // Índice na coluna 'nome'
      },

      // Adicione mais índices conforme necessário
    ],
  });

ItensPedidos.belongsTo(User, {
    constraint: true,
    foreignKey: 'usuario'
}); // produto pertence a um usuario



ItensPedidos.hasMany(Produto, {
    constraint: true,
    foreignKey: 'itens_produto'
}); // um item pertence a um produto

module.exports = ItensPedidos;