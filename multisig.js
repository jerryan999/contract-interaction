require('dotenv').config()
const ethers = require('ethers')
const {
	Contract,
	providers,
	Wallet
} = require('ethers')

async function main() {
	const provider = new providers.StaticJsonRpcProvider('https://rinkeby.infura.io/v3/2882509b917c44b892ea21a84cf38413')

	const multiSigAddress = '0x8c7375C8202d15FF6Bc11fFf79F8F0Cc6B75Fe0d'
	//const slot0 = await provider.getStorageAt(multiSigAddress, 0)
	//console.log('slot0', slot0)
	const contract = new ethers.Contract(multiSigAddress, require('./abis/gnosis.json'), provider)
	const owners = await contract.getOwners()
	console.log('owners', owners)
}

main()