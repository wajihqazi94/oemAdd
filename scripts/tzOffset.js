window.oemAdd = window.oemAdd || {};
window.oemAdd.timeZoneConversionModule = function(){

    var api,sessionInfo,availableTimeZones,dayLightSavingOffset,userTimeZoneOffset = new Object(),weekday = new Array("Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday");

    const getUserSession = function(apiObject){
        const userTimeZoneOffsetPromise = new Promise((resolve, reject) => {
            api = apiObject;
            api.getSession(function(session){sessionInfo = session;});
            getTimeZones(resolve, reject);
            });
            return  userTimeZoneOffsetPromise;   
        },
        //Get All Available Time Zones in the Database
        getTimeZones = function(resolve, reject){
            api.call("GetTimeZones", {
            }, function(result) {
                availableTimeZones = result;
                getUserTimeZoneId(resolve, reject);
            }, function(e) {
                reject(e);
            });    
        },
        //Get the Current User's Time Zone
        getUserTimeZoneId = function (resolve, reject){
            api.call("Get", {
                "typeName": "User",
                "resultsLimit": 10,
                search: {
                    name: sessionInfo.userName
                }
            }, function(result) {
                getTimeZoneOffset(result[0].timeZoneId, resolve, reject);
            }, function(e) {
                reject(e);
            });        
        }, 
        //Calculate the Offset based on User's Time Zone
        getTimeZoneOffset= function (timeZoneId, resolve, reject){
            for(var i=0; i<availableTimeZones.length; i++){
                if(availableTimeZones[i].id == timeZoneId){
                    userTimeZoneOffset = availableTimeZones[i];
                    if(userTimeZoneOffset.isDaylightSavingTimeSupported){
                        getDayLightSavingRules(timeZoneId, resolve, reject);      
                    }
                    else{
                        calculateTotalOffset(resolve);
                    }
                }
            }
        },
        //Get Daylight Saving Rules
        getDayLightSavingRules = function (timeZoneId, resolve, reject){
            api.call("GetDaylightSavingRules", {
                "timeZoneId": timeZoneId
            }, function(result) {
                calculatingAdjustment(result.adjustmentRules, resolve, reject);
            }, function(e) {
                reject(e);
            });
            
        },
        calculateTotalOffset = function (resolve){
            // return userTimeZoneOffset;
            let offset = {"hours":0,"minutes":0};
            offset.hours = parseInt(dayLightSavingOffset.split(":",2)[0], 10) + parseInt(userTimeZoneOffset.offsetFromUtc.split(":",2)[0], 10);
            offset.minutes = parseInt(dayLightSavingOffset.split(":",2)[1], 10) + parseInt(userTimeZoneOffset.offsetFromUtc.split(":",2)[1], 10);
            resolve(offset);
        },
        //Calculate the DayLightSaving Adjustment/Offset
        calculatingAdjustment = function (adjustmentRules, resolve, reject){
            var curDate = new Date();
            //Changing Date to UTC to handle calculations   
            curDate.setDate(curDate.getUTCDate());
            curDate.setMonth(curDate.getUTCMonth());
            curDate.setFullYear(curDate.getUTCFullYear());
            curDate.setHours(curDate.getUTCHours());
            curDate.setMinutes(curDate.getUTCMinutes());
            curDate.setSeconds(curDate.getUTCSeconds());
            
            
            //Calculates when to apply the Daylight Adjustment based on the Daylight Saving Adjustment Rules
            (function findTransitionDate(){
                
                //If curDate Month is between Daylight Transition Start & Transition End
                if(curDate.getMonth()+1 > adjustmentRules[1].daylightTransitionStart.month & curDate.getMonth()+1 < adjustmentRules[1].daylightTransitionEnd.month){
                    dayLightSavingOffset = adjustmentRules[1].daylightDelta;
                } 
                //If curDate month is equal to Daylight Transition Start Month
                else if(curDate.getMonth()+1 == adjustmentRules[1].daylightTransitionStart.month ){
                    var startWeekNumber = adjustmentRules[1].daylightTransitionStart.week; 
                    var startWeekDay = adjustmentRules[1].daylightTransitionStart.dayOfWeek;
                    var firstOfStartMonth = new Date(curDate);
                    firstOfStartMonth.setDate(1);
                    var weekcount = 0;
                    for(var i = 0; i<30; i++){
                        if(weekday[firstOfStartMonth.getDay()] == startWeekDay){
                            weekcount++;
                            if(weekcount == startWeekNumber){
                                var dateOfTransitionStart = new Date(firstOfStartMonth);
                                dateOfTransitionStart.setHours(0);
                                dateOfTransitionStart.setMinutes(0);
                                dateOfTransitionStart.setSeconds(0);
                                if(curDate.getTime() > dateOfTransitionStart.getTime()){
                                    dayLightSavingOffset = adjustmentRules[1].daylightDelta;
                                }
                                else {
                                    dayLightSavingOffset = "00:00:00";
                                }
                                break;
                            }
                        }
                        firstOfStartMonth = new Date(firstOfStartMonth.setDate(firstOfStartMonth.getDate()+1));
                    }
                }
                //If curDate month is equal to Daylight Transition End Month
                else if(curDate.getMonth()+1 == adjustmentRules[1].daylightTransitionEnd.month){
                    var endWeekNumber = adjustmentRules[1].daylightTransitionEnd.week; 
                    var endWeekDay = adjustmentRules[1].daylightTransitionEnd.dayOfWeek;
                    var firstOfEndMonth = new Date(curDate);
                    firstOfEndMonth.setDate(1);
                    var weekcount = 0;
                    for(var i = 0; i<30; i++){
                        if(weekday[firstOfEndMonth.getDay()] == endWeekDay){
                            weekcount++;
                            if(weekcount == endWeekNumber){
                                var dateOfTransitionEnd = new Date(firstOfEndMonth);
                                dateOfTransitionEnd.setHours(0);
                                dateOfTransitionEnd.setMinutes(0);
                                dateOfTransitionEnd.setSeconds(0);
                                if(curDate.getTime() < dateOfTransitionEnd.getTime()){
                                    dayLightSavingOffset = adjustmentRules[1].daylightDelta;
                                }
                                else {
                                    dayLightSavingOffset = "00:00:00";
                                }
                                break;
                            }
                        }
                        firstOfEndMonth = new Date(firstOfEndMonth.setDate(firstOfEndMonth.getDate()+1));
                    }
                }
                //If curDate Month is not between Daylight Transition Start & Transition End
                else {
                    dayLightSavingOffset = "00:00:00";
                }
                calculateTotalOffset(resolve);
            })();

        };
    return {
        userTimeZoneOffset: getUserSession
    };
}();
