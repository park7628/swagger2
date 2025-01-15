const express = require('express');
const cookieParser = require('cookie-parser');
const router = express.Router();
const jwt = require('../utils/jwtUtils');
const chk = require('../utils/checkUtils');
const db = require('../db/db_utils');

router.use(cookieParser());
router.use(express.json());
router.use(express.urlencoded({extended: true}));

router.get('/login', async (req, res) => {
    const accessToken = req.cookies.accessToken;
    const refreshToken = req.cookies.refreshToken;

    console.log(req.cookies);
    
    if (!(accessToken || refreshToken)) {
        return res.status(400).json({success: false, message: "불량 토큰"});
    }

    try {
        const accessResult = jwt.verifyToken(accessToken);
        if (accessResult) {
            // DB에 동일한 accessToken 여부 확인 필요
            const value = await db.findByValue("accessToken", accessToken);
            if (value !== null)
                return res.json({success: true});
        }

        const refreshResult = jwt.verifyToken(refreshToken);
        if (refreshResult) {
            // DB에 동일한 refreshToken 여부 확인 필요
            const value = await db.findByValue("refreshToken", refreshToken);
            if (value !== null) {
                const {newAccessToken, newRefreshToken} = jwt.generateToken(refreshResult.email);
                await db.updateUserInfo(accessToken, {accessToken: newAccessToken, refreshToken: newRefreshToken});
                return res.status(403).json({success: false, message: "토큰 교환", accessToken: newAccessToken});
            }
        }
        return res.status(401).json({success: false, message: "신규 가입 필요"});
    } catch (error) {
        console.error('Token verification error:', error);
        return res.status(500).json({success: false, message: "Internal server error"});
    }
});

router.post('/register', async (req, res) => {
    const { username, email, password, method } = req.body;

    if (!email || !password) {
        return res.status(400).json({success: false, message: "불량 값"});
    }

    if (method !== 0 && method !== 1) {
        return res.status(400).json({success: false, message: "유효하지 않은 로그인 수단"});
    }

    try {
        // DB에 동일한 이메일 존재 확인 필요
        const value = await db.findByValue("email", email);
        if (value === null) {
            const { accessToken, refreshToken } = jwt.generateToken(email);
            await db.insertUserInfo({username: username, email: email, password: password, method: method, accessToken: accessToken, refreshToken: refreshToken, aliasname: null, profileimage: null});
            await db.insertConfigInfo(accessToken, {alarm: false, dataeliminateduration: 10, coretimestart: 9, coretimeend: 18});
            await db.insertBabyInfo(accessToken, {babyname: "입력해주세요", babybirth: "1990-01-01"});
            return res.json({success: true, accessToken: accessToken, refreshToken: refreshToken});
        }
        return res.status(400).json({success: false, message: "이미 가입한 회원입니다"});
    } catch (error) {
        console.error('Token generation error:', error);
        return res.status(500).json({message: "Internal server error"});
    }
});

router.get('/checkEmail', (req, res) => {
    const email = req.cookies.email;

    try {
        if (chk.checkEmail(email))
            return res.json({success: true});
        return res.status(400).json({success: false, message: "이메일 양식에 맞지 않음"});
    } catch (error) {
        return res.json({success: false, message: "Internal Server Error"});
    }
});

router.get('/checkPass', (req, res) => {
    const password = req.cookies.password;
    const comb = chk.checkPass(password);

    try {
        if (!comb)
            return res.json({success: true});
        if (comb == 1)
            return res.status(400).json({success: false, checkCharacters: true, checkPassLen: false, message: "양식에 맞지 않는 비밀번호입니다"});
        if (comb == 2)
            return res.status(400).json({success: false, checkCharacters: false, checkPassLen: true, message: "양식에 맞지 않는 비밀번호입니다"});
        return res.status(400).json({success: false, checkCharacters: false, checkPassLen: false, message: "양식에 맞지 않는 비밀번호입니다"});
    } catch (error) {
        return res.status(500).json({success: false, message: "Internal Server Error"});
    }
});

router.get('/findEmail', async (req, res) => {
    const email = req.query.email;

    if (!chk.checkEmail(email)) {
        return res.status(400).json({success: false, message: "잘못된 형식의 이메일입니다"});
    }

    try {
        // DB 작업을 해서 이메일 존재 여부 확인
        const value = await db.findByValue("email", email);
        if (value !== null)
            return res.json({success: true});
        return res.status(404).json({success: false, message: "존재하지 않는 이메일입니다"})
    } catch (error) {
        return res.status(500).json({success: false, message: "내부 서버 오류"})
    }
});

router.get('/findPass', async (req, res) => {
    const accessToken = req.cookies.accessToken;

    try {
        const accessResult = jwt.verifyToken(accessToken);
        // DB에서 accessToken 존재 여부를 찾는다
        if (!accessResult)
            return res.status(400).json({success: false, message: "유효하지 않은 인증수단"});
        const value = await db.findByValue("accessToken", accessToken);
        if (!value)
            return res.status(404).json({success: false, message: "존재하지 않는 이메일입니다"});
        // accessToken이 존재하면 해당 db의 이메일로 신규 비밀번호를 보내준다
        return res.json({success: true});
    } catch (error) {
        return res.status(500).json({success: false, message: "내부 서버 오류"});
    }
});

module.exports = router;