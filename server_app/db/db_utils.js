const { Pool } = require('pg');

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASS,
    port: process.env.DB_PORT
});

exports.createTable = async function() {
    const createTableQuery = `
        CREATE TABLE IF NOT EXISTS UserInfo (
            id SERIAL PRIMARY KEY,
            username VARCHAR(100) NOT NULL,
            email VARCHAR(100) UNIQUE NOT NULL,
            password VARCHAR(100) NOT NULL,
            method INTEGER NOT NULL,
            accessToken TEXT UNIQUE NOT NULL,
            refreshToken TEXT UNIQUE NOT NULL,
            aliasname VARCHAR(100),
            profileimage BYTEA
        );

        CREATE TABLE IF NOT EXISTS ConfigInfo (
            id SERIAL PRIMARY KEY,
            user_id INTEGER,
            alarm BOOLEAN NOT NULL,
            dataeliminateduration INTEGER NOT NULL,
            coretimestart INTEGER NOT NULL,
            coretimeend INTEGER NOT NULL,
            CONSTRAINT fk_user
                FOREIGN KEY (user_id)
                REFERENCES UserInfo(id)
                ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS ChatInfo (
            id SERIAL PRIMARY KEY,
            user_id INTEGER,
            requesttime DATE NOT NULL,
            request JSON NOT NULL,
            response json NOT NULL,
            CONSTRAINT fk_user
                FOREIGN KEY (user_id)
                REFERENCES UserInfo(id)
                ON DELETE CASCADE
        );
        
        CREATE TABLE IF NOT EXISTS BabyInfo (
            id SERIAL PRIMARY KEY,
            user_id INTEGER,
            babyname VARCHAR(100) NOT NULL,
            babybirth DATE NOT NULL,
            babyimage BYTEA,
            CONSTRAINT fk_user
                FOREIGN KEY (user_id)
                REFERENCES UserInfo(id)
                ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS BabyEmotion (
            id SERIAL PRIMARY KEY,
            user_id INTEGER,
            baby_id INTEGER,
            checktime DATE NOT NULL,
            emotion INTEGER NOT NULL,
            CONSTRAINT fk_user
                FOREIGN KEY (user_id)
                REFERENCES UserInfo(id)
                ON DELETE CASCADE,
            CONSTRAINT fk_baby
                FOREIGN KEY (baby_id)
                REFERENCES BabyInfo(id)
                ON DELETE CASCADE
        );
    `;

    await pool.query(createTableQuery);
}

exports.findByValue = async function(key, val) {
    const query = `SELECT * FROM UserInfo WHERE ${key} = $1`;
    const result = await pool.query(query, [val]);
    console.log(result.rows);

    if (result.rows.length === 0) {
        return null;
    } else {
        return result.rows[0];
    }
}

exports.findConfigInfoByUserId = async function(id) {
    const query = `
        SELECT c.*
        FROM ConfigInfo c
        JOIN UserInfo u on u.id = c.user_id
        where u.id = $1
    `;

    const result = await pool.query(query, [id]);

    if (result.rows.length === 0)
        return null;
    return result.rows[0];
}

exports.findBabyInfoByUserId = async function(id) {
    const query = `
        SELECT b.*
        FROM BabyInfo b
        JOIN UserInfo u ON u.id = b.user_id
        WHERE u.id = $1
    `;

    const result = await pool.query(query, [id]);

    if (result.rows.length === 0)
        return null;
    return result.rows[0];
}

exports.updateUserInfo = async function(accessToken, updateColumns) {
    const columns = Object.keys(updateColumns);
    const setClause = columns.map((col, index) => `${col} = $${index + 1}`).join(', ');
    const updateQuery = `
        UPDATE UserInfo
        SET ${setClause}
        WHERE accessToken = $${columns.length + 1}
        RETURNING *;
    `;

    const values = [ ...Object.values(updateColumns), accessToken ];

    const result = await pool.query(updateQuery, values);

    if (result.rowCount === 0)
        return false;
    return true;
}

exports.updateConfigInfo = async function(id, updateColumns) {
    const columns = Object.keys(updateColumns);
    const setClause = columns.map((col, index) => `${col} = $${index + 1}`).join(', ');
    const updateQuery = `
        UPDATE ConfigInfo
        SET ${setClause}
        WHERE user_id = $${columns.length + 1}
        RETURNING *
    `;

    const values = [ ...Object.values(updateColumns), id ];

    const result = await pool.query(updateQuery, values);

    if (result.rowCount === 0)
        return false;
    return true;
}

exports.updateBabyInfo = async function(id, updateColumns) {
    const columns = Object.keys(updateColumns);
    const setClause = columns.map((col, index) => `${col} = $${index + 1}`).join(', ');
    const updateQuery = `
        UPDATE BabyInfo
        SET ${setClause}
        WHERE user_id = $${columns.length + 1}
        RETURNING *
    `;

    const values = [ ...Object.values(updateColumns), id ];

    const result = await pool.query(updateQuery, values);

    if (result.rowCount === 0)
        return false;
    return true;  
}

