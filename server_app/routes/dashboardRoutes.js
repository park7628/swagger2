const express = require('express');
const cookieParser = require('cookie-parser');
const router = express.Router();
const db = require('../db/db_utils');
const jwt = require('../utils/jwtUtils');

router.use(cookieParser());
router.use(express.json());





// 아이 생년월일, 이름
router.get('/getBabyInfo', async (req, res) => {
    const accessToken = req.cookies.accessToken;
    try{
        if(jwt.verifyToken(accessToken)){
            const value = await db.findByValue("accessToken", accessToken);

            if (value !== null){
                const baby = await db.findBabyInfoByUserId(value.id);

                if(baby!== null){
                    return res.json({success: true, babyName: baby.babyname, babyBirth: baby.babybirth});
                }
                else{
                    return res.status(404).json({success: false, message: "해당 데이터가 없습니다."});
                }
            }
        }
        return res.status(400).json({success: false, message: "유효하지 않은 접근수단"});
    } catch (error) {
        console.log(error);
        return res.status(500).json({success: false, message: "내부 서버 오류"});
    }
});

// 최근 감정 정보(날짜, 시간, 감정) 3개
router.get('/getBabyEmotionInfo', async (req, res) => {
    const accessToken = req.cookies.accessToken;
    try{
        if(jwt.verifyToken(accessToken)){
            const value = await db.findByValue("accessToken", accessToken);

            if (value !== null){
                const babyEmotion = await db.findBabyEmotionInfoByUserId(value.id);

                if(babyEmotion !== null){
                    // Array인 경우 처리
                    const EmotionsMap = babyEmotion.map(emotion => ({
                        babyEmotionTime: emotion.checkTime,
                        babyEmotionNum: emotion.emotion
                    }));
                    return res.json({success: true, babyEmotionMap: EmotionsMap}); //babyEmotionTime babyEmotionNum 들어가있음
                }
                else{
                    return res.status(404).json({success: false, message: "해당 데이터가 없습니다."});
                }
            }
        }
        return res.status(400).json({success: false, message: "유효하지 않은 접근수단"});
    } catch (error) {
        console.log(error);
        return res.status(500).json({success: false, message: "내부 서버 오류"});
    }
});

// 집중 관찰시간의 아기 감정 및 시간 데이터
router.get('/getBabyCoreTimeDataInfo', async (req, res) => {
    const accessToken = req.cookies.accessToken;
    try{
        if(jwt.verifyToken(accessToken)){
            const value = await db.findByValue("accessToken", accessToken);

            if (value !== null){
                const babyCoreTimeEmotions = await db.findCoreTimeBabyInfoByUserId(value.id);
                const babyCoreTime = await db.findCoreTimeInfoByUserId(value.id);
                if (babyCoreTimeEmotions !== null && babyCoreTime !== null) {
                    // 감정별로 checkTime을 받는 객체 생성
                    const emotionData = {
                        1: [],
                        2: [],
                        3: [],
                        4: [],
                        5: []
                    };

                    // 데이터 분류
                    babyCoreTimeEmotions.forEach(item => {
                        const emotion = item.emotion;
                        const checkTime = item.checkTime; // PostgreSQL은 소문자로 반환할 수 있음
                        if (Object.prototype.hasOwnProperty.call(emotionData, emotion)) {
                            // checkTime에서 시간 데이터만 추출하여 Integer로 변환
                            const date = new Date(checkTime);
                            const timeOnly = date.getHours();
                            emotionData[emotion].push(timeOnly);
                        }
                    });

                    return res.json({
                        success: true,
                        emotionData: emotionData,
                        coreTimeStart: babyCoreTime.coretimestart,
                        coreTimeEnd: babyCoreTime.coretimeend
                    });
                else{
                    return res.status(404).json({success: false, message: "해당 데이터가 없습니다."});
                }
            }
        }
        return res.status(400).json({success: false, message: "유효하지 않은 접근수단"});
    } catch (error) {
        console.log(error);
        return res.status(500).json({success: false, message: "내부 서버 오류"});
    }
});

// 아이 감정 데이터 -> 가장 많은 감정과 비율
router.get('/getBabyFrequencyInfo', async (req, res) => {
    const accessToken = req.cookies.accessToken;
    try{
        if(jwt.verifyToken(accessToken)){
            const value = await db.findByValue("accessToken", accessToken);

            if (value !== null){
                const babyEmotions = await db.findBabyFrequencyInfoByUserId(value.id);

                if(babyEmotions !== null){
                    //감정 빈도 계산
                    const emotionCounts = {}
                    babyEmotions.forEach(emotion => {
                        emotionCounts[emotion] = (emotionCounts[emotion] || 0) + 1;
                    });

                    // 최빈값 찾기
                    let modeEmotion = babyEmotions[0];
                    let maxCount = 0;
                    for (const emotion in emotionCounts) {
                        if (emotionCounts[emotion] > maxCount) {
                            maxCount = emotionCounts[emotion];
                            modeEmotion = Number(emotion);
                        }
                    }
                    // 비율 계산
                    const EmotionLength = babyEmotions.length;
                    const modeEmotionRatio = parseFloat(((maxCount / totalEmotions) * 100).toFixed(1));

                    return res.json({success: true, modeEmotion: modeEmotion, modeEmotionRatio: modeEmotionRatio});
                }
                else{
                    return res.status(404).json({success: false, message: "해당 데이터가 없습니다."});
                }
            }
        }
        return res.status(400).json({success: false, message: "유효하지 않은 접근수단"});
    } catch (error) {
        console.log(error);
        return res.status(500).json({success: false, message: "내부 서버 오류"});
    }
});



module.exports = router;