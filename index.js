import express from 'express'
import pg from 'pg'
const app = express()
const port = 3000
const { Pool } = pg

app.use(express.json())
app.use(
    express.urlencoded({
        extended: true,
    })
)

app.get('/health', (req, res) => {
    res.json({ status: 'ok' })
})

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'mahasiswa',
    password: '123',
    port: 5432,
})

// GET ALL
app.get('/', (req, res) => {
    console.log("TEST DATA :");

    pool.query('SELECT * FROM biodata ORDER BY id')
        .then((result) => {
            res.send(result.rows);
        })
        .catch(err => {
            console.error(err);
            res.status(500).send('Internal Server Error');
        });
});

const hasRequiredFields = (body, fields) =>
    body !== null
        && typeof body === 'object'
        && fields.every(field =>
            body[field] !== undefined
            && body[field] !== null
            && String(body[field]).trim() !== ''
        );

// POST (Tambah Data)
app.post('/biodata', (req, res) => {
    const body = req.body ?? {};
    const { id, nama, nim, kelas } = body;

    if (!hasRequiredFields(body, ['id', 'nama', 'nim', 'kelas'])) {
        return res.status(400).json({ message: 'Semua field biodata wajib diisi' });
    }

    pool.query(
        'INSERT INTO biodata (id, nama, nim, kelas) VALUES ($1, $2, $3, $4) RETURNING *',
        [id, nama, nim, kelas]
    )
        .then(result => res.status(201).json(result.rows[0]))
        .catch(err => {
            console.error(err);
            res.status(500).json({ message: 'Internal Server Error' });
        });
});

// PUT (Update Data)
app.put('/biodata/:id', (req, res) => {
    const { id } = req.params;
    const body = req.body ?? {};
    const { nama, nim, kelas } = body;

    if (!hasRequiredFields(body, ['nama', 'nim', 'kelas'])) {
        return res.status(400).json({ message: 'Semua field biodata wajib diisi' });
    }

    pool.query(
        'UPDATE biodata SET nama=$1, nim=$2, kelas=$3 WHERE id=$4 RETURNING *',
        [nama, nim, kelas, id]
    )
        .then(result => {
            if (result.rowCount === 0) {
                return res.status(404).json({
                    message: "Data tidak ditemukan"
                });
            }

            res.json({
                message: "Data berhasil diupdate",
                data: result.rows[0]
            });
        })
        .catch(err => {
            console.error(err);
            res.status(500).send('Internal Server Error');
        });
});

// DELETE (Hapus Data)
app.delete('/biodata/:id', (req, res) => {
    const { id } = req.params;

    pool.query(
        'DELETE FROM biodata WHERE id=$1 RETURNING *',
        [id]
    )
        .then(result => {
            if (result.rowCount === 0) {
                return res.status(404).json({
                    message: "Data tidak ditemukan"
                });
            }

            res.json({
                message: "Data berhasil dihapus",
                data: result.rows[0]
            });
        })
        .catch(err => {
            console.error(err);
            res.status(500).send('Internal Server Error');
        });
});

app.use((req, res) => {
    res.status(404).json({ message: 'Endpoint tidak ditemukan' });
});

app.listen(port, () => {
    console.log(`App running on port ${port}.`);
});