const ethers = require('ethers')
require('dotenv').config()
const moment = require('moment')
const {
	Contract,
	providers,
	Wallet
} = require('ethers')

const sleep = (ms) => {
	return new Promise((resolve, reject)=> setTimeout(resolve, ms))
}

async function main() {
	const provider = new providers.StaticJsonRpcProvider(process.env.URL)
	const wallet = new Wallet(process.env.KEY, provider)
	console.log("关联的钱包地址是：", wallet.address)
	console.log("关联的钱包资产余额是:" + await wallet.getBalance())
	console.log("\n")

	//  const tokenFactoryAddress = '0xa82928D8Ab8Bbc41d0DEE4b09614b039878a80E3'
	const tokenFactoryAddress = '0x0fF0034E7342AA77D6CDa317e5e22a40C687291A'
	const tokenFactory = new ethers.Contract(tokenFactoryAddress, require('./abis/TokenFactory.json'), wallet)
	const decimals = 18

	// //  // 创建代币
	// //  let name = 'Test Token AAZZ1'
	// //  let symbol = 'USDT'
	// // //   const decimals = 6
	// //  let tx = await tokenFactory.createToken(name, symbol, decimals)  //创建ERC20代币
	// //  console.log("创建代币的交易hash是：", tx.hash)
	// //  let receipt = await tx.wait()
    // //  let evt = receipt.events[receipt.events.length-1]
	// //  console.log('token created')
	// //  const tokenAddressNew = evt.args._token.toString()
	// //  console.log("新创建的合约地址为：", tokenAddressNew)   // 0x0254CaF957027C003a85ca2578CB7373a38902bd
	

	//  创建后的代币操作
	// const tokenAddress = "0x0254CaF957027C003a85ca2578CB7373a38902bd"
    // const token = new ethers.Contract(tokenAddress, require('./abis/Token.json'), wallet)  // new代币合约对象
	// console.log("代币合约地址是：", tokenAddress)
	// const tName = await token.name()  // 查询代币名称
	// console.log('代币的名字是：', tName)
	// const balance = await token.balanceOf(wallet.address)
	// console.log("我的代币余额是：", balance.toString())

	// const balance3 = await token.balanceOf("0xb459646bF76c012654B611bC03c21834E0376142")
	// console.log("qi的代币余额是：", balance3.toString())

	// //   代币增发
	// const amount = ethers.utils.parseUnits('2000', decimals)  //等于 100_000_000
	// // tx = await token.mint(wallet.address, amount)  //代币增发
	// tx = await token.mint("0xb459646bF76c012654B611bC03c21834E0376142", amount)  //代币增发
    // const receipt = await tx.wait()
    // const evt = receipt.events[receipt.events.length-1]
	// console.log(evt)
	// const balance2 = await token.balanceOf(wallet.address)
	// console.log("增发之后我的代币余额是：", balance2.toString())


	// //   代币转账
	// // tx = await token.transfer("0x2999e67d78785e5d24c06109035adab2333e82ef", ethers.utils.parseUnits('500', decimals))  // 转账
	// // await tx.wait()
	// // const balance3 = await token.balanceOf(wallet.address)
	// // console.log("转账之后我的代币余额是：", balance3.toString())


	//   // NFT 创建
	  console.log("\n") 
	  const name = 'Test AAZZ 2222'
	  symbol = 'AAZZ22'
	  const supplyInfo = {
	  	reserve: 50, // 预留数量
	  	whitelist: 20,  //白名单数量， 3个*5 = 15
	  	sale: 100,  // 公开销售数量
	    mintLimit: 5, 
	  	root: ethers.constants.HashZero,
	  	salePrice: ethers.utils.parseUnits('0.00000001', decimals),
	  	claimPrice: ethers.utils.parseUnits('0.00000001', decimals),
	  	fund: 0,
	  	payment: ethers.constants.AddressZero,   // 代表ETH也可以是其他代币的tokenAddress
	  }
	
	  let bestBlock = await provider.getBlock(await provider.getBlockNumber())
	  // 【时间短点】方便debug
	  supplyInfo.startTime = bestBlock.timestamp + 30   
	  supplyInfo.endTime = supplyInfo.startTime + 3600 * 24
	
	const baseUri = "https://ipfs.io/ipfs/"
	const nftOwner = wallet.address

	// // 创建ERC20代币NFT
	  const tx = await tokenFactory.createNFT(supplyInfo, name, symbol, baseUri) 
	  receipt = await tx.wait()
      evt = receipt.events[receipt.events.length-1]
	  const nftAddress = evt.args._token
	  console.log("新创建的nft合约地址为：", nftAddress) 
	

	// //   // 操作新创建的NFT合约
	//   const nftAddress = "0xcefee99eb648e42c78e678ce02f40f2c07b0eb07"
    //   const nft = new ethers.Contract(nftAddress, require('./abis/NFT.json'), wallet)  // new代币合约对象
	//   let totalSupply = await nft.totalSupply()
	//   console.log('totalSupply', totalSupply.toString())
	//   let supplyInfos = await nft.supplyInfo()
	//   console.log('supplyInfos from blockchain:', supplyInfos)


	// //    NFT设定白名单(注意不能重复设定)
	//   const root = ethers.utils.arrayify('0x16382dec98bb9d8cf471a4024be2063dbb6e0fcb51dedae7cf6e51cfc0afcef3')  // 和空投一样API创建默克尔根
	//   tx = await nft.setRoot(root) 
	//   tx.wait()
	// //   console.log("成功重置白名单！")


	//  console.log("\n *************************")
	//  console.log("mint nft")
	//  while (true) {
	//  	bestBlock = await provider.getBlock(await provider.getBlockNumber())
	//  	if (bestBlock.timestamp < supplyInfo.startTime) {
	//  		await sleep(1000)  // wait...
	//  		console.log("waiting")
	//  		continue
	//  	}
	//  	//  // 如果是eth支付的话，下边两行不需要
	//  	//  const txxx = await token.approve(nft.address, ethers.constants.MaxUint256)
	//  	//  await txxx.wait()
		
	//  	const salePrice = supplyInfo.salePrice
	//     const amount = 1    // 要mint的数量
	//  	tx = await nft.mint(wallet.address, amount, {value: salePrice})
	//  	const rt =  await tx.wait()
	//  	evt = rt.events[rt.events.length-1]
	//  	console.log(evt.args)
	//  	console.log("hash txid:", tx.hash)

	//  	// 会返回tokenId的吧？？？？？
	//  	break
	//  }


	// //  // api 请求proofs
	  
	//  console.log("开始领取操作")
	//  const proofs = [
	// 	"0x4e60ad5ea88772b6ca88b3b76a361282a31e751dc5c03b12b6026bc1114675a7",
	// 	"0xd0f5c94363f9defd8cb690487d26e2acca99ae88a23d38d322beeb010693ce97"
	// ]
	//  // 第一个代表总共有多少个，和proof amount保持一致
	//  // 第二个代表希望领多少个
	//  // 第三个参数也很重要，claimPrice前的因子和第二个参数保持一致
	//  // 你这里payment是0，所以await nft.claim(3, 2, proofs, {value: 2*claimPrice})
	//  const claimPrice = ethers.utils.parseUnits('0.00000001', decimals)
	//  const txx = await nft.claim(90000000, 1, proofs, {value: 1*claimPrice}) // 白名单领取
	//  const rt =  await txx.wait()    // 别忘记wait
	//  evt = rt.events[rt.events.length-1] 
	//  console.log("hash txid",txx.hash)   		//这个要传给后端
	//  console.log(evt.args)

	// tx = await nft.withdrawToken('0x11b720ad9fa537e5a249cac9f8069eb26921d59a') 
	// const txxx = await tx.wait()
	//  evt = txxx.events[txxx.events.length-1] 
	//  console.log("hash txid",tx.hash)   		//这个要传给后端
	//  console.log(evt.args)

}

main()