const express = require('express');
const cookieParser = require('cookie-parser');
const router = express.Router();
const jwt = require('../utils/jwtUtils');
const db = require('../db/db_utils');

router.use(express.json());
router.use(express.urlencoded({extended: true}));
router.use(cookieParser());

router.get('/getSettingInfo', async (req, res) => {
    const accessToken = req.cookies.accessToken;

    try {
        if (jwt.verifyToken(accessToken)) {
            // DB에서 accessToken 존재 여부 확인
            const value = await db.findByValue("accessToken", accessToken);

            if (value !== null) {
                const info = await db.findConfigInfoByUserId(value.id);
                const baby = await db.findBabyInfoByUserId(value.id);
                if (info !== null && baby !== null) {
                    return res.json({success: true, alarm: info.alarm, babyName: baby.babyname, babyBirth: baby.babybirth,
                        dataEliminateDuration: info.dataeliminateduration, coreTimeStart: info.coretimestart, coreTimeEnd: info.coretimeend
                    });
                }
            }
        }
        return res.status(400).json({success: false, message: "유효하지 않은 접근수단"});
    } catch (error) {
        console.log(error);
        return res.status(500).json({success: false, message: "내부 서버 오류"});
    }
});

router.post('/setSettingInfo', async (req, res) => {
    const {accessToken, alarm, babyName, babyBirth, dataEliminateDuration, coreTimeStart, coreTimeEnd} = req.body;

    try {
        if (jwt.verifyToken(accessToken)) {
            // DB에서 accessToken 존재 여부 확인
            const value = await db.findByValue("accessToken", accessToken);
            // accessToken을 동일한 정보를 찾았을 경우, body를 통해 받은 설정 정보를 DB에 저장
            if (value !== null) {
                const baby = await db.updateBabyInfo(value.id, {babyname: babyName, babybirth: babyBirth});
                const config = await db.updateConfigInfo(value.id, {alarm: alarm, dataeliminateduration: dataEliminateDuration, coretimestart: coreTimeStart, coretimeend: coreTimeEnd});

                if (config && baby)
                    return res.json({success: true});
            }
        }
        return res.json({success: false, message: "유효하지 않은 접근수단"});
    } catch (error) {
        return res.status(500).json({success: false, message: "내부 서버 오류"});
    }
});


router.post('/logout', async (req, res) => {
    const { accessToken } = req.body;

    try {
        if (jwt.verifyToken(accessToken)) {
            // DB에서 해당 토큰 존재 여부 확인
            const value = await db.findByValue(accessToken);
            if (value !== null) {
                await db.updateUserInfo(accessToken, {accessToken: "null"});
                return res.json({success: true});
            }
        }
        return res.status(400).json({success: false, message: "유효하지 않은 로그아웃 수단입니다"});
    } catch (error) {
        return res.status(500).json({success: false, message: "내부 서버 오류입니다"});
    }
});

router.post('/deleteUser', async (req, res) => {
    const { accessToken } = req.body;

    try {
        if (jwt.verifyToken(accessToken)) {
            // DB에서 해당 토큰 존재 여부 확인
            const value = await db.findByValue("accessToken", accessToken);

            if (value !== null) {
                // DB에서 회원 삭제
                await db.deleteUserInfo(accessToken);
                return res.json({success: true});
            }
        }
        return res.status(400).json({success: false, message: "유효하지 않은 회원탈퇴 수단입니다"});
    } catch (error) {
        return res.status(500).json({success: false, message: "내부 서버 오류입니다"});
    }
});

router.get('/getProfileImage', async (req, res) => {
    const accessToken = req.cookies.accessToken;

    try {
        if (jwt.verifyToken(accessToken)) {
            // DB에서 해당 토큰 존재 여부 확인
            const value = await db.findByValue("accessToken", accessToken);

            if (value !== null) {
                const image = value.profileimage;
                return res.json({success: true, profileImage: image});
            }
        }
        return res.status(400).json({success: false, message: "유효하지 않은 인증수단"});
    } catch (error) {
        return res.status(500).json({success: false, message: "내부 서버 오류"});
    }
});

router.post('/setProfileImage', async (req, res) => {
    const {accessToken, profileImage} = req.body;

    try {
        if (jwt.verifyToken(accessToken)) {
            // DB에서 해당 토큰 존재 여부 확인
            const value = await db.findByValue("accessToken", accessToken);
            // DB에 이미지 저장
            if (value !== null) {
                await db.updateUserInfo(accessToken, {profileimage: profileImage});
                return res.json({success: true, profileImage: profileImage});
            }
        }
        return res.status(400).json({success: false, message: "유효하지 않은 인증수단"})
    } catch (error) {
        return res.status(500).json({success: false, message: "내부 서버 오류"});
    }
});

router.get('/getPersonalInfo', async (req, res) => {
    const accessToken = req.cookies.accessToken;

    try {
        if (jwt.verifyToken(accessToken)) {
            const value = await db.findByValue("accessToken", accessToken);
            if (value !== null) {
                return res.json({success: true, name: value.name, email: value.email})
            }
        }
    } catch (error) {
        return res.status(500).json({success: false, message: "내부 서버 오류"});
    }
});

router.get('/getAliasName', async (req, res) => {
    const accessToken = req.cookies.accessToken

    try {
        if (jwt.verifyToken(accessToken)) {
            const value = await db.findByValue("accessToken", accessToken);
            if (value !== null) {
                return res.json({success: true, name: value.aliasname});
            }
            return res.status(404).json({success: false, message: "존재하지 않는 이용자입니다"});
        }
        return res.status(400).json({success: false, message: "유효하지 않은 인증수단"});
    } catch (error) {
        return res.status(500).json({success: false, message: "내부 서버 오류"});
    }
});

router.post('/setAliasName', async (req, res) => {
    const { accessToken, name } = req.body;

    try {
        if (jwt.verifyToken(accessToken)) {
            const value = await db.findByValue("accessToken", accessToken);

            if (value !== null) {
                await db.updateConfigInfo(value.id, {aliasname: name});
                return res.json({success: true});
            }
            return res.status(404).json({success: false, message: "존재하지 않는 이용자"});
        }
        return res.status(400).json({success: false, message: "유효하지 않은 인증수단"});
    } catch (error) {
        return res.status(500).json({success: false, message: "내부 서버 오류"});
    }
});

router.post('/setPass', async (req, res) => {
    const { accessToken, password } = req.body;

    try {
        if (jwt.verifyToken(accessToken)) {
            const value = await db.findByValue("accessToken", accessToken);

            if (value !== null) {
                await db.updateConfigInfo(value.id, {password: password});
                return res.json({success: true});
            }
            return res.status(400).json({success: false, message: "존재하지 않는 이용자"});
        }
        return res.status(404).json({success: false, message: "유효하지 않은 인증수단"});
    } catch (error) {
        return res.status(500).json({success: false, message: "내부 서버 오류"});
    }
});

module.exports = router;