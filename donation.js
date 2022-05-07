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
    startTime += 0    // 100秒之后合约开始生效
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

    const duration = 600 // * 24 * 30   // 合约什么时候结束呢，30天后吗？
    di.endTime = di.startTime + duration
      
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

    // // One-time vesting
    console.log("One time vesting mode")
    const releaseTime = di.endTime // + 3600 * 24 * 7      // 合约结束后7天内可以解锁代币
    const iface = new ethers.utils.Interface(require('./abis/SaftFactory.json'))
    let data = iface.encodeFunctionData('createOnetime', [sp, releaseTime])
    console.log("prepared data")


    // 分阶段释放(还没有跑通)
    // const releaseTimesStaged = [di.endTime+600, 
    //                             di.endTime+600*2, 
    //                             di.endTime+600*3,
    //                             di.endTime+600*4
    //                         ]
    // const releaseAmountsStaged = [ethers.utils.parseEther('25'), 
    //                             ethers.utils.parseEther('25'), 
    //                             ethers.utils.parseEther('25'),
    //                             ethers.utils.parseEther('25'), 
    //                         ]
    // let data = iface.encodeFunctionData('createStaged', [sp, releaseTimesStaged, releaseAmountsStaged])

    // 创建动作
    // console.log("start creating")
    // tx = await donation.createDonation(di, data)
    // let receipt = await tx.wait()
    // evt = receipt.events[receipt.events.length-1]
	// // const did = evt.args
    // console.log("evt.args._did")
    // const did = evt.args._did.toString()
    // console.log(did)
    // console.log("donation id did:", did)
    

    const did = 6
    while(true) {
        const now = await getBlockTime(donation)
        if (now < startTime) {
            console.log("waiting for start")
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
        console.log('donated')
        console.log(tx.hash)

        const balanceAfter = await tokenOut.balanceOf(donation.address)
        console.log('current balance', balanceAfter.toString())
        break
    }



    // print donation info
    // const did = 3
    // const dinfo = await donation.donationInfos(did)
    // console.log('donation info:', dinfo)


    // // 认领动作
    // const did = 2
    // tx = await donation.claimSaft(did)
    // let receipt2 = await tx.wait()
    // console.log(tx.hash)
    // evt = receipt2.events[receipt2.events.length-1]
    // console.log('claimSaft', evt.args)

    // owner claimBack
    // const did = 2
    // tx = await donation.claimBack(did)
    // let receipt2 = await tx.wait()
    // console.log(tx.hash)
    // evt = receipt2.events[receipt2.events.length-1]
    // console.log('claimBack', evt.args)

    //如果是普通的fund（非eth)，使用下边的函数
    // donation.claimFund(did)


    // claimETHFund
    // const did = 2
    // tx = await donation.claimETHFund(did)
    // console.log(tx.hash)
    // evt = receipt2.events[receipt2.events.length-1]
    // console.log('claimBack ETH FUND', evt.args)

}

main()