exports.insertUserInfo = async function(data) {
    const columns = Object.keys(data).join(', ');
    const values = Object.values(data);
    const placeholders = values.map((_, index) => `$${index + 1}`).join(', ');
    const query = `INSERT INTO UserInfo (${columns}) VALUES (${placeholders}) RETURNING *`;

    const result = await pool.query(query, values);

    if (result.rowCount === 0)
        return false;
    return true;
}

exports.insertConfigInfo = async function(accessToken, data) {
    const value = await this.findByValue("accessToken", accessToken);
    
    if (value !== null) {
        const userId = value.id;
        const columns = Object.keys(data).join(', ');
        const values = Object.values(data);
        const placeholders = values.map((_, index) => `$${index + 2}`).join(', ');
        const query = `
            INSERT INTO ConfigInfo (user_id, ${columns})
            VALUES ($1, ${placeholders})
            RETURNING *
        `;

        const result = await pool.query(query, [ userId, ...values ]);
        if (result.rowCount === 0)
            return false;
        return true;
    }
}

exports.insertBabyInfo = async function(accessToken, data) {
    const value = await this.findByValue("accessToken", accessToken);

    if (value !== null) {
        const userId = value.id;
        const columns = Object.keys(data).join(', ');
        const values = Object.values(data);
        const placeholders = values.map((_, index) => `$${index + 2}`).join(', ');
        const query = `
            INSERT INTO BabyInfo (user_id, ${columns})
            VALUES ($1, ${placeholders})
            RETURNING *
        `;

        const result = await pool.query(query, [ userId, ...values ]);
        if (result.rowCount === 0)
            return false;
        return true;
    }
}

exports.deleteUserInfo = async function(accessToken) {
    const query = `DELETE FROM UserInfo WHERE accessToken = $1`;

    const result = await pool.query(query, [accessToken]);

    if (result.rowCount === 0)
        return false;
    return true;
}

// BabyEmotion에서 값 가져오기, LIMIT 지정, e.checkTime 내림차순 정렬
exports.findBabyEmotionInfoByUserId = async function(id) {
    const query = `
        SELECT e.checkTime, e.emotion
        FROM BabyEmotion e
        JOIN UserInfo u ON u.id = e.user_id
        WHERE u.id = $1
        ORDER BY e.checkTime DESC
        LIMIT 3
    `;

    const result = await pool.query(query, [id]);

    if (result.rows.length === 0){
        return null;
    } else {
        return result.rows;
    }
        // 1개일 때는 그냥 그냥 전달하고 2대부터 Array형태로 전달?
//    } else if (result.row.length === 1){
//        return result.row[0];
//    } else {
//        return result.rows;
//    }
}

// 집중 관찰 시간의 아기 감정과 시간 데이터 가져오기 # 이거는 한번 더 확인 필요!!!!
exports.findCoreTimeBabyInfoByUserId = async function(id) {
    const query = `
        SELECT e.emotion, e.checkTime
        FROM BabyEmotion e
        JOIN UserInfo u ON u.id = e.user_id
        JOIN ConfigInfo c ON u.id = c.user_id
        WHERE u.id = $1
          AND (
            (c.coretimestart <= c.coretimeend AND EXTRACT(HOUR FROM e.checkTime)::INTEGER BETWEEN c.coretimestart AND c.coretimeend)
            OR
            (c.coretimestart > c.coretimeend AND
             (EXTRACT(HOUR FROM e.checkTime)::INTEGER >= c.coretimestart OR EXTRACT(HOUR FROM e.checkTime)::INTEGER < c.coretimeend))
          )
    `;

    const result = await pool.query(query, [id]);
    if (result.rows.length === 0){
        return null;
    } else {
        return result.rows;
    }
}

// 집중 관찰 시간 데이터 가져오기
exports.findCoreTimeInfoByUserId = async function(id) {
    const query = `
        SELECT c.coretimestart, c.coretimeend
        FROM ConfigInfo c
        JOIN UserInfo u ON u.id = c.user_id
        WHERE u.id = $1
    `;

    const result = await pool.query(query, [id]);
    if (result.rows.length === 0){
        return null;
    } else {
        return result.rows[0];
    }
}

// 감정 데이터 가져오기
exports.findBabyFrequencyInfoByUserId = async function(id) {
    const query = `
        SELECT e.emotion
        FROM BabyEmotion e
        JOIN UserInfo u ON u.id = e.user_id
        WHERE u.id = $1
        ORDER BY e.checkTime DESC
    `;

    const result = await pool.query(query, [id]);

    if (result.rows.length === 0){
        return null;
    } else {
        return result.rows.map(row => row.emotion);
    }
}