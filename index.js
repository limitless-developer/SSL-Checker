const sslChecker = require("ssl-checker");
const axios = require("axios");
require("dotenv").config();

(async()=>{
    let messages    = ""
    const remains   = process.env.DAYS_REMAIN || 7
    const domains   = process.env.HOSTS || "ionyx-crmd.uniteus.id"

    const hosts     = domains.split(',')
    const checks    = await Promise.all(
                            hosts.map(async host=>{
                            return await new Promise(async resolve => {
                                const result = {
                                    host:host.trim(),
                                    result: await check(host.trim())
                                }
                                resolve( result )
                            })
                        })
                    );
    console.log(checks);
    
    checks.forEach(item => {
        const host = item.host
        const remain = item.result?.daysRemaining || 0
        const isValid = item.result?.valid || false
        const isUp = item.result || false 

        if( remain<=remains){
            messages += `Host       : ${host}\n`
            if(isUp){
            messages += `Is Valid   : ${isValid}\n`
            messages += `Remains    : <b>${remain}d</b>\n`
            }else{
            messages += `\n🔥 <b>Timeout or Down</b> 🔥\n`
            }
            messages += `-------------------------------------------\n`
        }
    });

    if(messages.length > 0){
        messages = `SSL Alert!\n\n${messages}`
        await sendNotif(messages)
    }

    process.exit(1)
    
})()

async function check(host){
    const time_out = parseInt(process.env.TIMEOUT || '5')

    return new Promise(async resolve => {
        const timeout = setTimeout(() => {
                            resolve(false)
                        }, time_out * 1000);

        const result = await sslChecker(host);
        if(result) clearTimeout(timeout)
        resolve(result)
    })
}

async function sendNotif (msg){
    const url = `https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendMessage`;
    let data    =   {
                       chat_id: process.env.CHAT_ID,
                       text:msg,
                       parse_mode:'HTML'
                    };

    let cfg     =   {
                        method:'post',
                        url: url,
                        timeout: 2000, //wait 2 s
                        data
                    };

    let result  = await axios(cfg).then(function (response) {
        return response.data;
    }).catch(function (error) {
        return error;
    });
    return result;
};