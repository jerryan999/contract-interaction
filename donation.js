const ethers = require('ethers')
require('dotenv').config()
const {
	Contract,
	providers,
	Wallet
} = require('ethers')

async function getBlockTime(contract) {
    let t = await contract.provider.getBlock(await contract.provider.getBlockNumber())
    return t.timestamp
}

const sleep = ms => new Promise(res => setTimeout(res, ms));


async function main() {
	const provider = new providers.StaticJsonRpcProvider(process.env.URL)
	const wallet = new Wallet(process.env.KEY, provider)

    const simpleStrategy = '0x2476e793A57b309B6F06Dbf013Cc3222D2D2517b'
	const donationAddress = '0x9B4d7476dbEeeE18843463aB4d985bd79dFBfd2e'
	const donation = new ethers.Contract(donationAddress, require('./abis/Donation.json'), wallet)
    

    let startTime = await getBlockTime(donation)

    // 60秒之后合约开始生效
    startTime += 60   

    // donation parameters
    const di = {
        admin: wallet.address, 
        startTime,
        tokenIn: await donation.weth(),    //接收eth 
        tokenOut: '0x0254CaF957027C003a85ca2578CB7373a38902bd', // 卖掉代币
        amountIn: ethers.utils.parseEther('1'),   //目标接收1个ETH
        amountOut: ethers.utils.parseEther('100'),  // 送出100个代币
        saft: ethers.constants.AddressZero,
        root: ethers.constants.HashZero,
        uri: '',   // 哈希串
        fund: 0,
        strategy: simpleStrategy,
    }

    // 持续时间
    const duration = 100 // * 24 * 30   // 合约什么时候结束呢，30天后吗，测试的时候设定的时间短点，比如5分钟
    di.endTime = di.startTime + duration
    
    // saft paramaters
    const sp = {
        owner: donation.address,
        token: di.tokenOut,
        tokenAmount: di.amountOut,
        vesting: ethers.constants.AddressZero,
        nextId: 0,
        haveToken: false,
        institutionName: '',
        webSite: '',
        description: '',
        logoUri: '',
        counts:[],
        tokenAmounts: []
    }

    const tokenOut = new Contract(di.tokenOut, require('./abis/Token.json'), wallet)
    let tx = await tokenOut.approve(donation.address, ethers.constants.MaxUint256)
    await tx.wait()
    console.log('token out approved')
    const balanceBefore= await tokenOut.balanceOf(wallet.address)
    console.log('current my balance', balanceBefore.toString())

    // 定义一个did变量,下边会用到
    var did = null
    // 定义一个对象，下边用到
    var dinfo = {}
    // 定义saft tokenid
    var tokenId = null

    // One-time vesting
    async function onetimeVesting() {
        console.log("One time vesting mode")
        const releaseTime = di.endTime // + 3600 * 24 * 7,测试的时候选择筹款结束后立马释放     // 合约结束后7天内可以解锁代币
        const iface = new ethers.utils.Interface(require('./abis/SaftFactory.json'))
        let data = iface.encodeFunctionData('createOnetime', [sp, releaseTime])
        console.log("prepared data")

        // 创建
        console.log("start creating")
        tx = await donation.createDonation(di, data)

        // 等待创建完成
        let receipt = await tx.wait()
        evt = receipt.events[receipt.events.length-1]

        console.log("evt.args._did")
        did = evt.args._did.toString()
        console.log("donation id did:", did)
    }

    async function createStagedVesting() {
        console.log("createStagedVesting vesting mode")
        const iface = new ethers.utils.Interface(require('./abis/SaftFactory.json'))
        console.log("prepared data")
        const releaseTime = di.endTime + 0
        const releaseTimesStaged = [releaseTime+60, 
                                    releaseTime+60*2, 
                                    releaseTime+60*3
                                ]
        const releaseAmountsStaged = [
                                    ethers.utils.parseEther('0'), 
                                    ethers.utils.parseEther('0'), 
                                    ethers.utils.parseEther('0')
                                ]
        let data = iface.encodeFunctionData('createStaged', [sp, releaseTimesStaged, releaseAmountsStaged])

        // 创建
        console.log("start creating")
        tx = await donation.createDonation(di, data)

        // 等待创建完成
        let receipt = await tx.wait()
        evt = receipt.events[receipt.events.length-1]

        console.log("evt.args._did")
        did = evt.args._did.toString()
        console.log("donation id did:", did)
    }

    async function createLinearlyVesting() {
        console.log("createLinearlyVesting vesting mode")
        const iface = new ethers.utils.Interface(require('./abis/SaftFactory.json'))
        console.log("prepared data")
        const startTime = di.endTime + 0
        const endTime = di.endTime + 120
        const count = 2
        let data = iface.encodeFunctionData('createLinearly', [sp, startTime, endTime, count])

        // 创建
        console.log("start creating")
        tx = await donation.createDonation(di, data)

        // 等待创建完成
        let receipt = await tx.wait()
        evt = receipt.events[receipt.events.length-1]

        console.log("evt.args._did")
        did = evt.args._did.toString()
        console.log("donation id did:", did)
    }


 
    async function donate(){
        while(true) {
            const now = await getBlockTime(donation)
            if (now < dinfo.startTime) {
                console.log("waiting for start, 剩余多少秒",dinfo.startTime-now)
                await sleep(1000) // 等待达到开始时间
                continue
            }
    
            // 以下两个amount可以相同吗？可以！  为什么会不一致？因为有白名单
            // 如果有白名单totalAmount就取白名单中值，如果没有的话两个值就取相同的值
            // totalAmount是最多可以捐赠多少
            // amount就是用户希望捐赠的数量
            const amount = ethers.utils.parseEther('0.0000001')
    
            // proof为空的时候，这里totalAmount取最大数； 如果proof非空的时候，就要取白名单中的amount了
            const totalAmount = ethers.constants.MaxUint256   
            const proof = []       // 如果是白名单的话，需要获得该用户的proof
            tx = await donation.donateETH(did, totalAmount, proof, {value: amount})
            await tx.wait()
            console.log('donated to did:', did)
            console.log("donated hash:",tx.hash)
    
            const balanceAfter = await tokenOut.balanceOf(donation.address)
            console.log('current balance', balanceAfter.toString())
            break
        }
    }


    // print donation info
    async function printDonationInfo() {
        console.log("print dontation info")
        dinfo = await donation.donationInfos(did)
        console.log('did', did)
        console.log('donation info:', dinfo)
    }


    // // 认领动作
    async function claimsaft() {
        while(true) {
            const now = await getBlockTime(donation)
            if (now < dinfo.endTime) {   
                console.log("waiting for end, 剩余多少秒",dinfo.endTime-now)
                await sleep(1000) // 等待达到开始时间
                continue
            }

        tx = await donation.claimSaft(did)
        let receipt2 = await tx.wait()
        console.log(tx.hash)
        evt = receipt2.events[receipt2.events.length-1]
        console.log("claimSaft to did", did)
        console.log('claimSaft', evt.args)

        tokenId = evt.args._tokenId.toString()
        console.log("claimSaft tokenId", tokenId)
        break
        }
    }


    // owner claimBack
    async function claimBack() {
        while(true) {
            const now = await getBlockTime(donation)
            if (now < dinfo.endTime) {
                console.log("waiting for end, 剩余多少秒",dinfo.endTime-now)
                await sleep(1000) // 等待达到开始时间
                continue
            }
        tx = await donation.claimBack(did)
        let receipt2 = await tx.wait()
        console.log(tx.hash)
        evt = receipt2.events[receipt2.events.length-1]
        console.log("claimBack to did", did)
        console.log('claimBack', evt.args)
        break
        }
    }

    //如果是普通的fund（非eth)，使用下边的函数
    async function claimFund() {
        await donation.claimFund(did)
    }

    // claimETHFund, eth取现特殊函数
    async function claimETHFund() { 
        // 先看一下有没有代币余额
        // const balance = await provider.getBalance(nft.address)
        // console.log("余额为：", balance.toString())
        // if (balance.toString() == 0) { 
        //     // 如果余额等于0，那就不可以提现
        //     console.log("代币余额为0，不需要提现了")
        //     return 
        // }

        while(true) {
            const now = await getBlockTime(donation)
            if (now < dinfo.endTime) {
                console.log("waiting for end, 剩余多少秒",dinfo.endTime-now)
                await sleep(1000) // 等待达到开始时间
                continue
            }
        tx = await donation.claimETHFund(did)
        console.log(tx.hash)
        // evt = tx.events[tx.events.length-1]
        console.log("claimBack ETH FUND to did", did)
        // console.log('claimBack ETH FUND', evt.args)
        break
        }
    }

    async function claimToken() {
        // 这个地址从后端取，后端从claimSafts来取,或者donationInfo里面取
        // saftAddress = "0xf5535c7db2a16fcea1b7e6bfd0dc1a677b1b9870"
        console.log("start claim token")
        console.log("tokenId of claim token", tokenId)

        saftAddress = dinfo.saft
        // 查看一下我的可以认领的数据
        const saft =  new ethers.Contract(saftAddress, require('./abis/saft.json'), wallet)

        // 这个tokenid也从后端取，后端从claimSafts来取
        // 闭包获取tokenId
        const claimable = await saft.claimable(tokenId)
        console.log("claimable", claimable.toString())

        if (claimable.toString() == 0) {
            console.log("没啥可以认领的，退出吧")
            return 
        }

        // 认领代币的tokenid列表
        console.log("开始进行claim token操作")
        const tokenids = [tokenId]
        // 领取到哪个地址
        const to = dinfo.admin  
        // const amount = ethers.utils.parseEther('0.000020000000000000')   // 也可以从claimable取
        await saft.claim(tokenids, to, claimable)
        console.log("claim token done")

    }

    // 一次性尝试
    async function onetimeTest() {
        // 尝试连续两次捐赠,一次认领
        // did = 15  有时候需要手动设置一下
        await onetimeVesting()
        await printDonationInfo()
        await donate()
        await donate()
        await claimsaft()
        await claimBack()
        await claimETHFund()
        await claimToken()
    }

    // 线性释放
    async function createLinearTest() {
        // await createLinearlyVesting()
        did = 18
        tokenId = 0
        await printDonationInfo()
        // 尝试连续两次捐赠,一次认领
        // await donate()
        // await donate()
        // await claimsaft()        // 验证确实只会有一个tokenId
        // await claimBack()
        // await claimETHFund()
        
        // claim token看一下和一次性的有什么不同
        await claimToken()
    }

    await createLinearTest()

    // await createStagedVesting()




}

main()