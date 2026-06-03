const pool=require("../connect/connect");
const AcsPool=require("../connect/acsConnect");
class AuthService{
    updateUserDataByAcs=async (account)=>{
        console.log(account);
        try {
            let sql=``;
            if(account!=='6868'){
                sql=`select LOGIN_PWD from user_data where USER_ID=?`;
            }else{
                sql=`select LOGIN_PWD from user_data where USER_ID='0000'`; //總幹事
            }
            const AcsResult=await AcsPool.execute(sql,[account]);

            const ACS_LOGIN_PWD=AcsResult[0][0]?.LOGIN_PWD;
            const updateSql=`update user_data set LOGIN_PWD =? where USER_ID=?`;
            const updateResult=await pool.execute(updateSql,[ACS_LOGIN_PWD,account]);
            return {
                success:1,
                info:updateResult[0]?.info
            };
        }catch (e){
            console.log(e);
            return {
                success:-1,
                info:"acs連線錯誤"
            };
        }

    }
    getLoginDataByAccount=async (account)=>{
        const sql=`select U.USER_ID,U.LOGIN_PWD,U.USER_NAME,U.admin_type,W.MISS_ID,MISS_NAME,B.BRANCH_ID,B.BRANCH_NAME from user_data U
                         join work_mission W on U.MISS_ID=W.MISS_ID 
                         join branch_info B on W.BRANCH_ID=B.BRANCH_ID where U.USER_STATUS="1" and account_stop="0"
                         and U.USER_ID=? `;
        const result=await pool.execute(sql,[account]);
        return result[0];
    }
}

module.exports=new AuthService();