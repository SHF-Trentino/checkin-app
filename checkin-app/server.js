const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const http = require("http");
const { Server } = require("socket.io");

const app = express();

const server = http.createServer(app);

const io = new Server(server);

const PORT = 3000;

app.use(express.json());

app.use(express.static("public"));

const db = new sqlite3.Database("./database.db");

db.serialize(() => {

    db.run(`
        CREATE TABLE IF NOT EXISTS checkins (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE,
            timestamp TEXT
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            timestamp TEXT
        )
    `);

    const names = [
        "Marina",
        "Patrick",
        "Raphi",
        "Sandra",
        "Johann",
        "Vanessa"
    ];

    names.forEach(name => {

        db.run(`
            INSERT OR IGNORE INTO checkins(name, timestamp)
            VALUES (?, ?)
        `, [name, null]);
    });
});

app.get("/api/checkins", (req, res) => {

    db.all(`
        SELECT * FROM checkins
        ORDER BY name ASC
    `, (err, rows) => {

        if (err) {

            return res.status(500).json({
                error: err.message
            });
        }

        res.json(rows);
    });
});

app.get("/api/history", (req, res) => {

    db.all(`
        SELECT * FROM history
        ORDER BY id DESC
    `, (err, rows) => {

        if (err) {

            return res.status(500).json({
                error: err.message
            });
        }

        res.json(rows);
    });
});

app.post("/api/checkin/:name", (req, res) => {

    const name = req.params.name;

    db.get(`
        SELECT *
        FROM checkins
        WHERE timestamp IS NOT NULL
        LIMIT 1
    `, (err, existingCheckin) => {

        if (err) {

            return res.status(500).json({
                error: err.message
            });
        }

        if (existingCheckin) {

            return res.status(400).json({
                error: "Heute wurde bereits gegossen"
            });
        }

        const timestamp =
            new Date().toLocaleString("de-DE");

        db.run(`
            UPDATE checkins
            SET timestamp = ?
            WHERE name = ?
        `, [timestamp, name], function (err) {

            if (err) {

                return res.status(500).json({
                    error: err.message
                });
            }

            db.run(`
                INSERT INTO history(name, timestamp)
                VALUES (?, ?)
            `, [name, timestamp], function () {

                io.emit("update");

                res.json({
                    success: true,
                    timestamp
                });
            });
        });
    });
});

app.post("/api/reset", (req, res) => {

    db.get(`
        SELECT *
        FROM history
        ORDER BY id DESC
        LIMIT 1
    `, (err, latestHistory) => {

        if (latestHistory) {

            db.run(`
                DELETE FROM history
                WHERE id = ?
            `, [latestHistory.id]);
        }

        db.run(`
            UPDATE checkins
            SET timestamp = NULL
        `, function (err) {

            if (err) {

                return res.status(500).json({
                    error: err.message
                });
            }

            io.emit("update");

            res.json({
                success: true
            });
        });
    });
});

app.delete("/api/history/:id", (req, res) => {

    const id = req.params.id;

    db.run(`
        DELETE FROM history
        WHERE id = ?
    `, [id], function (err) {

        if (err) {

            return res.status(500).json({
                error: err.message
            });
        }

        io.emit("update");

        res.json({
            success: true
        });
    });
});

function resetCheckins() {

    db.run(`
        UPDATE checkins
        SET timestamp = NULL
    `, err => {

        if (err) {

            console.error(
                "Fehler beim Mitternachts-Reset:",
                err.message
            );

            return;
        }

        io.emit("update");

        console.log(
            "🌙 Check-Ins wurden um Mitternacht zurückgesetzt"
        );
    });
}

function scheduleMidnightReset() {

    const now = new Date();

    const midnight = new Date();

    midnight.setHours(24, 0, 0, 0);

    const timeUntilMidnight =
        midnight.getTime() - now.getTime();

    setTimeout(() => {

        resetCheckins();

        setInterval(
            resetCheckins,
            24 * 60 * 60 * 1000
        );

    }, timeUntilMidnight);
}

scheduleMidnightReset();

server.listen(PORT, () => {

    console.log(
        `Server läuft auf Port ${PORT}`
    );
});