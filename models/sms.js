'use strict';

module.exports = function(sequelize, DataTypes) {

  var SMS = sequelize.define('SMS', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true
    },
    data: DataTypes.TEXT,
    mensagem: DataTypes.TEXT,
    origem: DataTypes.CHAR
  }, {
    classMethods: {
      associate: function(models) {
        // associations can be defined here
      }
    }
  });

  return SMS;

};