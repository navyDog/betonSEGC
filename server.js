const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');

const app = express();
const db = new sqlite3.Database('./data.db');

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Création des tables
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS affaires (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nom TEXT NOT NULL
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS chantiers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      numero INTEGER UNIQUE,
      nom TEXT NOT NULL,
      affaire_id INTEGER,
      date_reception TEXT,
      date_prelevement TEXT,
      slump TEXT,
      FOREIGN KEY (affaire_id) REFERENCES affaires(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS eprouvettes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      chantier_id INTEGER,
      age_jour INTEGER,
      nombre INTEGER,
      FOREIGN KEY (chantier_id) REFERENCES chantiers(id)
    )
  `);
});

// GET toutes les affaires
app.get('/api/affaires', (req, res) => {
  db.all('SELECT * FROM affaires', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// POST une nouvelle affaire
app.post('/api/affaires', (req, res) => {
  const { nom } = req.body;
  db.run('INSERT INTO affaires (nom) VALUES (?)', [nom], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: this.lastID, nom });
  });
});

// GET tous les chantiers avec nom affaire


app.get('/api/chantiers', (req, res) => {
  const sql = `
    SELECT chantiers.*, affaires.nom as affaire_nom
    FROM chantiers
    LEFT JOIN affaires ON chantiers.affaire_id = affaires.id
  `;
  db.all(sql, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Erreur lecture chantiers' });
    }
    res.json(rows);
  });
});




app.post('/api/chantiers', (req, res) => {
  const { nom, affaire_id, date_reception, date_prelevement, slump } = req.body;

  db.get(`SELECT MAX(numero) as maxNum FROM chantiers`, [], (err, row) => {
    if (err) return res.status(500).json({ error: 'Erreur numéro' });

    const nextNumero = (row?.maxNum || 0) + 1;

    const sql = `
      INSERT INTO chantiers (numero, nom, affaire_id, date_reception, date_prelevement, slump)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    const params = [nextNumero, nom, affaire_id, date_reception, date_prelevement, slump];

    db.run(sql, params, function (err) {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Erreur création chantier' });
      }
      res.json({ id: this.lastID, numero: nextNumero });
    });
  });
});


app.post('/api/eprouvettes', (req, res) => {
  const { chantier_id, age_jour, nombre } = req.body;
  const sql = `INSERT INTO eprouvettes (chantier_id, age_jour, nombre) VALUES (?, ?, ?)`;
  db.run(sql, [chantier_id, age_jour, nombre], function (err) {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Erreur DB' });
    }
    res.json({ id: this.lastID });
  });
});

app.get('/api/eprouvettes', (req, res) => {
  const chantierId = req.query.chantier_id;
  const sql = `SELECT * FROM eprouvettes WHERE chantier_id = ?`;
  db.all(sql, [chantierId], (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Erreur DB' });
    }
    res.json(rows);
  });
});

app.get('/api/eprouvettesall', (req, res) => {
  const sql = `
    SELECT e.*, c.date_reception AS datePrel, c.nom AS chantier_nom, 
    FROM eprouvettes e
    JOIN chantiers c ON e.chantier_id = c.id
  `;
  db.all(sql, [], (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Erreur DB' });
    }
    res.json(rows);
  });
});









app.listen(3000, () => {
  console.log('Serveur lancé sur http://localhost:3000');
});
