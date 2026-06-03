const {
    selectNowCarData,
    selectAlreadyReturn,
    selectCarStatus,
    selectLenderCarCount,
    selectCarConfig,
    selectNowCarMiles,
    updateSelectNowCarMiles,
    selectNowCarOldImageData,
    selectUpdateCarManager
} = require("../Service/CarService");
const MyUtil = require("../publicMethod/verisySqlAction");
const {parse} = require("uuid");

const getCarData = async (req, res, next) => {
    const result = await selectNowCarData();
    // console.log(result['message']);
    req.nowCarData = result['message'];
    await next();
}
const getCarImageData=async (req,res,next)=>{
    const getFormMessage = JSON.parse(req.body.message)['message'];
    const {CarId}=getFormMessage;

    const result=await selectNowCarOldImageData(CarId);
    req.nowCarData=result['message'];
    await next();
}

// 判斷 新增,修改,刪除
const verifySqlAction = async (req, res, next) => {
    let getFormMessage = JSON.parse(req.body.message)['message'];
    let nowCarData = req.nowCarData;
    const getSqlActionArray = MyUtil.VerifySqlAction(getFormMessage, nowCarData, "car_id");

    req.getSqlActionArray = getSqlActionArray;
    await next();
}

const getUserConfigCar = async (req, res, next) => {
    const {USER_ID} = req.mydata;
    const result = await selectCarConfig(USER_ID);
    req.nowCarConfigData = result['message'];

    await next();
}
const getUpdateCarManager=async (req,res,next)=>{
    const result=await selectUpdateCarManager();
    req.nowCar_managerData=result['message'];
    await next();
}

// 驗證sql 新增 修改
const verifyCarConfigAction = async (req, res, next) => {
    let getData = req.body;
    let nowCarConfigData = req.nowCarConfigData;
    const getSqlActionArray = MyUtil.VerifyUpdateCarSqlAction(getData, nowCarConfigData, "car_id");
    req.getSqlActionArray = getSqlActionArray;

    // console.log(getSqlActionArray);
    await next();

}
const verifyCarManagerAction=async (req,res,next)=>{
    const {updateData}=req.body;
    // console.warn(updateData);
    let nowCarManagerData = req.nowCar_managerData;
    // console.warn(nowCarManagerData);
    const getSqlActionArray=MyUtil.VerifyUpdateCarSqlAction(updateData,nowCarManagerData,"data");
    req.getSqlActionArray=getSqlActionArray;
    // console.log(req.getSqlActionArray);
    await next();
}

// 驗證是否已填寫過借車公務表單過
const verifyLenderCar = async (req, res, next) => {
    const getFormMessage = JSON.parse(req.body.message)['message'];
    const {CarId} = getFormMessage;

    const result = await selectCarStatus(CarId, req);
    console.log(result);
    const {car_status} = result?.message
    // 忙碌 已被借走
    if (car_status !== '1') {
        await req.connection.rollback();
        await req.connection.release();
        return res.json({
            success: -2,
            message: "公務車已被借走"
        });
    } else {
        await next();
    }


}
// 沒有歸還公務車不讓你借車
const verifyLenderCount = async (req, res, next) => {
    const {USER_ID} = req.mydata;
    // console.warn(USER_ID);
    const result = await selectLenderCarCount(USER_ID, req.connection);
    const {count} = result.message;

    // 有借車沒有歸還
    if (count >= 1) {
        await req.connection.rollback();
        await req.connection.release();
        return res.json({
            success: -3,
            message: "有公務車沒有歸還 不能借車"
        });
    } else {
        await next();
    }
}

//驗證是否已經填寫歸還表單過
const verifyReturnCar = async (req, res, next) => {
    const getFormMessage = JSON.parse(req.body.message)['message'];
    const {LenderId} = getFormMessage;
    const result = await selectAlreadyReturn(req, LenderId);
    const {success, message} = result;
    console.log(message);
    if (message['already_return'] === '1') {
        console.log("已經填寫歸還公務車表單");
        await req.connection.rollback();
        await req.connection.release();
        return res.json({
            success: -2,
            message: "已經填寫歸還公務車表單"
        });
    } else {
        await next();
    }

}
const checkMilesRange = async (req, res, next) => {
    const getFormMessage = JSON.parse(req.body.message)['message'];
    const {CarId, startMiles, miles} = getFormMessage;
    console.log(CarId, startMiles, miles);

    console.log("起始",startMiles);
    console.log("歸還",miles);
    if (parseInt(miles) < parseInt(startMiles)||parseInt(miles)<0||parseInt(startMiles)<0) {
        console.log(true);
        return res.json({
            success: -3,
            message: `歸還里程數必須大於起始里程數`
        })
    }else{
        await next();
    }

}
// const updateCheckMilesRange = async (req,res,next) => {
//     const getFormMessage = JSON.parse(req.body.message)['message'];
//     console.warn(getFormMessage);
//     const {CarId,miles} = getFormMessage;
//     console.log(miles,CarId);
//
//     const result=await updateSelectNowCarMiles(CarId);
//     const {nowMilage}=result?.message;
//     console.log(miles);
//     console.log(nowMilage);
//
//     if(miles>nowMilage+300||miles<nowMilage){
//         return res.json({
//             success: -3,
//             message: `里程數必須介於${nowMilage} 到${nowMilage+300}之間`
//         })
//     }else{
//         await next();
//     }
// }

module.exports = {
    getCarData, verifySqlAction, verifyLenderCar, verifyLenderCount,
    verifyReturnCar, verifyCarConfigAction, getUserConfigCar, checkMilesRange,getUpdateCarManager,verifyCarManagerAction,getCarImageData

};