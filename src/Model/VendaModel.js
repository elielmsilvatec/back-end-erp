const Sequelize = require("sequelize");
const connection = require("../../database/database");
const User = require("../User/UserModel");
const Pedido = require("./PedidosModel");


const Venda = connection.define('venda', {
    id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true
    },
    numero_pedido: {
        type: Sequelize.INTEGER,
        allowNull: true,
    },
    data_venda: {
        type: Sequelize.DATE,
        allowNull: true
    },
    tipo_pagamento: {
        type: Sequelize.STRING(50),
        allowNull: true
    },
    quant_parcelas: {
        type: Sequelize.FLOAT,
        allowNull: true
    },
    valor_total_venda: {
        type: Sequelize.FLOAT,
        allowNull: true
    },
    entrega: {
        type: Sequelize.INTEGER,
        allowNull: true,
    },
    data_entrega: {
        type: Sequelize.DATE,
        allowNull: true
    },
     obs: {
        type: Sequelize.STRING(100),
        allowNull: true
    },
    fechado: {
        type: Sequelize.INTEGER,
        allowNull: true,
    },
    desconto: {
        type: Sequelize.FLOAT,
        allowNull: true
    },
    taxas: {
        type: Sequelize.FLOAT,
        allowNull: true
    },
    lucro: {
        type: Sequelize.FLOAT,
        allowNull: true
    },
});

Venda.belongsTo(User, {
    constraint: true,
    foreignKey: 'usuario'
}); // uma venda pertence a um usuário

Venda.belongsTo(Pedido, {
    constraint: true,
    foreignKey: 'id_pedido'
}); // uma venda pertence a um pedido



module.exports = Venda;