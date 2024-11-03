const Sequelize = require("sequelize");
const connection = require("../../database/database");
const User = require("../User/UserModel")
const ItemModel = require("./itensPedidosModel")
const ClienteModel = require("./ClienteModel")


const Pedido = connection.define('pedido', {

    id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true
    },
    num_pedido: {
        type: Sequelize.INTEGER,
        allowNull: true,
    },
    quantidade: {
        type: Sequelize.FLOAT(50),
        allowNull: true
    },
    status: {
        type: Sequelize.FLOAT(50),
        allowNull: true
    },
    valor_total_pedido: {
        type: Sequelize.FLOAT(50),
        allowNull: true
    },

},
{
  indexes: [
    {
      fields: ["num_pedido"], // Índice na coluna 'nome'
    },

    // Adicione mais índices conforme necessário
  ],
})


Pedido.belongsTo(User, {
    constraint: true,
    foreignKey: 'usuario'

}) // produto pertence ao um usuario


Pedido.hasMany(ItemModel, {
    constraint: true,
    foreignKey: 'itens_pedidos'

}) // produto pertence varios itens Carrinho / pedido

Pedido.belongsTo(ClienteModel, {
    constraint: true,
    foreignKey: 'cliente_pedido'

}) // produto pertence aum cliente

//Produto.hasMany(User);  //um para muitos
//Produto.sync({force: true})

module.exports = Pedido;
