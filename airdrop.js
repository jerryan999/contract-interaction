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

async function main() {
	const provider = new providers.StaticJsonRpcProvider(process.env.URL)
	const wallet = new Wallet(process.env.KEY, provider)

	const airdropAddress = '0x3110BeC2Ea95CB7BF66bE9eEf5EEc36D5D1144F1'
	const airdrop = new ethers.Contract(airdropAddress, require('./abis/Distribution.json'), wallet)

	const tokenAddress = '0x0254CaF957027C003a85ca2578CB7373a38902bd' // 通过createToken产生
	const token = new ethers.Contract(tokenAddress, require('./abis/Token.json'), wallet)
	const allowance = await token.allowance(wallet.address, airdropAddress)

	// 注意：准备要分配多少币，需要和默克尔根的总和相同
	const _totalAllocation = ethers.utils.parseUnits('0.0341', 18)   //每个人的总和
	console.log('allowance', allowance.toString())
	console.log('_totalAllocation', _totalAllocation.toString())
	if (allowance.lt(_totalAllocation)) {
		console.log('approve')
	  let tx = await token.approve(airdropAddress, ethers.constants.MaxUint256)
	  await tx.wait()
	}

	
	// console.log("\n")
	// console.log("尝试一些airdrop操作")
	// // const _merkleRoot = '0xe780b0b5204a810e552c0d4b6e4c669bc6a73cdb15f57d41298a009eff1d0ab0' // 默克尔根，包含所有用户的可领空投的证明

	// const _startTime = Math.floor(new Date().getTime() / 1000) + 60 * 0 // 领取开始时间 1分钟后(开发的时候设置的短一些)
	// const _endTime = _startTime + 3600 * 24 // 空投领取持续一天，一天后不可领
	
	// const distributionType = 0 // 0代表空投，1代表bounty

	// _merkleRoot = ethers.constants.HashZero  
	// let tx = await airdrop.createDistribution(distributionType, tokenAddress, _merkleRoot, _totalAllocation, _startTime, _endTime)
	// const receipt = await tx.wait()
	// console.log('airdrop created')
	// evt = receipt.events[receipt.events.length-1]
	// console.log("evt", evt.args)
	// const _did = evt.args._did.toString()
	// const _root = evt.args._root.toString()
	// console.log('did for airdrop:', _did)
	// console.log('_root for airdrop:', _root)



	
	console.log("尝试一些bounty操作")
	const _startTime = Math.floor(new Date().getTime() / 1000) + 3600 * 0 // 领取开始时间
	const _endTime = _startTime + 3600 * 24 // 空投领取持续一天，一天后不可领

	const distributionType = 1
	const _merkleRoot = ethers.constants.HashZero
	let tx = await airdrop.createDistribution(distributionType, tokenAddress, _merkleRoot, _totalAllocation, _startTime, _endTime)
	const receipt = await tx.wait()
	console.log('bounty created')
	evt = receipt.events[receipt.events.length-1]
	// console.log(evt.args)
	const _did = evt.args._did.toString()
	const _root = evt.args._root.toString()
	const _distributionType = evt.args._type.toString()
	console.log('did for bounty:', _did)
	console.log('_root for bounty', _root)
	console.log('_distributionType', _distributionType)


	// console.log("开始设定merkelroot,只能设定一次(subgraph会反应慢)")
	// // const _did = 22
	// _merkleRootUpdate = '0x19518c720edd3bb0b1696a28f88b412e92beacc2df84b55cda1082d7b56f22ac' 
    // tx = await airdrop.setRoot(_did, _merkleRootUpdate)
	// console.log("再次看一下root是否已经修改")
	// const infos = await airdrop.distributionInfos(_did)
	// console.log(infos)
	

	// const airdropId = 16
	// const amount = ethers.utils.parseUnits('0.0341', 18)
	// const _merkleProof = [
	// ] // 从api获得
	// tx = await airdrop.claim(airdropId, amount, _merkleProof)
	// let rept = await tx.wait()
	// console.log('claimed')
	// evt = rept.events[rept.events.length-1]
	// console.log(evt.args)

}

main()
