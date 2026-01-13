const db = require('../src/app/models');

async function up() {
    try {
        const queryInterface = db.sequelize.getQueryInterface();
        await queryInterface.addColumn('accounts', 'reset_password_token', {
            type: db.Sequelize.STRING,
            allowNull: true
        });
        await queryInterface.addColumn('accounts', 'reset_password_expires', {
            type: db.Sequelize.DATE,
            allowNull: true
        });
        console.log('Columns added successfully');
    } catch (error) {
        console.error('Error adding columns:', error.message);
    } finally {
        process.exit();
    }
}

up();
