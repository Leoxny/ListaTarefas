import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabase("db.db");  // inicialização do banco

export default db